const {
  QueueEntry,
  Patient,
  Staff,
  Service,
  Encounter,
  Branch,
  AuditLog
} = require('../models');
const { generateId } = require('../utils/idGenerator');
const AuditService = require('../services/AuditService');

class QueueController {
  static async getQueue(req, res, next) {
    try {
      const { branchId, providerId, departmentId, status, date } = req.query;
      const query = { organizationId: req.organizationId };

      const isAll = branchId === 'all' || branchId === 'overall' || req.branchId === 'all' || req.branchId === 'overall';
      const effectiveBranchId = isAll ? null : (branchId && branchId !== 'undefined' ? branchId : req.branchId);
      if (effectiveBranchId) query.branchId = effectiveBranchId;
      if (providerId && providerId !== 'undefined' && providerId !== 'all') query.providerId = providerId;
      if (departmentId && departmentId !== 'undefined' && departmentId !== 'all') query.departmentId = departmentId;
      if (status && status !== 'all') {
        query.status = status;
      } else if (!status) {
        // Default to active statuses
        query.status = { $in: ['waiting', 'called', 'in_consultation', 'skipped'] };
      }

      // Filter by today or specified date
      if (date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query.createdAt = { $gte: targetDate, $lt: nextDay };
      } else {
        // By default show tokens created in last 24h to avoid timezone cutoff issues
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: since };
      }

      const entries = await QueueEntry.find(query).sort({ priority: -1, createdAt: 1 });

      const patientIds = [...new Set(entries.map(e => e.patientId))];
      const providerIds = [...new Set(entries.map(e => e.providerId))];
      const serviceIds = [...new Set(entries.map(e => e.serviceId).filter(Boolean))];
      const branchIds = [...new Set(entries.map(e => e.branchId).filter(Boolean))];

      const [patients, providers, services, branches] = await Promise.all([
        Patient.find({ patientId: { $in: patientIds } }),
        Staff.find({ staffId: { $in: providerIds } }),
        Service.find({ serviceId: { $in: serviceIds } }),
        Branch.find({ branchId: { $in: branchIds } })
      ]);

      const patientMap = {};
      patients.forEach(p => { patientMap[p.patientId] = p; });
      const providerMap = {};
      providers.forEach(p => { providerMap[p.staffId] = p; });
      const serviceMap = {};
      services.forEach(s => { serviceMap[s.serviceId] = s; });
      const branchMap = {};
      branches.forEach(b => { branchMap[b.branchId] = b; });

      const data = entries.map(entry => ({
        ...entry.toObject(),
        patient: patientMap[entry.patientId] || null,
        provider: providerMap[entry.providerId] || null,
        service: serviceMap[entry.serviceId] || null,
        branch: branchMap[entry.branchId] || null
      }));

      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async registerWalkIn(req, res, next) {
    try {
      const { patientId, providerId, serviceId, departmentId, branchId, priority = 'normal', notes, paymentStatus = 'paid', caseType = 'new' } = req.body;

      if (!patientId || !providerId) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Patient and provider are required' } });
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const queueCount = await QueueEntry.countDocuments({
        organizationId: req.organizationId,
        branchId: branchId || req.branchId,
        createdAt: { $gte: todayStart }
      });
      const tokenNumber = `W-${String(queueCount + 1).padStart(2, '0')}`;

      // Create linked Encounter
      const encounter = await Encounter.create({
        encounterId: generateId('encounter'),
        organizationId: req.organizationId,
        branchId: branchId || req.branchId,
        departmentId,
        patientId,
        providerId,
        serviceId,
        encounterType: 'consultation',
        paymentStatus,
        caseType,
        status: 'in_progress',
        startedAt: new Date()
      });

      // Create QueueEntry
      const queueEntry = await QueueEntry.create({
        queueEntryId: generateId('queueEntry'),
        organizationId: req.organizationId,
        branchId: branchId || req.branchId,
        departmentId,
        patientId,
        encounterId: encounter.encounterId,
        providerId,
        serviceId,
        tokenNumber,
        priority,
        status: 'waiting',
        notes
      });

      AuditService.log({
        organizationId: req.organizationId,
        branchId: queueEntry.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'queue.walk_in_registered',
        entityType: 'queueEntry',
        entityId: queueEntry.queueEntryId,
        after: { tokenNumber, encounterId: encounter.encounterId }
      });

      return res.status(201).json({
        success: true,
        message: `Walk-in registered successfully. Token: ${tokenNumber}`,
        data: {
          queueEntry,
          encounter
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async callPatient(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await QueueEntry.findOne({ queueEntryId: id, organizationId: req.organizationId });
      if (!entry) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Queue entry not found' } });
      }

      entry.status = 'called';
      entry.calledAt = new Date();
      entry.version += 1;
      await entry.save();

      AuditService.log({
        organizationId: req.organizationId,
        branchId: entry.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'queue.patient_called',
        entityType: 'queueEntry',
        entityId: entry.queueEntryId,
        after: { tokenNumber: entry.tokenNumber, status: 'called' }
      });

      return res.json({ success: true, message: `Called Token ${entry.tokenNumber}`, data: entry });
    } catch (err) {
      next(err);
    }
  }

  static async startConsultation(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await QueueEntry.findOne({ queueEntryId: id, organizationId: req.organizationId });
      if (!entry) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Queue entry not found' } });
      }

      entry.status = 'in_consultation';
      entry.startedAt = new Date();
      entry.version += 1;
      await entry.save();

      // Ensure Encounter is in_progress
      if (entry.encounterId) {
        await Encounter.updateOne(
          { encounterId: entry.encounterId, organizationId: req.organizationId },
          { status: 'in_progress', startedAt: new Date() }
        );
      }

      AuditService.log({
        organizationId: req.organizationId,
        branchId: entry.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'queue.consultation_started',
        entityType: 'queueEntry',
        entityId: entry.queueEntryId,
        after: { encounterId: entry.encounterId, status: 'in_consultation' }
      });

      return res.json({
        success: true,
        message: 'Consultation started',
        data: {
          queueEntry: entry,
          encounterId: entry.encounterId,
          patientId: entry.patientId
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async completeQueue(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await QueueEntry.findOne({ queueEntryId: id, organizationId: req.organizationId });
      if (!entry) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Queue entry not found' } });
      }

      entry.status = 'completed';
      entry.completedAt = new Date();
      entry.version += 1;
      await entry.save();

      AuditService.log({
        organizationId: req.organizationId,
        branchId: entry.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'queue.completed',
        entityType: 'queueEntry',
        entityId: entry.queueEntryId,
        after: { status: 'completed' }
      });

      return res.json({ success: true, message: 'Queue entry marked as completed', data: entry });
    } catch (err) {
      next(err);
    }
  }

  static async skipQueue(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await QueueEntry.findOne({ queueEntryId: id, organizationId: req.organizationId });
      if (!entry) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Queue entry not found' } });
      }

      entry.status = 'skipped';
      entry.version += 1;
      await entry.save();

      return res.json({ success: true, message: 'Queue entry marked as skipped', data: entry });
    } catch (err) {
      next(err);
    }
  }

  // Restore skipped token back to waiting
  static async restoreQueue(req, res, next) {
    try {
      const entry = await QueueEntry.findOne({ queueEntryId: req.params.id });
      if (!entry) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Queue entry not found' } });
      }

      entry.status = 'waiting';
      await entry.save();

      // Log activity
      const reqUser = req.user || { userId: 'system', name: 'System' };
      await AuditLog.create({
        action: 'QUEUE_RESTORED',
        resourceType: 'Queue',
        resourceId: entry.queueEntryId,
        performedBy: reqUser.userId,
        details: {
          patientId: entry.patientId,
          after: { status: 'waiting' }
        },
        branchId: entry.branchId
      });

      return res.json({ success: true, message: 'Queue entry restored to waiting', data: entry });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = QueueController;
