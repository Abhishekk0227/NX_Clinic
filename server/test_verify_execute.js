const mongoose = require('mongoose');
const { Payment, Invoice, Receipt, LedgerEntry, Patient } = require('./src/models');
const { generateId } = require('./src/utils/idGenerator');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  try {
    const payment = await Payment.findOne({ paymentId: 'pay_2bede652ec364ef5' });
    const req = { organizationId: payment.organizationId };
    
    console.log('Finding invoice...');
    const invoice = await Invoice.findOne({ invoiceId: payment.invoiceId, organizationId: req.organizationId });
    if (invoice) {
      console.log('Found invoice, updating...');
      invoice.paidAmount += payment.amount;
      invoice.balance = Math.max(0, invoice.total - invoice.paidAmount);
      invoice.status = invoice.balance <= 0 ? 'paid' : 'partially_paid';
      invoice.version += 1;
      
      console.log('Saving invoice...');
      await invoice.save();
      console.log('Invoice saved.');

      console.log('Updating patient...');
      await Patient.updateOne(
        { patientId: invoice.patientId },
        { $inc: { balance: -payment.amount } }
      );
      console.log('Patient updated.');

      console.log('Creating receipt...');
      const receiptCount = await Receipt.countDocuments({ organizationId: req.organizationId });
      const receiptNumber = `RCPT-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(4, '0')}`;

      const receipt = await Receipt.create({
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
      console.log('Receipt created:', receipt.receiptId);

      console.log('Creating ledger entry...');
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
      console.log('Ledger entry created.');
    }
    console.log('Done.');
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    process.exit(0);
  }
}
run();
