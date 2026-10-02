const {
  Organization,
  Branch,
  Department,
  User,
  Role,
  Permission,
  Staff
} = require('./IdentityModels');

const {
  Patient,
  Service,
  Appointment,
  QueueEntry,
  Encounter,
  ClinicalRecord,
  Treatment,
  Prescription,
  FollowUp,
  VitalParam
} = require('./HealthcareModels');

const {
  Invoice,
  Payment,
  Receipt,
  Refund,
  LedgerEntry
} = require('./FinancialModels');

const {
  Document,
  Notification
} = require('./DocumentModels');

const {
  Form,
  FormSubmission,
  Workflow,
  WorkflowInstance
} = require('./DynamicModels');

const {
  AuditLog,
  SyncOperation,
  OutboxEvent
} = require('./PlatformModels');

module.exports = {
  Organization,
  Branch,
  Department,
  User,
  Role,
  Permission,
  Staff,
  Patient,
  Service,
  Appointment,
  QueueEntry,
  Encounter,
  ClinicalRecord,
  Treatment,
  Prescription,
  FollowUp,
  VitalParam,
  Invoice,
  Payment,
  Receipt,
  Refund,
  LedgerEntry,
  Document,
  Notification,
  Form,
  FormSubmission,
  Workflow,
  WorkflowInstance,
  AuditLog,
  SyncOperation,
  OutboxEvent
};
