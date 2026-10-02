const mongoose = require('mongoose');

// --- 1. Audit Log ---
const AuditLogSchema = new mongoose.Schema({
  auditLogId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  actorUserId: { type: String, required: true, index: true },
  actorName: String,
  action: { type: String, required: true }, // 'patient.created', 'invoice.updated', 'payment.verified', etc.
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, required: true, index: true },
  before: mongoose.Schema.Types.Mixed,
  after: mongoose.Schema.Types.Mixed,
  reason: String,
  ip: String,
  userAgent: String,
  correlationId: String,
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: false });

AuditLogSchema.index({ organizationId: 1, entityType: 1, entityId: 1 });
AuditLogSchema.index({ organizationId: 1, timestamp: -1 });

// --- 2. Sync Operation (Offline / Online Sync Engine) ---
const SyncOperationSchema = new mongoose.Schema({
  operationId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  entityType: { type: String, required: true }, // 'patient', 'appointment', 'encounter', 'payment', 'formSubmission'
  entityId: { type: String, required: true },
  entityVersion: { type: Number, default: 1 },
  operationType: { type: String, enum: ['create', 'update', 'delete'], required: true },
  deviceId: String,
  userId: { type: String, required: true },
  payload: mongoose.Schema.Types.Mixed,
  syncStatus: {
    type: String,
    enum: ['pending', 'syncing', 'synced', 'conflict', 'failed'],
    default: 'pending'
  },
  conflictDetails: mongoose.Schema.Types.Mixed,
  appliedAt: Date,
  errorMessage: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

SyncOperationSchema.index({ organizationId: 1, syncStatus: 1 });

// --- 3. Outbox Event ---
const OutboxEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  eventType: { type: String, required: true }, // e.g. 'payment.received.v1', 'appointment.completed.v1'
  eventVersion: { type: String, default: 'v1' },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  actorUserId: String,
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  payload: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['pending', 'dispatched', 'failed'], default: 'dispatched' },
  occurredAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  AuditLog: mongoose.model('AuditLog', AuditLogSchema),
  SyncOperation: mongoose.model('SyncOperation', SyncOperationSchema),
  OutboxEvent: mongoose.model('OutboxEvent', OutboxEventSchema)
};
