const {
  Form,
  FormSubmission,
  Workflow,
  WorkflowInstance
} = require('../models');
const { generateId } = require('../utils/idGenerator');
const AuditService = require('../services/AuditService');

class DynamicController {
  // --- Form Engine ---
  static async getForms(req, res, next) {
    try {
      const { entityType } = req.query;
      const query = { organizationId: req.organizationId };
      if (entityType) query.entityType = entityType;

      const forms = await Form.find(query).sort({ name: 1 });
      return res.json({ success: true, data: forms });
    } catch (err) {
      next(err);
    }
  }

  static async getFormByKey(req, res, next) {
    try {
      const { key } = req.params;
      const form = await Form.findOne({ key, organizationId: req.organizationId });
      if (!form) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Form not found' } });
      }
      return res.json({ success: true, data: form });
    } catch (err) {
      next(err);
    }
  }

  static async createForm(req, res, next) {
    try {
      const { name, key, description, entityType, sections } = req.body;
      if (!name || !key) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Form name and key are required' } });
      }

      // Format sections and fields with unique IDs
      const processedSections = (sections || []).map((sec, secIdx) => ({
        sectionId: generateId('formSection'),
        title: sec.title || `Section ${secIdx + 1}`,
        order: sec.order !== undefined ? sec.order : secIdx,
        fields: (sec.fields || []).map((f, fIdx) => ({
          fieldId: generateId('formField'),
          key: f.key,
          label: f.label,
          type: f.type || 'text',
          required: !!f.required,
          placeholder: f.placeholder,
          defaultValue: f.defaultValue,
          helpText: f.helpText,
          options: f.options || [],
          order: f.order !== undefined ? f.order : fIdx,
          visibleWhen: f.visibleWhen,
          validationConfig: f.validationConfig
        }))
      }));

      const form = await Form.create({
        formId: generateId('form'),
        organizationId: req.organizationId,
        name,
        key: key.toLowerCase().replace(/\s+/g, '-'),
        description,
        entityType: entityType || 'clinical-record',
        status: 'published',
        sections: processedSections
      });

      AuditService.log({
        organizationId: req.organizationId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'form.published',
        entityType: 'form',
        entityId: form.formId,
        after: form.toObject()
      });

      return res.status(201).json({ success: true, data: form });
    } catch (err) {
      next(err);
    }
  }

  static async updateForm(req, res, next) {
    try {
      const { id } = req.params;
      const form = await Form.findOne({ formId: id, organizationId: req.organizationId });
      if (!form) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Form not found' } });
      }

      const before = form.toObject();
      if (req.body.name) form.name = req.body.name;
      if (req.body.description !== undefined) form.description = req.body.description;
      if (req.body.status) form.status = req.body.status;
      if (req.body.sections) {
        form.sections = req.body.sections.map((sec, secIdx) => ({
          sectionId: sec.sectionId || generateId('formSection'),
          title: sec.title || `Section ${secIdx + 1}`,
          order: sec.order !== undefined ? sec.order : secIdx,
          fields: (sec.fields || []).map((f, fIdx) => ({
            fieldId: f.fieldId || generateId('formField'),
            key: f.key,
            label: f.label,
            type: f.type || 'text',
            required: !!f.required,
            placeholder: f.placeholder,
            defaultValue: f.defaultValue,
            helpText: f.helpText,
            options: f.options || [],
            order: f.order !== undefined ? f.order : fIdx,
            visibleWhen: f.visibleWhen,
            validationConfig: f.validationConfig
          }))
        }));
        form.currentVersionNumber += 1;
      }
      form.version += 1;
      await form.save();

      AuditService.log({
        organizationId: req.organizationId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'form.updated',
        entityType: 'form',
        entityId: form.formId,
        before,
        after: form.toObject()
      });

      return res.json({ success: true, data: form });
    } catch (err) {
      next(err);
    }
  }

  static async submitFormValues(req, res, next) {
    try {
      const { formId, entityType, entityId, values } = req.body;
      if (!formId || !entityId || !values) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Form ID, entity ID, and values are required' } });
      }

      const form = await Form.findOne({ formId, organizationId: req.organizationId });
      if (!form) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Form not found' } });
      }

      let submission = await FormSubmission.findOne({ formId, entityId, organizationId: req.organizationId });

      if (!submission) {
        submission = await FormSubmission.create({
          submissionId: generateId('formSubmission'),
          formId,
          formVersionNumber: form.currentVersionNumber,
          organizationId: req.organizationId,
          entityType: entityType || form.entityType,
          entityId,
          values,
          submittedBy: req.user.userId
        });
      } else {
        submission.values = { ...submission.values, ...values };
        submission.version += 1;
        await submission.save();
      }

      return res.json({ success: true, message: 'Form values submitted successfully', data: submission });
    } catch (err) {
      next(err);
    }
  }

  static async getFormSubmission(req, res, next) {
    try {
      const { entityId } = req.params;
      const submission = await FormSubmission.findOne({ entityId, organizationId: req.organizationId });
      return res.json({ success: true, data: submission ? submission.values : {} });
    } catch (err) {
      next(err);
    }
  }

  // --- Workflow Engine ---
  static async getWorkflows(req, res, next) {
    try {
      const workflows = await Workflow.find({ organizationId: req.organizationId }).sort({ name: 1 });
      return res.json({ success: true, data: workflows });
    } catch (err) {
      next(err);
    }
  }

  static async createWorkflow(req, res, next) {
    try {
      const { name, key, entityType, steps, transitions } = req.body;
      if (!name || !key) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Workflow name and key are required' } });
      }

      const workflow = await Workflow.create({
        workflowId: generateId('workflow'),
        organizationId: req.organizationId,
        name,
        key: key.toLowerCase().replace(/\s+/g, '-'),
        entityType: entityType || 'encounter',
        steps: steps || [],
        transitions: transitions || []
      });

      return res.status(201).json({ success: true, data: workflow });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DynamicController;
