const mongoose = require('mongoose');

// --- 1. Document ---
const DocumentSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  entityType: {
    type: String,
    enum: ['patient', 'encounter', 'invoice', 'payment', 'consent', 'staff', 'organization'],
    required: true,
    index: true
  },
  entityId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  category: { type: String, default: 'General' }, // Prescription, Lab Report, X-Ray, ID Proof, Invoice Receipt, Consent
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  mimeType: String,
  sizeBytes: Number,
  currentVersionNumber: { type: Number, default: 1 },
  versions: [{
    versionNumber: { type: Number, default: 1 },
    fileUrl: String,
    fileName: String,
    mimeType: String,
    sizeBytes: Number,
    uploadedBy: String,
    uploadedAt: { type: Date, default: Date.now },
    notes: String
  }],
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

DocumentSchema.index({ organizationId: 1, entityType: 1, entityId: 1 });

// --- 2. Notification ---
const NotificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'urgent'], default: 'info' },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  link: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

NotificationSchema.index({ organizationId: 1, userId: 1, isRead: 1 });

module.exports = {
  Document: mongoose.model('Document', DocumentSchema),
  Notification: mongoose.model('Notification', NotificationSchema)
};
