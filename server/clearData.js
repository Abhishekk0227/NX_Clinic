require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const {
  Patient,
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
  Refund,
  LedgerEntry,
  Document,
  Notification,
  FormSubmission,
  WorkflowInstance,
  AuditLog
} = require('./src/models');

const clearTransactionData = async () => {
  try {
    console.log('[Clear] Connecting to MongoDB...');
    await connectDB();
    console.log('[Clear] Connected successfully.');

    console.log('[Clear] Clearing Patients, Appointments, Queue, Clinical Records, Invoices, Payments, Documents...');
    
    const results = await Promise.all([
      Patient.deleteMany({}),
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
      Refund.deleteMany({}),
      LedgerEntry.deleteMany({}),
      Document.deleteMany({}),
      Notification.deleteMany({}),
      FormSubmission.deleteMany({}),
      WorkflowInstance.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('[Clear] SUCCESS: All patient & transactional data cleared.');
    console.log('[Clear] Admin/Doctor logins, Staff, Roles, Permissions, Branches, Services & Settings remain intact.');
    process.exit(0);
  } catch (error) {
    console.error('[Clear] Error while clearing data:', error);
    process.exit(1);
  }
};

clearTransactionData();
