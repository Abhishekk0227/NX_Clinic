import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import Modal from '../../components/Modal';
import {
  Stethoscope,
  Save,
  CheckCircle2,
  Plus,
  Pill,
  Trash2,
  AlertCircle,
  FileText,
  Activity,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  HeartPulse,
  Clock
} from 'lucide-react';

const ClinicalWorkspace = () => {
  const { id } = useParams(); // Encounter ID
  const navigate = useNavigate();
  const { user, branch } = useAuth();
  const { addToast } = useToast();

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Clinical record form state
  const [record, setRecord] = useState({
    complaint: '',
    vitals: {
      bpSystolic: '',
      bpDiastolic: '',
      pulse: '',
      temperature: '',
      weightKg: '',
      heightCm: '',
      spo2: ''
    },
    history: '',
    examination: '',
    diagnosis: '',
    notes: ''
  });

  // Dynamic Form Submission values state
  const [selectedForm, setSelectedForm] = useState(null);
  const [dynamicFormValues, setDynamicFormValues] = useState({});

  // Treatments & Prescriptions state
  const [treatments, setTreatments] = useState([]);
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Previous Visits History Index (0 = most recent previous visit)
  const [selectedPrevIndex, setSelectedPrevIndex] = useState(0);

  // Add Treatment Modal
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    name: '',
    serviceId: '',
    toothNumber: '',
    procedureDetails: '',
    cost: 0
  });

  // Add Medicine Modal
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [medicineForm, setMedicineForm] = useState({
    medicineName: '',
    dosage: '1 tablet',
    frequency: '1-0-1',
    duration: '5 days',
    timing: 'After meals',
    instructions: ''
  });

  const [servicesList, setServicesList] = useState([]);
  const [configuredVitals, setConfiguredVitals] = useState([]);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const data = await api.getEncounterWorkspace(id);
      setWorkspace(data);

      if (data.clinicalRecord) {
        setRecord({
          complaint: data.clinicalRecord.complaint || '',
          vitals: data.clinicalRecord.vitals || {},
          history: data.clinicalRecord.history || '',
          examination: data.clinicalRecord.examination || '',
          diagnosis: data.clinicalRecord.diagnosis || '',
          notes: data.clinicalRecord.notes || ''
        });
      }

      setTreatments(data.treatments || []);
      setPrescriptionItems(data.prescription?.items || []);
      setPrescriptionNotes(data.prescription?.notes || '');
      setDynamicFormValues(data.formSubmission || {});

      if (data.followUp) {
        if (data.followUp.scheduledDate) {
          const d = new Date(data.followUp.scheduledDate);
          const isoString = d.toISOString().slice(0, 16);
          setFollowUpDate(isoString);
        }
        setFollowUpNotes(data.followUp.reason || data.followUp.notes || '');
      }

      // Auto-select specialty form
      if (data.availableForms && data.availableForms.length > 0) {
        const dentalForm = data.availableForms.find((f) => f.key === 'dental-examination');
        setSelectedForm(dentalForm || data.availableForms[0]);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
    api.getServices().then((svcs) => setServicesList(svcs || [])).catch(() => {});
    api.getVitalParams({ status: 'active' }).then((vts) => setConfiguredVitals(vts || [])).catch(() => {});
  }, [id]);

  const [autoSaving, setAutoSaving] = useState(false);
  const isInitialMount = React.useRef(true);
  const recordRef = React.useRef(record);
  recordRef.current = record;

  // Real-time Auto-Save with debounce (800ms) whenever Doctor types Vitals, Complaint, Diagnosis or Notes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!id || loading) return;

    setAutoSaving(true);
    const timer = setTimeout(async () => {
      try {
        await api.saveClinicalRecord(id, { ...recordRef.current, status: 'draft' });
      } catch (err) {
        console.error('Auto-save error:', err);
      } finally {
        setAutoSaving(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [record, id]);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      // 1. Save Clinical Record
      await api.saveClinicalRecord(id, { ...record, status: 'draft' });

      // 2. Save Prescription
      await api.savePrescription({
        encounterId: id,
        items: prescriptionItems,
        notes: prescriptionNotes
      });

      // 3. Save Dynamic Form values if form is selected
      if (selectedForm && Object.keys(dynamicFormValues).length > 0) {
        await api.submitFormValues({
          formId: selectedForm.formId,
          entityType: 'clinical-record',
          entityId: id,
          values: dynamicFormValues
        });
      }

      addToast('Clinical consultation draft saved successfully!', 'success');
      // Do not refetch full workspace to prevent overriding active input state
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteEncounter = async () => {
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
          reason: followUpNotes || 'Follow-up Consultation',
          notes: followUpNotes || '',
          branchId: workspace.encounter?.branchId || branch?.branchId,
          status: 'scheduled'
        });
      }

      // 5. Complete Encounter (triggers invoice generation and queue completion)
      const res = await api.completeEncounter(id);
      addToast('Encounter completed! Invoice generated.', 'success');

      const invoiceId = res?.invoice?.invoiceId || res?.data?.invoice?.invoiceId;
      if (invoiceId) {
        navigate(`/billing/invoices/${invoiceId}`);
      } else {
        navigate('/queue');
      }
    } catch (err) {
      addToast(err.message || 'Error completing encounter', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTreatment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addTreatment({
        encounterId: id,
        name: treatmentForm.name,
        serviceId: treatmentForm.serviceId,
        toothNumber: treatmentForm.toothNumber,
        procedureDetails: treatmentForm.procedureDetails,
        cost: parseFloat(treatmentForm.cost) || 0
      });
      addToast(`Added procedure: ${res.name}`, 'success');
      setIsTreatmentModalOpen(false);
      setTreatmentForm({ name: '', serviceId: '', toothNumber: '', procedureDetails: '', cost: 0 });
      fetchWorkspace();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAddMedicine = (e) => {
    e.preventDefault();
    setPrescriptionItems([...prescriptionItems, medicineForm]);
    setIsMedicineModalOpen(false);
    setMedicineForm({
      medicineName: '',
      dosage: '1 tablet',
      frequency: '1-0-1',
      duration: '5 days',
      timing: 'After meals',
      instructions: ''
    });
    addToast('Medicine added to prescription list', 'info', 2000);
  };

  const handleRemoveMedicine = (idx) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx));
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Clinical Workspace...</div>;
  }

  if (!workspace || !workspace.encounter) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Encounter record not found.</div>;
  }

  const { patient, encounter, provider, service, availableForms } = workspace;
  const isCompleted = encounter.status === 'completed';
  const isMr10 = encounter?.branchId === 'br_1b8ebeea30984a7a' || branch?.branchId === 'br_1b8ebeea30984a7a';

  return (
    <div>
      {/* Patient Header Banner */}
      <div className="patient-workspace-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 800,
            color: 'white'
          }}>
            {patient?.name?.charAt(0)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', color: 'white' }}>{patient?.name}</h2>
              <span className="badge badge-info" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 800 }}>
                {patient?.patientNumber}
              </span>
              <span className={`badge ${isCompleted ? 'badge-success' : 'badge-warning'}`}>
                {encounter.status.replace('_', ' ')}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '14px' }}>
              <span>Age/Gender: <strong>{patient?.age || 'N/A'} yrs / {patient?.gender}</strong></span>
              <span>Phone: <strong>{patient?.phone}</strong></span>
              <span>Blood Group: <strong>{patient?.bloodGroup || 'N/A'}</strong></span>
              <span>Doctor: <strong>Dr. {provider?.name}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {autoSaving && (
            <span style={{ fontSize: '12px', color: '#0284c7', background: '#e0f2fe', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#0284c7', animation: 'pulse 1.5s infinite' }}></span>
              Saving changes...
            </span>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            disabled={saving || isCompleted}
            onClick={handleSaveDraft}
          >
            <Save size={16} /> Save Draft
          </button>
          {!isCompleted && (
            <button
              type="button"
              className="btn btn-success"
              disabled={saving}
              onClick={handleCompleteEncounter}
            >
              <CheckCircle2 size={16} /> {encounter.paymentStatus === 'pending' ? 'Complete & Send to Billing' : 'Complete & Save'}
            </button>
          )}
        </div>
      </div>

      {/* Allergy Warning */}
      {patient?.allergies && patient.allergies.length > 0 && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #f87171',
          borderRadius: '8px',
          padding: '8px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#991b1b',
          fontSize: '12.5px',
          fontWeight: 700
        }}>
          <AlertCircle size={16} />
          <span>Patient Allergy Alert: {patient.allergies.join(', ')}</span>
        </div>
      )}

      {/* Clinical Workspace Master 2-Column Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: COMPLETE PREVIOUS VISIT HISTORY & LONGITUDINAL PATIENT TIMELINE */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="card" style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', padding: '20px', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
            {/* Previous Visit History Title & Navigation Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px', gap: '12px', minHeight: '48px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '15.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, margin: 0 }}>
                  <Clock size={18} color="var(--primary)" style={{ flexShrink: 0 }} /> Previous Visit History & Longitudinal Record
                </h3>
                <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', marginBottom: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {workspace.previousVisits && workspace.previousVisits.length > 0
                    ? `Total: ${workspace.previousVisits.length} Past Visits • Active: Visit #${workspace.previousVisits.length - selectedPrevIndex} (${new Date(workspace.previousVisits[selectedPrevIndex]?.startedAt).toLocaleDateString('en-IN')})`
                    : 'No prior clinical consultations recorded for this patient.'}
                </p>
              </div>

              {/* Multi-Visit Selector Buttons */}
              {workspace.previousVisits && workspace.previousVisits.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
                  {workspace.previousVisits.map((v, idx) => {
                    const isSelected = selectedPrevIndex === idx;
                    return (
                      <button
                        key={v.encounterId}
                        type="button"
                        className="btn btn-sm"
                        style={{
                          padding: '5px 12px',
                          fontSize: '12px',
                          fontWeight: isSelected ? 800 : 600,
                          background: isSelected ? 'var(--primary)' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#334155',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease, border-color 0.15s ease',
                          boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                        onClick={() => setSelectedPrevIndex(idx)}
                        title={`Visit on ${new Date(v.startedAt).toLocaleDateString('en-IN')}`}
                      >
                        Visit #{workspace.previousVisits.length - idx} {idx === 0 ? '(Latest)' : ''}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {(!workspace.previousVisits || workspace.previousVisits.length === 0) ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', background: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <Stethoscope size={36} color="#94a3b8" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                <div style={{ fontWeight: 700, color: '#334155', fontSize: '14px' }}>First-Time Patient Visit</div>
                <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                  This patient has no completed prior consultations on record. Future consultation records will automatically show here.
                </p>
              </div>
            ) : (() => {
              const activePrev = workspace.previousVisits[selectedPrevIndex] || workspace.previousVisits[0];

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* 1. Visit Metadata & Doctor Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '12.5px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Visit Date & Time:</span><br />
                      <strong style={{ color: '#0f172a' }}>{new Date(activePrev.startedAt).toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Consulting Doctor:</span><br />
                      <strong style={{ color: 'var(--primary)' }}>Dr. {activePrev.doctor?.name || 'Physician'}</strong>
                      {activePrev.doctor?.specialty && <span style={{ fontSize: '11px', color: '#64748b' }}> ({activePrev.doctor.specialty})</span>}
                    </div>
                  </div>

                  {/* 2. Previous Chief Complaint / Symptoms */}
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#92400e', fontWeight: 800 }}>
                      Previous Chief Complaint & Patient Symptoms:
                    </div>
                    <div style={{ fontSize: '13px', color: '#78350f', marginTop: '3px', fontWeight: 500 }}>
                      {activePrev.clinicalRecord?.complaint || 'No complaints logged for this visit.'}
                    </div>
                  </div>

                  {/* 3. Previous Vitals */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: 800, marginBottom: '6px' }}>
                      Previous Recorded Vitals:
                    </div>
                    {activePrev.clinicalRecord?.vitals && (activePrev.clinicalRecord.vitals.bpSystolic || activePrev.clinicalRecord.vitals.pulse || activePrev.clinicalRecord.vitals.temperature || activePrev.clinicalRecord.vitals.weightKg || activePrev.clinicalRecord.vitals.spo2) ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px' }}>
                        {(activePrev.clinicalRecord.vitals.bpSystolic || activePrev.clinicalRecord.vitals.bpDiastolic) && (
                          <span className="badge badge-neutral" style={{ padding: '5px 9px' }}>
                            BP: <strong>{activePrev.clinicalRecord.vitals.bpSystolic || '—'}/{activePrev.clinicalRecord.vitals.bpDiastolic || '—'} mmHg</strong>
                          </span>
                        )}
                        {activePrev.clinicalRecord.vitals.pulse && (
                          <span className="badge badge-neutral" style={{ padding: '5px 9px' }}>
                            Pulse: <strong>{activePrev.clinicalRecord.vitals.pulse} bpm</strong>
                          </span>
                        )}
                        {activePrev.clinicalRecord.vitals.temperature && (
                          <span className="badge badge-neutral" style={{ padding: '5px 9px' }}>
                            Temp: <strong>{activePrev.clinicalRecord.vitals.temperature} °F</strong>
                          </span>
                        )}
                        {activePrev.clinicalRecord.vitals.spo2 && (
                          <span className="badge badge-neutral" style={{ padding: '5px 9px' }}>
                            SpO2: <strong>{activePrev.clinicalRecord.vitals.spo2} %</strong>
                          </span>
                        )}
                        {activePrev.clinicalRecord.vitals.weightKg && (
                          <span className="badge badge-neutral" style={{ padding: '5px 9px' }}>
                            Weight: <strong>{activePrev.clinicalRecord.vitals.weightKg} kg</strong>
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>No vitals recorded for this visit.</div>
                    )}
                  </div>

                  {/* 4. Previous Doctor Diagnosis & Detailed Clinical Notes */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#166534', fontWeight: 800 }}>
                      Previous Doctor Diagnosis & Clinical Notes:
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#14532d', marginTop: '3px' }}>
                      {activePrev.clinicalRecord?.diagnosis || 'General Clinical Evaluation'}
                    </div>
                    {activePrev.clinicalRecord?.notes && (
                      <div style={{ fontSize: '12.5px', color: '#166534', marginTop: '6px', whiteSpace: 'pre-wrap', background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                        {activePrev.clinicalRecord.notes}
                      </div>
                    )}
                  </div>

                  {/* 5. Previous Procedures & Treatments Done */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: 800, marginBottom: '6px' }}>
                      Previous Procedures & Treatments Done:
                    </div>
                    {activePrev.treatments && activePrev.treatments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {activePrev.treatments.map((t, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                            <div>
                              <strong style={{ color: '#0f172a' }}>{t.name}</strong>
                              {t.toothNumber && <span style={{ color: '#64748b', marginLeft: '6px' }}>({t.toothNumber})</span>}
                            </div>
                            <span style={{ fontWeight: 700, color: '#15803d' }}>₹{t.cost || 0}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>No specific procedures logged.</div>
                    )}
                  </div>

                  {/* 6. Previous Prescription (Rx) */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: 800, marginBottom: '6px' }}>
                      Previous Prescription (Rx):
                    </div>
                    {activePrev.prescription?.items && activePrev.prescription.items.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {activePrev.prescription.items.map((med, idx) => (
                          <div key={idx} style={{ fontSize: '12px', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{med.medicineName}</span>
                            <span style={{ color: '#64748b', marginLeft: '6px' }}>
                              ({med.dosage || '1 tab'} • {med.frequency} • {med.duration} • {med.timing})
                            </span>
                            {med.instructions && <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '2px' }}>{med.instructions}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>No medicines prescribed in this visit.</div>
                    )}
                    {activePrev.prescription?.notes && (
                      <div style={{ fontSize: '11.5px', color: '#78350f', background: '#fffbeb', padding: '6px 8px', borderRadius: '4px', marginTop: '6px' }}>
                        <strong>Rx Notes:</strong> {activePrev.prescription.notes}
                      </div>
                    )}
                  </div>

                  {/* 7. Previous Follow-Up & Previous Bills */}
                  <div style={{ display: 'grid', gridTemplateColumns: activePrev.followUp && activePrev.bill ? '1fr 1fr' : '1fr', gap: '8px' }}>
                    {activePrev.followUp && (
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px 10px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '11px', textTransform: 'uppercase' }}>Previous Follow-up:</div>
                        <div style={{ color: '#1e3a8a', fontWeight: 700, marginTop: '2px' }}>
                          {new Date(activePrev.followUp.scheduledDate).toLocaleDateString('en-IN')}
                        </div>
                        {activePrev.followUp.reason && <div style={{ color: '#3b82f6', fontSize: '11px', marginTop: '2px' }}>{activePrev.followUp.reason}</div>}
                      </div>
                    )}

                    {activePrev.bill && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 10px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 800, color: '#166534', fontSize: '11px', textTransform: 'uppercase' }}>Previous Bill:</div>
                        <div style={{ color: '#15803d', fontWeight: 700, marginTop: '2px' }}>
                          {activePrev.bill.invoiceNumber} (₹{activePrev.bill.total})
                        </div>
                        <div style={{ color: '#16a34a', fontSize: '11px', textTransform: 'capitalize', marginTop: '2px' }}>
                          Status: <strong>{activePrev.bill.status}</strong> {activePrev.bill.balance > 0 ? `(Bal: ₹${activePrev.bill.balance})` : '(Paid)'}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: CURRENT VISIT CONSULTATION ENTRY, VITALS, RX & PROCEDURES    */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 1. Chief Complaint / Registered Symptoms */}
          <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <h3 style={{ fontSize: '14.5px', marginBottom: '8px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} color="#d97706" /> Current Chief Complaint / Patient Symptoms
            </h3>
            <p style={{ fontSize: '11.5px', color: '#b45309', marginBottom: '10px' }}>
              Symptoms & reason for visit captured during registration or clinical entry:
            </p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea
                rows={3}
                className="form-textarea"
                style={{ background: '#ffffff', borderColor: '#fcd34d' }}
                disabled={isCompleted}
                placeholder="Describe chief complaint, symptoms, or reason for visit..."
                value={record.complaint}
                onChange={(e) => setRecord({ ...record, complaint: e.target.value })}
              />
            </div>
          </div>

          {/* 2. Current Patient Vitals Examination */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} color="var(--primary)" /> Patient Vitals Examination
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Live Triage & Doctor Vitals</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
              {(configuredVitals && configuredVitals.length > 0 ? configuredVitals : [
                { key: 'bpSystolic', name: 'BP Systolic', unit: 'mmHg', inputType: 'numeric', normalRange: '90-120' },
                { key: 'bpDiastolic', name: 'BP Diastolic', unit: 'mmHg', inputType: 'numeric', normalRange: '60-80' },
                { key: 'pulse', name: 'Pulse', unit: 'bpm', inputType: 'numeric', normalRange: '60-100' },
                { key: 'temperature', name: 'Temp', unit: '°F', inputType: 'decimal', normalRange: '97-99' },
                { key: 'weightKg', name: 'Weight', unit: 'kg', inputType: 'decimal' },
                { key: 'spo2', name: 'SpO2', unit: '%', inputType: 'numeric', normalRange: '95-100' }
              ]).map((param) => {
                const val = record.vitals?.[param.key] || '';
                return (
                  <div key={param.key} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={param.name}>
                      {param.name} {param.unit ? `(${param.unit})` : ''} {param.isMandatory ? '*' : ''}
                    </label>
                    <input
                      type={param.inputType === 'numeric' || param.inputType === 'decimal' ? 'number' : 'text'}
                      step={param.inputType === 'decimal' ? '0.1' : undefined}
                      min={param.minVal}
                      max={param.maxVal}
                      placeholder={param.normalRange ? param.normalRange.split(' ')[0] : '—'}
                      className="form-input"
                      disabled={isCompleted}
                      value={val}
                      onChange={(e) => setRecord({
                        ...record,
                        vitals: { ...record.vitals, [param.key]: e.target.value }
                      })}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Current Doctor Diagnosis & Detailed Clinical Notes */}
          <div className="card">
            <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Doctor Diagnosis & Detailed Clinical Notes</h3>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-main)' }}>Primary Doctor Diagnosis *</label>
              <input
                type="text"
                className="form-input"
                disabled={isCompleted}
                placeholder="e.g. Acute Viral Bronchitis, Dental Caries with Pulpitis, etc."
                value={record.diagnosis}
                onChange={(e) => setRecord({ ...record, diagnosis: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Clinical Examination Findings & Medical Advice</label>
              <textarea
                rows={4}
                className="form-textarea"
                disabled={isCompleted}
                placeholder="Clinical observations, physical examination notes, investigation remarks, and dietary/lifestyle advice..."
                value={record.notes}
                onChange={(e) => setRecord({ ...record, notes: e.target.value })}
              />
            </div>
          </div>

          {/* 4. Procedures & Treatments Done */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: '15px' }}>Procedures & Treatments Done</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Billable procedures attached to visit</p>
              </div>
              {!isCompleted && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsTreatmentModalOpen(true)}
                >
                  <Plus size={14} /> Add Procedure
                </button>
              )}
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Procedure / Treatment</th>
                    <th>Fee</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {treatments.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No procedures added yet.</td></tr>
                  ) : (
                    treatments.map((t) => (
                      <tr key={t.treatmentId}>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td style={{ fontWeight: 600 }}>₹{t.cost || 0}</td>
                        <td><span className="badge badge-success">{t.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Prescriptions (Rx) */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: '15px' }}>Prescription (Rx)</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Medicines prescribed for this visit</p>
              </div>
              {!isCompleted && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsMedicineModalOpen(true)}
                >
                  <Plus size={14} /> Add Medicine
                </button>
              )}
            </div>

            {prescriptionItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px', fontSize: '13px' }}>
                No medicines prescribed yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {prescriptionItems.map((med, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{med.medicineName}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {med.dosage} • {med.frequency} • {med.duration} • {med.timing}
                      </div>
                      {med.instructions && <div style={{ fontSize: '11px', color: '#0369a1' }}>{med.instructions}</div>}
                    </div>

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Next Appointment / Follow Up */}
          <div className="card">
            <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Next Appointment (Follow-Up)</h3>
            <div className="form-row">
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
            )}
          </div>

        </div>

      </div>

      {/* Add Treatment Modal */}
      <Modal
        isOpen={isTreatmentModalOpen}
        onClose={() => setIsTreatmentModalOpen(false)}
        title="Add Procedure / Treatment"
        maxWidth="500px"
      >
        <form onSubmit={handleAddTreatment} autoComplete="off">
          <div className="form-group">
            <label className="form-label">Select Standard Service</label>
            <select
              className="form-select"
              value={treatmentForm.serviceId}
              onChange={(e) => {
                const svc = servicesList.find((s) => s.serviceId === e.target.value);
                setTreatmentForm({
                  ...treatmentForm,
                  serviceId: e.target.value,
                  name: svc ? svc.name : treatmentForm.name,
                  cost: svc ? svc.price : treatmentForm.cost
                });
              }}
            >
              <option value="">Custom Procedure / Select Service...</option>
              {servicesList.map((s) => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.name} (₹{s.price})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Procedure / Treatment Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Wound Dressing, Root Canal Treatment, Blood Test, etc."
              value={treatmentForm.name}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Procedure Fee (₹) *</label>
            <input
              type="number"
              required
              className="form-input"
              placeholder="0"
              value={treatmentForm.cost}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, cost: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Clinical / Procedure Notes</label>
            <textarea
              rows={2}
              className="form-textarea"
              placeholder="Access opening, canals prepared, dressing details..."
              value={treatmentForm.procedureDetails}
              onChange={(e) => setTreatmentForm({ ...treatmentForm, procedureDetails: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsTreatmentModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Record Treatment
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Medicine Modal */}
      <Modal
        isOpen={isMedicineModalOpen}
        onClose={() => setIsMedicineModalOpen(false)}
        title="Prescribe Medicine"
        maxWidth="500px"
      >
        <form onSubmit={handleAddMedicine} autoComplete="off">
          <div className="form-group">
            <label className="form-label">Medicine Name & Strength *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Tab. Amoxicillin 500mg"
              value={medicineForm.medicineName}
              onChange={(e) => setMedicineForm({ ...medicineForm, medicineName: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Dosage</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 1 tablet / 5ml"
                value={medicineForm.dosage}
                onChange={(e) => setMedicineForm({ ...medicineForm, dosage: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select
                className="form-select"
                value={medicineForm.frequency}
                onChange={(e) => setMedicineForm({ ...medicineForm, frequency: e.target.value })}
              >
                <option value="1-0-1">1-0-1 (Twice daily)</option>
                <option value="1-1-1">1-1-1 (Thrice daily)</option>
                <option value="1-0-0">1-0-0 (Morning only)</option>
                <option value="0-0-1">0-0-1 (Night only)</option>
                <option value="1-0-1 (SOS)">SOS (When needed)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 5 days / 7 days"
                value={medicineForm.duration}
                onChange={(e) => setMedicineForm({ ...medicineForm, duration: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Timing</label>
              <select
                className="form-select"
                value={medicineForm.timing}
                onChange={(e) => setMedicineForm({ ...medicineForm, timing: e.target.value })}
              >
                <option value="After meals">After meals</option>
                <option value="Before meals">Before meals</option>
                <option value="With water">With water</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Special Instructions</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Complete full course, do not chew"
              value={medicineForm.instructions}
              onChange={(e) => setMedicineForm({ ...medicineForm, instructions: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsMedicineModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add to Rx
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClinicalWorkspace;
