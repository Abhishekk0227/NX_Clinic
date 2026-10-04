const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const { tenantScope, checkPermission } = require('../middleware/tenantScope');

const AuthController = require('../controllers/AuthController');
const OrganizationController = require('../controllers/OrganizationController');
const UserController = require('../controllers/UserController');
const PatientController = require('../controllers/PatientController');
const AppointmentController = require('../controllers/AppointmentController');
const QueueController = require('../controllers/QueueController');
const ClinicalController = require('../controllers/ClinicalController');
const BillingController = require('../controllers/BillingController');
const ServiceController = require('../controllers/ServiceController');
const VitalParamController = require('../controllers/VitalParamController');
const DynamicController = require('../controllers/DynamicController');
const DocumentController = require('../controllers/DocumentController');
const DashboardController = require('../controllers/DashboardController');
const ReportController = require('../controllers/ReportController');
const SyncController = require('../controllers/SyncController');
const AuditController = require('../controllers/AuditController');

// 1. Auth routes (public login, protected me & switch)
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authenticate, AuthController.me);
router.post('/auth/switch-branch', authenticate, AuthController.switchBranch);

// Apply Auth + Tenant Scope to all subsequent /api/v1 routes
router.use(authenticate);
router.use(tenantScope);

// 2. Organization, Branches & Departments
router.get('/organizations/current', OrganizationController.getCurrent);
router.put('/organizations/current', checkPermission('admin.branches'), OrganizationController.updateCurrent);
router.get('/organizations/branches', OrganizationController.getBranches);
router.post('/organizations/branches', checkPermission('admin.branches'), OrganizationController.createBranch);
router.put('/organizations/branches/:id', checkPermission('admin.branches'), OrganizationController.updateBranch);
router.delete('/organizations/branches/:id', checkPermission('admin.branches'), OrganizationController.deleteBranch);
router.post('/organizations/branches/:id/wipe', checkPermission('admin.branches'), OrganizationController.wipeBranchData);
router.get('/organizations/departments', OrganizationController.getDepartments);
router.post('/organizations/departments', checkPermission('admin.branches'), OrganizationController.createDepartment);

// 3. Staff, Users, Roles, Permissions
router.get('/users', checkPermission('admin.users'), UserController.getUsers);
router.post('/users', checkPermission('admin.users'), UserController.createUser);
router.put('/users/:id', checkPermission('admin.users'), UserController.updateUser);
router.delete('/users/:id', checkPermission('admin.users'), UserController.deleteUser);
router.get('/roles', checkPermission('admin.roles'), UserController.getRoles);
router.post('/roles', checkPermission('admin.roles'), UserController.createRole);
router.put('/roles/:id', checkPermission('admin.roles'), UserController.updateRole);
router.delete('/roles/:id', checkPermission('admin.roles'), async (req, res, next) => {
    try {
      const role = await require('../models').Role.findOne({ roleId: req.params.id, organizationId: req.organizationId });
      if(!role) return res.status(404).json({success: false});
      await role.deleteOne();
      res.json({success: true});
    } catch(err){next(err);}
  });
router.get('/permissions', checkPermission('admin.roles'), UserController.getPermissions);
router.get('/staff', UserController.getStaff);
router.post('/staff', checkPermission('admin.users'), UserController.createStaff);
router.put('/staff/:id', checkPermission('admin.users'), UserController.updateStaff);
router.delete('/staff/:id', checkPermission('admin.users'), UserController.deleteStaff);

// 4. Patients
router.get('/patients', checkPermission('patients.view'), PatientController.getPatients);
router.post('/patients', checkPermission('patients.create'), PatientController.createPatient);
router.post('/patients/register-unified', checkPermission('patients.create'), PatientController.registerUnified);
router.get('/patients/:id', checkPermission('patients.view'), PatientController.getPatientById);
router.put('/patients/:id', checkPermission('patients.edit'), PatientController.updatePatient);
router.post('/patients/:id/archive', checkPermission('patients.archive'), PatientController.archivePatient);
router.get('/patients/:id/timeline', checkPermission('patients.view'), PatientController.getPatientTimeline);

