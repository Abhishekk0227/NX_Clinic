const {
  Invoice,
  Payment,
  Receipt,
  Refund,
  LedgerEntry,
  Patient,
  Encounter,
  Branch,
  Organization
} = require('../models');
const { generateId } = require('../utils/idGenerator');
const AuditService = require('../services/AuditService');

class BillingController {
  static async getInvoices(req, res, next) {
    try {
      const { patientId, status, branchId, search, startDate, endDate } = req.query;
      const query = { organizationId: req.organizationId };

      const isAll = branchId === 'all' || branchId === 'overall' || req.branchId === 'all' || req.branchId === 'overall';
      const effectiveBranchId = isAll ? null : (branchId && branchId !== 'undefined' ? branchId : req.branchId);
      if (effectiveBranchId) query.branchId = effectiveBranchId;
      if (patientId) query.patientId = patientId;
      if (status) query.status = status;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          query.createdAt.$gte = s;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          query.createdAt.$lte = e;
        }
      }

      const invoices = await Invoice.find(query).sort({ createdAt: -1 });

      const patientIds = [...new Set(invoices.map(i => i.patientId))];
      const branchIds = [...new Set(invoices.map(i => i.branchId).filter(Boolean))];
      const [patients, branches] = await Promise.all([
        Patient.find({ patientId: { $in: patientIds } }),
        Branch.find({ branchId: { $in: branchIds } })
      ]);
      const patientMap = {};
      patients.forEach(p => { patientMap[p.patientId] = p; });
      const branchMap = {};
      branches.forEach(b => { branchMap[b.branchId] = b; });

      let data = invoices.map(inv => ({
        ...inv.toObject(),
        patient: patientMap[inv.patientId] || null,
        branch: branchMap[inv.branchId] || null
      }));

