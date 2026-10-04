const mongoose = require('mongoose');

// --- 1. Patient ---
const PatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  patientNumber: { type: String, required: true }, // e.g., P0001
  name: { type: String, required: true },
  phone: { type: String, required: true, index: true },
  email: String,
  dob: Date,
  age: Number,
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  bloodGroup: String,
  address: { street: String, city: String, state: String, zip: String },
  emergencyContact: { name: String, relation: String, phone: String },
  allergies: [{ type: String }],
  medicalHistory: [{ type: String }],
  balance: { type: Number, default: 0 },
  lastVisitAt: Date,
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
  archiveReason: String,
  customData: { type: mongoose.Schema.Types.Mixed, default: {} },
  version: { type: Number, default: 1 }
}, { timestamps: true });

PatientSchema.index({ organizationId: 1, patientNumber: 1 }, { unique: true });
PatientSchema.index({ organizationId: 1, phone: 1 });

// --- 2. Service Catalog ---
const ServiceSchema = new mongoose.Schema({
  serviceId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  departmentId: { type: String, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  category: { type: String, default: 'Consultation' }, // Consultation, Dental, Procedure, Lab, Radiology, Nursing
  durationMinutes: { type: Number, default: 15 },
  price: { type: Number, required: true, default: 0 },
  taxPercent: { type: Number, default: 0 },
  requiredFormId: String,
  requiredWorkflowId: String,
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

// --- 3. Appointment ---
const AppointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  departmentId: { type: String, index: true },
  patientId: { type: String, required: true, index: true },
  providerId: { type: String, required: true, index: true }, // Staff / Doctor ID
  serviceIds: [{ type: String, index: true }],
  scheduledStart: { type: Date, required: true, index: true },
  scheduledEnd: { type: Date, required: true },
  durationMinutes: { type: Number, default: 15 },
  appointmentType: { type: String, enum: ['scheduled', 'walk_in', 'emergency', 'follow_up'], default: 'scheduled' },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show', 'rescheduled'],
    default: 'scheduled'
  },
  reason: String,
  notes: String,
  checkInTime: Date,
  cancellationReason: String,
  version: { type: Number, default: 1 }
}, { timestamps: true });

AppointmentSchema.index({ organizationId: 1, branchId: 1, scheduledStart: 1 });
AppointmentSchema.index({ organizationId: 1, providerId: 1, scheduledStart: 1 });

// --- 4. Queue Entry ---
const QueueEntrySchema = new mongoose.Schema({
  queueEntryId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  departmentId: { type: String, index: true },
  patientId: { type: String, required: true, index: true },
  appointmentId: { type: String, index: true },
  encounterId: { type: String, index: true },
  providerId: { type: String, required: true, index: true },
  serviceIds: [{ type: String, index: true }],
  tokenNumber: { type: String, required: true }, // e.g., "A-01", "Q-102"
  priority: { type: String, enum: ['normal', 'urgent', 'vip'], default: 'normal' },
  status: {
    type: String,
    enum: ['waiting', 'called', 'in_consultation', 'completed', 'skipped', 'transferred'],
    default: 'waiting'
  },
  calledAt: Date,
  startedAt: Date,
  completedAt: Date,
  notes: String,
  version: { type: Number, default: 1 }
}, { timestamps: true });

QueueEntrySchema.index({ organizationId: 1, branchId: 1, status: 1, createdAt: 1 });

// --- 5. Encounter ---
const EncounterSchema = new mongoose.Schema({
  encounterId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  departmentId: { type: String, index: true },
  patientId: { type: String, required: true, index: true },
  providerId: { type: String, required: true, index: true },
  serviceIds: [{ type: String, index: true }],
  appointmentId: { type: String, index: true },
  queueEntryId: { type: String, index: true },
  encounterType: { type: String, enum: ['consultation', 'procedure', 'follow_up', 'emergency'], default: 'consultation' },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'waived'], default: 'pending' },
  caseType: { type: String, enum: ['new', 'follow_up'], default: 'new' },
  previousEncounterId: { type: String, index: true },
  status: { type: String, enum: ['draft', 'in_progress', 'completed', 'cancelled'], default: 'in_progress' },
  workflowInstanceId: String,
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  notes: String,
  isConsultationFeeWaived: { type: Boolean, default: false },
  version: { type: Number, default: 1 }
}, { timestamps: true });

