require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const { generateId } = require('../utils/idGenerator');
const {
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
  Invoice,
  Payment,
  Receipt,
  LedgerEntry,
  Document,
  Form,
  FormSubmission,
  Workflow,
  WorkflowInstance,
  AuditLog
} = require('../models');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB. Purging existing collections...');

    // Clear all existing collections
    await Promise.all([
      Organization.deleteMany({}),
      Branch.deleteMany({}),
      Department.deleteMany({}),
      User.deleteMany({}),
      Role.deleteMany({}),
      Permission.deleteMany({}),
      Staff.deleteMany({}),
      Patient.deleteMany({}),
      Service.deleteMany({}),
      Appointment.deleteMany({}),
      QueueEntry.deleteMany({}),
      Encounter.deleteMany({}),
      ClinicalRecord.deleteMany({}),
      Treatment.deleteMany({}),
      Prescription.deleteMany({}),
      FollowUp.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      Receipt.deleteMany({}),
      LedgerEntry.deleteMany({}),
      Document.deleteMany({}),
      Form.deleteMany({}),
      FormSubmission.deleteMany({}),
      Workflow.deleteMany({}),
      WorkflowInstance.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('[Seed] Collections cleared.');

    // 1. Seed Permissions Registry (26 core permissions)
    const permissionDefs = [
      { key: 'patients.view', category: 'patients', name: 'View Patients', description: 'Can view patient lists and profile' },
      { key: 'patients.create', category: 'patients', name: 'Create Patients', description: 'Can register new patients' },
      { key: 'patients.edit', category: 'patients', name: 'Edit Patients', description: 'Can edit patient demographics' },
      { key: 'patients.archive', category: 'patients', name: 'Archive Patients', description: 'Can soft delete / archive patients' },

      { key: 'appointments.view', category: 'appointments', name: 'View Appointments', description: 'Can view appointment schedule' },
      { key: 'appointments.create', category: 'appointments', name: 'Create Appointments', description: 'Can book appointments' },
      { key: 'appointments.edit', category: 'appointments', name: 'Edit Appointments', description: 'Can reschedule and edit appointments' },
      { key: 'appointments.cancel', category: 'appointments', name: 'Cancel Appointments', description: 'Can cancel appointments' },

      { key: 'queue.view', category: 'queue', name: 'View Queue', description: 'Can view live token queue' },
      { key: 'queue.manage', category: 'queue', name: 'Manage Queue', description: 'Can call, recall, complete or skip tokens' },

      { key: 'clinical.view', category: 'clinical', name: 'View Clinical Records', description: 'Can view consultations, charts, notes' },
      { key: 'clinical.create', category: 'clinical', name: 'Create Clinical Records', description: 'Can perform consultation, diagnoses, treatments' },
      { key: 'clinical.edit', category: 'clinical', name: 'Edit Clinical Records', description: 'Can amend clinical notes and prescriptions' },

      { key: 'billing.view', category: 'billing', name: 'View Invoices', description: 'Can view bills and outstanding amounts' },
      { key: 'billing.create', category: 'billing', name: 'Create Invoices', description: 'Can issue invoices' },
      { key: 'billing.edit', category: 'billing', name: 'Edit Invoices', description: 'Can edit invoice items and discounts' },

      { key: 'payment.view', category: 'payments', name: 'View Payments', description: 'Can view payment transactions and receipts' },
      { key: 'payment.create', category: 'payments', name: 'Receive Payments', description: 'Can record offline/online payments' },
      { key: 'payment.verify', category: 'payments', name: 'Verify Payments', description: 'Can verify offline proof of payments' },
      { key: 'payment.refund', category: 'payments', name: 'Process Refunds', description: 'Can issue refund entries' },

      { key: 'documents.view', category: 'documents', name: 'View Documents', description: 'Can view linked documents and scans' },
      { key: 'documents.create', category: 'documents', name: 'Upload Documents', description: 'Can upload and link files to patients' },

      { key: 'reports.view', category: 'reports', name: 'View Reports', description: 'Can view financial and operational analytics' },
      { key: 'reports.export', category: 'reports', name: 'Export Reports', description: 'Can download CSV and PDF reports' },

      { key: 'admin.manage', category: 'admin', name: 'Administration Hub', description: 'Can configure organization, staff, roles, forms, workflows' },
      { key: 'settings.manage', category: 'settings', name: 'User & Clinic Settings', description: 'Can manage user profile and branch switches' }
    ];

    const savedPermissions = await Permission.insertMany(
      permissionDefs.map(p => ({
        permissionId: generateId('perm'),
        ...p
      }))
    );
    console.log(`[Seed] Seeded ${savedPermissions.length} permissions.`);

    // 2. Organization
    const organizationId = generateId('org');
    await Organization.create({
      organizationId,
      name: 'Apex Multi-Specialty Dental & Health Care',
      code: 'APEX',
      type: 'dental_clinic',
      currency: 'INR',
      phone: '+91 755 244 8899',
      email: 'contact@apexhealthcare.in',
      website: 'https://apexhealthcare.in',
      taxNumber: '23AAAAA0000A1Z5',
      settings: {
        modules: {
          dental: true,
          appointments: true,
          queue: true,
          clinical: true,
          billing: true,
          documents: true,
          reports: true
        },
        taxDefaultPercent: 0,
        appointmentSlotDurationMinutes: 15,
        timezone: 'Asia/Kolkata'
      }
    });

    // 3. Branches
    const mainBranchId = generateId('branch');
    const areraBranchId = generateId('branch');

    await Branch.insertMany([
      {
        branchId: mainBranchId,
        organizationId,
        name: 'Main City Centre Branch',
        code: 'MAIN',
        phone: '+91 755 244 8801',
        email: 'main@apexhealthcare.in',
        address: {
          street: 'Plot 12, Commercial Enclave, MP Nagar Zone II',
          city: 'Bhopal',
          state: 'Madhya Pradesh',
          zip: '462011',
          country: 'India'
        },
        isMain: true,
        status: 'active'
      },
      {
        branchId: areraBranchId,
        organizationId,
        name: 'Arera Colony Branch',
        code: 'ARERA',
        phone: '+91 755 244 8802',
        email: 'arera@apexhealthcare.in',
        address: {
          street: 'E-3/45, Near 10 No. Market, Arera Colony',
          city: 'Bhopal',
          state: 'Madhya Pradesh',
          zip: '462016',
          country: 'India'
        },
        isMain: false,
        status: 'active'
      }
    ]);

    // 4. Departments
    const deptDentalId = generateId('department');
    const deptOrthoId = generateId('department');
    const deptSurgeryId = generateId('department');
    const deptReceptionId = generateId('department');

    await Department.insertMany([
      {
        departmentId: deptDentalId,
        organizationId,
        branchId: mainBranchId,
        name: 'General & Endodontic Dentistry',
        code: 'DENT-ENDO',
        description: 'Root canals, fillings, cleanings, and diagnostic consultations'
      },
      {
        departmentId: deptOrthoId,
        organizationId,
        branchId: mainBranchId,
        name: 'Orthodontics & Dentofacial Orthopedics',
        code: 'DENT-ORTHO',
        description: 'Braces, aligners, bite correction'
      },
      {
        departmentId: deptSurgeryId,
        organizationId,
        branchId: mainBranchId,
        name: 'Oral & Maxillofacial Surgery',
        code: 'ORAL-SURG',
        description: 'Impacted tooth extractions, implants, minor surgeries'
      },
      {
        departmentId: deptReceptionId,
        organizationId,
        branchId: mainBranchId,
        name: 'Front Desk, Admissions & Billing',
        code: 'ADMIN-DESK',
        description: 'Reception, token issuance, billing & cashiering'
      }
    ]);

    // 5. Roles
    const adminRoleId = generateId('role');
    const doctorRoleId = generateId('role');
    const receptionistRoleId = generateId('role');
    const billingRoleId = generateId('role');

    await Role.insertMany([
      {
        roleId: adminRoleId,
        organizationId,
        name: 'Super Admin',
        key: 'super_admin',
        description: 'Full administrative access across all clinics and modules',
        isSystem: true,
        permissions: permissionDefs.map(p => p.key)
      },
      {
        roleId: doctorRoleId,
        organizationId,
        name: 'Doctor / Specialist',
        key: 'doctor',
        description: 'Clinical consultations, prescriptions, examinations, and queue handling',
        isSystem: true,
        permissions: [
          'patients.view',
          'patients.create',
          'appointments.view',
          'appointments.create',
          'appointments.edit',
          'queue.view',
          'queue.manage',
          'clinical.view',
          'clinical.create',
          'clinical.edit',
          'documents.view',
          'documents.create'
        ]
      },
      {
        roleId: receptionistRoleId,
        organizationId,
        name: 'Front Desk Receptionist',
        key: 'receptionist',
        description: 'Patient registration, appointment booking, check-in, and live queue token issuance',
        isSystem: true,
        permissions: [
          'patients.view',
          'patients.create',
          'patients.edit',
          'appointments.view',
          'appointments.create',
          'appointments.edit',
          'appointments.cancel',
          'queue.view',
          'queue.manage',
          'billing.view',
          'billing.create',
          'payment.view',
          'payment.create',
          'documents.view',
          'documents.create'
        ]
      },
      {
        roleId: billingRoleId,
        organizationId,
        name: 'Billing & Cashier Specialist',
        key: 'billing_staff',
        description: 'Financial operations, billing, payment collections, receipts, and offline verification',
        isSystem: true,
        permissions: [
          'patients.view',
          'billing.view',
          'billing.create',
          'billing.edit',
          'payment.view',
          'payment.create',
          'payment.verify',
          'payment.refund',
          'reports.view',
          'reports.export'
        ]
      },
      {
        roleId: generateId('role'),
        organizationId,
        name: 'Branch Administrator',
        key: 'branch_admin',
        description: 'Branch-level operational admin (Manages branch appointments, queue, clinical, billing, reports)',
        isSystem: true,
        permissions: [
          'patients.view',
          'patients.create',
          'patients.edit',
          'patients.archive',
          'appointments.view',
          'appointments.create',
          'appointments.edit',
          'appointments.cancel',
          'queue.view',
          'queue.manage',
          'clinical.view',
          'clinical.create',
          'clinical.edit',
          'billing.view',
          'billing.create',
          'billing.edit',
          'payment.view',
          'payment.create',
          'payment.verify',
          'payment.refund',
          'documents.view',
          'documents.create',
          'reports.view',
          'reports.export',
          'settings.manage'
        ]
      }
    ]);

    // 6. Users & Passwords
    const defaultPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    const adminUserId = generateId('user');
    const doctorUserId = generateId('user');
    const doctor2UserId = generateId('user');
    const receptionistUserId = generateId('user');
    const billingUserId = generateId('user');

    await User.insertMany([
      {
        userId: adminUserId,
        organizationId,
        branchId: mainBranchId,
        name: 'Dr. Vikramaditya Rao (Owner/Admin)',
        email: 'admin@apex.com',
        phone: '+91 98980 00001',
        passwordHash: adminPassword,
        roleId: adminRoleId,
        roleKey: 'super_admin',
        status: 'active'
      },
      {
        userId: doctorUserId,
        organizationId,
        branchId: mainBranchId,
        name: 'Dr. Amit Verma (BDS, MDS - Endodontist)',
        email: 'doctor@apex.com',
        phone: '+91 98980 00002',
        passwordHash: defaultPassword,
        roleId: doctorRoleId,
        roleKey: 'doctor',
        status: 'active'
      },
      {
        userId: doctor2UserId,
        organizationId,
        branchId: mainBranchId,
        name: 'Dr. Neha Saxena (BDS, MDS - Orthodontist)',
        email: 'neha.ortho@apex.com',
        phone: '+91 98980 00005',
        passwordHash: defaultPassword,
        roleId: doctorRoleId,
        roleKey: 'doctor',
        status: 'active'
      },
      {
        userId: receptionistUserId,
        organizationId,
        branchId: mainBranchId,
        name: 'Sneha Patel (Front Desk Lead)',
        email: 'reception@apex.com',
        phone: '+91 98980 00003',
        passwordHash: defaultPassword,
        roleId: receptionistRoleId,
        roleKey: 'receptionist',
        status: 'active'
      },
      {
        userId: billingUserId,
        organizationId,
        branchId: mainBranchId,
        name: 'Rohan Sharma (Accounts & Cashier)',
        email: 'billing@apex.com',
        phone: '+91 98980 00004',
        passwordHash: defaultPassword,
        roleId: billingRoleId,
        roleKey: 'billing_staff',
        status: 'active'
      }
    ]);

    // Seed Staff
    const doctorStaffId = generateId('staff');
    const doctor2StaffId = generateId('staff');
    const receptionistStaffId = generateId('staff');
    const billingStaffId = generateId('staff');

    await Staff.insertMany([
      {
        staffId: doctorStaffId,
        userId: doctorUserId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        name: 'Dr. Amit Verma',
        designation: 'Senior Dental Surgeon & Endodontist',
        specialty: 'Endodontics & Conservative Dentistry',
        phone: '+91 98980 00002',
        email: 'doctor@apex.com',
        licenseNumber: 'MPDC-2015-8842',
        consultationFee: 400
      },
      {
        staffId: doctor2StaffId,
        userId: doctor2UserId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptOrthoId,
        name: 'Dr. Neha Saxena',
        designation: 'Consultant Orthodontist',
        specialty: 'Dentofacial Orthopedics & Clear Aligners',
        phone: '+91 98980 00005',
        email: 'neha.ortho@apex.com',
        licenseNumber: 'MPDC-2018-9120',
        consultationFee: 500
      },
      {
        staffId: receptionistStaffId,
        userId: receptionistUserId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptReceptionId,
        name: 'Sneha Patel',
        designation: 'Reception Desk Lead',
        phone: '+91 98980 00003',
        email: 'reception@apex.com'
      },
      {
        staffId: billingStaffId,
        userId: billingUserId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptReceptionId,
        name: 'Rohan Sharma',
        designation: 'Chief Cashier & Billing Officer',
        phone: '+91 98980 00004',
        email: 'billing@apex.com'
      }
    ]);

    // 7. Services Catalog (10 diverse clinical services)
    const svcConsultationId = generateId('service');
    const svcRctId = generateId('service');
    const svcCleaningId = generateId('service');
    const svcExtractionId = generateId('service');
    const svcXRayId = generateId('service');
    const svcCrownId = generateId('service');
    const svcBracesId = generateId('service');
    const svcBleachingId = generateId('service');
    const svcFillingId = generateId('service');
    const svcImplantId = generateId('service');

    await Service.insertMany([
      {
        serviceId: svcConsultationId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        name: 'Dental Consultation & Oral Examination',
        code: 'DENT-CONSULT',
        category: 'Consultation',
        durationMinutes: 15,
        price: 400,
        taxPercent: 0
      },
      {
        serviceId: svcRctId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        name: 'Root Canal Treatment (RCT - Rotary/Single Sitting)',
        code: 'DENT-RCT',
        category: 'Dental',
        durationMinutes: 45,
        price: 3500,
        taxPercent: 0
      },
      {
        serviceId: svcCleaningId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        name: 'Ultrasonic Teeth Scaling & Stain Polishing',
        code: 'DENT-CLEAN',
        category: 'Dental',
        durationMinutes: 30,
        price: 1200,
        taxPercent: 0
      },
      {
        serviceId: svcExtractionId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptSurgeryId,
        name: 'Tooth Extraction (Surgical / Impacted)',
        code: 'DENT-EXTR',
        category: 'Dental',
        durationMinutes: 40,
        price: 1800,
        taxPercent: 0
      },
      {
        serviceId: svcXRayId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        name: 'Digital Intraoral Radiograph (RVG / IOPA)',
        code: 'DENT-XRAY',
        category: 'Radiology',
        durationMinutes: 10,
        price: 300,
        taxPercent: 0
      },
      {
        serviceId: svcCrownId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        name: 'Zirconia / Ceramic Dental Crown',
        code: 'DENT-CROWN',
        category: 'Dental',
        durationMinutes: 30,
        price: 6000,
        taxPercent: 0
      },
      {
        serviceId: svcBracesId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptOrthoId,
        name: 'Orthodontic Braces Consultation & Bonding',
        code: 'DENT-BRACES',
        category: 'Dental',
        durationMinutes: 60,
        price: 25000,
        taxPercent: 0
      },
      {
        serviceId: svcBleachingId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        name: 'In-Office Diode Laser Teeth Whitening',
        code: 'DENT-BLEACH',
        category: 'Dental',
        durationMinutes: 45,
        price: 7000,
        taxPercent: 0
      },
      {
        serviceId: svcFillingId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        name: 'Composite Light-Cure Tooth Colored Restoration',
        code: 'DENT-FILL',
        category: 'Dental',
        durationMinutes: 25,
        price: 1000,
        taxPercent: 0
      },
      {
        serviceId: svcImplantId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptSurgeryId,
        name: 'Titanium Dental Implant (Single Stage)',
        code: 'DENT-IMPLANT',
        category: 'Dental',
        durationMinutes: 60,
        price: 28000,
        taxPercent: 0
      }
    ]);

    // 8. Dynamic Forms
    const dentalFormId = generateId('form');
    await Form.create({
      formId: dentalFormId,
      organizationId,
      name: 'Dental Clinical Examination Form',
      key: 'dental-examination',
      description: 'Standard clinical diagnosis, tooth numbering, caries status, and gum health assessment',
      entityType: 'clinical-record',
      status: 'published',
      currentVersionNumber: 1,
      sections: [
        {
          sectionId: generateId('formSection'),
          title: 'Tooth & Pain Assessment',
          order: 0,
          fields: [
            {
              fieldId: generateId('formField'),
              key: 'toothNumber',
              label: 'Involved Tooth Number (FDI Notation)',
              type: 'text',
              required: true,
              placeholder: 'e.g. 16, 21, 36, 46',
              order: 0
            },
            {
              fieldId: generateId('formField'),
              key: 'painLevel',
              label: 'Pain Severity Level',
              type: 'select',
              required: true,
              options: ['Mild (1-3)', 'Moderate (4-6)', 'Severe Throbbing (7-10)', 'No Pain / Routine Checkup'],
              defaultValue: 'Moderate (4-6)',
              order: 1
            },
            {
              fieldId: generateId('formField'),
              key: 'sensitivityType',
              label: 'Sensitivity Trigger',
              type: 'select',
              options: ['None', 'Cold Drinks / Food', 'Hot Beverages', 'Sweet Foods', 'Chewing Pressure'],
              defaultValue: 'Cold Drinks / Food',
              order: 2
            }
          ]
        },
        {
          sectionId: generateId('formSection'),
          title: 'Clinical Observations & Oral Hygiene',
          order: 1,
          fields: [
            {
              fieldId: generateId('formField'),
              key: 'cariesDetected',
              label: 'Cavities / Caries Detected?',
              type: 'boolean',
              defaultValue: true,
              order: 0
            },
            {
              fieldId: generateId('formField'),
              key: 'gumStatus',
              label: 'Gingival / Gum Condition',
              type: 'select',
              options: ['Healthy & Pink', 'Mild Gingivitis / Bleeding on Brushing', 'Moderate Periodontitis with Calculus', 'Severe Pocket Formation'],
              defaultValue: 'Healthy & Pink',
              order: 1
            },
            {
              fieldId: generateId('formField'),
              key: 'mobilityGrade',
              label: 'Tooth Mobility',
              type: 'select',
              options: ['Grade 0 (Firm)', 'Grade I (Slight horizontal)', 'Grade II (Moderate horizontal)', 'Grade III (Severe / vertical)'],
              defaultValue: 'Grade 0 (Firm)',
              order: 2
            }
          ]
        }
      ]
    });

    // 9. Workflows
    const opdWorkflowId = generateId('workflow');
    await Workflow.create({
      workflowId: opdWorkflowId,
      organizationId,
      name: 'Standard Outpatient Clinical Workflow',
      key: 'standard-opd-visit',
      entityType: 'encounter',
      steps: [
        { stepKey: 'registration', name: 'Patient Registration', order: 1 },
        { stepKey: 'checkin', name: 'Check-in & Token Issued', order: 2 },
        { stepKey: 'queue', name: 'Waiting in Queue', order: 3 },
        { stepKey: 'consultation', name: 'Doctor Consultation & Treatment', order: 4, requiredRole: 'doctor' },
        { stepKey: 'billing', name: 'Invoice Generation & Payment', order: 5 },
        { stepKey: 'completed', name: 'Visit Completed', order: 6 }
      ],
      transitions: [
        { fromStep: 'registration', toStep: 'checkin', action: 'check_in' },
        { fromStep: 'checkin', toStep: 'queue', action: 'assign_token' },
        { fromStep: 'queue', toStep: 'consultation', action: 'start_consultation' },
        { fromStep: 'consultation', toStep: 'billing', action: 'complete_encounter' },
        { fromStep: 'billing', toStep: 'completed', action: 'receive_payment' }
      ]
    });

    // 10. Seed 16 Realistic Patients
    console.log('[Seed] Generating 16 diverse, realistic patient profiles...');
    const patientDataSeeds = [
      {
        num: 'P0001',
        name: 'Rajesh Kumar',
        phone: '9827011223',
        email: 'rajesh.kumar@gmail.com',
        age: 35,
        gender: 'male',
        bloodGroup: 'B+',
        street: 'Flat 302, Green Meadows',
        city: 'Bhopal',
        allergies: ['Penicillin'],
        medicalHistory: ['Hypertension (Mild)'],
        balance: 1800
      },
      {
        num: 'P0002',
        name: 'Priya Sharma',
        phone: '9826044556',
        email: 'priya.sharma@yahoo.com',
        age: 28,
        gender: 'female',
        bloodGroup: 'O+',
        street: 'B-14 Malviya Nagar',
        city: 'Bhopal',
        allergies: [],
        medicalHistory: [],
        balance: 0
      },
      {
        num: 'P0003',
        name: 'Mohammed Ali',
        phone: '9425077889',
        email: 'm.ali88@gmail.com',
        age: 44,
        gender: 'male',
        bloodGroup: 'A+',
        street: '88 Old City Market',
        city: 'Bhopal',
        allergies: ['Sulfa drugs'],
        medicalHistory: ['Type 2 Diabetes'],
        balance: 900
      },
      {
        num: 'P0004',
        name: 'Sunita Verma',
        phone: '9755033445',
        email: 'sunita.v@outlook.com',
        age: 52,
        gender: 'female',
        bloodGroup: 'AB+',
        street: 'C-9 Shahpura',
        city: 'Bhopal',
        allergies: [],
        medicalHistory: ['Hypothyroidism'],
        balance: 0
      },
      {
        num: 'P0005',
        name: 'Anil Kapoor',
        phone: '9893044112',
        email: 'anil.kapoor@gmail.com',
        age: 48,
        gender: 'male',
        bloodGroup: 'O+',
        street: '12-A Arera Colony',
        city: 'Bhopal',
        allergies: ['Aspirin'],
        medicalHistory: ['High Cholesterol'],
        balance: 3500
      },
      {
        num: 'P0006',
        name: 'Pooja Hegde',
        phone: '9893266781',
        email: 'pooja.h@rediffmail.com',
        age: 24,
        gender: 'female',
        bloodGroup: 'B-',
        street: '45 Kolar Road',
        city: 'Bhopal',
        allergies: [],
        medicalHistory: [],
        balance: 0
      },
      {
        num: 'P0007',
        name: 'Deepak Joshi',
        phone: '9826188992',
        email: 'dr.deepak.j@gmail.com',
        age: 61,
        gender: 'male',
        bloodGroup: 'A+',
        street: '102 Chunabhatti',
        city: 'Bhopal',
        allergies: [],
        medicalHistory: ['Coronary Artery Stent (2022)'],
        balance: 12000
      },
      {
        num: 'P0008',
        name: 'Neha Gupta',
        phone: '9424455123',
        email: 'neha.gupta.in@gmail.com',
        age: 31,
        gender: 'female',
        bloodGroup: 'O+',
        street: 'Sector B, Indrapuri',
        city: 'Bhopal',
        allergies: ['Amoxicillin'],
        medicalHistory: ['Asthma (Mild)'],
        balance: 0
      },
      {
        num: 'P0009',
        name: 'Aarav Patel',
        phone: '9755123490',
        email: 'patel.aarav9@gmail.com',
        age: 14,
        gender: 'male',
        bloodGroup: 'B+',
        street: 'M-16 Gulmohar Colony',
        city: 'Bhopal',
        allergies: [],
        medicalHistory: [],
        balance: 15000
      },
      {
        num: 'P0010',
        name: 'Rekha Sen',
        phone: '9893098765',
        email: 'rekha.sen45@gmail.com',
        age: 58,
        gender: 'female',
        bloodGroup: 'AB-',
        street: '72 MP Nagar Zone I',
        city: 'Bhopal',
        allergies: [],
        medicalHistory: ['Osteoporosis'],
        balance: 0
      },
      {
        num: 'P0011',
        name: 'Vikram Malhotra',
        phone: '9827055443',
        email: 'v.malhotra@corporate.in',
        age: 39,
        gender: 'male',
        bloodGroup: 'O+',
        street: 'Villa 4, Lake Pearl Spring',
        city: 'Bhopal',
        allergies: [],
        medicalHistory: ['Acid Reflux (GERD)'],
        balance: 0
      },
      {
        num: 'P0012',
        name: 'Ananya Deshmukh',
        phone: '9893112233',
        email: 'ananya.d@gmail.com',
        age: 22,
        gender: 'female',
        bloodGroup: 'A-',
        street: 'Hostel Block 3, MANIT Campus',
        city: 'Bhopal',
        allergies: ['Dust/Pollen'],
        medicalHistory: [],
        balance: 7000
      },
      {
        num: 'P0013',
        name: 'Rohan Mehra',
        phone: '9425012345',
        email: 'rohan.mehra.bpl@gmail.com',
        age: 41,
        gender: 'male',
        bloodGroup: 'B+',
        street: '88 Ayodhya Bypass',
        city: 'Bhopal',
        allergies: [],
        medicalHistory: ['Smoker (10 yrs)'],
        balance: 400
      },
      {
        num: 'P0014',
        name: 'Simran Kaur',
        phone: '9826077881',
        email: 'simran.kaur@yahoo.com',
        age: 33,
        gender: 'female',
        bloodGroup: 'O+',
        street: 'Gurdwara Road, Bairagarh',
        city: 'Bhopal',
        allergies: [],
        medicalHistory: ['PCOS'],
        balance: 0
      },
      {
        num: 'P0015',
        name: 'Gopal Krishna',
        phone: '9755088991',
        email: 'gopal.krishna@bsnl.in',
        age: 66,
        gender: 'male',
        bloodGroup: 'B+',
        street: 'Retd. Colony, Hoshangabad Road',
        city: 'Bhopal',
        allergies: ['Sulfa drugs'],
        medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
        balance: 2800
      },
      {
        num: 'P0016',
        name: 'Tanvi Shrivastava',
        phone: '9893045612',
        email: 'tanvi.shri@gmail.com',
        age: 26,
        gender: 'female',
        bloodGroup: 'A+',
        street: 'C-21 Rohit Nagar',
        city: 'Bhopal',
        allergies: [],
        medicalHistory: [],
        balance: 0
      }
    ];

    const insertedPatients = await Patient.insertMany(
      patientDataSeeds.map(p => ({
        patientId: generateId('patient'),
        organizationId,
        branchId: mainBranchId,
        patientNumber: p.num,
        name: p.name,
        phone: p.phone,
        email: p.email,
        age: p.age,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        address: {
          street: p.street,
          city: p.city,
          state: 'Madhya Pradesh',
          zip: '462001',
          country: 'India'
        },
        emergencyContact: {
          name: 'Family Contact',
          relation: 'Next of Kin',
          phone: p.phone
        },
        allergies: p.allergies,
        medicalHistory: p.medicalHistory,
        balance: p.balance,
        status: 'active',
        lastVisitAt: new Date(Date.now() - Math.floor(Math.random() * 5 * 86400000))
      }))
    );
    console.log(`[Seed] Successfully seeded ${insertedPatients.length} patients.`);

    // Map patients by ID
    const p1 = insertedPatients[0]; // Rajesh Kumar
    const p2 = insertedPatients[1]; // Priya Sharma
    const p3 = insertedPatients[2]; // Mohammed Ali
    const p4 = insertedPatients[3]; // Sunita Verma
    const p5 = insertedPatients[4]; // Anil Kapoor
    const p6 = insertedPatients[5]; // Pooja Hegde
    const p7 = insertedPatients[6]; // Deepak Joshi
    const p8 = insertedPatients[7]; // Neha Gupta
    const p9 = insertedPatients[8]; // Aarav Patel
    const p10 = insertedPatients[9]; // Rekha Sen
    const p11 = insertedPatients[10]; // Vikram Malhotra
    const p12 = insertedPatients[11]; // Ananya Deshmukh
    const p13 = insertedPatients[12]; // Rohan Mehra
    const p14 = insertedPatients[13]; // Simran Kaur
    const p15 = insertedPatients[14]; // Gopal Krishna
    const p16 = insertedPatients[15]; // Tanvi Shrivastava

    // 11. Appointments (Past, Today, Future across various statuses)
    console.log('[Seed] Seeding diverse appointments schedule...');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);

    const appointmentsData = [
      // Past completed
      {
        patientId: p1.patientId,
        providerId: doctorStaffId,
        serviceId: svcRctId,
        start: new Date(today.getTime() - 2 * 86400000 + 10 * 3600000),
        status: 'completed',
        reason: 'Tooth #46 severe ache (Sitting 1)',
        notes: 'Access opening done'
      },
      {
        patientId: p3.patientId,
        providerId: doctorStaffId,
        serviceId: svcExtractionId,
        start: new Date(today.getTime() - 1 * 86400000 + 11 * 3600000),
        status: 'completed',
        reason: 'Impacted third molar pain #38',
        notes: 'Extraction completed with sutures'
      },
      // Today Completed
      {
        patientId: p6.patientId,
        providerId: doctorStaffId,
        serviceId: svcFillingId,
        start: new Date(today.getTime() + 9 * 3600000 + 30 * 60000),
        status: 'completed',
        reason: 'Cavity filling upper front tooth',
        notes: 'Composite restoration done'
      },
      // Today Active (In consultation / checked-in)
      {
        patientId: p1.patientId,
        providerId: doctorStaffId,
        serviceId: svcRctId,
        start: new Date(now.getTime() - 40 * 60000),
        status: 'in_consultation',
        reason: 'Tooth #46 RCT 2nd sitting',
        checkInTime: new Date(now.getTime() - 45 * 60000)
      },
      {
        patientId: p2.patientId,
        providerId: doctorStaffId,
        serviceId: svcCleaningId,
        start: new Date(now.getTime() - 15 * 60000),
        status: 'checked_in',
        reason: 'Ultrasonic teeth cleaning & tea stain removal',
        checkInTime: new Date(now.getTime() - 15 * 60000)
      },
      {
        patientId: p5.patientId,
        providerId: doctorStaffId,
        serviceId: svcCrownId,
        start: new Date(now.getTime() - 5 * 60000),
        status: 'checked_in',
        reason: 'Permanent crown trial and fixing',
        checkInTime: new Date(now.getTime() - 5 * 60000)
      },
      // Today Upcoming
      {
        patientId: p4.patientId,
        providerId: doctorStaffId,
        serviceId: svcConsultationId,
        start: new Date(now.getTime() + 45 * 60000),
        status: 'confirmed',
        reason: 'Routine 6-month checkup'
      },
      {
        patientId: p7.patientId,
        providerId: doctorStaffId,
        serviceId: svcImplantId,
        start: new Date(now.getTime() + 90 * 60000),
        status: 'confirmed',
        reason: 'Dental Implant consultation for missing molar'
      },
      {
        patientId: p9.patientId,
        providerId: doctor2StaffId,
        serviceId: svcBracesId,
        start: new Date(now.getTime() + 150 * 60000),
        status: 'scheduled',
        reason: 'Orthodontic braces wire activation'
      },
      // Tomorrow & Future
      {
        patientId: p8.patientId,
        providerId: doctorStaffId,
        serviceId: svcConsultationId,
        start: new Date(today.getTime() + 86400000 + 10 * 3600000),
        status: 'scheduled',
        reason: 'Bleeding gums consultation'
      },
      {
        patientId: p11.patientId,
        providerId: doctorStaffId,
        serviceId: svcBleachingId,
        start: new Date(today.getTime() + 86400000 + 14 * 3600000),
        status: 'scheduled',
        reason: 'Laser teeth whitening session'
      },
      {
        patientId: p10.patientId,
        providerId: doctorStaffId,
        serviceId: svcConsultationId,
        start: new Date(today.getTime() + 2 * 86400000 + 11 * 3600000),
        status: 'scheduled',
        reason: 'Denture loose fitting review'
      }
    ];

    const insertedAppointments = await Appointment.insertMany(
      appointmentsData.map(a => ({
        appointmentId: generateId('appointment'),
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: a.patientId,
        providerId: a.providerId,
        serviceId: a.serviceId,
        scheduledStart: a.start,
        scheduledEnd: new Date(a.start.getTime() + 30 * 60000),
        durationMinutes: 30,
        appointmentType: 'scheduled',
        status: a.status,
        reason: a.reason,
        notes: a.notes || '',
        checkInTime: a.checkInTime || undefined
      }))
    );

    // 12. Encounters (Linked to active, completed, and walk-in flows)
    console.log('[Seed] Seeding Clinical Encounters...');
    const encRajeshId = generateId('encounter');
    const encPriyaId = generateId('encounter');
    const encAnilId = generateId('encounter');
    const encAliWalkinId = generateId('encounter');
    const encPoojaPastId = generateId('encounter');
    const encDeepakId = generateId('encounter');

    await Encounter.insertMany([
      {
        encounterId: encRajeshId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p1.patientId,
        providerId: doctorStaffId,
        serviceId: svcRctId,
        appointmentId: insertedAppointments[3].appointmentId,
        encounterType: 'consultation',
        status: 'in_progress',
        startedAt: new Date(now.getTime() - 40 * 60000)
      },
      {
        encounterId: encPriyaId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p2.patientId,
        providerId: doctorStaffId,
        serviceId: svcCleaningId,
        appointmentId: insertedAppointments[4].appointmentId,
        encounterType: 'consultation',
        status: 'in_progress',
        startedAt: new Date(now.getTime() - 15 * 60000)
      },
      {
        encounterId: encAnilId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p5.patientId,
        providerId: doctorStaffId,
        serviceId: svcCrownId,
        appointmentId: insertedAppointments[5].appointmentId,
        encounterType: 'consultation',
        status: 'in_progress',
        startedAt: new Date(now.getTime() - 5 * 60000)
      },
      {
        encounterId: encAliWalkinId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p3.patientId,
        providerId: doctorStaffId,
        serviceId: svcConsultationId,
        encounterType: 'consultation',
        status: 'in_progress',
        startedAt: now
      },
      {
        encounterId: encPoojaPastId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p6.patientId,
        providerId: doctorStaffId,
        serviceId: svcFillingId,
        appointmentId: insertedAppointments[2].appointmentId,
        encounterType: 'consultation',
        status: 'completed',
        startedAt: new Date(today.getTime() + 9 * 3600000 + 30 * 60000),
        completedAt: new Date(today.getTime() + 10 * 3600000 + 15 * 60000)
      },
      {
        encounterId: encDeepakId,
        organizationId,
        branchId: mainBranchId,
        departmentId: deptSurgeryId,
        patientId: p7.patientId,
        providerId: doctorStaffId,
        serviceId: svcImplantId,
        encounterType: 'consultation',
        status: 'completed',
        startedAt: new Date(today.getTime() - 3 * 86400000 + 11 * 3600000),
        completedAt: new Date(today.getTime() - 3 * 86400000 + 12 * 3600000)
      }
    ]);

    // 13. Live Queue Board (8+ Tokens distributed across 3 Kanban columns)
    console.log('[Seed] Seeding Live Queue Kanban Tokens (Waiting, Called, In Consultation)...');
    await QueueEntry.insertMany([
      // 1. Column: In Consultation
      {
        queueEntryId: generateId('queueEntry'),
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p1.patientId,
        appointmentId: insertedAppointments[3].appointmentId,
        encounterId: encRajeshId,
        providerId: doctorStaffId,
        serviceId: svcRctId,
        tokenNumber: 'Q-01',
        priority: 'urgent',
        status: 'in_consultation',
        startedAt: new Date(now.getTime() - 40 * 60000)
      },
      {
        queueEntryId: generateId('queueEntry'),
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p12.patientId,
        encounterId: generateId('encounter'),
        providerId: doctor2StaffId,
        serviceId: svcConsultationId,
        tokenNumber: 'W-02',
        priority: 'normal',
        status: 'in_consultation',
        startedAt: new Date(now.getTime() - 10 * 60000),
        notes: 'Broken retainer wire examination'
      },

      // 2. Column: Called
      {
        queueEntryId: generateId('queueEntry'),
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p3.patientId,
        encounterId: encAliWalkinId,
        providerId: doctorStaffId,
        serviceId: svcConsultationId,
        tokenNumber: 'W-03',
        priority: 'urgent',
        status: 'called',
        calledAt: now,
        notes: 'Walk-in: Gum bleeding & extreme throbbing'
      },
      {
        queueEntryId: generateId('queueEntry'),
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p5.patientId,
        appointmentId: insertedAppointments[5].appointmentId,
        encounterId: encAnilId,
        providerId: doctorStaffId,
        serviceId: svcCrownId,
        tokenNumber: 'Q-04',
        priority: 'normal',
        status: 'called',
        calledAt: new Date(now.getTime() - 2 * 60000),
        notes: 'Crown cementation'
      },

      // 3. Column: Waiting
      {
        queueEntryId: generateId('queueEntry'),
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p2.patientId,
        appointmentId: insertedAppointments[4].appointmentId,
        encounterId: encPriyaId,
        providerId: doctorStaffId,
        serviceId: svcCleaningId,
        tokenNumber: 'Q-05',
        priority: 'normal',
        status: 'waiting'
      },
      {
        queueEntryId: generateId('queueEntry'),
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p13.patientId,
        encounterId: generateId('encounter'),
        providerId: doctorStaffId,
        serviceId: svcConsultationId,
        tokenNumber: 'W-06',
        priority: 'normal',
        status: 'waiting',
        notes: 'Walk-in tobacco stains & tartar removal'
      },
      {
        queueEntryId: generateId('queueEntry'),
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p14.patientId,
        encounterId: generateId('encounter'),
        providerId: doctorStaffId,
        serviceId: svcFillingId,
        tokenNumber: 'W-07',
        priority: 'normal',
        status: 'waiting',
        notes: 'Food lodgement between molars'
      },

      // 4. Completed earlier today
      {
        queueEntryId: generateId('queueEntry'),
        organizationId,
        branchId: mainBranchId,
        departmentId: deptDentalId,
        patientId: p6.patientId,
        appointmentId: insertedAppointments[2].appointmentId,
        encounterId: encPoojaPastId,
        providerId: doctorStaffId,
        serviceId: svcFillingId,
        tokenNumber: 'Q-00',
        priority: 'normal',
        status: 'completed',
        completedAt: new Date(today.getTime() + 10 * 3600000 + 15 * 60000)
      }
    ]);

    // 14. Clinical Records, Vitals, Diagnoses & Dynamic Form Submissions
    console.log('[Seed] Seeding Clinical Workspace Records, Vitals, Prescriptions, Treatments...');
    // Record for Rajesh Kumar (Tooth #46 RCT)
    await ClinicalRecord.create({
      clinicalRecordId: generateId('clinicalRecord'),
      organizationId,
      branchId: mainBranchId,
      encounterId: encRajeshId,
      patientId: p1.patientId,
      providerId: doctorStaffId,
      complaint: 'Severe throbbing pain in lower right jaw since 3 days, radiating to ear. Pain intensifies with hot tea.',
      vitals: {
        bpSystolic: 124,
        bpDiastolic: 82,
        pulse: 76,
        temperature: 98.4,
        weightKg: 74,
        heightCm: 175,
        spo2: 99
      },
      history: 'Patient took over-the-counter painkillers with temporary relief. History of penicillin allergy noted.',
      examination: 'Deep occlusal decay on tooth #46. Tender on vertical percussion. No swelling or sinus tract visible.',
      diagnosis: 'Acute Irreversible Pulpitis #46 with Symptomatic Apical Periodontitis',
      notes: 'Advised Root Canal Treatment followed by Zirconia Crown. Patient agreed. BMP done.'
    });

    await FormSubmission.create({
      submissionId: generateId('formSubmission'),
      formId: dentalFormId,
      formVersionNumber: 1,
      organizationId,
      entityType: 'clinical-record',
      entityId: encRajeshId,
      values: {
        toothNumber: '46',
        painLevel: 'Severe Throbbing (7-10)',
        sensitivityType: 'Hot Beverages',
        cariesDetected: true,
        gumStatus: 'Healthy & Pink',
        mobilityGrade: 'Grade 0 (Firm)'
      },
      submittedBy: doctorUserId
    });

    const trtRajeshRct = generateId('treatment');
    const trtRajeshXray = generateId('treatment');
    await Treatment.insertMany([
      {
        treatmentId: trtRajeshRct,
        organizationId,
        branchId: mainBranchId,
        encounterId: encRajeshId,
        patientId: p1.patientId,
        providerId: doctorStaffId,
        serviceId: svcRctId,
        name: 'Root Canal Treatment (1st Sitting - Pulpectomy & BMP)',
        toothNumber: '46',
        procedureDetails: 'Access opening done under 2% Lignocaine. 3 canals located (MB, ML, D). Biomechanical preparation completed up to 25/04. Working length 21mm. Closed dressing given.',
        cost: 3500,
        status: 'in_progress'
      },
      {
        treatmentId: trtRajeshXray,
        organizationId,
        branchId: mainBranchId,
        encounterId: encRajeshId,
        patientId: p1.patientId,
        providerId: doctorStaffId,
        serviceId: svcXRayId,
        name: 'Digital Intraoral RVG X-Ray',
        toothNumber: '46',
        procedureDetails: 'Pre-operative and working length radiographs taken digitally.',
        cost: 300,
        status: 'completed'
      }
    ]);

    await Prescription.create({
      prescriptionId: generateId('prescription'),
      organizationId,
      branchId: mainBranchId,
      encounterId: encRajeshId,
      patientId: p1.patientId,
      providerId: doctorStaffId,
      items: [
        {
          medicineName: 'Tab. Cephalexin 500mg (Penicillin-Safe)',
          dosage: '1 tablet',
          frequency: '1-0-1',
          duration: '5 days',
          timing: 'After meals',
          instructions: 'Complete full 5-day antibiotic course'
        },
        {
          medicineName: 'Tab. Ketorolac Tromethamine 10mg',
          dosage: '1 tablet',
          frequency: '1-0-1 (SOS)',
          duration: '3 days',
          timing: 'After meals',
          instructions: 'Take if pain persists'
        },
        {
          medicineName: 'Chlorhexidine 0.2% Mouthwash',
          dosage: '10 ml',
          frequency: '1-0-1',
          duration: '7 days',
          timing: 'After brushing',
          instructions: 'Rinse mouth for 30 seconds, do not swallow'
        }
      ],
      notes: 'Avoid chewing hard foods on right side until root canal completion.',
      status: 'active'
    });

    // Record for Pooja Hegde (Completed Filling)
    await ClinicalRecord.create({
      clinicalRecordId: generateId('clinicalRecord'),
      organizationId,
      branchId: mainBranchId,
      encounterId: encPoojaPastId,
      patientId: p6.patientId,
      providerId: doctorStaffId,
      complaint: 'Food trapping in upper left molar with mild sweet sensitivity',
      vitals: {
        bpSystolic: 118,
        bpDiastolic: 78,
        pulse: 72,
        temperature: 98.6,
        weightKg: 56,
        heightCm: 165,
        spo2: 99
      },
      examination: 'Class I occlusal pit and fissure caries in tooth #26. Non-tender on percussion.',
      diagnosis: 'Enamel-Dentin Dental Caries #26',
      notes: 'Excavated under rubber dam, etched, bonded and restored with 3M Filtek Composite A2.'
    });

    await Treatment.create({
      treatmentId: generateId('treatment'),
      organizationId,
      branchId: mainBranchId,
      encounterId: encPoojaPastId,
      patientId: p6.patientId,
      providerId: doctorStaffId,
      serviceId: svcFillingId,
      name: 'Composite Light-Cure Tooth Colored Restoration',
      toothNumber: '26',
      procedureDetails: 'Caries excavation done, bonded with 3M Universal Adper, polished with Sof-Lex discs.',
      cost: 1000,
      status: 'completed'
    });

    // 15. Invoices, Payments, Receipts & Offline Verification
    console.log('[Seed] Seeding Financial Invoices, Payments, Receipts, and Offline Verification Queue...');
    const invRajeshId = generateId('invoice');
    const invPoojaId = generateId('invoice');
    const invAnilId = generateId('invoice');
    const invDeepakId = generateId('invoice');
    const invAliId = generateId('invoice');

    // 1. Rajesh Kumar: Total ₹3800, Paid ₹2000 (UPI), Balance ₹1800 (Partially Paid)
    await Invoice.create({
      invoiceId: invRajeshId,
      invoiceNumber: 'INV-2026-0001',
      organizationId,
      branchId: mainBranchId,
      patientId: p1.patientId,
      encounterId: encRajeshId,
      items: [
        {
          itemId: generateId('invoiceItem'),
          serviceId: svcRctId,
          description: 'Root Canal Treatment (Tooth #46)',
          quantity: 1,
          unitPrice: 3500,
          discount: 0,
          tax: 0,
          total: 3500
        },
        {
          itemId: generateId('invoiceItem'),
          serviceId: svcXRayId,
          description: 'Digital Intraoral RVG X-Ray (Tooth #46)',
          quantity: 1,
          unitPrice: 300,
          discount: 0,
          tax: 0,
          total: 300
        }
      ],
      subtotal: 3800,
      discountTotal: 0,
      taxTotal: 0,
      total: 3800,
      paidAmount: 2000,
      balance: 1800,
      status: 'partially_paid',
      issuedAt: new Date(now.getTime() - 40 * 60000),
      dueDate: new Date(now.getTime() + 7 * 86400000)
    });

    const payRajeshId = generateId('payment');
    await Payment.create({
      paymentId: payRajeshId,
      paymentNumber: 'PAY-2026-0001',
      organizationId,
      branchId: mainBranchId,
      patientId: p1.patientId,
      invoiceId: invRajeshId,
      amount: 2000,
      currency: 'INR',
      method: 'upi',
      reference: 'UPI/628849102911/GPay',
      status: 'verified',
      verifiedBy: billingUserId,
      verifiedAt: now,
      notes: 'Advance token payment at desk'
    });

    await Receipt.create({
      receiptId: generateId('receipt'),
      receiptNumber: 'RCPT-2026-0001',
      organizationId,
      branchId: mainBranchId,
      patientId: p1.patientId,
      invoiceId: invRajeshId,
      paymentId: payRajeshId,
      amount: 2000,
      method: 'upi',
      issuedAt: now
    });

    // 2. Pooja Hegde: Total ₹1400 (Filling ₹1000 + Consult ₹400), Paid in FULL via Cash
    await Invoice.create({
      invoiceId: invPoojaId,
      invoiceNumber: 'INV-2026-0002',
      organizationId,
      branchId: mainBranchId,
      patientId: p6.patientId,
      encounterId: encPoojaPastId,
      items: [
        {
          itemId: generateId('invoiceItem'),
          serviceId: svcConsultationId,
          description: 'Consultation - Dr. Amit Verma',
          quantity: 1,
          unitPrice: 400,
          discount: 0,
          tax: 0,
          total: 400
        },
        {
          itemId: generateId('invoiceItem'),
          serviceId: svcFillingId,
          description: 'Composite Restoration (Tooth #26)',
          quantity: 1,
          unitPrice: 1000,
          discount: 0,
          tax: 0,
          total: 1000
        }
      ],
      subtotal: 1400,
      discountTotal: 0,
      taxTotal: 0,
      total: 1400,
      paidAmount: 1400,
      balance: 0,
      status: 'paid',
      issuedAt: new Date(today.getTime() + 10 * 3600000 + 15 * 60000)
    });

    const payPoojaId = generateId('payment');
    await Payment.create({
      paymentId: payPoojaId,
      paymentNumber: 'PAY-2026-0002',
      organizationId,
      branchId: mainBranchId,
      patientId: p6.patientId,
      invoiceId: invPoojaId,
      amount: 1400,
      currency: 'INR',
      method: 'cash',
      reference: 'CASH-REC-002',
      status: 'verified',
      verifiedBy: billingUserId,
      verifiedAt: new Date(today.getTime() + 10 * 3600000 + 20 * 60000)
    });

    await Receipt.create({
      receiptId: generateId('receipt'),
      receiptNumber: 'RCPT-2026-0002',
      organizationId,
      branchId: mainBranchId,
      patientId: p6.patientId,
      invoiceId: invPoojaId,
      paymentId: payPoojaId,
      amount: 1400,
      method: 'cash',
      issuedAt: new Date(today.getTime() + 10 * 3600000 + 20 * 60000)
    });

    // 3. Deepak Joshi: Titanium Implant: ₹28000, Paid ₹16000 (Card), Balance ₹12000
    await Invoice.create({
      invoiceId: invDeepakId,
      invoiceNumber: 'INV-2026-0003',
      organizationId,
      branchId: mainBranchId,
      patientId: p7.patientId,
      encounterId: encDeepakId,
      items: [
        {
          itemId: generateId('invoiceItem'),
          serviceId: svcImplantId,
          description: 'Titanium Dental Implant (Osseointegrated)',
          quantity: 1,
          unitPrice: 28000,
          discount: 0,
          tax: 0,
          total: 28000
        }
      ],
      subtotal: 28000,
      discountTotal: 0,
      taxTotal: 0,
      total: 28000,
      paidAmount: 16000,
      balance: 12000,
      status: 'partially_paid',
      issuedAt: new Date(today.getTime() - 3 * 86400000)
    });

    const payDeepakId = generateId('payment');
    await Payment.create({
      paymentId: payDeepakId,
      paymentNumber: 'PAY-2026-0003',
      organizationId,
      branchId: mainBranchId,
      patientId: p7.patientId,
      invoiceId: invDeepakId,
      amount: 16000,
      currency: 'INR',
      method: 'card',
      reference: 'HDFC-POS-77412',
      status: 'verified',
      verifiedBy: billingUserId,
      verifiedAt: new Date(today.getTime() - 3 * 86400000)
    });

    await Receipt.create({
      receiptId: generateId('receipt'),
      receiptNumber: 'RCPT-2026-0003',
      organizationId,
      branchId: mainBranchId,
      patientId: p7.patientId,
      invoiceId: invDeepakId,
      paymentId: payDeepakId,
      amount: 16000,
      method: 'card',
      issuedAt: new Date(today.getTime() - 3 * 86400000)
    });

    // 4. Anil Kapoor: Crown ₹6000, Paid ₹2500 via QR Screenshot (PENDING OFFLINE VERIFICATION)
    // This allows testing the "Offline Verification" tab in Billing!
    await Invoice.create({
      invoiceId: invAnilId,
      invoiceNumber: 'INV-2026-0004',
      organizationId,
      branchId: mainBranchId,
      patientId: p5.patientId,
      encounterId: encAnilId,
      items: [
        {
          itemId: generateId('invoiceItem'),
          serviceId: svcCrownId,
          description: 'Zirconia Ceramic Crown (Tooth #14)',
          quantity: 1,
          unitPrice: 6000,
          discount: 0,
          tax: 0,
          total: 6000
        }
      ],
      subtotal: 6000,
      discountTotal: 0,
      taxTotal: 0,
      total: 6000,
      paidAmount: 0, // Not credited yet until verified
      balance: 6000,
      status: 'pending',
      issuedAt: now
    });

    await Payment.create({
      paymentId: generateId('payment'),
      paymentNumber: 'PAY-2026-0004',
      organizationId,
      branchId: mainBranchId,
      patientId: p5.patientId,
      invoiceId: invAnilId,
      amount: 2500,
      currency: 'INR',
      method: 'upi',
      reference: 'UPI/OFFLINE/screenshot_7741.png',
      proofUrl: '/uploads/sample_upi_receipt.png',
      verificationNotes: 'Patient showed mobile PhonePe debit screenshot. Needs bank settlement check.',
      status: 'pending_verification' // <--- Ready to click "Verify Payment" in UI!
    });

    // 5. Mohammed Ali: Extraction ₹900 (UNPAID BILL)
    await Invoice.create({
      invoiceId: invAliId,
      invoiceNumber: 'INV-2026-0005',
      organizationId,
      branchId: mainBranchId,
      patientId: p3.patientId,
      encounterId: encAliWalkinId,
      items: [
        {
          itemId: generateId('invoiceItem'),
          serviceId: svcExtractionId,
          description: 'Surgical Extraction (Tooth #38)',
          quantity: 1,
          unitPrice: 900,
          discount: 0,
          tax: 0,
          total: 900
        }
      ],
      subtotal: 900,
      discountTotal: 0,
      taxTotal: 0,
      total: 900,
      paidAmount: 0,
      balance: 900,
      status: 'pending',
      issuedAt: new Date(today.getTime() - 1 * 86400000)
    });

    // 16. Documents & Medical Scans
    console.log('[Seed] Seeding Medical Documents, X-Rays & Scans...');
    await Document.insertMany([
      {
        documentId: generateId('document'),
        organizationId,
        branchId: mainBranchId,
        entityType: 'patient',
        entityId: p1.patientId,
        title: 'Tooth #46 Digital Pre-Operative Radiograph (RVG)',
        category: 'X-Ray',
        fileUrl: '/uploads/sample_xray_tooth46.jpg',
        fileName: 'rvg_tooth46_preop.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 245000,
        versions: [{ versionNumber: 1, fileUrl: '/uploads/sample_xray_tooth46.jpg', fileName: 'rvg_tooth46_preop.jpg', mimeType: 'image/jpeg', sizeBytes: 245000, uploadedBy: 'Dr. Amit Verma', uploadedAt: now }]
      },
      {
        documentId: generateId('document'),
        organizationId,
        branchId: mainBranchId,
        entityType: 'patient',
        entityId: p3.patientId,
        title: 'Full Mouth Panoramic OPG X-Ray',
        category: 'X-Ray',
        fileUrl: '/uploads/sample_opg_panoramic.jpg',
        fileName: 'opg_fullmouth_panoramic.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 890000,
        versions: [{ versionNumber: 1, fileUrl: '/uploads/sample_opg_panoramic.jpg', fileName: 'opg_fullmouth_panoramic.jpg', mimeType: 'image/jpeg', sizeBytes: 890000, uploadedBy: 'Dr. Amit Verma', uploadedAt: new Date(today.getTime() - 1 * 86400000) }]
      },
      {
        documentId: generateId('document'),
        organizationId,
        branchId: mainBranchId,
        entityType: 'patient',
        entityId: p7.patientId,
        title: 'CBCT 3D Bone Density Scan Report',
        category: 'Lab Report',
        fileUrl: '/uploads/sample_cbct_implant.pdf',
        fileName: 'cbct_implant_site46.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1540000,
        versions: [{ versionNumber: 1, fileUrl: '/uploads/sample_cbct_implant.pdf', fileName: 'cbct_implant_site46.pdf', mimeType: 'application/pdf', sizeBytes: 1540000, uploadedBy: 'Dr. Amit Verma', uploadedAt: new Date(today.getTime() - 4 * 86400000) }]
      },
      {
        documentId: generateId('document'),
        organizationId,
        branchId: mainBranchId,
        entityType: 'patient',
        entityId: p9.patientId,
        title: 'Lateral Cephalometric Radiograph & Tracing',
        category: 'X-Ray',
        fileUrl: '/uploads/sample_ceph_tracing.jpg',
        fileName: 'ceph_ortho_aarav.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 670000,
        versions: [{ versionNumber: 1, fileUrl: '/uploads/sample_ceph_tracing.jpg', fileName: 'ceph_ortho_aarav.jpg', mimeType: 'image/jpeg', sizeBytes: 670000, uploadedBy: 'Dr. Neha Saxena', uploadedAt: now }]
      },
      {
        documentId: generateId('document'),
        organizationId,
        branchId: mainBranchId,
        entityType: 'patient',
        entityId: p5.patientId,
        title: 'Star Health Insurance Cashless Pre-Auth Card',
        category: 'Prescription',
        fileUrl: '/uploads/sample_insurance_card.pdf',
        fileName: 'star_health_preauth.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 320000,
        versions: [{ versionNumber: 1, fileUrl: '/uploads/sample_insurance_card.pdf', fileName: 'star_health_preauth.pdf', mimeType: 'application/pdf', sizeBytes: 320000, uploadedBy: 'Sneha Patel', uploadedAt: now }]
      }
    ]);

    // 17. Follow-ups
    console.log('[Seed] Seeding Scheduled Patient Follow-ups...');
    await FollowUp.insertMany([
      {
        followupId: generateId('followup'),
        organizationId,
        branchId: mainBranchId,
        patientId: p1.patientId,
        encounterId: encRajeshId,
        providerId: doctorStaffId,
        scheduledDate: new Date(now.getTime() + 7 * 86400000),
        reason: 'RCT 2nd sitting for Tooth #46 - Canal obturation and permanent core buildup',
        notes: 'Dry canals before obturation with gutta-percha',
        status: 'pending'
      },
      {
        followupId: generateId('followup'),
        organizationId,
        branchId: mainBranchId,
        patientId: p3.patientId,
        encounterId: encAliWalkinId,
        providerId: doctorStaffId,
        scheduledDate: new Date(now.getTime() + 6 * 86400000),
        reason: 'Suture removal & post-extraction socket healing assessment',
        notes: 'Check for food debris in socket',
        status: 'pending'
      },
      {
        followupId: generateId('followup'),
        organizationId,
        branchId: mainBranchId,
        patientId: p5.patientId,
        encounterId: encAnilId,
        providerId: doctorStaffId,
        scheduledDate: new Date(now.getTime() + 14 * 86400000),
        reason: 'Zirconia crown occlusion check and bite verification',
        notes: 'Articulating paper bite test',
        status: 'pending'
      },
      {
        followupId: generateId('followup'),
        organizationId,
        branchId: mainBranchId,
        patientId: p9.patientId,
        providerId: doctor2StaffId,
        scheduledDate: new Date(now.getTime() + 28 * 86400000),
        reason: 'Monthly Orthodontic wire change (NiTi 0.016 to 0.018)',
        notes: 'Check molar bands and bracket integrity',
        status: 'pending'
      },
      {
        followupId: generateId('followup'),
        organizationId,
        branchId: mainBranchId,
        patientId: p6.patientId,
        encounterId: encPoojaPastId,
        providerId: doctorStaffId,
        scheduledDate: new Date(today.getTime() - 2 * 86400000),
        reason: 'Review post-filling bite and sensitivity',
        notes: 'Patient reported zero sensitivity',
        status: 'completed'
      }
    ]);

    // 18. Audit Logs (Rich historical audit trail for Dashboard & Administration)
    console.log('[Seed] Seeding Comprehensive Audit Trail...');
    const auditEvents = [
      { actor: 'Dr. Vikramaditya Rao', action: 'system.bootstrap', type: 'organization', id: organizationId, reason: 'Organization APEX initialized with 2 branches' },
      { actor: 'Sneha Patel', action: 'patient.created', type: 'patient', id: p1.patientId, reason: 'Registered patient Rajesh Kumar' },
      { actor: 'Sneha Patel', action: 'appointment.checked_in', type: 'appointment', id: insertedAppointments[3].appointmentId, reason: 'Issued Token Q-01 for Rajesh Kumar' },
      { actor: 'Dr. Amit Verma', action: 'clinical_record.created', type: 'clinicalRecord', id: encRajeshId, reason: 'Examined tooth #46, started 1st sitting RCT' },
      { actor: 'Dr. Amit Verma', action: 'prescription.created', type: 'prescription', id: encRajeshId, reason: 'Prescribed Cephalexin and Ketorolac' },
      { actor: 'Rohan Sharma', action: 'invoice.created', type: 'invoice', id: invRajeshId, reason: 'Issued bill INV-2026-0001 for ₹3,800' },
      { actor: 'Rohan Sharma', action: 'payment.received', type: 'payment', id: payRajeshId, reason: 'Received ₹2,000 advance via PhonePe UPI' },
      { actor: 'Dr. Amit Verma', action: 'queue.token_called', type: 'queueEntry', id: 'que_call_3', reason: 'Called Token W-03 (Mohammed Ali)' },
      { actor: 'Sneha Patel', action: 'queue.walk_in_registered', type: 'queueEntry', id: 'que_walk_6', reason: 'Issued emergency walk-in token W-06' },
      { actor: 'Rohan Sharma', action: 'payment.proof_uploaded', type: 'payment', id: 'pay_offline_4', reason: 'Uploaded offline UPI screenshot for Anil Kapoor (₹2,500)' }
    ];

    await AuditLog.insertMany(
      auditEvents.map((evt, idx) => ({
        auditLogId: generateId('auditLog'),
        organizationId,
        branchId: mainBranchId,
        actorUserId: adminUserId,
        actorName: evt.actor,
        action: evt.action,
        entityType: evt.type,
        entityId: evt.id,
        reason: evt.reason,
        timestamp: new Date(now.getTime() - (auditEvents.length - idx) * 15 * 60000)
      }))
    );

    console.log('\n========================================================================');
    console.log('✅ DATABASE FULLY LOADED WITH REALISTIC FAKE / DEMO CLINICAL DATA!');
    console.log('========================================================================');
    console.log('  • 16 Realistic Patients (Rajesh, Priya, Mohammed, Sunita, Anil, Pooja, Deepak, Neha, etc.)');
    console.log('  • 12 Appointments (Past completed, Today live, Upcoming tomorrow)');
    console.log('  • 8 Live Queue Tokens across Kanban (Waiting, Called, In Consultation)');
    console.log('  • 6 Clinical Encounters with Vitals, FDI Tooth #s, Treatments & Prescriptions');
    console.log('  • 5 Invoices & Receipts (Paid, Partially Paid, Unpaid, and Offline Verification)');
    console.log('  • 5 Medical Documents (RVG, OPG, CBCT, Cephalometric Scans)');
    console.log('  • 5 Follow-ups (Pending & Completed)');
    console.log('  • 10 Comprehensive Audit Logs');
    console.log('------------------------------------------------------------------------');
    console.log('User Accounts for Quick Login:');
    console.log('  Admin / Owner: admin@apex.com     / admin123');
    console.log('  Doctor:        doctor@apex.com    / password123');
    console.log('  Receptionist:  reception@apex.com / password123');
    console.log('  Billing:       billing@apex.com   / password123');
    console.log('========================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedDatabase();
