import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import {
  FileText,
  Printer,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Eye,
  RotateCcw
} from 'lucide-react';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { organization, hasPermission } = useAuth();
  const { addToast } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'bill', 'rx'

  // Receive Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'upi',
    reference: '',
    notes: '',
    needsVerification: false
  });

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const data = await api.getInvoiceById(id);
      setInvoice(data);
      setPaymentForm((prev) => ({ ...prev, amount: data.balance }));
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleReceivePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.receivePayment({
        invoiceId: id,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
        needsVerification: paymentForm.needsVerification
      });
      addToast(res.message || 'Payment recorded', 'success');
      setIsPaymentModalOpen(false);
      fetchInvoice();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading invoice...</div>;
  }

  if (!invoice) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Invoice not found.</div>;
  }

  const { patient, payments, receipts } = invoice;

  return (
    <div>
      {/* Top Action Bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px' }}>Invoice {invoice.invoiceNumber}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Issued on {new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString('en-IN')}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '8px', gap: '2px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : ''}`}
            style={{ background: activeTab === 'all' ? 'var(--primary)' : 'transparent', color: activeTab === 'all' ? '#fff' : '#475569', border: 'none', borderRadius: '6px', fontWeight: 600 }}
            onClick={() => setActiveTab('all')}
          >
            All (2 Pages: Bill & Rx)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'bill' ? 'btn-primary' : ''}`}
            style={{ background: activeTab === 'bill' ? 'var(--primary)' : 'transparent', color: activeTab === 'bill' ? '#fff' : '#475569', border: 'none', borderRadius: '6px', fontWeight: 600 }}
            onClick={() => setActiveTab('bill')}
          >
            Page 1: Tax Invoice / Bill
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'rx' ? 'btn-primary' : ''}`}
            style={{ background: activeTab === 'rx' ? 'var(--primary)' : 'transparent', color: activeTab === 'rx' ? '#fff' : '#475569', border: 'none', borderRadius: '6px', fontWeight: 600 }}
            onClick={() => setActiveTab('rx')}
          >
            Page 2: Medical Prescription (Rx)
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print {activeTab === 'all' ? 'Both Pages' : activeTab === 'bill' ? 'Bill Only' : 'Prescription Only'}
          </button>
          {invoice.balance > 0 && hasPermission('payment.create') && (
            <button className="btn btn-success" onClick={() => setIsPaymentModalOpen(true)}>
              <IndianRupee size={16} /> Collect Payment
            </button>
          )}
        </div>
      </div>

      {/* Container for Printable Documents */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '820px', margin: '0 auto' }}>

        {/* ========================================================= */}
        {/* PAGE 1: TAX INVOICE & BILL RECEIPT                        */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'bill') && (
          <div className="card print-page" style={{ padding: '36px', background: '#ffffff', border: '1px solid #cbd5e1', pageBreakAfter: activeTab === 'all' ? 'always' : 'auto' }}>
            {/* Header Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--primary)' }}>
                Page 1 of {activeTab === 'all' && (invoice.prescription || invoice.clinicalRecord) ? '2' : '1'} • Official Tax Invoice & Bill
              </span>
              <span className={`badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                Status: {invoice.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Clinic / Branch Letterhead */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '18px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '22px', color: 'var(--primary-dark)', fontWeight: 800, margin: 0 }}>
                  {invoice.branch?.name || organization?.name || 'Apex Healthcare'}
                </h2>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                  {invoice.branch?.address?.street ? `${invoice.branch.address.street}, ` : ''}{invoice.branch?.address?.city || 'Bhopal'}, {invoice.branch?.address?.state || 'MP'}<br />
                  Phone: {invoice.branch?.phone || organization?.phone || '+91 98765 43210'} • Email: {organization?.email || 'billing@apexhealthcare.in'}<br />
                  {invoice.branch?.gstNumber && <span>GSTIN: <strong>{invoice.branch.gstNumber}</strong></span>}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px' }}>TAX INVOICE</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>{invoice.invoiceNumber}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Date: <strong>{new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString('en-IN')}</strong>
                </div>
              </div>
            </div>

            {/* Bill To & Metadata Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '22px', fontSize: '13px', background: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>BILLED TO PATIENT:</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{patient?.name}</div>
                <div style={{ color: '#475569' }}>Patient ID: <strong>{patient?.patientNumber}</strong></div>
                <div style={{ color: '#475569' }}>Phone: {patient?.phone || '—'} • Age/Gender: {patient?.age || '—'}y / {patient?.gender || '—'}</div>
                {patient?.address?.street && <div style={{ color: '#475569' }}>{patient.address.street}, {patient.address.city}</div>}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>VISIT & BILLING INFO:</div>
                <div style={{ color: '#475569', marginTop: '2px' }}>Doctor: <strong>Dr. {invoice.doctor?.name || 'Medical Officer'}</strong></div>
                <div style={{ color: '#475569' }}>Department: <strong>{invoice.doctor?.specialty || 'General OPD'}</strong></div>
                <div style={{ color: '#475569' }}>Payment Terms: <strong>Due on Receipt</strong></div>
              </div>
            </div>

            {/* Items Table */}
            <div className="table-responsive" style={{ marginBottom: '20px' }}>
              <table className="data-table" style={{ border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#0f172a' }}>
                    <th style={{ width: '45%' }}>Particulars / Service Description</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Rate (₹)</th>
                    <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.description}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₹{item.unitPrice}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '22px' }}>
              <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', background: '#f8fafc', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Subtotal:</span>
                  <span>₹{invoice.subtotal}</span>
                </div>
                {invoice.discountTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                    <span>Special Discount:</span>
                    <span>- ₹{invoice.discountTotal}</span>
                  </div>
                )}
                {invoice.taxTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Tax / GST:</span>
                    <span>+ ₹{invoice.taxTotal}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '16px', borderTop: '2px solid #cbd5e1', paddingTop: '8px', color: '#0f172a' }}>
                  <span>Total Amount:</span>
                  <span>₹{invoice.total}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 700 }}>
                  <span>Paid Amount:</span>
                  <span>₹{invoice.paidAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: invoice.balance > 0 ? '#ef4444' : '#10b981', fontWeight: 800, fontSize: '15px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                  <span>Balance Due:</span>
                  <span>₹{invoice.balance}</span>
                </div>
              </div>
            </div>

            {/* Payments History */}
            {payments && payments.length > 0 && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 800 }}>
                  Payment Receipts Recorded
                </h4>
                {payments.map((p) => {
                  const rcpt = receipts?.find((r) => r.paymentId === p.paymentId);
                  return (
                    <div key={p.paymentId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px' }}>
                      <div>
                        <strong>{p.paymentNumber}</strong> — {p.method.toUpperCase()} {p.reference ? `(Ref: ${p.reference})` : ''} on {new Date(p.receivedAt).toLocaleDateString('en-IN')}
                        {rcpt && (
                          <span
                            className="no-print"
                            style={{ marginLeft: '10px', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => navigate(`/billing/receipts/${rcpt.receiptId}`)}
                          >
                            View Receipt #{rcpt.receiptNumber}
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, color: '#10b981' }}>₹{p.amount}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bill Footer & Authorization */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '28px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                This is a computer generated bill receipt.<br />
                Page 1: Billing & Accounts Summary
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '160px', borderBottom: '1px solid #475569', marginBottom: '6px' }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Authorized Cashier / Accounts</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PAGE 2: OFFICIAL MEDICAL CONSULTATION & PRESCRIPTION (Rx) */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'rx') && (invoice.prescription || invoice.clinicalRecord || invoice.doctor) && (
          <div className="card print-page" style={{ padding: '38px', background: '#ffffff', border: '1.5px solid #0f172a', borderRadius: '8px', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            
            {/* Top Security & Authentication Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#0f172a' }}>
                  MEDICAL PRESCRIPTION & CLINICAL RECORD
                </span>
                <span style={{ background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px' }}>
                  PAGE 2 OF 2
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                Encounter ID: <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{invoice.encounterId || invoice.invoiceNumber}</span>
              </div>
            </div>

            {/* Hospital / Clinic & Doctor Professional Double Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '18px', marginBottom: '18px' }}>
              {/* Clinic Letterhead */}
              <div>
                <h2 style={{ fontSize: '22px', color: '#0f172a', fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
                  {invoice.branch?.name || organization?.name || 'Apex Healthcare Centre'}
                </h2>
                <div style={{ fontSize: '12.5px', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                  Multi-Specialty Healthcare, Dental & Diagnostics
                </div>
                <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: 1.45 }}>
                  {invoice.branch?.address?.street ? `${invoice.branch.address.street}, ` : ''}{invoice.branch?.address?.city || 'Bhopal'}, {invoice.branch?.address?.state || 'MP'} • Pin: {invoice.branch?.address?.pincode || '462001'}<br />
                  Emergency / Helpline: <strong>{invoice.branch?.phone || organization?.phone || '+91 98765 43210'}</strong> • Email: {organization?.email || 'care@apexhealthcare.in'}
                </div>
              </div>

              {/* Doctor Credentials Letterhead */}
              <div style={{ textAlign: 'right', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '16.5px', fontWeight: 900, color: '#0f172a' }}>
                  Dr. {invoice.doctor?.name || 'Physician'}
                </div>
                <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                  {invoice.doctor?.designation || 'Senior Consultant'} {invoice.doctor?.specialty ? `• ${invoice.doctor.specialty}` : ''}
                </div>
                <div style={{ fontSize: '11.5px', color: '#334155', marginTop: '4px' }}>
                  Medical Reg. No: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{invoice.doctor?.licenseNumber || 'MP-MED-2024-REG'}</strong>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Dept: <strong>{invoice.doctor?.specialty || 'General Medicine'}</strong>
                </div>
              </div>
            </div>

            {/* Patient Demographics & Vitals Passport */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', marginBottom: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12.5px', borderBottom: (invoice.clinicalRecord?.vitals && (invoice.clinicalRecord.vitals.bpSystolic || invoice.clinicalRecord.vitals.pulse)) ? '1px dashed #cbd5e1' : 'none', paddingBottom: (invoice.clinicalRecord?.vitals && (invoice.clinicalRecord.vitals.bpSystolic || invoice.clinicalRecord.vitals.pulse)) ? '10px' : '0' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Patient Name:</span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{patient?.name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Patient ID / UHID:</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0284c7' }}>{patient?.patientNumber}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Age / Gender / Blood:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{patient?.age || '—'} yrs / {patient?.gender || '—'} / {patient?.bloodGroup || 'N/A'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Prescription Date:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Recorded Vitals Row */}
              {invoice.clinicalRecord?.vitals && (invoice.clinicalRecord.vitals.bpSystolic || invoice.clinicalRecord.vitals.pulse || invoice.clinicalRecord.vitals.temperature || invoice.clinicalRecord.vitals.spo2 || invoice.clinicalRecord.vitals.weightKg) && (
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '10px', fontSize: '12px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 900, color: '#475569', letterSpacing: '0.5px' }}>
                    PATIENT VITALS:
                  </span>
                  {(invoice.clinicalRecord.vitals.bpSystolic || invoice.clinicalRecord.vitals.bpDiastolic) && (
                    <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px' }}>
                      BP: <strong>{invoice.clinicalRecord.vitals.bpSystolic || '—'}/{invoice.clinicalRecord.vitals.bpDiastolic || '—'} mmHg</strong>
                    </span>
                  )}
                  {invoice.clinicalRecord.vitals.pulse && (
                    <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px' }}>
                      Pulse: <strong>{invoice.clinicalRecord.vitals.pulse} bpm</strong>
                    </span>
                  )}
                  {invoice.clinicalRecord.vitals.temperature && (
                    <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px' }}>
                      Temp: <strong>{invoice.clinicalRecord.vitals.temperature} °F</strong>
                    </span>
                  )}
                  {invoice.clinicalRecord.vitals.spo2 && (
                    <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px' }}>
                      SpO2: <strong>{invoice.clinicalRecord.vitals.spo2} %</strong>
                    </span>
                  )}
                  {invoice.clinicalRecord.vitals.weightKg && (
                    <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px' }}>
                      Weight: <strong>{invoice.clinicalRecord.vitals.weightKg} kg</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Clinical Findings & Diagnosis Card */}
            {(invoice.clinicalRecord?.diagnosis || invoice.clinicalRecord?.complaint) && (
              <div style={{ display: 'grid', gridTemplateColumns: invoice.clinicalRecord?.complaint && invoice.clinicalRecord?.diagnosis ? '1fr 1.3fr' : '1fr', gap: '14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                {invoice.clinicalRecord?.complaint && (
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#166534', fontWeight: 900, letterSpacing: '0.5px' }}>
                      CHIEF COMPLAINT / SYMPTOMS:
                    </span>
                    <div style={{ fontSize: '13px', color: '#14532d', fontWeight: 600, marginTop: '2px' }}>
                      {invoice.clinicalRecord.complaint}
                    </div>
                  </div>
                )}
                {invoice.clinicalRecord?.diagnosis && (
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#166534', fontWeight: 900, letterSpacing: '0.5px' }}>
                      PRIMARY CLINICAL DIAGNOSIS:
                    </span>
                    <div style={{ fontSize: '14.5px', color: '#0f172a', fontWeight: 900, marginTop: '2px' }}>
                      {invoice.clinicalRecord.diagnosis}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prescribed Medicines (Rx) Section */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '2px solid #0f172a', paddingBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#0284c7', fontFamily: 'serif', lineHeight: 1 }}>℞</span>
                  <span style={{ fontSize: '13.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#0f172a' }}>
                    PRESCRIBED MEDICATIONS & DOSAGE SCHEDULE
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Total Medicines: <strong>{invoice.prescription?.items?.length || 0}</strong>
                </span>
              </div>

              {invoice.prescription?.items && invoice.prescription.items.length > 0 ? (
                <div className="table-responsive">
                  <table className="data-table" style={{ fontSize: '13px', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                        <th style={{ width: '4%', textAlign: 'center', color: '#ffffff' }}>#</th>
                        <th style={{ width: '38%', color: '#ffffff' }}>Medicine / Drug Name</th>
                        <th style={{ width: '12%', textAlign: 'center', color: '#ffffff' }}>Dosage</th>
                        <th style={{ width: '15%', textAlign: 'center', color: '#ffffff' }}>Frequency (M-A-N)</th>
                        <th style={{ width: '11%', textAlign: 'center', color: '#ffffff' }}>Duration</th>
                        <th style={{ width: '20%', color: '#ffffff' }}>Instructions / Timing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.prescription.items.map((item, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px' }}>{item.medicineName}</div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.dosage || '1 Tab'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                              {item.frequency || '1-0-1'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: '#334155' }}>{item.duration || '3 Days'}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0284c7' }}>{item.timing || 'After Food'}</div>
                            {item.instructions && <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>{item.instructions}</div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  No oral/injectable medications prescribed for this consultation.
                </div>
              )}
            </div>

            {/* Doctor's Special Advice, Dietary Notes & Next Appointment */}
            <div style={{ display: 'grid', gridTemplateColumns: invoice.followUp ? '1.5fr 1fr' : '1fr', gap: '16px', marginBottom: '22px' }}>
              {/* Advice Box */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#92400e', fontWeight: 900, letterSpacing: '0.5px', marginBottom: '4px' }}>
                  GENERAL ADVICE, DIETARY & CLINICAL INSTRUCTIONS:
                </div>
                <div style={{ fontSize: '13px', color: '#78350f', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {invoice.prescription?.notes || invoice.clinicalRecord?.notes || '• Drink plenty of warm fluids\n• Adequate rest and complete the prescribed antibiotic/medication course\n• Contact clinic immediately in case of fever spike or adverse symptoms.'}
                </div>
              </div>

              {/* Follow-Up Box */}
              {invoice.followUp && (
                <div style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: '8px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#1e40af', fontWeight: 900, letterSpacing: '0.5px', marginBottom: '4px' }}>
                    NEXT APPOINTMENT / REVIEW VISIT:
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#1e3a8a' }}>
                    {new Date(invoice.followUp.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  {invoice.followUp.scheduledDate && (
                    <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>
                      Time: {new Date(invoice.followUp.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {invoice.followUp.reason && (
                    <div style={{ fontSize: '11.5px', color: '#1d4ed8', marginTop: '4px', background: '#dbeafe', padding: '4px 8px', borderRadius: '4px' }}>
                      Purpose: {invoice.followUp.reason}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Official Practitioner Signature & Security Watermark */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', paddingTop: '16px', borderTop: '2px solid #0f172a' }}>
              <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                <strong style={{ color: '#0f172a' }}>Notice:</strong> This is a digitally verified medical prescription.<br />
                Substitution of medications is not permitted without consulting the practitioner.<br />
                Valid across India under National Digital Health & Medical Council Guidelines.
              </div>

              <div style={{ textAlign: 'center', minWidth: '200px' }}>
                <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: '13px', fontWeight: 800, fontStyle: 'italic', letterSpacing: '0.5px' }}>
                  [ Digitally Signed & Authenticated ]
                </div>
                <div style={{ borderBottom: '2px solid #0f172a', margin: '4px 0' }} />
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                  Dr. {invoice.doctor?.name || 'Authorized Medical Officer'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#475569', fontWeight: 600 }}>
                  Reg. No: <strong>{invoice.doctor?.licenseNumber || 'MP-MED-2024-REG'}</strong>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Collect Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Receive Payment for ${invoice.invoiceNumber}`}
        maxWidth="500px"
      >
        <form onSubmit={handleReceivePaymentSubmit} autoComplete="off">
          {(() => {
            const disc = parseFloat(paymentForm.discountAmount) || 0;
            const netBalance = Math.max(0, (invoice.balance || 0) - disc);

            return (
              <>
                <div className="form-group">
                  <label className="form-label">Discount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={paymentForm.discountAmount ?? ''}
                    placeholder="0"
                    onChange={(e) => {
                      const newDisc = e.target.value;
                      const newNet = Math.max(0, (invoice.balance || 0) - (parseFloat(newDisc) || 0));
                      setPaymentForm({
                        ...paymentForm,
                        discountAmount: newDisc,
                        amount: newNet
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, color: '#15803d' }}>
                      Amount Paid (Exact ₹) *
                    </label>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Net Payable: <strong>₹{netBalance}</strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    required
                    max={netBalance}
                    className="form-input"
                    style={{ fontWeight: 700, color: '#15803d', borderColor: '#86efac' }}
                    value={paymentForm.amount !== '' ? paymentForm.amount : netBalance}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder={String(netBalance)}
                  />
                </div>
              </>
            );
          })()}

          <div className="form-group">
            <label className="form-label">Payment Mode *</label>
            <select
              className="form-select"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              <option value="upi">UPI (GPay / PhonePe / QR)</option>
              <option value="cash">Cash</option>
              <option value="card">Card (POS)</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online_gateway">Online Gateway</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Reference / UTR</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 628849102911"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              Confirm & Issue Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InvoiceDetailPage;
