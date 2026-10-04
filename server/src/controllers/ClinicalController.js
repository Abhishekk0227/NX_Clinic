const {
  Encounter,
  Patient,
  Staff,
  Service,
  ClinicalRecord,
  Treatment,
  Prescription,
  QueueEntry,
  Appointment,
  Invoice,
  FormSubmission,
  Form,
  Branch,
  FollowUp
} = require('../models');
const { generateId } = require('../utils/idGenerator');
const AuditService = require('../services/AuditService');

class ClinicalController {
  static async getEncounters(req, res, next) {
    try {
      const { providerId, patientId, status, branchId } = req.query;
      const query = { organizationId: req.organizationId };

      const isAll = branchId === 'all' || branchId === 'overall' || req.branchId === 'all' || req.branchId === 'overall';
      const effectiveBranchId = isAll ? null : (branchId && branchId !== 'undefined' ? branchId : req.branchId);
      if (effectiveBranchId) query.branchId = effectiveBranchId;
      if (providerId && providerId !== 'undefined') query.providerId = providerId;
      if (patientId && patientId !== 'undefined') query.patientId = patientId;
      if (status && status !== 'undefined') query.status = status;

      const encounters = await Encounter.find(query).sort({ createdAt: -1 });

      const patientIds = [...new Set(encounters.map(e => e.patientId))];
      const providerIds = [...new Set(encounters.map(e => e.providerId))];
      const serviceIds = [...new Set(encounters.map(e => e.serviceId).filter(Boolean))];
      const branchIds = [...new Set(encounters.map(e => e.branchId).filter(Boolean))];

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

      const data = encounters.map(enc => ({
        ...enc.toObject(),
        patient: patientMap[enc.patientId] || null,
        provider: providerMap[enc.providerId] || null,
        service: serviceMap[enc.serviceId] || null,
        branch: branchMap[enc.branchId] || null
      }));

      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getEncounterWorkspace(req, res, next) {
    try {
      const { id } = req.params;
      const encounter = await Encounter.findOne({ encounterId: id, organizationId: req.organizationId });
      if (!encounter) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Encounter not found' } });
      }

      const [
        patient,
        provider,
        service,
        clinicalRecord,
        treatments,
        prescription,
        followUp,
        formSubmission,
        forms
      ] = await Promise.all([
        Patient.findOne({ patientId: encounter.patientId }),
        Staff.findOne({ staffId: encounter.providerId }),
        encounter.serviceId ? Service.findOne({ serviceId: encounter.serviceId }) : null,
        ClinicalRecord.findOne({ encounterId: id, organizationId: req.organizationId }),
        Treatment.find({ encounterId: id, organizationId: req.organizationId }),
        Prescription.findOne({ encounterId: id, organizationId: req.organizationId }),
        FollowUp.findOne({ encounterId: id, organizationId: req.organizationId }).sort({ createdAt: -1 }),
        FormSubmission.findOne({ entityId: id, organizationId: req.organizationId }),
        Form.find({ organizationId: req.organizationId, status: 'published' })
      ]);

      // Fetch all previous completed visits for this patient (excluding current encounter)
      const previousEncounters = await Encounter.find({
        patientId: encounter.patientId,
        status: 'completed',
        organizationId: req.organizationId,
        encounterId: { $ne: id }
      }).sort({ createdAt: -1 });

      const prevEncounterIds = previousEncounters.map(e => e.encounterId);
      const prevProviderIds = [...new Set(previousEncounters.map(e => e.providerId))];

      const [
        prevRecords,
        prevPrescriptions,
        prevTreatments,
        prevFollowUps,
        prevInvoices,
        prevProviders
      ] = await Promise.all([
        ClinicalRecord.find({ encounterId: { $in: prevEncounterIds }, organizationId: req.organizationId }),
        Prescription.find({ encounterId: { $in: prevEncounterIds }, organizationId: req.organizationId }),
        Treatment.find({ encounterId: { $in: prevEncounterIds }, organizationId: req.organizationId }),
        FollowUp.find({ encounterId: { $in: prevEncounterIds }, organizationId: req.organizationId }),
        Invoice.find({ encounterId: { $in: prevEncounterIds }, organizationId: req.organizationId }),
        Staff.find({ staffId: { $in: prevProviderIds } })
      ]);

      const prevRecordMap = {};
      prevRecords.forEach(r => { prevRecordMap[r.encounterId] = r; });
      const prevRxMap = {};
      prevPrescriptions.forEach(rx => { prevRxMap[rx.encounterId] = rx; });
      const prevTreatmentMap = {};
      prevTreatments.forEach(t => {
        if (!prevTreatmentMap[t.encounterId]) prevTreatmentMap[t.encounterId] = [];
        prevTreatmentMap[t.encounterId].push(t);
      });
      const prevFuMap = {};
      prevFollowUps.forEach(f => { prevFuMap[f.encounterId] = f; });
      const prevInvMap = {};
      prevInvoices.forEach(inv => { prevInvMap[inv.encounterId] = inv; });
      const prevStaffMap = {};
      prevProviders.forEach(s => { prevStaffMap[s.staffId] = s; });

      const previousVisits = previousEncounters.map(pe => ({
        encounterId: pe.encounterId,
        startedAt: pe.startedAt || pe.createdAt,
        encounterType: pe.encounterType,
        doctor: prevStaffMap[pe.providerId] ? {
          name: prevStaffMap[pe.providerId].name,
          designation: prevStaffMap[pe.providerId].designation,
          specialty: prevStaffMap[pe.providerId].specialty,
          licenseNumber: prevStaffMap[pe.providerId].licenseNumber
        } : null,
        clinicalRecord: prevRecordMap[pe.encounterId] ? {
          complaint: prevRecordMap[pe.encounterId].complaint || '',
          vitals: prevRecordMap[pe.encounterId].vitals || null,
          history: prevRecordMap[pe.encounterId].history || '',
          examination: prevRecordMap[pe.encounterId].examination || '',
          diagnosis: prevRecordMap[pe.encounterId].diagnosis || '',
          notes: prevRecordMap[pe.encounterId].notes || ''
        } : null,
        prescription: prevRxMap[pe.encounterId] ? {
          items: prevRxMap[pe.encounterId].items || [],
          notes: prevRxMap[pe.encounterId].notes || ''
        } : null,
        treatments: prevTreatmentMap[pe.encounterId] || [],
        followUp: prevFuMap[pe.encounterId] ? {
          scheduledDate: prevFuMap[pe.encounterId].scheduledDate,
          reason: prevFuMap[pe.encounterId].reason,
          notes: prevFuMap[pe.encounterId].notes
        } : null,
        bill: prevInvMap[pe.encounterId] ? {
          invoiceNumber: prevInvMap[pe.encounterId].invoiceNumber,
          total: prevInvMap[pe.encounterId].total,
          paidAmount: prevInvMap[pe.encounterId].paidAmount,
          balance: prevInvMap[pe.encounterId].balance,
          status: prevInvMap[pe.encounterId].status
        } : null
      }));

      let initialComplaint = clinicalRecord?.complaint || '';
      if (!initialComplaint) {
        // Try queueEntry notes, appointment reason or patient customData/notes
        const [linkedQueue, linkedApt] = await Promise.all([
          encounter.queueEntryId ? QueueEntry.findOne({ queueEntryId: encounter.queueEntryId }) : QueueEntry.findOne({ encounterId: id }),
          encounter.appointmentId ? Appointment.findOne({ appointmentId: encounter.appointmentId }) : null
        ]);
        initialComplaint = linkedQueue?.notes || linkedApt?.reason || linkedApt?.notes || patient?.customData?.symptoms || '';
      }

      return res.json({
        success: true,
        data: {
          encounter,
          patient,
          provider,
          service,
          clinicalRecord: {
            complaint: initialComplaint,
            vitals: clinicalRecord?.vitals || { bpSystolic: '', bpDiastolic: '', pulse: '', temperature: '', weightKg: '', heightCm: '', spo2: '' },
            history: clinicalRecord?.history || '',
            examination: clinicalRecord?.examination || '',
            diagnosis: clinicalRecord?.diagnosis || '',
            notes: clinicalRecord?.notes || ''
          },
          treatments: treatments || [],
          prescription: prescription || { items: [], notes: '' },
          followUp: followUp || null,
          previousVisits,
          previousPrescription: previousVisits[0]?.prescription || null,
          formSubmission: formSubmission ? formSubmission.values : {},
          availableForms: forms
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async saveClinicalRecord(req, res, next) {
    try {
      const { id } = req.params;
      const { complaint, vitals, history, examination, diagnosis, notes, status = 'finalized' } = req.body;

      const encounter = await Encounter.findOne({ encounterId: id, organizationId: req.organizationId });
      if (!encounter) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Encounter not found' } });
      }

      let record = await ClinicalRecord.findOne({ encounterId: id, organizationId: req.organizationId });
      const before = record ? record.toObject() : null;

      if (!record) {
        record = await ClinicalRecord.create({
          clinicalRecordId: generateId('clinicalRecord'),
          organizationId: req.organizationId,
          branchId: encounter.branchId,
          encounterId: id,
          patientId: encounter.patientId,
          providerId: encounter.providerId,
          complaint,
          vitals,
          history,
          examination,
          diagnosis,
          notes,
          status
        });
      } else {
        if (complaint !== undefined) record.complaint = complaint;
        if (vitals !== undefined) record.vitals = vitals;
        if (history !== undefined) record.history = history;
        if (examination !== undefined) record.examination = examination;
        if (diagnosis !== undefined) record.diagnosis = diagnosis;
        if (notes !== undefined) record.notes = notes;
        if (status) record.status = status;
        record.version += 1;
        await record.save();
      }

      AuditService.log({
        organizationId: req.organizationId,
        branchId: encounter.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'clinical_record.saved',
        entityType: 'clinicalRecord',
        entityId: record.clinicalRecordId,
        before,
        after: record.toObject()
      });

      return res.json({ success: true, message: 'Clinical record saved successfully', data: record });
    } catch (err) {
      next(err);
    }
  }

  static async addTreatment(req, res, next) {
    try {
      const { encounterId, name, serviceId, toothNumber, procedureDetails, cost = 0, notes } = req.body;

      const encounter = await Encounter.findOne({ encounterId, organizationId: req.organizationId });
      if (!encounter) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Encounter not found' } });
      }

      const treatment = await Treatment.create({
        treatmentId: generateId('treatment'),
        organizationId: req.organizationId,
        branchId: encounter.branchId,
        encounterId,
        patientId: encounter.patientId,
        providerId: encounter.providerId,
        serviceId,
        name,
        toothNumber,
        procedureDetails,
        cost: Number(cost),
        notes,
        status: 'completed'
      });

      // Synchronize with existing Invoice if present
      const treatmentCost = Number(cost) || 0;
      if (treatmentCost > 0) {
        const invoice = await Invoice.findOne({ encounterId, organizationId: req.organizationId });
        if (invoice) {
          const newItem = {
            itemId: generateId('invoiceItem'),
            serviceId: serviceId,
            description: toothNumber ? `${name} (Tooth #${toothNumber})` : name,
            quantity: 1,
            unitPrice: treatmentCost,
            discount: 0,
            tax: 0,
            total: treatmentCost,
            sourceEntityType: 'treatment',
            sourceEntityId: treatment.treatmentId
          };
          
          await Invoice.updateOne(
            { _id: invoice._id },
            { 
              $push: { items: newItem },
              $inc: { subtotal: treatmentCost, total: treatmentCost, balance: treatmentCost }
            }
          );
          
          await Patient.updateOne(
            { patientId: encounter.patientId },
            { $inc: { balance: treatmentCost } }
          );
        }
      }

      AuditService.log({
        organizationId: req.organizationId,
        branchId: encounter.branchId,
        actorUserId: req.user?.userId || 'system',
        actorName: req.user?.name || 'Doctor',
        action: 'treatment.created',
        entityType: 'treatment',
        entityId: treatment.treatmentId,
        after: treatment.toObject()
      });

      return res.status(201).json({ success: true, data: treatment });
    } catch (err) {
      next(err);
    }
  }

  static async savePrescription(req, res, next) {
    try {
      const { encounterId, items, notes } = req.body;
      const encounter = await Encounter.findOne({ encounterId, organizationId: req.organizationId });
      if (!encounter) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Encounter not found' } });
      }

      let prescription = await Prescription.findOne({ encounterId, organizationId: req.organizationId });
      if (!prescription) {
        prescription = await Prescription.create({
          prescriptionId: generateId('prescription'),
          organizationId: req.organizationId,
          branchId: encounter.branchId,
          encounterId,
          patientId: encounter.patientId,
          providerId: encounter.providerId,
          items: items || [],
          notes,
          status: 'active'
        });
      } else {
        prescription.items = items || [];
        if (notes !== undefined) prescription.notes = notes;
        prescription.version += 1;
        await prescription.save();
      }

      AuditService.log({
        organizationId: req.organizationId,
        branchId: encounter.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'prescription.saved',
        entityType: 'prescription',
        entityId: prescription.prescriptionId,
        after: prescription.toObject()
      });

      return res.json({ success: true, message: 'Prescription saved', data: prescription });
    } catch (err) {
      next(err);
    }
  }

  static async completeEncounter(req, res, next) {
    try {
      const { id } = req.params;
      const { waiveConsultationFee } = req.body;
      const encounter = await Encounter.findOne({ encounterId: id, organizationId: req.organizationId });
      if (!encounter) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Encounter not found' } });
      }

      const patient = await Patient.findOne({ patientId: encounter.patientId, organizationId: req.organizationId });
      if (patient && patient.balance > 0) {
        return res.status(400).json({ success: false, error: { code: 'PAYMENT_PENDING', message: 'Patient has pending payment. Please complete payment first.' } });
      }

      encounter.status = 'completed';
      encounter.completedAt = new Date();
      if (waiveConsultationFee === true) {
        encounter.isConsultationFeeWaived = true;
      }
      encounter.version += 1;
      await encounter.save();

      // Update linked queue entry
      if (encounter.queueEntryId) {
        await QueueEntry.updateOne(
          { queueEntryId: encounter.queueEntryId },
          { status: 'completed', completedAt: new Date() }
        );
      }

      // Update linked appointment
      if (encounter.appointmentId) {
        await Appointment.updateOne(
          { appointmentId: encounter.appointmentId },
          { status: 'completed' }
        );
      }

      // Update Patient lastVisitAt
      await Patient.updateOne(
        { patientId: encounter.patientId },
        { lastVisitAt: new Date() }
      );

      // Check if invoice already exists or needs to be generated from treatments/consultation
      let invoice = await Invoice.findOne({ encounterId: id, organizationId: req.organizationId });
      if (!invoice) {
        const treatments = await Treatment.find({ encounterId: id, organizationId: req.organizationId });
        const provider = await Staff.findOne({ staffId: encounter.providerId });
        const items = [];

        // Add Consultation fee if configured
        const consultFee = provider ? provider.consultationFee || 0 : 0;
        if (consultFee > 0 && waiveConsultationFee !== true) {
          items.push({
            itemId: generateId('invoiceItem'),
            description: `Consultation - ${provider.name}`,
            quantity: 1,
            unitPrice: consultFee,
            discount: 0,
            tax: 0,
            total: consultFee,
            sourceEntityType: 'consultation',
            sourceEntityId: encounter.encounterId
          });
        }

        // Add Treatments
        treatments.forEach(t => {
          if (t.cost > 0) {
            items.push({
              itemId: generateId('invoiceItem'),
              serviceId: t.serviceId,
              description: t.toothNumber ? `${t.name} (Tooth #${t.toothNumber})` : t.name,
              quantity: 1,
              unitPrice: t.cost,
              discount: 0,
              tax: 0,
              total: t.cost,
              sourceEntityType: 'treatment',
              sourceEntityId: t.treatmentId
            });
          }
        });

        if (items.length > 0) {
          const count = await Invoice.countDocuments({ organizationId: req.organizationId });
          const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
          const subtotal = items.reduce((acc, cur) => acc + cur.total, 0);

          invoice = await Invoice.create({
            invoiceId: generateId('invoice'),
            invoiceNumber,
            organizationId: req.organizationId,
            branchId: encounter.branchId,
            patientId: encounter.patientId,
            encounterId: encounter.encounterId,
            items,
            subtotal,
            discountTotal: 0,
            taxTotal: 0,
            total: subtotal,
            paidAmount: 0,
            balance: subtotal,
            status: 'pending',
            dueDate: new Date(Date.now() + 7 * 86400000)
          });

          // Update patient balance
          await Patient.updateOne(
            { patientId: encounter.patientId },
            { $inc: { balance: subtotal } }
          );
        }
      } else {
        // If invoice exists and fee is waived, remove the consultation fee line item
        if (waiveConsultationFee === true) {
          const consultItem = invoice.items.find(i => i.sourceEntityType === 'consultation' && i.sourceEntityId === encounter.encounterId);
          if (consultItem) {
            const amountToDeduct = consultItem.total;
            await Invoice.updateOne(
              { _id: invoice._id },
              {
                $pull: { items: { sourceEntityType: 'consultation', sourceEntityId: encounter.encounterId } },
                $inc: { subtotal: -amountToDeduct, total: -amountToDeduct, balance: -amountToDeduct }
              }
            );
            await Patient.updateOne(
              { patientId: encounter.patientId },
              { $inc: { balance: -amountToDeduct } }
            );
          }
        }
      }

      AuditService.log({
        organizationId: req.organizationId,
        branchId: encounter.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'encounter.completed',
        entityType: 'encounter',
        entityId: encounter.encounterId,
        after: { status: 'completed', invoiceId: invoice ? invoice.invoiceId : null }
      });

      return res.json({
        success: true,
        message: 'Encounter completed successfully',
        data: {
          encounter,
          invoice
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ClinicalController;
