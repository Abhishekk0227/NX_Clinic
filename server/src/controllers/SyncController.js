const {
  SyncOperation,
  Patient,
  Appointment,
  Encounter,
  ClinicalRecord,
  Treatment,
  Invoice,
  Payment,
  FormSubmission
} = require('../models');
const AuditService = require('../services/AuditService');

class SyncController {
  static async syncBatch(req, res, next) {
    try {
      const { operations } = req.body;
      if (!Array.isArray(operations) || operations.length === 0) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Operations array is required' } });
      }

      const results = [];

      for (const op of operations) {
        const {
          operationId,
          entityType,
          entityId,
          entityVersion = 1,
          operationType, // 'create', 'update', 'delete'
          deviceId,
          payload,
          timestamp
        } = op;

        if (!operationId || !entityType || !entityId) {
          results.push({ operationId, status: 'failed', message: 'Missing operationId, entityType, or entityId' });
          continue;
        }

        // 1. Idempotency Check: if already processed, return existing status
        const existingOp = await SyncOperation.findOne({ operationId, organizationId: req.organizationId });
        if (existingOp) {
          results.push({
            operationId,
            status: existingOp.syncStatus,
            message: 'Operation already processed (idempotent)',
            appliedAt: existingOp.appliedAt
          });
          continue;
        }

        // 2. Resolve Model
        let Model;
        let idField;
        switch (entityType) {
          case 'patient':
            Model = Patient;
            idField = 'patientId';
            break;
          case 'appointment':
            Model = Appointment;
            idField = 'appointmentId';
            break;
          case 'encounter':
            Model = Encounter;
            idField = 'encounterId';
            break;
          case 'clinicalRecord':
            Model = ClinicalRecord;
            idField = 'clinicalRecordId';
            break;
          case 'treatment':
            Model = Treatment;
            idField = 'treatmentId';
            break;
          case 'invoice':
            Model = Invoice;
            idField = 'invoiceId';
            break;
          case 'payment':
            Model = Payment;
            idField = 'paymentId';
            break;
          case 'formSubmission':
            Model = FormSubmission;
            idField = 'submissionId';
            break;
          default:
            Model = null;
        }

        if (!Model) {
          results.push({ operationId, status: 'failed', message: `Unsupported entityType: ${entityType}` });
          continue;
        }

        // 3. Process operation
        try {
          if (operationType === 'create') {
            const existingRecord = await Model.findOne({ [idField]: entityId, organizationId: req.organizationId });
            if (existingRecord) {
              results.push({ operationId, status: 'synced', message: 'Entity already exists on server' });
              continue;
            }

            const docData = {
              ...payload,
              [idField]: entityId,
              organizationId: req.organizationId,
              branchId: payload.branchId || req.branchId
            };
            const createdDoc = await Model.create(docData);

            await SyncOperation.create({
              operationId,
              organizationId: req.organizationId,
              branchId: req.branchId,
              entityType,
              entityId,
              entityVersion: 1,
              operationType,
              deviceId,
              userId: req.user.userId,
              payload,
              syncStatus: 'synced',
              appliedAt: new Date(),
              timestamp: timestamp || new Date()
            });

            AuditService.log({
              organizationId: req.organizationId,
              actorUserId: req.user.userId,
              actorName: req.user.name,
              action: `sync.${entityType}.created`,
              entityType,
              entityId,
              after: createdDoc.toObject()
            });

            results.push({ operationId, status: 'synced' });
          } else if (operationType === 'update') {
            const currentDoc = await Model.findOne({ [idField]: entityId, organizationId: req.organizationId });
            if (!currentDoc) {
              results.push({ operationId, status: 'failed', message: 'Target entity not found on server' });
              continue;
            }

            // Conflict Check (Optimistic concurrency)
            if (currentDoc.version && currentDoc.version > entityVersion) {
              // Server wins or conflict recorded
              await SyncOperation.create({
                operationId,
                organizationId: req.organizationId,
                branchId: req.branchId,
                entityType,
                entityId,
                entityVersion,
                operationType,
                deviceId,
                userId: req.user.userId,
                payload,
                syncStatus: 'conflict',
                conflictDetails: { serverVersion: currentDoc.version, clientVersion: entityVersion },
                errorMessage: 'Version conflict detected',
                timestamp: timestamp || new Date()
              });

              results.push({
                operationId,
                status: 'conflict',
                serverVersion: currentDoc.version,
                clientVersion: entityVersion,
                serverData: currentDoc.toObject()
              });
              continue;
            }

            const before = currentDoc.toObject();
            Object.assign(currentDoc, payload);
            currentDoc.version = (currentDoc.version || 1) + 1;
            await currentDoc.save();

            await SyncOperation.create({
              operationId,
              organizationId: req.organizationId,
              branchId: req.branchId,
              entityType,
              entityId,
              entityVersion: currentDoc.version,
              operationType,
              deviceId,
              userId: req.user.userId,
              payload,
              syncStatus: 'synced',
              appliedAt: new Date(),
              timestamp: timestamp || new Date()
            });

            AuditService.log({
              organizationId: req.organizationId,
              actorUserId: req.user.userId,
              actorName: req.user.name,
              action: `sync.${entityType}.updated`,
              entityType,
              entityId,
              before,
              after: currentDoc.toObject()
            });

            results.push({ operationId, status: 'synced', version: currentDoc.version });
          }
        } catch (opErr) {
          results.push({ operationId, status: 'failed', message: opErr.message });
        }
      }

      return res.json({
        success: true,
        message: 'Sync batch processed',
        data: {
          processed: results.length,
          results
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSyncStatus(req, res, next) {
    try {
      const pendingCount = await SyncOperation.countDocuments({ organizationId: req.organizationId, syncStatus: 'pending' });
      const conflictCount = await SyncOperation.countDocuments({ organizationId: req.organizationId, syncStatus: 'conflict' });
      const recentOps = await SyncOperation.find({ organizationId: req.organizationId }).sort({ appliedAt: -1 }).limit(10);

      return res.json({
        success: true,
        data: {
          pendingCount,
          conflictCount,
          recentOperations: recentOps
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SyncController;
