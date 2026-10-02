const mongoose = require('mongoose');

// --- 1. Organization ---
const OrganizationSchema = new mongoose.Schema({
  organizationId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  type: { type: String, enum: ['single_doctor', 'clinic', 'dental_clinic', 'multi_doctor', 'hospital', 'diagnostic'], default: 'clinic' },
  phone: String,
  email: String,
  address: { street: String, city: String, state: String, country: String, zip: String },
  logoUrl: String,
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  settings: {
    modules: {
      dental: { type: Boolean, default: false },
      appointments: { type: Boolean, default: true },
      queue: { type: Boolean, default: true },
      clinical: { type: Boolean, default: true },
      billing: { type: Boolean, default: true },
      documents: { type: Boolean, default: true },
      reports: { type: Boolean, default: true }
    },
    timezone: { type: String, default: 'Asia/Kolkata' },
    taxDefaultPercent: { type: Number, default: 0 },
    appointmentSlotDurationMinutes: { type: Number, default: 15 }
  },
  version: { type: Number, default: 1 }
}, { timestamps: true });

// --- 2. Branch ---
const BranchSchema = new mongoose.Schema({
  branchId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  tagline: { type: String, default: 'Multi-Specialty Healthcare & Clinic Centre' },
  isMain: { type: Boolean, default: false },
  phone: String,
  emergencyPhone: String,
  email: String,
  website: String,
  taxNumber: String, // GST / Tax Reg No
  registrationNumber: String, // Clinical Establishment Reg No
  clinicHeaderNote: { type: String, default: 'Official Medical Prescription & Healthcare Consultation Record' },
  clinicFooterNote: { type: String, default: 'Thank you for visiting. Valid computer generated healthcare record.' },
  address: { street: String, city: String, state: String, country: { type: String, default: 'India' }, zip: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

// --- 3. Department ---
const DepartmentSchema = new mongoose.Schema({
  departmentId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

// --- 4. User ---
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: String,
  passwordHash: { type: String, required: true },
  roleId: { type: String, index: true },
  roleIds: [{ type: String }],
  roleKey: { type: String, default: 'staff' }, // admin, doctor, receptionist, billing_staff
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
  lastLogin: Date,
  version: { type: Number, default: 1 }
}, { timestamps: true });

UserSchema.index({ organizationId: 1, email: 1 }, { unique: true });

// --- 5. Role ---
const RoleSchema = new mongoose.Schema({
  roleId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  key: { type: String, required: true }, // admin, doctor, receptionist, billing_staff, custom
  description: String,
  isSystem: { type: Boolean, default: false },
  permissions: [{ type: String }],
  version: { type: Number, default: 1 }
}, { timestamps: true });

RoleSchema.index({ organizationId: 1, key: 1 }, { unique: true });

// --- 6. Permission Registry ---
const PermissionSchema = new mongoose.Schema({
  permissionId: { type: String, required: true, unique: true, index: true },
  key: { type: String, required: true, unique: true }, // e.g., 'patients.view'
  category: { type: String, required: true }, // patients, appointments, queue, clinical, billing, reports, admin
  name: { type: String, required: true },
  description: String
}, { timestamps: true });

// --- 7. Staff ---
const StaffSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  departmentId: { type: String, index: true },
  name: { type: String, required: true },
  designation: { type: String, required: true }, // Doctor, Nurse, Receptionist, Accountant
  specialty: String, // General Physician, Dentist, Orthopedic, etc.
  phone: String,
  email: String,
  licenseNumber: String,
  consultationFee: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'on_leave', 'archived'], default: 'active' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = {
  Organization: mongoose.model('Organization', OrganizationSchema),
  Branch: mongoose.model('Branch', BranchSchema),
  Department: mongoose.model('Department', DepartmentSchema),
  User: mongoose.model('User', UserSchema),
  Role: mongoose.model('Role', RoleSchema),
  Permission: mongoose.model('Permission', PermissionSchema),
  Staff: mongoose.model('Staff', StaffSchema)
};
