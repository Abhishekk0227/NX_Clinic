const {
  Patient,
  Staff,
  Service,
  Appointment,
  QueueEntry,
  Encounter,
  ClinicalRecord,
  Treatment,
  Prescription,
  Invoice,
  Payment,
  Receipt,
  Document,
  FollowUp,
  AuditLog,
  Branch
} = require('../models');
const { generateId } = require('../utils/idGenerator');
const AuditService = require('../services/AuditService');

class PatientController {
  static async getPatients(req, res, next) {
    try {
      const { search, status, page = 1, limit = 20, branchId } = req.query;
      const query = { organizationId: req.organizationId };

      if (status) {
        query.status = status;
      } else {
        query.status = { $ne: 'archived' };
      }

      const isAll = branchId === 'all' || branchId === 'overall' || req.branchId === 'all' || req.branchId === 'overall';
      const effectiveBranchId = isAll ? null : (branchId && branchId !== 'undefined' ? branchId : req.branchId);
      if (effectiveBranchId) {
        query.branchId = effectiveBranchId;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { patientNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [patients, total] = await Promise.all([
        Patient.find(query).sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)),
        Patient.countDocuments(query)
      ]);

      const patientIds = patients.map(p => p.patientId);
      const branchIds = [...new Set(patients.map(p => p.branchId).filter(Boolean))];

      // Fetch branches, active queue entries, and upcoming appointments
      const [branches, activeQueues, upcomingAppointments] = await Promise.all([
        Branch.find({ branchId: { $in: branchIds } }),
        QueueEntry.find({
          patientId: { $in: patientIds },
          status: { $in: ['waiting', 'called', 'in_consultation'] }
        }),
        Appointment.find({
          patientId: { $in: patientIds },
          status: { $in: ['scheduled', 'confirmed'] }
        }).sort({ scheduledStart: 1 })
      ]);

      const branchMap = {};
      branches.forEach(b => { branchMap[b.branchId] = b; });

      const queueMap = {};
      activeQueues.forEach(q => { queueMap[q.patientId] = q; });

      const aptMap = {};
      upcomingAppointments.forEach(a => {
        if (!aptMap[a.patientId]) {
          aptMap[a.patientId] = a;
        }
      });

      const data = patients.map(p => ({
        ...p.toObject(),
        branch: branchMap[p.branchId] || null,
        activeQueue: queueMap[p.patientId] || null,
        upcomingAppointment: aptMap[p.patientId] || null
      }));

      return res.json({
        success: true,
        data,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPatientById(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await Patient.findOne({
        organizationId: req.organizationId,
        $or: [
          { patientId: id },
          { patientNumber: id }
        ]
      });
      if (!patient) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Patient not found' } });
      }

      const pId = patient.patientId;

      // Return comprehensive Patient Hub related data
      const [
        appointments,
        encounters,
        clinicalRecords,
        treatments,
        prescriptions,
        invoices,
        payments,
        receipts,
        documents,
        followups
      ] = await Promise.all([
        Appointment.find({ patientId: pId, organizationId: req.organizationId }).sort({ scheduledStart: -1 }),
        Encounter.find({ patientId: pId, organizationId: req.organizationId }).sort({ createdAt: -1 }),
        ClinicalRecord.find({ patientId: pId, organizationId: req.organizationId }).sort({ createdAt: -1 }),
        Treatment.find({ patientId: pId, organizationId: req.organizationId }).sort({ createdAt: -1 }),
        Prescription.find({ patientId: pId, organizationId: req.organizationId }).sort({ createdAt: -1 }),
        Invoice.find({ patientId: pId, organizationId: req.organizationId }).sort({ createdAt: -1 }),
        Payment.find({ patientId: pId, organizationId: req.organizationId }).sort({ createdAt: -1 }),
        Receipt.find({ patientId: pId, organizationId: req.organizationId }).sort({ createdAt: -1 }),
        Document.find({ entityType: 'patient', entityId: pId, organizationId: req.organizationId }).sort({ createdAt: -1 }),
        FollowUp.find({ patientId: pId, organizationId: req.organizationId }).sort({ scheduledDate: -1 })
      ]);

      // Hydrate appointments with provider & service details
      const providerIds = [...new Set(appointments.map(a => a.providerId).filter(Boolean))];
      const serviceIds = [...new Set(appointments.map(a => a.serviceId).filter(Boolean))];
      const [providers, services] = await Promise.all([
        Staff.find({ staffId: { $in: providerIds } }),
        Service.find({ serviceId: { $in: serviceIds } })
      ]);
      const providerMap = {};
      providers.forEach(p => { providerMap[p.staffId] = p; });
      const serviceMap = {};
      services.forEach(s => { serviceMap[s.serviceId] = s; });

      const hydratedAppointments = appointments.map(a => ({
        ...a.toObject(),
        provider: providerMap[a.providerId] || null,
        service: serviceMap[a.serviceId] || null
      }));

      return res.json({
        success: true,
        data: {
          patient,
          hub: {
            appointments: hydratedAppointments,
            encounters,
            clinicalRecords,
            treatments,
            prescriptions,
            invoices,
            payments,
            receipts,
            documents,
            followups
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async createPatient(req, res, next) {
    try {
      const {
        name,
        phone,
        email,
        dob,
        age,
        gender,
        bloodGroup,
        address,
        emergencyContact,
        allergies,
        medicalHistory,
        branchId,
        customData
      } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and phone are required' } });
      }

      // TC-06: Check if phone number already exists
      const cleanPhone = String(phone).replace(/\D/g, '');
      const existingPatient = await Patient.findOne({
        organizationId: req.organizationId,
        phone: cleanPhone,
        status: { $ne: 'archived' }
      });

      if (existingPatient && !req.body.allowDuplicatePhone) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'PATIENT_ALREADY_EXISTS',
            message: `A patient with mobile number ${cleanPhone} already exists: ${existingPatient.name} (${existingPatient.patientNumber}).`,
            patientId: existingPatient.patientId,
            patientNumber: existingPatient.patientNumber,
            name: existingPatient.name
          }
        });
      }

      // Generate sequential patientNumber: P0001, P0002...
      const count = await Patient.countDocuments({ organizationId: req.organizationId });
      const patientNumber = `P${String(count + 1).padStart(4, '0')}`;

      const patient = await Patient.create({
        patientId: generateId('patient'),
        organizationId: req.organizationId,
        branchId: branchId || req.branchId,
        patientNumber,
        name,
        phone: cleanPhone,
        email,
        dob,
        age: age ? parseInt(age) : undefined,
        gender: gender || 'other',
        bloodGroup,
        address,
        emergencyContact,
        allergies: allergies || [],
        medicalHistory: medicalHistory || [],
        customData: customData || {}
      });

      AuditService.log({
        organizationId: req.organizationId,
        branchId: patient.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'patient.created',
        entityType: 'patient',
        entityId: patient.patientId,
        after: patient.toObject()
      });

      return res.status(201).json({ success: true, data: patient });
    } catch (err) {
      next(err);
    }
  }

  static async registerUnified(req, res, next) {
    try {
      const {
        // Patient details
        name, phone, email, dob, age, gender, bloodGroup, address, emergencyContact, allergies, medicalHistory, branchId, customData,
        // Intent details
        symptoms, // Stored in customData or a clinical record if we wanted, for now just notes
        // Routing
        actionType, // 'walkin' | 'appointment'
        providerId, serviceIds, departmentId,
        // Walk-in specific
        paymentStatus = 'paid', priority = 'normal',
        billingDetails, // { discount, paidAmount, generateInvoice: true }
        // Appointment specific
        scheduledStart, durationMinutes = 15, appointmentType = 'scheduled'
      } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and phone are required' } });
      }

      const activeBranchId = branchId || req.branchId;
      const cleanPhone = String(phone).replace(/\D/g, '');

      // TC-06: Check if phone number already exists
      let patient = await Patient.findOne({
        organizationId: req.organizationId,
        phone: cleanPhone,
        status: { $ne: 'archived' }
      });

      if (patient && !req.body.useExistingPatient) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'PATIENT_ALREADY_EXISTS',
            message: `A patient with mobile number ${cleanPhone} already exists: ${patient.name} (${patient.patientNumber}).`,
            patientId: patient.patientId,
            patientNumber: patient.patientNumber,
            name: patient.name
          }
        });
      }

