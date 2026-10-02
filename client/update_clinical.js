const fs = require('fs');

let content = fs.readFileSync('./src/pages/Clinical/ClinicalWorkspace.jsx', 'utf8');

// 1. Add state for followUp
content = content.replace(
  "const [prescriptionNotes, setPrescriptionNotes] = useState('');",
  "const [prescriptionNotes, setPrescriptionNotes] = useState('');\n  const [followUpDate, setFollowUpDate] = useState('');\n  const [followUpNotes, setFollowUpNotes] = useState('');"
);

// 2. Update handleCompleteEncounter
const newCompleteLogic =   const handleCompleteEncounter = async () => {
    setSaving(true);
    try {
      // 1. Finalize Clinical Record
      await api.saveClinicalRecord(id, { ...record, status: 'finalized' });

      // 2. Save Prescription
      await api.savePrescription({
        encounterId: id,
        items: prescriptionItems,
        notes: prescriptionNotes
      });

      // 3. Save Dynamic Form values
      if (selectedForm && Object.keys(dynamicFormValues).length > 0) {
        await api.submitFormValues({
          formId: selectedForm.formId,
          entityType: 'clinical-record',
          entityId: id,
          values: dynamicFormValues
        });
      }

      // 4. Create FollowUp if provided
      if (followUpDate) {
        await api.createFollowUp({
          patientId: workspace.patient.patientId,
          encounterId: id,
          providerId: workspace.provider.staffId,
          scheduledDate: followUpDate,
          notes: followUpNotes,
          status: 'scheduled'
        });
      }

      // 5. Complete Encounter (triggers invoice generation and queue completion)
      const res = await api.completeEncounter(id);
      addToast('Encounter completed! Invoice generated.', 'success');

      const invoiceId = res?.invoice?.invoiceId || res?.data?.invoice?.invoiceId;
      if (invoiceId) {
        navigate(\/billing/invoices/\\);
      } else {
        navigate('/queue');
      }
    } catch (err) {
      addToast(err.message || 'Error completing encounter', 'error');
    } finally {
      setSaving(false);
    }
  };;

content = content.replace(
  /const handleCompleteEncounter = async \(\) => \{[\s\S]*?setSaving\(false\);\s*\}\s*\};\s*/,
  newCompleteLogic + "\n\n"
);

// 3. Update the Next Appointment section
const oldNextAppt = <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Follow-Up Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  disabled={isCompleted}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Purpose / Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. For extraction / regular checkup"
                  disabled={isCompleted}
                />
              </div>
            </div>;

const newNextAppt = <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Follow-Up Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  disabled={isCompleted}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Purpose / Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. For extraction / regular checkup"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  disabled={isCompleted}
                />
              </div>
            </div>
            
            {!isCompleted && (
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-success"
                  style={{ padding: '10px 24px', fontSize: '15px' }}
                  disabled={saving}
                  onClick={handleCompleteEncounter}
                >
                  <CheckCircle2 size={18} style={{ marginRight: '8px' }} /> 
                  {encounter.paymentStatus === 'pending' ? 'Complete & Send to Billing' : 'Complete & Save'}
                </button>
              </div>
            )};

content = content.replace(oldNextAppt, newNextAppt);

fs.writeFileSync('./src/pages/Clinical/ClinicalWorkspace.jsx', content, 'utf8');
console.log('ClinicalWorkspace.jsx updated');
