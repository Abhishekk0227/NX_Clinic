import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Printer } from 'lucide-react';

const BatchPrintPage = () => {
  const [searchParams] = useSearchParams();
  const invoiceIds = searchParams.get('invoices')?.split(',') || [];
  const [invoicesData, setInvoicesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { organization } = useAuth();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (invoiceIds.length === 0) {
          setLoading(false);
          return;
        }
        
        const promises = invoiceIds.map(id => api.getInvoiceById(id).catch(() => null));
        const results = await Promise.all(promises);
        setInvoicesData(results.filter(Boolean));
        
        // Auto-print when loaded
        setTimeout(() => {
          window.print();
        }, 800);
      } catch (err) {
        console.error('Batch fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [invoiceIds.join(',')]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Preparing documents for printing...</div>;
  }

  if (invoicesData.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>No valid invoices found to print.</div>;
  }

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>
      <div className="no-print" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> Print All Documents
        </button>
        <p style={{ marginTop: '10px', color: '#64748b' }}>If the print dialog did not open automatically, click the button above.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
        {invoicesData.map((data, index) => {
          const { patient, invoice } = data;
          
          return (
            <React.Fragment key={index}>
              {/* PAGE 1: BILL / RECEIPT */}
              <div className="card print-page" style={{ width: '100%', maxWidth: '800px', padding: '36px', background: '#ffffff', border: '1px solid #cbd5e1', pageBreakAfter: 'always', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>{invoice.branch?.name || organization?.name || 'Apex Healthcare'}</h2>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                    {invoice.branch?.address?.city || 'Bhopal'} • Phone: {invoice.branch?.phone || organization?.phone || '+91 98765 43210'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 900 }}>TAX INVOICE / RECEIPT</div>
                    <div style={{ color: '#0284c7', fontWeight: 700 }}>{invoice.invoiceNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px' }}>Date: <strong>{new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString('en-IN')}</strong></div>
                    <div style={{ fontSize: '13px' }}>Status: <strong>{invoice.status.toUpperCase()}</strong></div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>BILLED TO:</div>
                    <div style={{ fontWeight: 800, fontSize: '15px' }}>{patient?.name}</div>
                    <div>Patient ID: {patient?.patientNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>DOCTOR:</div>
                    <div><strong>Dr. {invoice.doctor?.name || 'Medical Officer'}</strong></div>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Description</th>
                      <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Qty</th>
                      <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #e2e8f0' }}>Rate</th>
                      <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #e2e8f0' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: 600 }}>{item.description}</td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>₹{item.unitPrice}</td>
                        <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700 }}>₹{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '250px', fontSize: '13px', background: '#f8fafc', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Subtotal:</span><span>₹{invoice.subtotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '15px', borderTop: '1px solid #cbd5e1', paddingTop: '4px', marginTop: '4px' }}>
                      <span>Total:</span><span>₹{invoice.total}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 700, marginTop: '4px' }}>
                      <span>Paid:</span><span>₹{invoice.paidAmount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 2: PRESCRIPTION (If available) */}
              {(invoice.prescription || invoice.clinicalRecord) && (
                <div className="card print-page" style={{ width: '100%', maxWidth: '800px', padding: '36px', background: '#ffffff', border: '1.5px solid #0f172a', pageBreakAfter: 'always', margin: '0 auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>{invoice.branch?.name || organization?.name || 'Apex Healthcare'}</h2>
                      <div style={{ fontSize: '12px', color: '#475569' }}>{invoice.branch?.address?.city || 'Bhopal'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900 }}>Dr. {invoice.doctor?.name || 'Physician'}</div>
                      <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700 }}>{invoice.doctor?.specialty || 'General'}</div>
                      <div style={{ fontSize: '11px' }}>Date: {new Date(invoice.issuedAt || invoice.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '20px', fontSize: '13px' }}>
                    <div>
                      <strong>Patient:</strong> {patient?.name} (ID: {patient?.patientNumber})
                    </div>
                    <div>
                      <strong>Age/Gender:</strong> {patient?.age || '-'}y / {patient?.gender}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 16px 0' }}>Rx</h3>

                  {invoice.clinicalRecord?.diagnosis && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>DIAGNOSIS:</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{invoice.clinicalRecord.diagnosis}</div>
                    </div>
                  )}

                  {invoice.prescription?.items?.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Medicine / Drug</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Dosage & Frequency</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.prescription.items.map((med, midx) => (
                          <tr key={midx}>
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>{med.medicineName}</td>
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>{med.dosage} • {med.frequency} <br/><span style={{ fontSize: '11px', color: '#64748b' }}>{med.timing}</span></td>
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 600 }}>{med.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {invoice.prescription?.notes && (
                    <div style={{ marginTop: '20px', padding: '12px', background: '#fef3c7', borderRadius: '4px', borderLeft: '4px solid #f59e0b', fontSize: '13px' }}>
                      <strong>Advice / Notes:</strong><br/>
                      {invoice.prescription.notes}
                    </div>
                  )}
                  
                  <div style={{ marginTop: '60px', textAlign: 'right' }}>
                    <div style={{ borderBottom: '1px solid #000', width: '200px', marginLeft: 'auto', marginBottom: '8px' }}></div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>Doctor's Signature</div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default BatchPrintPage;