      // 1. Create Patient if not existing
      if (!patient) {
        const count = await Patient.countDocuments({ organizationId: req.organizationId });
        const patientNumber = `P${String(count + 1).padStart(4, '0')}`;

        patient = await Patient.create({
          patientId: generateId('patient'),
          organizationId: req.organizationId,
          branchId: activeBranchId,
          patientNumber,
          name,
          phone: cleanPhone,
          email,
          dob,
          age: age ? parseInt(age) : undefined,
          gender: gender || 'other',
          bloodGroup,
          address,
          emergencyContact,
          allergies: allergies || [],
          medicalHistory: medicalHistory || [],
          customData: customData || {}
        });

        AuditService.log({
          organizationId: req.organizationId,
          branchId: patient.branchId,
          actorUserId: req.user.userId,
          actorName: req.user.name,
          action: 'patient.created',
          entityType: 'patient',
          entityId: patient.patientId,
          after: patient.toObject()
        });
      }

      let routeData = {};

      // 2. Route based on actionType
      if (actionType === 'walkin') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { QueueEntry } = require('../models');
        const queueCount = await QueueEntry.countDocuments({
          organizationId: req.organizationId,
          branchId: activeBranchId,
          createdAt: { $gte: todayStart }
        });
        const tokenNumber = `W-${String(queueCount + 1).padStart(2, '0')}`;

