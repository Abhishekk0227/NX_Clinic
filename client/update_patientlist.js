const fs = require('fs');

let content = fs.readFileSync('./src/pages/Patients/PatientList.jsx', 'utf8');

// Update patientForm state
content = content.replace(
  /serviceId: '', paymentStatus: 'paid', scheduledStart: ''/,
  "serviceIds: [], paymentStatus: 'paid', scheduledStart: '', billingDetails: { discount: 0, paidAmount: '' }"
);

// Update Modal Form UI
const oldServiceSelect = <div className=\"form-group\">
                <label className=\"form-label\">Service (Optional)</label>
                <select className=\"form-select\" value={patientForm.serviceId} onChange={(e) => setPatientForm({ ...patientForm, serviceId: e.target.value })}>
                  <option value=\"\">General Consultation</option>
                  {servicesList.map((svc) => (
                    <option key={svc.serviceId} value={svc.serviceId}>{svc.name} - ?{svc.price}</option>
                  ))}
                </select>
              </div>;

const newServiceSelectAndBilling = <div className=\"form-group\">
                <label className=\"form-label\">Services (Optional)</label>
                <select multiple className=\"form-select\" style={{ height: '80px' }} value={patientForm.serviceIds} onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions);
                  setPatientForm({ ...patientForm, serviceIds: options.map(o => o.value) });
                }}>
                  {servicesList.map((svc) => (
                    <option key={svc.serviceId} value={svc.serviceId}>{svc.name} - ?{svc.price}</option>
                  ))}
                </select>
                <small style={{ color: '#64748b' }}>Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>

            {/* Billing Summary Section */}
            {(patientForm.actionType === 'walkin' || patientForm.paymentStatus === 'paid') && (
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#334155' }}>Billing Summary</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                  <span>Doctor Fee:</span>
                  <span>?{staffList.find(s => s.staffId === patientForm.providerId)?.consultationFee || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                  <span>Services Fee:</span>
                  <span>?{patientForm.serviceIds.reduce((sum, id) => sum + (servicesList.find(s => s.serviceId === id)?.price || 0), 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', alignItems: 'center' }}>
                  <span>Discount:</span>
                  <input type="number" className="form-input" style={{ width: '80px', padding: '4px', fontSize: '12px' }} value={patientForm.billingDetails?.discount || ''} onChange={(e) => setPatientForm({...patientForm, billingDetails: {...patientForm.billingDetails, discount: Number(e.target.value)}})} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginBottom: '8px' }}>
                  <span>Final Price:</span>
                  <span>?{Math.max(0, (staffList.find(s => s.staffId === patientForm.providerId)?.consultationFee || 0) + patientForm.serviceIds.reduce((sum, id) => sum + (servicesList.find(s => s.serviceId === id)?.price || 0), 0) - (patientForm.billingDetails?.discount || 0))}</span>
                </div>
                
                {patientForm.paymentStatus === 'paid' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 'bold', color: '#15803d' }}>
                    <span>Amount Paid (Advance):</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>?</span>
                      <input type="number" required className="form-input" style={{ width: '90px', padding: '4px' }} value={patientForm.billingDetails?.paidAmount || ''} onChange={(e) => setPatientForm({...patientForm, billingDetails: {...patientForm.billingDetails, paidAmount: Number(e.target.value)}})} placeholder="e.g. 500" />
                    </div>
                  </div>
                )}
              </div>
            )};

content = content.replace(oldServiceSelect + "\n            </div>", newServiceSelectAndBilling);

// Update handleCreatePatient to include generateInvoice flag
content = content.replace(
  /const payload = \{ ...patientForm \};/,
  "const payload = { ...patientForm, billingDetails: { ...patientForm.billingDetails, generateInvoice: true } };"
);

fs.writeFileSync('./src/pages/Patients/PatientList.jsx', content, 'utf8');
console.log('PatientList.jsx updated');
