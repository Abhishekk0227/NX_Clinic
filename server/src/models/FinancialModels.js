const mongoose = require('mongoose');

// --- 1. Invoice ---
const InvoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true, index: true },
  invoiceNumber: { type: String, required: true }, // e.g. "INV-2026-0001"
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  encounterId: { type: String, index: true },
  currency: { type: String, default: 'INR' },
  items: [{
    itemId: { type: String, required: true },
    serviceId: String,
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    sourceEntityType: String, // 'treatment', 'service', 'consultation'
    sourceEntityId: String
  }],
  subtotal: { type: Number, required: true, default: 0 },
  discountTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  total: { type: Number, required: true, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'pending', 'partially_paid', 'paid', 'cancelled', 'refunded'],
    default: 'pending'
  },
  issuedAt: { type: Date, default: Date.now },
  dueDate: Date,
  notes: String,
  version: { type: Number, default: 1 }
}, { timestamps: true });

InvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ organizationId: 1, patientId: 1, status: 1 });

// --- 2. Payment ---
const PaymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true, index: true },
  paymentNumber: { type: String, required: true }, // e.g. "PAY-2026-0001"
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  invoiceId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  method: {
    type: String,
    enum: ['cash', 'upi', 'card', 'bank_transfer', 'online_gateway', 'other'],
    required: true
  },
  reference: String, // UTR, transaction ID, card last 4, etc.
  proofUrl: String, // Offline screenshot/receipt attachment
  verificationNotes: String,
  status: {
    type: String,
    enum: ['pending_verification', 'verified', 'rejected', 'refunded'],
    default: 'verified' // Direct methods are verified, offline proofs with verification needed are pending_verification
  },
  verifiedBy: String, // Staff User ID
  verifiedAt: Date,
  receivedAt: { type: Date, default: Date.now },
  notes: String,
  version: { type: Number, default: 1 }
}, { timestamps: true });

PaymentSchema.index({ organizationId: 1, invoiceId: 1 });

// --- 3. Receipt ---
const ReceiptSchema = new mongoose.Schema({
  receiptId: { type: String, required: true, unique: true, index: true },
  receiptNumber: { type: String, required: true }, // e.g. "RCPT-2026-0001"
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  invoiceId: { type: String, required: true, index: true },
  paymentId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}, { timestamps: true });

ReceiptSchema.index({ organizationId: 1, receiptNumber: 1 }, { unique: true });

// --- 4. Refund ---
const RefundSchema = new mongoose.Schema({
  refundId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  paymentId: { type: String, required: true, index: true },
  invoiceId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  approvedBy: String,
  processedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}, { timestamps: true });

// --- 5. Ledger Foundation ---
const LedgerEntrySchema = new mongoose.Schema({
  ledgerEntryId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  transactionType: { type: String, enum: ['invoice_issued', 'payment_received', 'refund_issued', 'adjustment'], required: true },
  referenceType: { type: String, enum: ['invoice', 'payment', 'refund'], required: true },
  referenceId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  direction: { type: String, enum: ['debit', 'credit'], required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  Invoice: mongoose.model('Invoice', InvoiceSchema),
  Payment: mongoose.model('Payment', PaymentSchema),
  Receipt: mongoose.model('Receipt', ReceiptSchema),
  Refund: mongoose.model('Refund', RefundSchema),
  LedgerEntry: mongoose.model('LedgerEntry', LedgerEntrySchema)
};