EncounterSchema.index({ organizationId: 1, patientId: 1, createdAt: -1 });

// --- 6. Clinical Record ---
const ClinicalRecordSchema = new mongoose.Schema({
  clinicalRecordId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  encounterId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  providerId: { type: String, required: true },
  complaint: { type: String, default: '' },
  vitals: {
    bpSystolic: { type: String, default: '' },
    bpDiastolic: { type: String, default: '' },
    pulse: { type: String, default: '' },
    temperature: { type: String, default: '' },
    weightKg: { type: String, default: '' },
    heightCm: { type: String, default: '' },
    spo2: { type: String, default: '' }
  },
  history: { type: String, default: '' },
  examination: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  notes: { type: String, default: '' },
  conditionAndSymptoms: { type: String, default: '' },
  prescriptionNotes: { type: String, default: '' },
  treatmentRemarks: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'finalized', 'amended'], default: 'finalized' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

// --- 7. Treatment ---
const TreatmentSchema = new mongoose.Schema({
  treatmentId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  encounterId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  serviceId: { type: String, index: true },
  providerId: { type: String, required: true },
  name: { type: String, required: true },
  toothNumber: String, // For dental specialty
  procedureDetails: String,
  cost: { type: Number, default: 0 },
  status: { type: String, enum: ['planned', 'in_progress', 'completed', 'cancelled'], default: 'completed' },
  notes: String,
  formSubmissionId: String,
  version: { type: Number, default: 1 }
}, { timestamps: true });

// --- 8. Prescription ---
const PrescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  encounterId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  providerId: { type: String, required: true },
  items: [{
    medicineName: { type: String, required: true },
    dosage: { type: String, default: '1 tablet' },
    frequency: { type: String, default: '1-0-1' }, // Morning-Noon-Night
    duration: { type: String, default: '5 days' },
    timing: { type: String, default: 'After food' },
    instructions: String
  }],
  notes: String,
  status: { type: String, enum: ['active', 'dispensed', 'cancelled'], default: 'active' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

// --- 9. Follow Up ---
const FollowUpSchema = new mongoose.Schema({
  followupId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  patientId: { type: String, required: true, index: true },
  encounterId: { type: String, index: true },
  providerId: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  reason: { type: String, required: true },
  notes: String,
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  cancellationReason: String,
  convertedToAppointmentId: String,
  version: { type: Number, default: 1 }
}, { timestamps: true });

// --- 10. Clinical Vital Parameter Configuration ---
const VitalParamSchema = new mongoose.Schema({
  vitalParamId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  key: { type: String, required: true }, // e.g., 'bpSystolic', 'pulse', 'temperature'
  unit: { type: String, default: '' },
  normalRange: { type: String, default: '' },
  minVal: { type: Number },
  maxVal: { type: Number },
  inputType: { type: String, enum: ['numeric', 'decimal', 'text'], default: 'numeric' },
  isMandatory: { type: Boolean, default: false },
  category: { type: String, enum: ['general', 'triage', 'cardiac', 'respiratory', 'pediatric'], default: 'general' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  order: { type: Number, default: 0 },
  version: { type: Number, default: 1 }
}, { timestamps: true });

VitalParamSchema.index({ organizationId: 1, key: 1 }, { unique: true });

module.exports = {
  Patient: mongoose.model('Patient', PatientSchema),
  Service: mongoose.model('Service', ServiceSchema),
  Appointment: mongoose.model('Appointment', AppointmentSchema),
  QueueEntry: mongoose.model('QueueEntry', QueueEntrySchema),
  Encounter: mongoose.model('Encounter', EncounterSchema),
  ClinicalRecord: mongoose.model('ClinicalRecord', ClinicalRecordSchema),
  Treatment: mongoose.model('Treatment', TreatmentSchema),
  Prescription: mongoose.model('Prescription', PrescriptionSchema),
  FollowUp: mongoose.model('FollowUp', FollowUpSchema),
  VitalParam: mongoose.model('VitalParam', VitalParamSchema)
};
