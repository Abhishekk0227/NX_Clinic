const { VitalParam } = require('../models');
const { generateId } = require('../utils/idGenerator');
const AuditService = require('../services/AuditService');

// Default initial clinical vitals setup if none exist yet for the organization
const DEFAULT_VITALS = [
  { name: 'Blood Pressure (Systolic)', key: 'bpSystolic', unit: 'mmHg', normalRange: '90 - 120 mmHg', minVal: 60, maxVal: 250, inputType: 'numeric', isMandatory: true, category: 'cardiac', order: 1 },
  { name: 'Blood Pressure (Diastolic)', key: 'bpDiastolic', unit: 'mmHg', normalRange: '60 - 80 mmHg', minVal: 40, maxVal: 150, inputType: 'numeric', isMandatory: true, category: 'cardiac', order: 2 },
  { name: 'Pulse / Heart Rate', key: 'pulse', unit: 'bpm', normalRange: '60 - 100 bpm', minVal: 30, maxVal: 220, inputType: 'numeric', isMandatory: false, category: 'cardiac', order: 3 },
  { name: 'Body Temperature', key: 'temperature', unit: '°F', normalRange: '97.0 - 99.0 °F', minVal: 90, maxVal: 110, inputType: 'decimal', isMandatory: false, category: 'triage', order: 4 },
  { name: 'Blood Oxygen (SpO2)', key: 'spo2', unit: '%', normalRange: '95 - 100 %', minVal: 50, maxVal: 100, inputType: 'numeric', isMandatory: false, category: 'respiratory', order: 5 },
  { name: 'Patient Weight', key: 'weightKg', unit: 'kg', normalRange: 'Adult BMI scale', minVal: 1, maxVal: 300, inputType: 'decimal', isMandatory: false, category: 'general', order: 6 },
  { name: 'Patient Height', key: 'heightCm', unit: 'cm', normalRange: '140 - 200 cm', minVal: 30, maxVal: 250, inputType: 'decimal', isMandatory: false, category: 'general', order: 7 }
];

class VitalParamController {
  static async getVitalParams(req, res, next) {
    try {
      const { category, status } = req.query;
      const query = { organizationId: req.organizationId };
      if (category) query.category = category;
      if (status) query.status = status;

      let vitals = await VitalParam.find(query).sort({ order: 1, createdAt: 1 });

      // Auto seed defaults for the organization on first access
      if (vitals.length === 0 && !category && !status) {
        for (const def of DEFAULT_VITALS) {
          await VitalParam.create({
            vitalParamId: generateId('vital'),
            organizationId: req.organizationId,
            ...def,
            status: 'active'
          });
        }
        vitals = await VitalParam.find(query).sort({ order: 1, createdAt: 1 });
      }

      return res.json({ success: true, data: vitals });
    } catch (err) {
      next(err);
    }
  }

  static async createVitalParam(req, res, next) {
    try {
      const { name, key, unit, normalRange, minVal, maxVal, inputType = 'numeric', isMandatory = false, category = 'general', order = 0 } = req.body;

      if (!name || !key) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Parameter name and code/key are required' }
        });
      }

      const cleanKey = key.trim().replace(/[^a-zA-Z0-9_]/g, '');

      // Check key uniqueness in organization
      const existing = await VitalParam.findOne({ organizationId: req.organizationId, key: cleanKey });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_KEY', message: `Vital parameter key "${cleanKey}" already exists.` }
        });
      }

      const vital = await VitalParam.create({
        vitalParamId: generateId('vital'),
        organizationId: req.organizationId,
        name: name.trim(),
        key: cleanKey,
        unit: unit || '',
        normalRange: normalRange || '',
        minVal: minVal !== undefined && minVal !== '' ? Number(minVal) : undefined,
        maxVal: maxVal !== undefined && maxVal !== '' ? Number(maxVal) : undefined,
        inputType,
        isMandatory: Boolean(isMandatory),
        category,
        order: Number(order) || 0,
        status: 'active'
      });

      AuditService.log({
        organizationId: req.organizationId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'vital_param.created',
        entityType: 'vital_param',
        entityId: vital.vitalParamId,
        after: vital.toObject()
      });

      return res.status(201).json({ success: true, data: vital });
    } catch (err) {
      next(err);
    }
  }

  static async updateVitalParam(req, res, next) {
    try {
      const { id } = req.params;
      const vital = await VitalParam.findOne({ vitalParamId: id, organizationId: req.organizationId });
      if (!vital) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vital parameter not found' } });
      }

      const before = vital.toObject();
      const { name, unit, normalRange, minVal, maxVal, inputType, isMandatory, category, status, order } = req.body;

      if (name !== undefined) vital.name = name.trim();
      if (unit !== undefined) vital.unit = unit;
      if (normalRange !== undefined) vital.normalRange = normalRange;
      if (minVal !== undefined) vital.minVal = minVal !== '' ? Number(minVal) : undefined;
      if (maxVal !== undefined) vital.maxVal = maxVal !== '' ? Number(maxVal) : undefined;
      if (inputType !== undefined) vital.inputType = inputType;
      if (isMandatory !== undefined) vital.isMandatory = Boolean(isMandatory);
      if (category !== undefined) vital.category = category;
      if (status !== undefined) vital.status = status;
      if (order !== undefined) vital.order = Number(order);

      vital.version += 1;
      await vital.save();

      AuditService.log({
        organizationId: req.organizationId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'vital_param.updated',
        entityType: 'vital_param',
        entityId: vital.vitalParamId,
        before,
        after: vital.toObject()
      });

      return res.json({ success: true, data: vital });
    } catch (err) {
      next(err);
    }
  }

  static async deleteVitalParam(req, res, next) {
    try {
      const { id } = req.params;
      const vital = await VitalParam.findOne({ vitalParamId: id, organizationId: req.organizationId });
      if (!vital) {
        return res.status(404).json({ success: false, error: { message: 'Vital parameter not found' } });
      }

      await vital.deleteOne();

      AuditService.log({
        organizationId: req.organizationId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'vital_param.deleted',
        entityType: 'vital_param',
        entityId: vital.vitalParamId,
        before: vital.toObject()
      });

      return res.json({ success: true, message: 'Vital parameter deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = VitalParamController;