// 5. Appointments
router.get('/appointments', checkPermission('appointments.view'), AppointmentController.getAppointments);
router.post('/appointments', checkPermission('appointments.create'), AppointmentController.createAppointment);
router.get('/appointments/:id', checkPermission('appointments.view'), AppointmentController.getAppointmentById);
router.put('/appointments/:id', checkPermission('appointments.edit'), AppointmentController.updateAppointment);
router.post('/appointments/:id/status', checkPermission('appointments.edit'), AppointmentController.updateStatus);
router.post('/appointments/:id/check-in', checkPermission('appointments.edit'), AppointmentController.checkIn);

// 6. Queue
router.get('/queue', checkPermission('queue.view'), QueueController.getQueue);
router.post('/queue/walk-in', checkPermission('queue.manage'), QueueController.registerWalkIn);
router.post('/queue/:id/call', checkPermission('queue.manage'), QueueController.callPatient);
router.post('/queue/:id/start-consultation', checkPermission('clinical.view'), QueueController.startConsultation);
router.post('/queue/:id/complete', checkPermission('queue.manage'), QueueController.completeQueue);
router.post('/queue/:id/skip', checkPermission('queue.manage'), QueueController.skipQueue);
router.post('/queue/:id/restore', checkPermission('queue.manage'), QueueController.restoreQueue);

// 7. Clinical
router.get('/clinical/encounters', checkPermission('clinical.view'), ClinicalController.getEncounters);
router.get('/clinical/encounters/:id', checkPermission('clinical.view'), ClinicalController.getEncounterWorkspace);
router.post('/clinical/encounters/:id/record', checkPermission('clinical.create'), ClinicalController.saveClinicalRecord);
router.post('/clinical/treatments', checkPermission('clinical.create'), ClinicalController.addTreatment);
router.post('/clinical/prescriptions', checkPermission('clinical.create'), ClinicalController.savePrescription);
router.post('/clinical/encounters/:id/complete', checkPermission('clinical.create'), ClinicalController.completeEncounter);

// 8. Services & Vital Parameters
router.get('/services', ServiceController.getServices);
router.post('/services', checkPermission('admin.services'), ServiceController.createService);
router.put('/services/:id', checkPermission('admin.services'), ServiceController.updateService);
router.delete('/services/:id', checkPermission('admin.services'), ServiceController.deleteService);

// 8b. Clinical Vitals & Triage Configuration
router.get('/vital-params', VitalParamController.getVitalParams);
router.post('/vital-params', checkPermission('admin.services'), VitalParamController.createVitalParam);
router.put('/vital-params/:id', checkPermission('admin.services'), VitalParamController.updateVitalParam);
router.delete('/vital-params/:id', checkPermission('admin.services'), VitalParamController.deleteVitalParam);

// 9. Billing, Payments & Receipts
router.get('/billing/invoices', checkPermission('billing.view'), BillingController.getInvoices);
router.post('/billing/invoices', checkPermission('billing.create'), BillingController.createInvoice);
router.get('/billing/invoices/:id', checkPermission('billing.view'), BillingController.getInvoiceById);
router.put('/billing/invoices/:id', checkPermission('billing.edit'), BillingController.updateInvoice);
router.delete('/billing/invoices/:id', checkPermission('billing.edit'), BillingController.deleteInvoice);
router.post('/billing/payments', checkPermission('payment.create'), BillingController.receivePayment);
router.get('/billing/payments', checkPermission('payment.view'), BillingController.getPayments);
router.put('/billing/payments/:id', checkPermission('payment.edit'), BillingController.updatePayment);
router.delete('/billing/payments/:id', checkPermission('payment.edit'), BillingController.deletePayment);
router.post('/billing/payments/:id/verify', checkPermission('payment.verify'), BillingController.verifyPayment);
router.get('/billing/receipts', checkPermission('billing.view'), BillingController.getReceipts);
router.get('/billing/receipts/:id', checkPermission('billing.view'), BillingController.getReceiptById);
router.post('/billing/refunds', checkPermission('payment.refund'), BillingController.processRefund);

// 10. Dynamic Forms & Workflows
router.get('/forms', DynamicController.getForms);
router.get('/forms/:key', DynamicController.getFormByKey);
router.post('/forms', checkPermission('admin.forms'), DynamicController.createForm);
router.put('/forms/:id', checkPermission('admin.forms'), DynamicController.updateForm);
router.post('/forms/submissions', DynamicController.submitFormValues);
router.get('/forms/submissions/:entityId', DynamicController.getFormSubmission);
router.get('/workflows', DynamicController.getWorkflows);
router.post('/workflows', checkPermission('admin.forms'), DynamicController.createWorkflow);

