const mongoose = require('mongoose');

// --- 1. Dynamic Form Definition ---
const FormFieldSchema = new mongoose.Schema({
  fieldId: { type: String, required: true },
  key: { type: String, required: true }, // e.g. 'toothNumber', 'bpSystolic', 'chiefComplaint'
  label: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'text', 'textarea', 'number', 'decimal', 'date', 'datetime',
      'boolean', 'checkbox', 'radio', 'select', 'multiSelect', 'phone', 'email'
    ],
    default: 'text'
  },
  required: { type: Boolean, default: false },
  defaultValue: mongoose.Schema.Types.Mixed,
  placeholder: String,
  helpText: String,
  options: [{ type: String }], // For select, radio, multiSelect, checkbox
  order: { type: Number, default: 0 },
  visibleWhen: {
    fieldKey: String,
    operator: { type: String, enum: ['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan'] },
    value: mongoose.Schema.Types.Mixed
  },
  validationConfig: {
    min: Number,
    max: Number,
    pattern: String
  }
});

const FormSectionSchema = new mongoose.Schema({
  sectionId: { type: String, required: true },
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  fields: [FormFieldSchema]
});

const FormSchema = new mongoose.Schema({
  formId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  key: { type: String, required: true }, // 'dental-examination', 'general-opd', 'patient-intake'
  description: String,
  entityType: {
    type: String,
    enum: ['clinical-record', 'treatment', 'patient', 'encounter'],
    default: 'clinical-record'
  },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  currentVersionNumber: { type: Number, default: 1 },
  sections: [FormSectionSchema],
  version: { type: Number, default: 1 }
}, { timestamps: true });

FormSchema.index({ organizationId: 1, key: 1 }, { unique: true });

// --- 2. Dynamic Form Submission / Values ---
const FormSubmissionSchema = new mongoose.Schema({
  submissionId: { type: String, required: true, unique: true, index: true },
  formId: { type: String, required: true, index: true },
  formVersionNumber: { type: Number, default: 1 },
  organizationId: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, required: true, index: true }, // clinicalRecordId, patientId, etc.
  values: { type: mongoose.Schema.Types.Mixed, default: {} }, // key-value map of form values
  submittedBy: { type: String, required: true }, // User ID
  submittedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}, { timestamps: true });

FormSubmissionSchema.index({ organizationId: 1, entityType: 1, entityId: 1 });

// --- 3. Dynamic Workflow Definition ---
const WorkflowSchema = new mongoose.Schema({
  workflowId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  key: { type: String, required: true }, // 'standard-opd-visit', 'dental-procedure-flow'
  entityType: { type: String, default: 'encounter' },
  steps: [{
    stepKey: { type: String, required: true }, // 'registration', 'checkin', 'queue', 'consultation', 'billing', 'completed'
    name: { type: String, required: true },
    order: { type: Number, required: true },
    requiredRole: String
  }],
  transitions: [{
    fromStep: { type: String, required: true },
    toStep: { type: String, required: true },
    action: { type: String, required: true }, // 'start_consultation', 'complete_consultation', 'issue_bill'
    requiredPermission: String
  }],
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

WorkflowSchema.index({ organizationId: 1, key: 1 }, { unique: true });

// --- 4. Workflow Instance ---
const WorkflowInstanceSchema = new mongoose.Schema({
  instanceId: { type: String, required: true, unique: true, index: true },
  workflowId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true, index: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true, index: true },
  currentStep: { type: String, required: true },
  history: [{
    fromStep: String,
    toStep: String,
    action: String,
    actorUserId: String,
    timestamp: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['in_progress', 'completed', 'cancelled'], default: 'in_progress' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = {
  Form: mongoose.model('Form', FormSchema),
  FormSubmission: mongoose.model('FormSubmission', FormSubmissionSchema),
  Workflow: mongoose.model('Workflow', WorkflowSchema),
  WorkflowInstance: mongoose.model('WorkflowInstance', WorkflowInstanceSchema)
};