      if (search) {
        data = data.filter(inv =>
          (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())) ||
          (inv.patient && inv.patient.name.toLowerCase().includes(search.toLowerCase())) ||
          (inv.patient && inv.patient.phone.includes(search))
        );
      }

      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getInvoiceById(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await Invoice.findOne({ invoiceId: id, organizationId: req.organizationId });
      if (!invoice) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
      }

      const [patient, payments, receipts, branch, organization] = await Promise.all([
        Patient.findOne({ patientId: invoice.patientId }),
        Payment.find({ invoiceId: id, organizationId: req.organizationId }).sort({ receivedAt: -1 }),
        Receipt.find({ invoiceId: id, organizationId: req.organizationId }).sort({ issuedAt: -1 }),
        Branch.findOne({ branchId: invoice.branchId }),
        Organization.findOne({ organizationId: req.organizationId })
      ]);

      let clinicalRecord = null;
      let prescription = null;
      let encounter = null;
      let doctor = null;
      let followUp = null;

      if (invoice.encounterId) {
        const { Encounter, ClinicalRecord, Prescription, FollowUp, Staff } = require('../models');
        encounter = await Encounter.findOne({ encounterId: invoice.encounterId, organizationId: req.organizationId });
        
        const [cr, rx, fu] = await Promise.all([
          ClinicalRecord.findOne({ encounterId: invoice.encounterId, organizationId: req.organizationId }),
          Prescription.findOne({ encounterId: invoice.encounterId, organizationId: req.organizationId }),
          FollowUp.findOne({ encounterId: invoice.encounterId, organizationId: req.organizationId }).sort({ createdAt: -1 })
        ]);

        clinicalRecord = cr;
        prescription = rx;
        followUp = fu;

        if (encounter && encounter.providerId) {
          doctor = await Staff.findOne({ staffId: encounter.providerId });
        }
      }

      return res.json({
        success: true,
        data: {
          ...invoice.toObject(),
          patient,
          payments,
          receipts,
          branch,
          organization,
          encounter,
          doctor,
          clinicalRecord,
          prescription,
          followUp
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async createInvoice(req, res, next) {
    try {
      const {
        patientId,
        encounterId,
        branchId,
        items,
        discountTotal = 0,
        taxTotal = 0,
        notes,
        dueDate
      } = req.body;

      if (!patientId || !items || items.length === 0) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Patient and at least one item are required' } });
      }

      const count = await Invoice.countDocuments({ organizationId: req.organizationId });
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const processedItems = items.map(item => ({
        itemId: item.itemId || generateId('invoiceItem'),
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        tax: item.tax || 0,
        total: (item.quantity || 1) * item.unitPrice - (item.discount || 0) + (item.tax || 0),
        sourceEntityType: item.sourceEntityType,
        sourceEntityId: item.sourceEntityId
      }));

      const subtotal = processedItems.reduce((acc, cur) => acc + (cur.quantity * cur.unitPrice), 0);
      const total = processedItems.reduce((acc, cur) => acc + cur.total, 0) - discountTotal + taxTotal;

      const invoice = await Invoice.create({
        invoiceId: generateId('invoice'),
        invoiceNumber,
        organizationId: req.organizationId,
        branchId: branchId || req.branchId,
        patientId,
        encounterId,
        items: processedItems,
        subtotal,
        discountTotal,
        taxTotal,
        total,
        paidAmount: 0,
        balance: total,
        status: 'pending',
        notes,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 86400000)
      });

      // Update patient balance
      await Patient.updateOne({ patientId }, { $inc: { balance: total } });

      // Ledger entry
      await LedgerEntry.create({
        ledgerEntryId: generateId('ledgerEntry'),
        organizationId: req.organizationId,
        branchId: invoice.branchId,
        transactionType: 'invoice_issued',
        referenceType: 'invoice',
        referenceId: invoice.invoiceId,
        amount: total,
        direction: 'debit'
      });

      AuditService.log({
        organizationId: req.organizationId,
        branchId: invoice.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'invoice.created',
        entityType: 'invoice',
        entityId: invoice.invoiceId,
        after: invoice.toObject()
      });

      return res.status(201).json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  }

  static async receivePayment(req, res, next) {
    try {
      const {
        invoiceId,
        amount,
        method,
        reference,
        proofUrl,
        verificationNotes,
        notes,
        discountAmount = 0,
        needsVerification = false
      } = req.body;

      if (!invoiceId || amount === undefined || !method) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invoice ID, amount, and payment method are required' } });
      }

      const invoice = await Invoice.findOne({ invoiceId, organizationId: req.organizationId });
      if (!invoice) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
      }

      const count = await Payment.countDocuments({ organizationId: req.organizationId });
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      // Status: if needs verification (e.g. offline screenshot submitted) -> pending_verification, else verified
      const status = needsVerification ? 'pending_verification' : 'verified';
      
      const parsedAmount = parseFloat(amount) || 0;
      const parsedDiscount = parseFloat(discountAmount) || 0;

      let payment = null;
      if (parsedAmount > 0) {
        payment = await Payment.create({
          paymentId: generateId('payment'),
          paymentNumber,
          organizationId: req.organizationId,
          branchId: invoice.branchId,
          patientId: invoice.patientId,
          invoiceId,
          amount: parsedAmount,
          method,
          reference,
          proofUrl,
          verificationNotes,
          status,
          verifiedBy: status === 'verified' ? req.user.userId : undefined,
          verifiedAt: status === 'verified' ? new Date() : undefined,
          notes
        });
      }

      let receipt = null;

      if (status === 'verified') {
        // Apply discount if provided
        if (parsedDiscount > 0) {
          invoice.discountTotal = (invoice.discountTotal || 0) + parsedDiscount;
          invoice.total = Math.max(0, invoice.total - parsedDiscount);
          
          // Since total decreased, we must adjust patient balance downwards by the discount amount
          await Patient.updateOne(
            { patientId: invoice.patientId },
            { $inc: { balance: -parsedDiscount } }
          );
        }

        // Update Invoice with payment
        invoice.paidAmount += parsedAmount;
        invoice.balance = Math.max(0, invoice.total - invoice.paidAmount);
        invoice.status = invoice.balance <= 0 ? 'paid' : 'partially_paid';
        invoice.version += 1;
        await invoice.save();

        // Update Patient balance for the payment
        if (parsedAmount > 0) {
          await Patient.updateOne(
            { patientId: invoice.patientId },
            { $inc: { balance: -parsedAmount } }
          );
        }

        // Generate Receipt only if payment was made
        if (payment) {
          const receiptCount = await Receipt.countDocuments({ organizationId: req.organizationId });
          const receiptNumber = `RCPT-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(4, '0')}`;

          receipt = await Receipt.create({
            receiptId: generateId('receipt'),
            receiptNumber,
            organizationId: req.organizationId,
            branchId: invoice.branchId,
            patientId: invoice.patientId,
            invoiceId: invoice.invoiceId,
            paymentId: payment.paymentId,
            amount: parsedAmount,
            method
          });
        }

        // Record Ledger
        await LedgerEntry.create({
          ledgerEntryId: generateId('ledgerEntry'),
          organizationId: req.organizationId,
          branchId: invoice.branchId,
          transactionType: 'payment_received',
          referenceType: 'payment',
          referenceId: payment.paymentId,
          amount: parseFloat(amount),
          direction: 'credit'
        });
      }

      AuditService.log({
        organizationId: req.organizationId,
        branchId: invoice.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'payment.received',
        entityType: 'payment',
        entityId: payment.paymentId,
        after: { ...payment.toObject(), receiptNumber: receipt ? receipt.receiptNumber : null }
      });

      return res.status(201).json({
        success: true,
        message: status === 'verified' ? 'Payment processed and receipt generated' : 'Payment recorded and pending verification',
        data: {
          payment,
          invoice,
          receipt
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyPayment(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body; // 'verified' or 'rejected'

      const payment = await Payment.findOne({ paymentId: id, organizationId: req.organizationId });
      if (!payment) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment record not found' } });
      }

      if (payment.status !== 'pending_verification') {
        return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Payment is not pending verification' } });
      }

      payment.status = status;
      payment.verificationNotes = notes;
      payment.verifiedBy = req.user.userId;
      payment.verifiedAt = new Date();
      payment.version += 1;
      await payment.save();

      let receipt = null;

      if (status === 'verified') {
        const invoice = await Invoice.findOne({ invoiceId: payment.invoiceId, organizationId: req.organizationId });
        if (invoice) {
          invoice.paidAmount += payment.amount;
          invoice.balance = Math.max(0, invoice.total - invoice.paidAmount);
          invoice.status = invoice.balance <= 0 ? 'paid' : 'partially_paid';
          invoice.version += 1;
          await invoice.save();

          await Patient.updateOne(
            { patientId: invoice.patientId },
            { $inc: { balance: -payment.amount } }
          );

          const receiptCount = await Receipt.countDocuments({ organizationId: req.organizationId });
          const receiptNumber = `RCPT-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(4, '0')}`;

          receipt = await Receipt.create({
            receiptId: generateId('receipt'),
            receiptNumber,
            organizationId: req.organizationId,
            branchId: invoice.branchId,
            patientId: invoice.patientId,
            invoiceId: invoice.invoiceId,
            paymentId: payment.paymentId,
            amount: payment.amount,
            method: payment.method
          });

          await LedgerEntry.create({
            ledgerEntryId: generateId('ledgerEntry'),
            organizationId: req.organizationId,
            branchId: invoice.branchId,
            transactionType: 'payment_received',
            referenceType: 'payment',
            referenceId: payment.paymentId,
            amount: payment.amount,
            direction: 'credit'
          });
        }
      }

      AuditService.log({
        organizationId: req.organizationId,
        branchId: payment.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: `payment.${status}`,
        entityType: 'payment',
        entityId: payment.paymentId,
        after: payment.toObject()
      });

      return res.json({
        success: true,
        message: `Payment ${status} successfully`,
        data: {
          payment,
          receipt
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPayments(req, res, next) {
    try {
      const { status, patientId, branchId } = req.query;
      const query = { organizationId: req.organizationId };

      const isAll = branchId === 'all' || branchId === 'overall' || req.branchId === 'all' || req.branchId === 'overall';
      const effectiveBranchId = isAll ? null : (branchId && branchId !== 'undefined' ? branchId : req.branchId);
      if (effectiveBranchId) query.branchId = effectiveBranchId;
      if (status) query.status = status;
      if (patientId) query.patientId = patientId;

      const payments = await Payment.find(query).sort({ receivedAt: -1 });

      const patientIds = [...new Set(payments.map(p => p.patientId))];
      const branchIds = [...new Set(payments.map(p => p.branchId).filter(Boolean))];
      const [patients, branches] = await Promise.all([
        Patient.find({ patientId: { $in: patientIds } }),
        Branch.find({ branchId: { $in: branchIds } })
      ]);
      const patientMap = {};
      patients.forEach(p => { patientMap[p.patientId] = p; });
      const branchMap = {};
      branches.forEach(b => { branchMap[b.branchId] = b; });

      const data = payments.map(p => ({
        ...p.toObject(),
        patient: patientMap[p.patientId] || null,
        branch: branchMap[p.branchId] || null
      }));

      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getReceipts(req, res, next) {
    try {
      const { patientId, branchId } = req.query;
      const query = { organizationId: req.organizationId };

      const isAll = branchId === 'all' || branchId === 'overall' || req.branchId === 'all' || req.branchId === 'overall';
      const effectiveBranchId = isAll ? null : (branchId && branchId !== 'undefined' ? branchId : req.branchId);
      if (effectiveBranchId) query.branchId = effectiveBranchId;
      if (patientId) query.patientId = patientId;

      const receipts = await Receipt.find(query).sort({ issuedAt: -1 });

      const patientIds = [...new Set(receipts.map(r => r.patientId))];
      const branchIds = [...new Set(receipts.map(r => r.branchId).filter(Boolean))];
      const [patients, branches] = await Promise.all([
        Patient.find({ patientId: { $in: patientIds } }),
        Branch.find({ branchId: { $in: branchIds } })
      ]);
      const patientMap = {};
      patients.forEach(p => { patientMap[p.patientId] = p; });
      const branchMap = {};
      branches.forEach(b => { branchMap[b.branchId] = b; });

      const data = receipts.map(r => ({
        ...r.toObject(),
        patient: patientMap[r.patientId] || null,
        branch: branchMap[r.branchId] || null
      }));

      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getReceiptById(req, res, next) {
    try {
      const { id } = req.params;
      const receipt = await Receipt.findOne({ receiptId: id, organizationId: req.organizationId });
      if (!receipt) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Receipt not found' } });
      }

      const [patient, invoice, payment, branch, organization] = await Promise.all([
        Patient.findOne({ patientId: receipt.patientId }),
        Invoice.findOne({ invoiceId: receipt.invoiceId }),
        Payment.findOne({ paymentId: receipt.paymentId }),
        Branch.findOne({ branchId: receipt.branchId }),
        Organization.findOne({ organizationId: req.organizationId })
      ]);

      let clinicalRecord = null;
      let prescription = null;
      let encounter = null;
      let doctor = null;
      let followUp = null;

      if (invoice && invoice.encounterId) {
        const { Encounter, ClinicalRecord, Prescription, FollowUp, Staff } = require('../models');
        encounter = await Encounter.findOne({ encounterId: invoice.encounterId, organizationId: req.organizationId });
        
        const clinicalData = await Promise.all([
          ClinicalRecord.findOne({ encounterId: invoice.encounterId, organizationId: req.organizationId }),
          Prescription.findOne({ encounterId: invoice.encounterId, organizationId: req.organizationId }),
          FollowUp.findOne({ encounterId: invoice.encounterId, organizationId: req.organizationId }).sort({ createdAt: -1 })
        ]);
        clinicalRecord = clinicalData[0];
        prescription = clinicalData[1];
        followUp = clinicalData[2];

        if (encounter && encounter.providerId) {
          doctor = await Staff.findOne({ staffId: encounter.providerId });
        }
      }

      return res.json({
        success: true,
        data: {
          ...receipt.toObject(),
          patient,
          invoice,
          payment,
          branch,
          organization,
          encounter,
          doctor,
          clinicalRecord,
          prescription,
          followUp
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async processRefund(req, res, next) {
    try {
      const { paymentId, amount, reason } = req.body;
      const payment = await Payment.findOne({ paymentId, organizationId: req.organizationId });
      if (!payment) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
      }

      const refundAmount = parseFloat(amount);
      if (refundAmount <= 0 || refundAmount > payment.amount) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: 'Refund amount cannot exceed payment amount' } });
      }

      const refund = await Refund.create({
        refundId: generateId('refund'),
        organizationId: req.organizationId,
        branchId: payment.branchId,
        paymentId,
        invoiceId: payment.invoiceId,
        amount: refundAmount,
        reason,
        status: 'approved',
        approvedBy: req.user.userId,
        processedAt: new Date()
      });

      // Update Invoice balance and status
      const invoice = await Invoice.findOne({ invoiceId: payment.invoiceId });
      if (invoice) {
        invoice.paidAmount -= refundAmount;
        invoice.balance += refundAmount;
        invoice.status = invoice.paidAmount <= 0 ? 'pending' : 'partially_paid';
        invoice.version += 1;
        await invoice.save();

        await Patient.updateOne(
          { patientId: invoice.patientId },
          { $inc: { balance: refundAmount } }
        );
      }

      // Ledger entry
      await LedgerEntry.create({
        ledgerEntryId: generateId('ledgerEntry'),
        organizationId: req.organizationId,
        branchId: payment.branchId,
        transactionType: 'refund_issued',
        referenceType: 'refund',
        referenceId: refund.refundId,
        amount: refundAmount,
        direction: 'debit'
      });

      AuditService.log({
        organizationId: req.organizationId,
        branchId: payment.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'payment.refunded',
        entityType: 'refund',
        entityId: refund.refundId,
        after: refund.toObject()
      });

      return res.status(201).json({ success: true, message: 'Refund processed successfully', data: refund });
    } catch (err) {
      next(err);
    }
  }

  static async updateInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const invoice = await Invoice.findOne({ invoiceId: id, organizationId: req.organizationId });
      if (!invoice) return res.status(404).json({ success: false, error: { message: 'Invoice not found' } });

      const oldTotal = invoice.total;
      
      if (updates.items) {
        let sub = 0;
        updates.items.forEach(item => {
          item.total = (item.quantity * item.unitPrice) - (item.discount || 0);
          sub += item.total;
        });
        invoice.items = updates.items;
        invoice.subtotal = sub;
        invoice.discountTotal = updates.discountTotal || 0;
        invoice.taxTotal = updates.taxTotal || 0;
        invoice.total = sub - invoice.discountTotal + invoice.taxTotal;
      }
      
      if (updates.status) invoice.status = updates.status;
      if (updates.notes) invoice.notes = updates.notes;
      if (updates.dueDate) invoice.dueDate = updates.dueDate;

      invoice.balance = Math.max(0, invoice.total - invoice.paidAmount);
      if (invoice.balance <= 0) invoice.status = 'paid';
      else if (invoice.paidAmount > 0) invoice.status = 'partially_paid';
      else invoice.status = 'draft';

      const diff = invoice.total - oldTotal;
      if (diff !== 0) {
        await Patient.updateOne({ patientId: invoice.patientId }, { $inc: { balance: diff } });
      }

      await invoice.save();
      return res.json({ success: true, message: 'Invoice updated', data: invoice });
    } catch (err) {
      next(err);
    }
  }

  static async deleteInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await Invoice.findOne({ invoiceId: id, organizationId: req.organizationId });
      if (!invoice) return res.status(404).json({ success: false, error: { message: 'Invoice not found' } });

      await Patient.updateOne({ patientId: invoice.patientId }, { $inc: { balance: -invoice.balance } });
      
      await Payment.deleteMany({ invoiceId: id });
      await Receipt.deleteMany({ invoiceId: id });
      await invoice.deleteOne();
      
      return res.json({ success: true, message: 'Invoice deleted' });
    } catch (err) {
      next(err);
    }
  }

  static async updatePayment(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, method, notes } = req.body;
      const payment = await Payment.findOne({ paymentId: id, organizationId: req.organizationId });
      if (!payment) return res.status(404).json({ success: false, error: { message: 'Payment not found' } });

      const oldAmount = payment.amount;
      payment.amount = amount !== undefined ? amount : payment.amount;
      payment.method = method || payment.method;
      payment.notes = notes || payment.notes;
      await payment.save();

      const diff = payment.amount - oldAmount;
      if (diff !== 0) {
        const invoice = await Invoice.findOne({ invoiceId: payment.invoiceId });
        if (invoice) {
          invoice.paidAmount += diff;
          invoice.balance = Math.max(0, invoice.total - invoice.paidAmount);
          if (invoice.balance <= 0) invoice.status = 'paid';
          else if (invoice.paidAmount > 0) invoice.status = 'partially_paid';
          else invoice.status = 'draft';
          await invoice.save();
        }
        await Patient.updateOne({ patientId: payment.patientId }, { $inc: { balance: -diff } });
      }

      return res.json({ success: true, message: 'Payment updated', data: payment });
    } catch (err) {
      next(err);
    }
  }

  static async deletePayment(req, res, next) {
    try {
      const { id } = req.params;
      const payment = await Payment.findOne({ paymentId: id, organizationId: req.organizationId });
      if (!payment) return res.status(404).json({ success: false, error: { message: 'Payment not found' } });

      const invoice = await Invoice.findOne({ invoiceId: payment.invoiceId });
      if (invoice) {
        invoice.paidAmount = Math.max(0, invoice.paidAmount - payment.amount);
        invoice.balance = invoice.total - invoice.paidAmount;
        if (invoice.balance <= 0) invoice.status = 'paid';
        else if (invoice.paidAmount > 0) invoice.status = 'partially_paid';
        else invoice.status = 'draft';
        await invoice.save();
      }

      await Patient.updateOne({ patientId: payment.patientId }, { $inc: { balance: payment.amount } });
      await payment.deleteOne();

      return res.json({ success: true, message: 'Payment deleted' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = BillingController;
