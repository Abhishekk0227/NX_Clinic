const mongoose = require('mongoose');
const { Payment, Invoice, Receipt, LedgerEntry, Patient } = require('./src/models');
require('dotenv').config();

async function reset() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Reset payment
  await Payment.updateOne(
    { paymentId: 'pay_2bede652ec364ef5' },
    { $set: { status: 'pending_verification' } }
  );

  // Revert invoice
  await Invoice.updateOne(
    { invoiceId: 'inv_2a0ec447c03c4d47' },
    { $set: { paidAmount: 0, balance: 800, status: 'pending' }, $inc: { version: 1 } }
  );

  // Revert patient
  await Patient.updateOne(
    { patientId: 'pat_341b711d95434ae9' },
    { $inc: { balance: 800 } }
  );

  // Delete the receipt and ledger entry
  await Receipt.deleteMany({ paymentId: 'pay_2bede652ec364ef5' });
  await LedgerEntry.deleteMany({ referenceId: 'pay_2bede652ec364ef5' });

  console.log('Reset complete.');
  process.exit(0);
}
reset();