// 11. Documents & Follow-ups
router.get('/documents', checkPermission('documents.view'), DocumentController.getDocuments);
router.post('/documents', checkPermission('documents.create'), DocumentController.uploadDocument);
router.get('/followups', DocumentController.getFollowUps);
router.post('/followups', DocumentController.createFollowUp);
router.put('/followups/:id', DocumentController.updateFollowUp);

// 12. Dashboard
router.get('/dashboard/stats', DashboardController.getStats);

// 13. Reports
router.get('/reports/operational', checkPermission('reports.view'), ReportController.getOperationalReport);
router.get('/reports/revenue', checkPermission('reports.view'), ReportController.getRevenueReport);
router.get('/reports/clinical', checkPermission('reports.view'), ReportController.getClinicalReport);

// 14. Offline Sync Engine
router.post('/sync/batch', SyncController.syncBatch);
router.get('/sync/status', SyncController.getSyncStatus);

// 15. Audit Logs
router.get('/audit/logs', checkPermission('admin.manage'), AuditController.getLogs);

// 16. Admin Branch Data Purge
router.post('/admin/purge-branch-data', checkPermission('admin.manage'), async (req, res, next) => {
  try {
    const { branchId } = req.body;
    if (!branchId) return res.status(400).json({ success: false, error: { message: 'branchId is required' } });

    const {
      Appointment,
      QueueEntry,
      Patient,
      Encounter,
      ClinicalRecord,
      Treatment,
      Prescription,
      Invoice,
      Payment,
      Receipt,
      FormSubmission
    } = require('../models');

    // 1. Find all encounters for this branch
    const encs = await Encounter.find({ branchId, organizationId: req.organizationId });
    const encIds = encs.map(e => e.encounterId);

    // 2. Find all patients registered under this branch
    const patients = await Patient.find({
      organizationId: req.organizationId,
      $or: [{ branchId }, { patientNumber: /^MR10-/ }]
    });
    const patIds = patients.map(p => p.patientId);

    // 3. Delete clinical child records and operational items
    const [
      treatmentsRes,
      prescriptionsRes,
      recordsRes,
      formsRes,
      encsRes,
      queueRes,
      aptsRes,
      paysRes,
      rcptsRes,
      invsRes,
      patientsRes
    ] = await Promise.all([
      Treatment.deleteMany({ $or: [{ encounterId: { $in: encIds } }, { patientId: { $in: patIds } }] }),
      Prescription.deleteMany({ $or: [{ encounterId: { $in: encIds } }, { patientId: { $in: patIds } }] }),
      ClinicalRecord.deleteMany({ $or: [{ branchId }, { encounterId: { $in: encIds } }, { patientId: { $in: patIds } }] }),
      FormSubmission.deleteMany({ entityId: { $in: encIds } }),
      Encounter.deleteMany({ $or: [{ branchId }, { encounterId: { $in: encIds } }, { patientId: { $in: patIds } }] }),
      QueueEntry.deleteMany({ $or: [{ branchId }, { patientId: { $in: patIds } }] }),
      Appointment.deleteMany({ $or: [{ branchId }, { patientId: { $in: patIds } }] }),
      Payment.deleteMany({ $or: [{ branchId }, { patientId: { $in: patIds } }] }),
      Receipt.deleteMany({ $or: [{ branchId }, { patientId: { $in: patIds } }] }),
      Invoice.deleteMany({ $or: [{ branchId }, { patientId: { $in: patIds } }] }),
      Patient.deleteMany({ patientId: { $in: patIds } })
    ]);

    return res.json({
      success: true,
      message: `All operational data for branch ${branchId} has been purged successfully.`,
      deletedCounts: {
        patients: patientsRes.deletedCount,
        appointments: aptsRes.deletedCount,
        queue: queueRes.deletedCount,
        encounters: encsRes.deletedCount,
        clinicalRecords: recordsRes.deletedCount,
        treatments: treatmentsRes.deletedCount,
        prescriptions: prescriptionsRes.deletedCount,
        formSubmissions: formsRes.deletedCount,
        invoices: invsRes.deletedCount,
        payments: paysRes.deletedCount,
        receipts: rcptsRes.deletedCount
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
