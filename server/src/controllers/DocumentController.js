const { Document, FollowUp, Patient, Staff, Appointment } = require('../models');
const { generateId } = require('../utils/idGenerator');
const AuditService = require('../services/AuditService');

class DocumentController {
  static async getDocuments(req, res, next) {
    try {
      const { entityType, entityId, category, branchId } = req.query;
      const query = { organizationId: req.organizationId };

      if (entityType) query.entityType = entityType;
      if (entityId) query.entityId = entityId;
      if (category) query.category = category;
      if (branchId) query.branchId = branchId;

      const documents = await Document.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, data: documents });
    } catch (err) {
      next(err);
    }
  }

  static async uploadDocument(req, res, next) {
    try {
      const { entityType, entityId, title, category, fileUrl, fileName, mimeType, sizeBytes, branchId } = req.body;
      if (!entityType || !entityId || !title || !fileUrl) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Entity type, entity ID, title, and file URL are required' } });
      }

      const document = await Document.create({
        documentId: generateId('document'),
        organizationId: req.organizationId,
        branchId: branchId || req.branchId,
        entityType,
        entityId,
        title,
        category: category || 'General',
        fileUrl,
        fileName: fileName || title,
        mimeType: mimeType || 'application/pdf',
        sizeBytes: sizeBytes || 0,
        versions: [{
          versionNumber: 1,
          fileUrl,
          fileName: fileName || title,
          mimeType,
          sizeBytes,
          uploadedBy: req.user.name,
          uploadedAt: new Date()
        }]
      });

      AuditService.log({
        organizationId: req.organizationId,
        branchId: document.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'document.uploaded',
        entityType: 'document',
        entityId: document.documentId,
        after: document.toObject()
      });

      return res.status(201).json({ success: true, data: document });
    } catch (err) {
      next(err);
    }
  }

  static async getFollowUps(req, res, next) {
    try {
      const { patientId, status, providerId, startDate, endDate } = req.query;
      const query = { organizationId: req.organizationId };

      if (patientId) query.patientId = patientId;
      if (status) query.status = status;
      if (providerId) query.providerId = providerId;

      if (startDate || endDate) {
        query.scheduledDate = {};
        if (startDate) query.scheduledDate.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.scheduledDate.$lte = end;
        }
      }

      const followups = await FollowUp.find(query).sort({ scheduledDate: 1 });

      const patientIds = [...new Set(followups.map(f => f.patientId))];
      const providerIds = [...new Set(followups.map(f => f.providerId))];

      const [patients, providers] = await Promise.all([
        Patient.find({ patientId: { $in: patientIds } }),
        Staff.find({ staffId: { $in: providerIds } })
      ]);

      const patientMap = {};
      patients.forEach(p => { patientMap[p.patientId] = p; });
      const providerMap = {};
      providers.forEach(p => { providerMap[p.staffId] = p; });

      const data = followups.map(f => ({
        ...f.toObject(),
        patient: patientMap[f.patientId] || null,
        provider: providerMap[f.providerId] || null
      }));

      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async createFollowUp(req, res, next) {
    try {
      const { patientId, encounterId, providerId, scheduledDate, reason, notes, branchId } = req.body;
      if (!patientId || !providerId || !scheduledDate) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Patient, provider, and scheduled date are required' } });
      }

      const followup = await FollowUp.create({
        followupId: generateId('followup'),
        organizationId: req.organizationId,
        branchId: branchId || req.branchId,
        patientId,
        encounterId,
        providerId,
        scheduledDate: new Date(scheduledDate),
        reason: reason || notes || 'Follow-up Consultation',
        notes: notes || reason || '',
        status: 'pending'
      });

      return res.status(201).json({ success: true, data: followup });
    } catch (err) {
      next(err);
    }
  }

  static async updateFollowUp(req, res, next) {
    try {
      const { id } = req.params;
      const followup = await FollowUp.findOne({ followupId: id, organizationId: req.organizationId });
      if (!followup) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Follow-up not found' } });
      }

      followup.set(req.body);
      followup.version = (followup.version || 0) + 1;
      await followup.save();

      return res.json({ success: true, data: followup });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DocumentController;