        // Create linked Encounter
        const encounter = await Encounter.create({
          encounterId: generateId('encounter'),
          organizationId: req.organizationId,
          branchId: activeBranchId,
          departmentId,
          patientId: patient.patientId,
          providerId,
          serviceIds: serviceIds || [],
          encounterType: 'consultation',
          paymentStatus,
          caseType: 'new', // Because they are a newly registered patient
          status: 'in_progress',
          startedAt: new Date()
        });

        // Create QueueEntry
        const queueEntry = await QueueEntry.create({
          queueEntryId: generateId('queueEntry'),
          organizationId: req.organizationId,
          branchId: activeBranchId,
          departmentId,
          patientId: patient.patientId,
          encounterId: encounter.encounterId,
          providerId,
          serviceIds: serviceIds || [],
          tokenNumber,
          priority,
          status: 'waiting',
          notes: symptoms // Save symptoms in notes
        });

        AuditService.log({
          organizationId: req.organizationId,
          branchId: activeBranchId,
          actorUserId: req.user.userId,
          actorName: req.user.name,
          action: 'queue.walkin_registered',
          entityType: 'queueEntry',
          entityId: queueEntry.queueEntryId,
          after: queueEntry.toObject()
        });

        routeData = { queueEntry, tokenNumber, encounter };

      } else if (actionType === 'appointment') {
        if (!scheduledStart) {
          return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Start time is required for appointment' } });
        }
        
        const start = new Date(scheduledStart);
        const end = new Date(start.getTime() + durationMinutes * 60000);

        const appointment = await Appointment.create({
          appointmentId: generateId('appointment'),
          organizationId: req.organizationId,
          branchId: activeBranchId,
          departmentId,
          patientId: patient.patientId,
          providerId,
          serviceIds: serviceIds || [],
          scheduledStart: start,
          scheduledEnd: end,
          durationMinutes,
          appointmentType,
          status: 'scheduled',
          reason: symptoms, // Map symptoms to reason
          notes: symptoms
        });

        AuditService.log({
          organizationId: req.organizationId,
          branchId: activeBranchId,
          actorUserId: req.user.userId,
          actorName: req.user.name,
          action: 'appointment.created',
          entityType: 'appointment',
          entityId: appointment.appointmentId,
          after: appointment.toObject()
        });

        routeData = { appointment };
      }

      // 3. Billing Logic
      let invoice = null;
      let payment = null;
      if (billingDetails && billingDetails.generateInvoice) {
        const { Staff, Service, Invoice, Payment } = require('../models');
        
        const staff = await Staff.findOne({ staffId: providerId });
        const doctorFee = staff?.consultationFee || 0;
        
        let services = [];
        if (serviceIds && serviceIds.length > 0) {
          services = await Service.find({ serviceId: { $in: serviceIds } });
        }
        
        const items = [];
        // Add Doctor Consultation
        if (doctorFee > 0) {
          items.push({
            itemId: generateId('invoiceItem'),
            description: `Consultation Fee (${staff.name})`,
            quantity: 1,
            unitPrice: doctorFee,
            total: doctorFee,
            sourceEntityType: 'consultation',
            sourceEntityId: providerId
          });
        }
        
        // Add Services
        services.forEach(svc => {
          items.push({
            itemId: generateId('invoiceItem'),
            serviceId: svc.serviceId,
            description: svc.name,
            quantity: 1,
            unitPrice: svc.price,
            total: svc.price,
            sourceEntityType: 'service',
            sourceEntityId: svc.serviceId
          });
        });
        
        const discountTotal = Number(billingDetails.discount) || 0;
        const subtotal = items.reduce((acc, cur) => acc + cur.total, 0);
        const total = Math.max(0, subtotal - discountTotal);
        
        const invoiceCount = await Invoice.countDocuments({ organizationId: req.organizationId });
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;
        
        invoice = await Invoice.create({
          invoiceId: generateId('invoice'),
          invoiceNumber,
          organizationId: req.organizationId,
          branchId: activeBranchId,
          patientId: patient.patientId,
          encounterId: routeData.encounter?.encounterId || null,
          items,
          subtotal,
          discountTotal,
          taxTotal: 0,
          total,
          paidAmount: 0,
          balance: total,
          status: 'pending'
        });
        
        await Patient.updateOne({ patientId: patient.patientId }, { $inc: { balance: total } });
        
        if (billingDetails.paidAmount > 0) {
          const paidAmount = Number(billingDetails.paidAmount);
          const payCount = await Payment.countDocuments({ organizationId: req.organizationId });
          const paymentNumber = `PAY-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, '0')}`;
          
          payment = await Payment.create({
            paymentId: generateId('payment'),
            paymentNumber,
            organizationId: req.organizationId,
            branchId: activeBranchId,
            patientId: patient.patientId,
            invoiceId: invoice.invoiceId,
            amount: paidAmount,
            method: 'cash',
            status: 'verified',
            verifiedBy: req.user.userId,
            verifiedAt: new Date()
          });
          
          invoice.paidAmount = paidAmount;
          invoice.balance = Math.max(0, invoice.total - paidAmount);
          invoice.status = invoice.balance <= 0 ? 'paid' : 'partially_paid';
          await invoice.save();
          
          await Patient.updateOne({ patientId: patient.patientId }, { $inc: { balance: -paidAmount } });
          
          routeData.payment = payment;
        }
        routeData.invoice = invoice;
      }

      return res.status(201).json({ 
        success: true, 
        data: {
          patient,
          ...routeData
        } 
      });

    } catch (err) {
      next(err);
    }
  }

  static async updatePatient(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await Patient.findOne({ patientId: id, organizationId: req.organizationId });
      if (!patient) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Patient not found' } });
      }

      const before = patient.toObject();
      Object.assign(patient, req.body);
      patient.version += 1;
      await patient.save();

      AuditService.log({
        organizationId: req.organizationId,
        branchId: patient.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'patient.updated',
        entityType: 'patient',
        entityId: patient.patientId,
        before,
        after: patient.toObject()
      });

      return res.json({ success: true, data: patient });
    } catch (err) {
      next(err);
    }
  }

  static async archivePatient(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const patient = await Patient.findOne({ patientId: id, organizationId: req.organizationId });
      if (!patient) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Patient not found' } });
      }

      patient.status = 'archived';
      patient.archiveReason = reason || 'Archived by user';
      patient.version += 1;
      await patient.save();

      AuditService.log({
        organizationId: req.organizationId,
        branchId: patient.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'patient.archived',
        entityType: 'patient',
        entityId: patient.patientId,
        reason: patient.archiveReason
      });

      return res.json({ success: true, message: 'Patient archived successfully', data: patient });
    } catch (err) {
      next(err);
    }
  }

  static async getPatientTimeline(req, res, next) {
    try {
      const { id } = req.params;
      const logs = await AuditLog.find({
        organizationId: req.organizationId,
        $or: [
          { entityId: id },
          { 'after.patientId': id }
        ]
      }).sort({ timestamp: -1 }).limit(50);

      return res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PatientController;
