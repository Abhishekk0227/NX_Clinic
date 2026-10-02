import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Printer, CheckCircle2, ArrowLeft } from 'lucide-react';

const ReceiptDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { organization } = useAuth();
  const { addToast } = useToast();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const data = await api.getReceiptById(id);
        setReceipt(data);
      } catch (err) {
        addToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading receipt...</div>;
  }

  if (!receipt) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Receipt not found.</div>;
  }

  const { patient, invoice, payment } = receipt;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px' }}>Receipt {receipt.receiptNumber}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Official Payment Acknowledgment</p>
        </div>

        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Printer size={16} /> Print Receipt
        </button>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '36px', background: '#ffffff', border: '1px solid #cbd5e1' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--primary-dark)', fontWeight: 800 }}>
            {organization?.name || 'Apex Healthcare'}
          </h2>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Multi-Specialty Healthcare Centre • Phone: {organization?.phone || '+91 98765 43210'}
          </div>
          <div style={{ marginTop: '12px', display: 'inline-block', background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700 }}>
            PAYMENT RECEIPT
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Receipt Number:</span>
            <strong style={{ color: 'var(--primary)' }}>{receipt.receiptNumber}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Date & Time:</span>
            <strong>{new Date(receipt.issuedAt).toLocaleString('en-IN')}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Patient Name:</span>
            <strong>{patient?.name} ({patient?.patientNumber})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Invoice Reference:</span>
            <strong>{invoice?.invoiceNumber}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Payment Mode:</span>
            <strong style={{ textTransform: 'uppercase' }}>{receipt.method}</strong>
          </div>
          {payment?.reference && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Transaction Reference / UTR:</span>
              <strong>{payment.reference}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '6px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800 }}>Amount Paid:</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>₹{receipt.amount}</span>
          </div>
        </div>

        {/* Attached Medical Prescription & Clinical Summary */}
        {(receipt.prescription || receipt.clinicalRecord || receipt.doctor) && (
          <div style={{ marginBottom: '24px', borderTop: '2px dashed #cbd5e1', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 800 }}>
                  OFFICIAL MEDICAL PRESCRIPTION (Rx)
                </div>
                <h4 style={{ fontSize: '16px', color: '#0f172a', fontWeight: 800, margin: '2px 0 0 0' }}>
                  {receipt.branch?.name || organization?.name || 'Apex Healthcare Centre'}
                </h4>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  {receipt.branch?.address?.street ? `${receipt.branch.address.street}, ` : ''}{receipt.branch?.address?.city || 'Bhopal'} • Phone: {receipt.branch?.phone || organization?.phone || '+91 98765 43210'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  {receipt.doctor?.name || 'Consulting Doctor'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: 600 }}>
                  {receipt.doctor?.designation || 'Physician'} {receipt.doctor?.specialty ? `• ${receipt.doctor.specialty}` : ''}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                  Reg: <strong>{receipt.doctor?.licenseNumber || 'MP-MED-2024-REG'}</strong>
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            {receipt.clinicalRecord?.diagnosis && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#166534', fontWeight: 800 }}>Diagnosis:</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#14532d', marginTop: '2px' }}>
                  {receipt.clinicalRecord.diagnosis}
                </div>
              </div>
            )}

            {/* Medicines List */}
            {receipt.prescription && receipt.prescription.items?.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '6px' }}>
                  Rx — Prescribed Medicines:
                </div>
                <div className="table-responsive">
                  <table className="data-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th>Medicine</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Timing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.prescription.items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700 }}>{item.medicineName}</td>
                          <td>{item.dosage || '1 tab'}</td>
                          <td><span className="badge badge-info" style={{ fontSize: '10.5px' }}>{item.frequency}</span></td>
                          <td>{item.duration}</td>
                          <td>{item.timing || 'After food'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Instructions & Follow-up */}
            <div style={{ display: 'grid', gridTemplateColumns: receipt.followUp ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '14px' }}>
              {(receipt.prescription?.notes || receipt.clinicalRecord?.notes) && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#92400e', fontWeight: 800 }}>Instructions:</div>
                  <div style={{ fontSize: '12px', color: '#78350f', marginTop: '2px', whiteSpace: 'pre-wrap' }}>
                    {receipt.prescription?.notes || receipt.clinicalRecord?.notes}
                  </div>
                </div>
              )}

              {receipt.followUp && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#1e40af', fontWeight: 800 }}>Next Follow-up:</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>
                    {new Date(receipt.followUp.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {receipt.followUp.reason && (
                    <div style={{ fontSize: '11.5px', color: '#3b82f6', marginTop: '2px' }}>
                      {receipt.followUp.reason}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px dashed #cbd5e1', paddingTop: '24px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Authorized Signatory / Cashier<br />
            Apex Healthcare Management System
          </div>
          <div style={{ width: '120px', borderBottom: '1px solid #94a3b8', height: '30px' }} />
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetailPage;
