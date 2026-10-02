const {
  Appointment,
  Patient,
  Staff,
  Service,
  Branch,
  Encounter,
  QueueEntry
} = require('../models');
const { generateId } = require('../utils/idGenerator');
const AuditService = require('../services/AuditService');

class AppointmentController {
  static async getAppointments(req, res, next) {
    try {
      let { startDate, endDate, providerId, branchId, status } = req.query;
      const query = { organizationId: req.organizationId };

      const isAll = branchId === 'all' || branchId === 'overall' || req.branchId === 'all' || req.branchId === 'overall';
      const effectiveBranchId = isAll ? null : (branchId && branchId !== 'undefined' ? branchId : req.branchId);
      if (effectiveBranchId) {
        query.branchId = effectiveBranchId;
      }
      if (providerId && providerId !== 'undefined') query.providerId = providerId;
      if (status && status !== 'undefined') query.status = status;

      if (startDate === 'undefined') startDate = undefined;
      if (endDate === 'undefined') endDate = undefined;

      if (startDate || endDate) {
        query.scheduledStart = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          query.scheduledStart.$gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.scheduledStart.$lte = end;
        }
      }

      const appointments = await Appointment.find(query).sort({ scheduledStart: 1 });

      // Join details for display
      const patientIds = [...new Set(appointments.map(a => a.patientId))];
      const providerIds = [...new Set(appointments.map(a => a.providerId))];
      const serviceIds = [...new Set(appointments.map(a => a.serviceId).filter(Boolean))];
      const branchIds = [...new Set(appointments.map(a => a.branchId).filter(Boolean))];

      const [patients, providers, services, branches] = await Promise.all([
        Patient.find({ patientId: { $in: patientIds } }),
        Staff.find({ staffId: { $in: providerIds } }),
        Service.find({ serviceId: { $in: serviceIds } }),
        Branch.find({ branchId: { $in: branchIds } })
      ]);

      const patientMap = {};
      patients.forEach(p => { patientMap[p.patientId] = p; });
      const providerMap = {};
      providers.forEach(p => { providerMap[p.staffId] = p; });
      const serviceMap = {};
      services.forEach(s => { serviceMap[s.serviceId] = s; });
      const branchMap = {};
      branches.forEach(b => { branchMap[b.branchId] = b; });

      const data = appointments.map(apt => ({
        ...apt.toObject(),
        patient: patientMap[apt.patientId] || null,
        provider: providerMap[apt.providerId] || null,
        service: serviceMap[apt.serviceId] || null,
        branch: branchMap[apt.branchId] || null
      }));

      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAppointmentById(req, res, next) {
    try {
      const { id } = req.params;
      const apt = await Appointment.findOne({ appointmentId: id, organizationId: req.organizationId });
      if (!apt) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } });
      }

      const [patient, provider, service] = await Promise.all([
        Patient.findOne({ patientId: apt.patientId }),
        Staff.findOne({ staffId: apt.providerId }),
        apt.serviceId ? Service.findOne({ serviceId: apt.serviceId }) : null
      ]);

      return res.json({
        success: true,
        data: {
          ...apt.toObject(),
          patient,
          provider,
          service
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async createAppointment(req, res, next) {
    try {
      const {
        patientId,
        providerId,
        serviceId,
        branchId,
        departmentId,
        scheduledStart,
        durationMinutes = 15,
        appointmentType = 'scheduled',
        reason,
        notes
      } = req.body;

      if (!patientId || !providerId || !scheduledStart) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Patient, provider, and start time are required' } });
      }

      const start = new Date(scheduledStart);
      const end = new Date(start.getTime() + durationMinutes * 60000);

      // TC-12: Doctor Slot Conflict Validation (Same doctor + same time slot)
      if (!req.body.allowSlotOverlap) {
        const slotConflict = await Appointment.findOne({
          organizationId: req.organizationId,
          providerId,
          status: { $in: ['scheduled', 'confirmed', 'checked_in', 'in_consultation'] },
          $or: [
            { scheduledStart: { $lt: end, $gte: start } },
            { scheduledEnd: { $gt: start, $lte: end } },
            { scheduledStart: { $lte: start }, scheduledEnd: { $gte: end } }
          ]
        });

        if (slotConflict) {
          const conflictingTime = new Date(slotConflict.scheduledStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          const conflictingDate = new Date(slotConflict.scheduledStart).toLocaleDateString('en-IN');
          return res.status(409).json({
            success: false,
            error: {
              code: 'DOCTOR_SLOT_CONFLICT',
              message: `Doctor already has an active appointment booked around ${conflictingTime} on ${conflictingDate}. Please choose a different time slot or doctor.`,
              conflictingAppointmentId: slotConflict.appointmentId
            }
          });
        }
      }

      const appointment = await Appointment.create({
        appointmentId: generateId('appointment'),
        organizationId: req.organizationId,
        branchId: branchId || req.branchId,
        departmentId,
        patientId,
        providerId,
        serviceId,
        scheduledStart: start,
        scheduledEnd: end,
        durationMinutes,
        appointmentType,
        status: 'scheduled',
        reason,
        notes
      });

      AuditService.log({
        organizationId: req.organizationId,
        branchId: appointment.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'appointment.created',
        entityType: 'appointment',
        entityId: appointment.appointmentId,
        after: appointment.toObject()
      });

      return res.status(201).json({ success: true, data: appointment });
    } catch (err) {
      next(err);
    }
  }

  static async updateAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const apt = await Appointment.findOne({ appointmentId: id, organizationId: req.organizationId });
      if (!apt) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } });
      }

      if (req.body.scheduledStart) {
        const newStart = new Date(req.body.scheduledStart);
        const duration = req.body.durationMinutes || apt.durationMinutes || 15;
        const newEnd = new Date(newStart.getTime() + duration * 60000);
        const checkProviderId = req.body.providerId || apt.providerId;

        // TC-12: Check slot conflict on reschedule
        if (!req.body.allowSlotOverlap) {
          const slotConflict = await Appointment.findOne({
            organizationId: req.organizationId,
            appointmentId: { $ne: apt.appointmentId },
            providerId: checkProviderId,
            status: { $in: ['scheduled', 'confirmed', 'checked_in', 'in_consultation'] },
            $or: [
              { scheduledStart: { $lt: newEnd, $gte: newStart } },
              { scheduledEnd: { $gt: newStart, $lte: newEnd } },
              { scheduledStart: { $lte: newStart }, scheduledEnd: { $gte: newEnd } }
            ]
          });

          if (slotConflict) {
            const conflictingTime = new Date(slotConflict.scheduledStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const conflictingDate = new Date(slotConflict.scheduledStart).toLocaleDateString('en-IN');
            return res.status(409).json({
              success: false,
              error: {
                code: 'DOCTOR_SLOT_CONFLICT',
                message: `Doctor already has an active appointment booked around ${conflictingTime} on ${conflictingDate}. Please select another time.`
              }
            });
          }
        }

        req.body.scheduledStart = newStart;
        req.body.scheduledEnd = newEnd;
      }
      apt.set(req.body);
      apt.version = (apt.version || 0) + 1;
      await apt.save();

      AuditService.log({
        organizationId: req.organizationId,
        branchId: apt.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'appointment.updated',
        entityType: 'appointment',
        entityId: apt.appointmentId,
        before,
        after: apt.toObject()
      });

      return res.json({ success: true, data: apt });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, cancellationReason } = req.body;
      const apt = await Appointment.findOne({ appointmentId: id, organizationId: req.organizationId });
      if (!apt) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } });
      }

      apt.status = status;
      if (cancellationReason) apt.cancellationReason = cancellationReason;
      apt.version += 1;
      await apt.save();

      AuditService.log({
        organizationId: req.organizationId,
        branchId: apt.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: `appointment.${status}`,
        entityType: 'appointment',
        entityId: apt.appointmentId,
        after: { status, cancellationReason }
      });

      return res.json({ success: true, data: apt });
    } catch (err) {
      next(err);
    }
  }

  static async checkIn(req, res, next) {
    try {
      const { id } = req.params;
      const { paymentStatus, billingDetails } = req.body || {};
      const apt = await Appointment.findOne({ appointmentId: id, organizationId: req.organizationId });
      if (!apt) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } });
      }

      apt.status = 'checked_in';
      apt.checkInTime = new Date();
      apt.version += 1;
      await apt.save();

      const targetBranchId = apt.branchId || req.branchId;

      // Create linked Encounter if not already created
      let encounter = await Encounter.findOne({ appointmentId: apt.appointmentId, organizationId: req.organizationId });
      if (!encounter) {
        encounter = await Encounter.create({
          encounterId: generateId('encounter'),
          organizationId: req.organizationId,
          branchId: targetBranchId,
          departmentId: apt.departmentId,
          patientId: apt.patientId,
          providerId: apt.providerId,
          serviceIds: apt.serviceIds || (apt.serviceId ? [apt.serviceId] : []),
          appointmentId: apt.appointmentId,
          encounterType: 'consultation',
          status: 'in_progress',
          startedAt: new Date()
        });
      }

      let invoice = null;
      let payment = null;

      // Process billing if 'paid'
      if (paymentStatus === 'paid' && billingDetails) {
        const { Staff, Service, Invoice, Payment, Patient } = require('../models');
        const provider = await Staff.findOne({ staffId: apt.providerId });
        const serviceIdsToFind = apt.serviceIds || (apt.serviceId ? [apt.serviceId] : []);
        const services = await Service.find({ serviceId: { $in: serviceIdsToFind } });

        const items = [];
        let subtotal = 0;

        if (provider && provider.consultationFee > 0) {
          items.push({
            itemId: generateId('invoiceItem'),
            sourceEntityType: 'consultation',
            sourceEntityId: provider.staffId,
            description: `Doctor Consultation - ${provider.name}`,
            quantity: 1,
            unitPrice: provider.consultationFee,
            discount: 0,
            tax: 0,
            total: provider.consultationFee
          });
          subtotal += provider.consultationFee;
        }

        for (const svc of services) {
          items.push({
            itemId: generateId('invoiceItem'),
            sourceEntityType: 'service',
            sourceEntityId: svc.serviceId,
            serviceId: svc.serviceId,
            description: svc.name,
            quantity: 1,
            unitPrice: svc.price,
            discount: 0,
            tax: 0,
            total: svc.price
          });
          subtotal += svc.price;
        }

        if (items.length === 0) {
          const fee = provider?.consultationFee || 200;
          items.push({
            itemId: generateId('invoiceItem'),
            sourceEntityType: 'consultation',
            description: `General Consultation - ${provider ? provider.name : 'Doctor'}`,
            quantity: 1,
            unitPrice: fee,
            discount: 0,
            tax: 0,
            total: fee
          });
          subtotal += fee;
        }

        const discount = parseFloat(billingDetails.discount) || 0;
        const total = Math.max(0, subtotal - discount);
        const paidAmount = parseFloat(billingDetails.paidAmount) || 0;
        const balance = Math.max(0, total - paidAmount);

        // Generate Invoice
        const invCount = await Invoice.countDocuments({ organizationId: req.organizationId });
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(4, '0')}`;

        invoice = await Invoice.create({
          invoiceId: generateId('invoice'),
          invoiceNumber,
          organizationId: req.organizationId,
          branchId: targetBranchId,
          patientId: apt.patientId,
          encounterId: encounter.encounterId,
          appointmentId: apt.appointmentId,
          status: balance <= 0 ? 'paid' : 'partially_paid',
          subtotal,
          discountTotal: discount,
          taxTotal: 0,
          total,
          paidAmount,
          balance,
          currency: 'INR',
          items,
          issuedAt: new Date()
        });

        // Generate Payment
        if (paidAmount > 0) {
          const payCount = await Payment.countDocuments({ organizationId: req.organizationId });
          const paymentNumber = `PAY-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, '0')}`;
          
          payment = await Payment.create({
            paymentId: generateId('payment'),
            paymentNumber,
            organizationId: req.organizationId,
            branchId: targetBranchId,
            patientId: apt.patientId,
            invoiceId: invoice.invoiceId,
            amount: paidAmount,
            method: 'cash',
            status: 'verified',
            verifiedAt: new Date(),
            notes: 'Advance at Check-In'
          });

          await Patient.updateOne(
            { patientId: apt.patientId },
            { $inc: { balance: -paidAmount } }
          );
        }
      }

      // Create or re-activate linked QueueEntry
      let queueEntry = await QueueEntry.findOne({ appointmentId: apt.appointmentId, organizationId: req.organizationId });
      let tokenNumber = queueEntry?.tokenNumber;

      if (!queueEntry) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const queueCount = await QueueEntry.countDocuments({
          organizationId: req.organizationId,
          branchId: targetBranchId,
          createdAt: { $gte: todayStart }
        });
        tokenNumber = `Q-${String(queueCount + 1).padStart(2, '0')}`;

        queueEntry = await QueueEntry.create({
          queueEntryId: generateId('queueEntry'),
          organizationId: req.organizationId,
          branchId: targetBranchId,
          departmentId: apt.departmentId,
          patientId: apt.patientId,
          appointmentId: apt.appointmentId,
          encounterId: encounter.encounterId,
          providerId: apt.providerId,
          serviceIds: apt.serviceIds || [],
          tokenNumber,
          priority: 'normal',
          status: 'waiting'
        });
      } else if (queueEntry.status === 'completed' || queueEntry.status === 'skipped') {
        queueEntry.status = 'waiting';
        queueEntry.joinedAt = new Date();
        await queueEntry.save();
      }

      return res.json({
        success: true,
        message: 'Appointment checked in successfully',
        data: {
          appointment: apt,
          encounter,
          queueEntry,
          tokenNumber,
          invoice,
          payment
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AppointmentController;
