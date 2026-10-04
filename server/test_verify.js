const mongoose = require('mongoose');
const { Payment, Invoice, Receipt, LedgerEntry, Patient } = require('./src/models');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const payment = await Payment.findOne({ paymentId: 'pay_2bede652ec364ef5' });
  if (!payment) {
    console.log('Payment not found');
    return process.exit(0);
  }
  console.log('Payment:', payment.toObject());

  const invoice = await Invoice.findOne({ invoiceId: payment.invoiceId });
  console.log('Invoice:', invoice ? invoice.toObject() : 'Not found');
  
  // Attempt to generate receipt
  const receiptCount = await Receipt.countDocuments({ organizationId: payment.organizationId });
  const receiptNumber = `RCPT-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(4, '0')}`;
  console.log('Next Receipt Number:', receiptNumber);

  process.exit(0);
}
run();
