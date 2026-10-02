require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generateId } = require('../utils/idGenerator');
const {
  Organization,
  Branch,
  Department,
  User,
  Role,
  Staff,
  Service,
  Form,
  Patient,
  Appointment,
  QueueEntry,
  Encounter,
  ClinicalRecord,
  Treatment,
  Prescription,
  Invoice,
  Payment,
  Receipt
} = require('../models');

async function seedMR10() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[MR10 Setup] Connected to MongoDB Atlas.');

  const org = await Organization.findOne();
  if (!org) {
    throw new Error('Organization not found in database');
  }
  const organizationId = org.organizationId;
  const mr10BranchId = 'br_1b8ebeea30984a7a';

  // 1. Update Branch
  console.log('[MR10 Setup] Updating Branch Details...');
  await Branch.findOneAndUpdate(
    { branchId: mr10BranchId },
    {
      name: 'MR10 Fever, Cough & Cold Clinic',
      code: 'MR10',
      isMain: false,
      phone: '+91 731 422 9901',
      email: 'mr10.clinic@apex.com',
      address: {
        street: 'Plot 104, MR-10 Main Road, Near Radisson Square',
        city: 'Indore',
        state: 'Madhya Pradesh',
        country: 'India',
        zip: '452010'
      },
      status: 'active'
    },
    { upsert: true }
  );

  // 2. Department for MR10
  console.log('[MR10 Setup] Configuring Department...');
  let dept = await Department.findOne({ branchId: mr10BranchId, code: 'MR10-FCC' });
  if (!dept) {
    dept = await Department.create({
      departmentId: generateId('dept'),
      organizationId,
      branchId: mr10BranchId,
      name: 'Fever, Cough & Cold OPD',
      code: 'MR10-FCC',
      status: 'active'
    });
  }

  // 3. Roles lookup
  const doctorRole = await Role.findOne({ organizationId, key: 'doctor' });
  const receptionistRole = await Role.findOne({ organizationId, key: 'receptionist' });
  const cashierRole = await Role.findOne({ organizationId, key: 'billing_staff' });

  // 4. Create / Update Users & Staff Panels
  console.log('[MR10 Setup] Creating Staff & Login Panels...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // Doctor Shukla
  let doctorUser = await User.findOne({ organizationId, email: 'dr.shukla@apex.com' });
  if (!doctorUser) {
    doctorUser = await User.create({
      userId: generateId('user'),
      organizationId,
      branchId: mr10BranchId,
      name: 'Dr. Rajesh Shukla',
      email: 'dr.shukla@apex.com',
      phone: '+91 98260 55101',
      passwordHash,
      roleId: doctorRole.roleId,
      roleKey: 'doctor',
      status: 'active'
    });
  } else {
    doctorUser.branchId = mr10BranchId;
    doctorUser.passwordHash = passwordHash;
    await doctorUser.save();
  }

  let doctorStaff = await Staff.findOne({ email: 'dr.shukla@apex.com' });
  if (!doctorStaff) {
    doctorStaff = await Staff.create({
      staffId: generateId('staff'),
      organizationId,
      branchId: mr10BranchId,
      departmentId: dept.departmentId,
      userId: doctorUser.userId,
      name: 'Dr. Rajesh Shukla',
      designation: 'Doctor (Consultant Physician)',
      specialty: 'Fever, Cough & Cold Specialist',
      phone: '+91 98260 55101',
      email: 'dr.shukla@apex.com',
      licenseNumber: 'MP-MED-2016-8942',
      consultationFee: 400,
      status: 'active'
    });
  } else {
    doctorStaff.branchId = mr10BranchId;
    doctorStaff.name = 'Dr. Rajesh Shukla';
    doctorStaff.specialty = 'Fever, Cough & Cold Specialist';
    await doctorStaff.save();
  }

  // Receptionist Ayushi
  let receptionistUser = await User.findOne({ organizationId, email: 'ayushi@apex.com' });
  if (!receptionistUser) {
    receptionistUser = await User.create({
      userId: generateId('user'),
      organizationId,
      branchId: mr10BranchId,
      name: 'Ayushi Verma (Front Desk)',
      email: 'ayushi@apex.com',
      phone: '+91 98260 55102',
      passwordHash,
      roleId: receptionistRole.roleId,
      roleKey: 'receptionist',
      status: 'active'
    });
  } else {
    receptionistUser.branchId = mr10BranchId;
    receptionistUser.passwordHash = passwordHash;
    await receptionistUser.save();
  }

  let receptionistStaff = await Staff.findOne({ email: 'ayushi@apex.com' });
  if (!receptionistStaff) {
    receptionistStaff = await Staff.create({
      staffId: generateId('staff'),
      organizationId,
      branchId: mr10BranchId,
      departmentId: dept.departmentId,
      userId: receptionistUser.userId,
      name: 'Ayushi Verma',
      designation: 'Receptionist',
      specialty: 'Front Desk & Patient Triage',
      phone: '+91 98260 55102',
      email: 'ayushi@apex.com',
      status: 'active'
    });
  } else {
    receptionistStaff.branchId = mr10BranchId;
    await receptionistStaff.save();
  }

  // Cashier Aman
  let cashierUser = await User.findOne({ organizationId, email: 'aman@apex.com' });
  if (!cashierUser) {
    cashierUser = await User.create({
      userId: generateId('user'),
      organizationId,
      branchId: mr10BranchId,
      name: 'Aman Gupta (Cashier & Accounts)',
      email: 'aman@apex.com',
      phone: '+91 98260 55103',
      passwordHash,
      roleId: cashierRole.roleId,
      roleKey: 'billing_staff',
      status: 'active'
    });
  } else {
    cashierUser.branchId = mr10BranchId;
    cashierUser.passwordHash = passwordHash;
    await cashierUser.save();
  }

  let cashierStaff = await Staff.findOne({ email: 'aman@apex.com' });
  if (!cashierStaff) {
    cashierStaff = await Staff.create({
      staffId: generateId('staff'),
      organizationId,
      branchId: mr10BranchId,
      departmentId: dept.departmentId,
      userId: cashierUser.userId,
      name: 'Aman Gupta',
      designation: 'Cashier & Billing Officer',
      specialty: 'Patient Billing & Counter Cashier',
      phone: '+91 98260 55103',
      email: 'aman@apex.com',
      status: 'active'
    });
  } else {
    cashierStaff.branchId = mr10BranchId;
    await cashierStaff.save();
  }

  // 5. Dynamic Form for Fever, Cough & Cold
  console.log('[MR10 Setup] Setting up Dynamic Clinical Form...');
  await Form.findOneAndUpdate(
    { organizationId, key: 'fever-cough-cold-opd' },
    {
      formId: generateId('frm'),
      organizationId,
      name: 'Fever, Cough & Cold Assessment Form',
      key: 'fever-cough-cold-opd',
      description: 'Standard clinical examination and symptom score form for Fever, Cough & Cold OPD',
      entityType: 'clinical-record',
      status: 'published',
      sections: [
        {
          sectionId: generateId('sec'),
          title: 'Symptoms & Duration',
          order: 1,
          fields: [
            {
              fieldId: generateId('fld'),
              key: 'fever_grade',
              label: 'Fever Intensity',
              type: 'select',
              required: true,
              options: ['Mild (99°F - 100°F)', 'Moderate (100.5°F - 102°F)', 'High Grade (> 102°F)', 'Afebrile']
            },
            {
              fieldId: generateId('fld'),
              key: 'fever_days',
              label: 'Fever Duration (Days)',
              type: 'number',
              required: true
            },
            {
              fieldId: generateId('fld'),
              key: 'cough_type',
              label: 'Cough Character',
              type: 'select',
              required: true,
              options: ['Dry Irritating Cough', 'Productive Wet Cough with Phlegm', 'Barking / Spasmodic Cough', 'No Cough']
            },
            {
              fieldId: generateId('fld'),
              key: 'cold_symptoms',
              label: 'Associated Cold Symptoms',
              type: 'multiSelect',
              options: ['Runny Nose / Rhinorrhea', 'Nasal Congestion / Blockage', 'Sneezing', 'Sore Throat', 'Headache', 'Severe Body Ache', 'Chills / Shivering']
            }
          ]
        },
        {
          sectionId: generateId('sec'),
          title: 'Vitals & Chest Signs',
          order: 2,
          fields: [
            {
              fieldId: generateId('fld'),
              key: 'temp_f',
              label: 'Recorded Temperature (°F)',
              type: 'decimal',
              required: true
            },
            {
              fieldId: generateId('fld'),
              key: 'spo2_percent',
              label: 'Oxygen Saturation SpO2 (%)',
              type: 'number',
              required: true
            },
            {
              fieldId: generateId('fld'),
              key: 'throat_exam',
              label: 'Throat & Pharynx Examination',
              type: 'select',
              options: ['Normal', 'Pharyngeal Congestion / Erythema', 'Tonsillar Hypertrophy', 'Exudative Follicular Tonsillitis']
            },
            {
              fieldId: generateId('fld'),
              key: 'chest_auscultation',
              label: 'Chest Auscultation Sounds',
              type: 'select',
              options: ['Normal Vesicular Breath Sounds', 'Scattered Rhonchi / Wheeze', 'Bilateral Crepitations / Crackles', 'Bronchial Breath Sounds']
            }
          ]
        },
        {
          sectionId: generateId('sec'),
          title: 'Diagnosis & Prescribed Plan',
          order: 3,
          fields: [
            {
              fieldId: generateId('fld'),
              key: 'diagnosis',
              label: 'Primary Clinical Diagnosis',
              type: 'select',
              required: true,
              options: ['Acute Viral Fever', 'Upper Respiratory Tract Infection (URTI)', 'Acute Bronchitis', 'Allergic Rhinitis with Cold', 'Suspected Dengue / Flu']
            },
            {
              fieldId: generateId('fld'),
              key: 'advice_notes',
              label: 'Doctor Advice & General Measures',
              type: 'textarea',
              placeholder: 'Warm fluids, rest, steam inhalation twice daily, tepid sponging if temp > 101°F'
            }
          ]
        }
      ]
    },
    { upsert: true }
  );

  // 6. Services for MR10 Branch
  console.log('[MR10 Setup] Setting up Fever & Cold Services...');
  const servicesData = [
    {
      name: 'Viral Fever & Flu Consultation',
      code: 'MR10-FEV',
      category: 'Consultation',
      durationMinutes: 15,
      price: 400
    },
    {
      name: 'Cough & Respiratory Checkup',
      code: 'MR10-CGH',
      category: 'Consultation',
      durationMinutes: 15,
      price: 450
    },
    {
      name: 'Acute Throat Infection & Cold Care',
      code: 'MR10-CLD',
      category: 'Consultation',
      durationMinutes: 15,
      price: 350
    },
    {
      name: 'Cold Relief Nebulization Therapy',
      code: 'MR10-NEB',
      category: 'Procedure',
      durationMinutes: 20,
      price: 300
    },
    {
      name: 'Rapid Flu & Dengue Antigen Screening',
      code: 'MR10-RAP',
      category: 'Lab',
      durationMinutes: 15,
      price: 600
    }
  ];

  const servicesMap = {};
  for (const s of servicesData) {
    let svc = await Service.findOne({ organizationId, code: s.code });
    if (!svc) {
      svc = await Service.create({
        serviceId: generateId('service'),
        organizationId,
        branchId: mr10BranchId,
        departmentId: dept.departmentId,
        ...s
      });
    } else {
      svc.branchId = mr10BranchId;
      await svc.save();
    }
    servicesMap[s.code] = svc;
  }

  // 7. Patients for MR10
  console.log('[MR10 Setup] Registering Fever & Cold Patients...');
  const patientsData = [
    {
      patientNumber: 'MR10-P001',
      name: 'Rohan Verma',
      phone: '+91 98261 11001',
      email: 'rohan.verma@example.com',
      age: 28,
      gender: 'male',
      bloodGroup: 'B+',
      address: { street: 'Vijay Nagar Sector 2', city: 'Indore', state: 'MP', zip: '452010' },
      allergies: [],
      medicalHistory: ['Occasional seasonal allergic rhinitis']
    },
    {
      patientNumber: 'MR10-P002',
      name: 'Sneha Patel',
      phone: '+91 98261 11002',
      email: 'sneha.patel@example.com',
      age: 24,
      gender: 'female',
      bloodGroup: 'O+',
      address: { street: 'Scheme 78, Aranya Nagar', city: 'Indore', state: 'MP', zip: '452010' },
      allergies: ['Sulfa drugs'],
      medicalHistory: ['Mild childhood asthma']
    },
    {
      patientNumber: 'MR10-P003',
      name: 'Vikas Dubey',
      phone: '+91 98261 11003',
      email: 'vikas.dubey@example.com',
      age: 36,
      gender: 'male',
      bloodGroup: 'A+',
      address: { street: 'Bapat Square, Sukhliya', city: 'Indore', state: 'MP', zip: '452010' },
      allergies: [],
      medicalHistory: ['Chronic bronchitis']
    },
    {
      patientNumber: 'MR10-P004',
      name: 'Neha Sharma',
      phone: '+91 98261 11004',
      email: 'neha.sharma@example.com',
      age: 21,
      gender: 'female',
      bloodGroup: 'AB+',
      address: { street: 'LIG Colony, AB Road', city: 'Indore', state: 'MP', zip: '452008' },
      allergies: [],
      medicalHistory: []
    },
    {
      patientNumber: 'MR10-P005',
      name: 'Arun Joshi',
      phone: '+91 98261 11005',
      email: 'arun.joshi@example.com',
      age: 52,
      gender: 'male',
      bloodGroup: 'O+',
      address: { street: 'Mahalaxmi Nagar', city: 'Indore', state: 'MP', zip: '452010' },
      allergies: [],
      medicalHistory: ['Hypertension']
    }
  ];

  const patientMap = {};
  for (const p of patientsData) {
    let pat = await Patient.findOne({ organizationId, patientNumber: p.patientNumber });
    if (!pat) {
      pat = await Patient.create({
        patientId: generateId('patient'),
        organizationId,
        branchId: mr10BranchId,
        ...p,
        status: 'active'
      });
    } else {
      pat.branchId = mr10BranchId;
      await pat.save();
    }
    patientMap[p.patientNumber] = pat;
  }

  // 8. Appointments & Pipeline Data for MR10
  console.log('[MR10 Setup] Creating Appointments & Pipeline...');
  const now = new Date();

  // Clear previous sample appointments / queues for MR10 to keep clean state
  await Appointment.deleteMany({ branchId: mr10BranchId });
  await QueueEntry.deleteMany({ branchId: mr10BranchId });
  await Encounter.deleteMany({ branchId: mr10BranchId });
  await ClinicalRecord.deleteMany({ branchId: mr10BranchId });
  await Treatment.deleteMany({ branchId: mr10BranchId });
  await Prescription.deleteMany({ branchId: mr10BranchId });
  await Invoice.deleteMany({ branchId: mr10BranchId });
  await Payment.deleteMany({ branchId: mr10BranchId });
  await Receipt.deleteMany({ branchId: mr10BranchId });

  // Apt 1: Sneha Patel -> In Consultation
  const apt1 = await Appointment.create({
    appointmentId: generateId('apt'),
    organizationId,
    branchId: mr10BranchId,
    departmentId: dept.departmentId,
    patientId: patientMap['MR10-P002'].patientId,
    providerId: doctorStaff.staffId,
    serviceId: servicesMap['MR10-CGH'].serviceId,
    scheduledStart: new Date(now.getTime() - 20 * 60 * 1000),
    scheduledEnd: new Date(now.getTime() + 10 * 60 * 1000),
    status: 'in_consultation',
    reason: 'Severe dry hacking cough since 4 days & sore throat on swallowing'
  });

  const enc1 = await Encounter.create({
    encounterId: generateId('encounter'),
    organizationId,
    branchId: mr10BranchId,
    departmentId: dept.departmentId,
    patientId: patientMap['MR10-P002'].patientId,
    providerId: doctorStaff.staffId,
    serviceId: servicesMap['MR10-CGH'].serviceId,
    appointmentId: apt1.appointmentId,
    encounterType: 'consultation',
    status: 'in_progress',
    startedAt: new Date(now.getTime() - 15 * 60 * 1000)
  });

  await QueueEntry.create({
    queueEntryId: generateId('queueEntry'),
    organizationId,
    branchId: mr10BranchId,
    departmentId: dept.departmentId,
    patientId: patientMap['MR10-P002'].patientId,
    appointmentId: apt1.appointmentId,
    encounterId: enc1.encounterId,
    providerId: doctorStaff.staffId,
    serviceId: servicesMap['MR10-CGH'].serviceId,
    tokenNumber: 'MR10-01',
    status: 'in_consultation',
    startedAt: new Date(now.getTime() - 15 * 60 * 1000)
  });

  await ClinicalRecord.create({
    clinicalRecordId: generateId('clin'),
    organizationId,
    branchId: mr10BranchId,
    encounterId: enc1.encounterId,
    patientId: patientMap['MR10-P002'].patientId,
    providerId: doctorStaff.staffId,
    complaint: 'Severe dry spasmodic cough for 4 days, exacerbated at night. Pain in throat while swallowing.',
    vitals: {
      temperature: 99.4,
      bpSystolic: 116,
      bpDiastolic: 76,
      pulse: 82,
      spo2: 99,
      respiratoryRate: 18,
      weightKg: 54
    },
    examination: 'Throat shows congested posterior pharyngeal wall with mild erythema. Chest clear bilaterally, no creps.',
    diagnosis: 'Upper Respiratory Tract Infection (URTI) with Acute Pharyngitis',
    notes: 'Prescribed antiallergic cough suppressant, warm saline gargles, and steam inhalation twice daily.',
    status: 'finalized'
  });

  await Prescription.create({
    prescriptionId: generateId('rx'),
    organizationId,
    branchId: mr10BranchId,
    encounterId: enc1.encounterId,
    patientId: patientMap['MR10-P002'].patientId,
    providerId: doctorStaff.staffId,
    items: [
      {
        medicineName: 'Tab Paracetamol 650mg (Dolo 650)',
        dosage: '1 tablet',
        frequency: '1-0-1 (SOS)',
        duration: '3 days',
        timing: 'After food',
        instructions: 'Take only if fever or throat ache exceeds threshold'
      },
      {
        medicineName: 'Tab Montelukast (10mg) + Levocetirizine (5mg) (Montair-LC)',
        dosage: '1 tablet',
        frequency: '0-0-1',
        duration: '5 days',
        timing: 'Bedtime',
        instructions: 'Controls allergic throat irritation and nocturnal dry cough'
      },
      {
        medicineName: 'Syrup Dextromethorphan + Chlorpheniramine (Ascoril-D)',
        dosage: '10 ml',
        frequency: '1-1-1',
        duration: '5 days',
        timing: 'After food',
        instructions: 'Shake well before use, avoid cold drinks'
      },
      {
        medicineName: 'Betadine 2% Gargle',
        dosage: '10 ml with warm water',
        frequency: '1-0-1',
        duration: '5 days',
        timing: 'Morning and Night',
        instructions: 'Gargle for 60 seconds after meals'
      }
    ],
    status: 'active'
  });

  // Invoice for Sneha Patel (Pending)
  await Invoice.create({
    invoiceId: generateId('inv'),
    invoiceNumber: 'INV-MR10-001',
    organizationId,
    branchId: mr10BranchId,
    patientId: patientMap['MR10-P002'].patientId,
    encounterId: enc1.encounterId,
    currency: 'INR',
    items: [
      {
        itemId: generateId('item'),
        serviceId: servicesMap['MR10-CGH'].serviceId,
        description: 'Cough & Respiratory Checkup (Dr. Shukla)',
        quantity: 1,
        unitPrice: 450,
        total: 450
      }
    ],
    subtotal: 450,
    total: 450,
    paidAmount: 0,
    balance: 450,
    status: 'pending',
    notes: 'Payment collection pending at counter with Cashier Aman'
  });

  // Apt 2: Rohan Verma -> Checked In (Waiting in Queue)
  const apt2 = await Appointment.create({
    appointmentId: generateId('apt'),
    organizationId,
    branchId: mr10BranchId,
    departmentId: dept.departmentId,
    patientId: patientMap['MR10-P001'].patientId,
    providerId: doctorStaff.staffId,
    serviceId: servicesMap['MR10-FEV'].serviceId,
    scheduledStart: new Date(now.getTime() - 5 * 60 * 1000),
    scheduledEnd: new Date(now.getTime() + 15 * 60 * 1000),
    status: 'checked_in',
    checkInTime: new Date(now.getTime() - 4 * 60 * 1000),
    reason: 'Continuous high grade fever 102°F with severe shivering & chills since 3 days'
  });

  const enc2 = await Encounter.create({
    encounterId: generateId('encounter'),
    organizationId,
    branchId: mr10BranchId,
    departmentId: dept.departmentId,
    patientId: patientMap['MR10-P001'].patientId,
    providerId: doctorStaff.staffId,
    serviceId: servicesMap['MR10-FEV'].serviceId,
    appointmentId: apt2.appointmentId,
    encounterType: 'consultation',
    status: 'in_progress',
    startedAt: new Date(now.getTime() - 4 * 60 * 1000)
  });

  await QueueEntry.create({
    queueEntryId: generateId('queueEntry'),
    organizationId,
    branchId: mr10BranchId,
    departmentId: dept.departmentId,
    patientId: patientMap['MR10-P001'].patientId,
    appointmentId: apt2.appointmentId,
    encounterId: enc2.encounterId,
    providerId: doctorStaff.staffId,
    serviceId: servicesMap['MR10-FEV'].serviceId,
    tokenNumber: 'MR10-02',
    priority: 'urgent',
    status: 'waiting',
    notes: 'High fever 102°F. Prioritized for consultation.'
  });

  await Invoice.create({
    invoiceId: generateId('inv'),
    invoiceNumber: 'INV-MR10-002',
    organizationId,
    branchId: mr10BranchId,
    patientId: patientMap['MR10-P001'].patientId,
    encounterId: enc2.encounterId,
    currency: 'INR',
    items: [
      {
        itemId: generateId('item'),
        serviceId: servicesMap['MR10-FEV'].serviceId,
        description: 'Viral Fever & Flu Consultation (Urgent)',
        quantity: 1,
        unitPrice: 400,
        total: 400
      },
      {
        itemId: generateId('item'),
        serviceId: servicesMap['MR10-RAP'].serviceId,
        description: 'Rapid Flu & Dengue Antigen Screening',
        quantity: 1,
        unitPrice: 600,
        total: 600
      }
    ],
    subtotal: 1000,
    total: 1000,
    paidAmount: 0,
    balance: 1000,
    status: 'pending',
    notes: 'Invoice generated by Ayushi at Front Desk, awaiting counter payment'
  });

  // Apt 3: Vikas Dubey -> Confirmed
  const apt3 = await Appointment.create({
    appointmentId: generateId('apt'),
    organizationId,
    branchId: mr10BranchId,
    departmentId: dept.departmentId,
    patientId: patientMap['MR10-P003'].patientId,
    providerId: doctorStaff.staffId,
    serviceId: servicesMap['MR10-CLD'].serviceId,
    scheduledStart: new Date(now.getTime() + 30 * 60 * 1000),
    scheduledEnd: new Date(now.getTime() + 45 * 60 * 1000),
    status: 'confirmed',
    reason: 'Chest congestion, productive phlegm cough & headache'
  });

  // Apt 4: Neha Sharma -> Scheduled
  await Appointment.create({
    appointmentId: generateId('apt'),
    organizationId,
    branchId: mr10BranchId,
    departmentId: dept.departmentId,
    patientId: patientMap['MR10-P004'].patientId,
    providerId: doctorStaff.staffId,
    serviceId: servicesMap['MR10-RAP'].serviceId,
    scheduledStart: new Date(now.getTime() + 90 * 60 * 1000),
    scheduledEnd: new Date(now.getTime() + 105 * 60 * 1000),
    status: 'scheduled',
    reason: 'Suspected viral flu with body pain, weakness & running nose'
  });

  // Apt 5: Arun Joshi -> Completed with Treatment, Prescription & Paid Invoice
  const pastStart = new Date(now.getTime() - 120 * 60 * 1000);
  const apt5 = await Appointment.create({
    appointmentId: generateId('apt'),
    organizationId,
    branchId: mr10BranchId,
    departmentId: dept.departmentId,
    patientId: patientMap['MR10-P005'].patientId,
    providerId: doctorStaff.staffId,
    serviceId: servicesMap['MR10-FEV'].serviceId,
    scheduledStart: pastStart,
    scheduledEnd: new Date(pastStart.getTime() + 15 * 60 * 1000),
    status: 'completed',
    reason: 'Follow-up after 5 days of fever medication & lingering cough'
  });

  const enc5 = await Encounter.create({
    encounterId: generateId('encounter'),
    organizationId,
    branchId: mr10BranchId,
    departmentId: dept.departmentId,
    patientId: patientMap['MR10-P005'].patientId,
    providerId: doctorStaff.staffId,
    serviceId: servicesMap['MR10-FEV'].serviceId,
    appointmentId: apt5.appointmentId,
    encounterType: 'consultation',
    status: 'completed',
    startedAt: pastStart,
    completedAt: new Date(pastStart.getTime() + 25 * 60 * 1000)
  });

  await ClinicalRecord.create({
    clinicalRecordId: generateId('clin'),
    organizationId,
    branchId: mr10BranchId,
    encounterId: enc5.encounterId,
    patientId: patientMap['MR10-P005'].patientId,
    providerId: doctorStaff.staffId,
    complaint: 'Fever has settled (afebrile since 2 days). Mild chest heaviness and coughing up clear sputum.',
    vitals: {
      temperature: 98.6,
      bpSystolic: 126,
      bpDiastolic: 80,
      pulse: 74,
      spo2: 98,
      respiratoryRate: 16,
      weightKg: 72
    },
    examination: 'Bilateral mild rhonchi in lower zones. Administered nebulization on site.',
    diagnosis: 'Post-Viral Convalescence / Resolving Acute Bronchitis',
    notes: 'Nebulization given with Duolin. Good clinical recovery.',
    status: 'finalized'
  });

  await Treatment.create({
    treatmentId: generateId('treat'),
    organizationId,
    branchId: mr10BranchId,
    encounterId: enc5.encounterId,
    patientId: patientMap['MR10-P005'].patientId,
    providerId: doctorStaff.staffId,
    serviceId: servicesMap['MR10-NEB'].serviceId,
    name: 'Cold Relief Nebulization Therapy',
    procedureDetails: 'Administered Levosalbutamol + Ipratropium respule via jet nebulizer for 15 minutes',
    cost: 300,
    status: 'completed'
  });

  await Prescription.create({
    prescriptionId: generateId('rx'),
    organizationId,
    branchId: mr10BranchId,
    encounterId: enc5.encounterId,
    patientId: patientMap['MR10-P005'].patientId,
    providerId: doctorStaff.staffId,
    items: [
      {
        medicineName: 'Syrup Ambroxol + Levosalbutamol + Guaiphenesin (Ascoril LS)',
        dosage: '10 ml',
        frequency: '1-1-1',
        duration: '5 days',
        timing: 'After food',
        instructions: 'Helps liquefy phlegm and clear chest congestion'
      },
      {
        medicineName: 'Tab Vitamin C 500mg + Zinc (Limcee Plus)',
        dosage: '1 chewable tablet',
        frequency: '0-1-0',
        duration: '15 days',
        timing: 'After lunch',
        instructions: 'Boosts post-viral immunity'
      }
    ],
    status: 'dispensed'
  });

  const inv5 = await Invoice.create({
    invoiceId: generateId('inv'),
    invoiceNumber: 'INV-MR10-003',
    organizationId,
    branchId: mr10BranchId,
    patientId: patientMap['MR10-P005'].patientId,
    encounterId: enc5.encounterId,
    currency: 'INR',
    items: [
      {
        itemId: generateId('item'),
        serviceId: servicesMap['MR10-FEV'].serviceId,
        description: 'Viral Fever Follow-up Consultation',
        quantity: 1,
        unitPrice: 400,
        total: 400
      },
      {
        itemId: generateId('item'),
        serviceId: servicesMap['MR10-NEB'].serviceId,
        description: 'Cold Relief Nebulization Therapy',
        quantity: 1,
        unitPrice: 300,
        total: 300
      }
    ],
    subtotal: 700,
    total: 700,
    paidAmount: 700,
    balance: 0,
    status: 'paid',
    notes: 'Paid in full at counter to Aman Gupta'
  });

  const pay5 = await Payment.create({
    paymentId: generateId('pay'),
    paymentNumber: 'PAY-MR10-001',
    organizationId,
    branchId: mr10BranchId,
    patientId: patientMap['MR10-P005'].patientId,
    invoiceId: inv5.invoiceId,
    amount: 700,
    currency: 'INR',
    method: 'cash',
    reference: 'CASH-COUNTER-001',
    status: 'verified',
    verifiedBy: cashierUser.userId,
    verifiedAt: pastStart,
    notes: 'Cash received at MR-10 counter by Cashier Aman Gupta'
  });

  await Receipt.create({
    receiptId: generateId('rcpt'),
    receiptNumber: 'RCPT-MR10-001',
    organizationId,
    branchId: mr10BranchId,
    patientId: patientMap['MR10-P005'].patientId,
    invoiceId: inv5.invoiceId,
    paymentId: pay5.paymentId,
    amount: 700,
    method: 'cash',
    issuedAt: pastStart
  });

  console.log('[MR10 Setup] All MR10 branch records successfully created!');
  await mongoose.disconnect();
}

seedMR10().catch(err => {
  console.error('[MR10 Setup] Failed:', err);
  process.exit(1);
});
