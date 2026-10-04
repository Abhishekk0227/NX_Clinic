import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import {
  User,
  Calendar,
  Clock,
  Stethoscope,
  Pill,
  CreditCard,
  FolderArchive,
  History,
  AlertCircle,
  Plus,
  CheckCircle2,
  FileText,
  Eye,
  IndianRupee,
  UserCheck,
  Edit2,
  Printer
} from 'lucide-react';

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { branch, hasPermission } = useAuth();
  const { addToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Edit Patient Details Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'male',
    bloodGroup: '',
    street: '',
    city: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    allergies: '',
    medicalHistory: ''
  });

  // Direct Book Appointment Modal State
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isBatchDownloadModalOpen, setIsBatchDownloadModalOpen] = useState(false);
  const [selectedBatchInvoices, setSelectedBatchInvoices] = useState([]);
  const [aptStaffList, setAptStaffList] = useState([]);
  const [aptServicesList, setAptServicesList] = useState([]);
  const [newlyBookedAptId, setNewlyBookedAptId] = useState(null);
  const [aptForm, setAptForm] = useState({
    providerId: '',
    serviceId: '',
    scheduledStart: '',
    durationMinutes: 15,
    reason: ''
  });

  const openEditModal = () => {
    if (!data?.patient) return;
    const p = data.patient;
    setEditForm({
      name: p.name || '',
      phone: p.phone || '',
      email: p.email || '',
      age: p.age || '',
      gender: p.gender || 'male',
      bloodGroup: p.bloodGroup || '',
      street: p.address?.street || '',
      city: p.address?.city || '',
      emergencyName: p.emergencyContact?.name || '',
      emergencyRelation: p.emergencyContact?.relation || '',
      emergencyPhone: p.emergencyContact?.phone || '',
      allergies: Array.isArray(p.allergies) ? p.allergies.join(', ') : (p.allergies || ''),
      medicalHistory: Array.isArray(p.medicalHistory) ? p.medicalHistory.join(', ') : (p.medicalHistory || '')
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    try {
      const cleanPhone = editForm.phone.replace(/\D/g, '').slice(0, 10);
      if (cleanPhone.length !== 10) {
        addToast('Please enter a valid 10-digit mobile number.', 'error');
        return;
      }

      const payload = {
        name: editForm.name,
        phone: cleanPhone,
        email: editForm.email,
        age: editForm.age ? parseInt(editForm.age) : undefined,
        gender: editForm.gender,
        bloodGroup: editForm.bloodGroup,
        address: {
          street: editForm.street,
          city: editForm.city
        },
        emergencyContact: {
          name: editForm.emergencyName,
          relation: editForm.emergencyRelation,
          phone: editForm.emergencyPhone
        },
        allergies: editForm.allergies ? editForm.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        medicalHistory: editForm.medicalHistory ? editForm.medicalHistory.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      await api.updatePatient(data.patient.patientId, payload);
      addToast('Patient details updated successfully!', 'success');
      setIsEditModalOpen(false);
      fetchPatientData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const res = await api.getPatientById(id);
      setData(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [staff, svcs] = await Promise.all([
          api.getStaff(),
          api.getServices()
        ]);
        setAptStaffList(staff || []);
        setAptServicesList(svcs || []);
      } catch (e) {
        // Non-blocking
      }
    };
    loadPrerequisites();
  }, []);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const handleCreateAppointmentFromProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createAppointment({
        ...aptForm,
        patientId: id,
        branchId: branch?.branchId,
        durationMinutes: parseInt(aptForm.durationMinutes) || 15
      });
      addToast(`Appointment scheduled successfully!`, 'success');
      setIsAppointmentModalOpen(false);
      const newId = res?.appointmentId || res?.data?.appointmentId;
      if (newId) {
        setNewlyBookedAptId(newId);
        setTimeout(() => setNewlyBookedAptId(null), 10000);
      }
      setAptForm({
        providerId: '',
        serviceId: '',
        scheduledStart: '',
        durationMinutes: 15,
        reason: ''
      });
      setActiveTab('appointments');
      fetchPatientData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading patient profile hub...</div>;
  }

  if (!data || !data.patient) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Patient record not found.</div>;
  }

  const { patient, hub } = data;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'appointments', label: `Appointments (${hub.appointments?.length || 0})`, icon: Calendar },
    { key: 'encounters', label: `Encounters (${hub.encounters?.length || 0})`, icon: Clock },
    { key: 'clinical', label: `Clinical Records (${hub.clinicalRecords?.length || 0})`, icon: Stethoscope },
    { key: 'treatments', label: `Treatments & Rx (${(hub.treatments?.length || 0) + (hub.prescriptions?.length || 0)})`, icon: Pill },
    { key: 'billing', label: `Billing & Payments (${hub.invoices?.length || 0})`, icon: CreditCard },
    { key: 'documents', label: `Documents (${hub.documents?.length || 0})`, icon: FolderArchive },
    { key: 'followups', label: `Scheduled Appointments (${hub.followups?.length || 0})`, icon: CheckCircle2 },
    { key: 'timeline', label: 'Timeline & History', icon: History }
  ];

  return (
    <div>
      {/* Patient Header Banner */}
      <div className="patient-workspace-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 800,
            color: 'white',
            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
          }}>
            {patient.name.charAt(0)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', color: 'white' }}>{patient.name}</h1>
              <span className="badge badge-info" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 800 }}>
                {patient.patientNumber}
              </span>
              <span className={`badge ${patient.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                {patient.status}
              </span>
            </div>

            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>Phone: <strong>{patient.phone}</strong></span>
              <span>Age/Gender: <strong>{patient.age || 'N/A'} yrs / {patient.gender}</strong></span>
              <span>Blood Group: <strong>{patient.bloodGroup || 'N/A'}</strong></span>
              <span>City: <strong>{patient.address?.city || 'Bhopal'}</strong></span>
            </div>
          </div>
        </div>

        {/* Actions & Balance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px 16px', borderRadius: '10px', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Balance Due</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: patient.balance > 0 ? '#f87171' : '#34d399' }}>
              ₹{patient.balance || 0}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', gap: '5px' }}
              onClick={openEditModal}
              title="Edit Patient Details"
            >
              <Edit2 size={14} /> Edit Details
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsAppointmentModalOpen(true)}
            >
              <Calendar size={14} /> Book Appointment
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/billing?patientId=${patient.patientId}&action=new_invoice`)}
            >
              <CreditCard size={14} /> Create Bill
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: '#fff', color: '#0f172a' }}
              onClick={() => setIsBatchDownloadModalOpen(true)}
            >
              <Printer size={14} /> Download Records
            </button>
          </div>
        </div>
      </div>

      {/* Allergy & Alert Banner if present */}
      {patient.allergies && patient.allergies.length > 0 && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #f87171',
          borderRadius: '10px',
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#991b1b',
          fontSize: '13px',
          fontWeight: 600
        }}>
          <AlertCircle size={18} />
          <span>Clinical Alert: Patient has documented allergies to: <strong>{patient.allergies.join(', ')}</strong></span>
        </div>
      )}

      {/* Tabs Header - 9 Comprehensive Tabs */}
      <div className="tabs-header">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={15} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '15px', margin: 0 }}>
                Personal & Contact Details
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px', padding: '3px 8px', gap: '4px' }}
                onClick={openEditModal}
              >
                <Edit2 size={13} /> Edit
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Full Name:</span> <strong>{patient.name}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Patient ID:</span> <strong>{patient.patientNumber}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> <strong>{patient.phone}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong>{patient.email || 'None'}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Address:</span> <strong>{patient.address?.street ? `${patient.address?.street}, ${patient.address?.city}` : (patient.address?.city || 'Not specified')}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Emergency Contact:</span> <strong>{patient.emergencyContact?.name ? `${patient.emergencyContact?.name} (${patient.emergencyContact?.relation || 'Contact'}) - ${patient.emergencyContact?.phone}` : 'None specified'}</strong></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '15px', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              Medical Profile
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Blood Group:</span> <strong>{patient.bloodGroup || 'Not specified'}</strong></div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Allergies:</span>{' '}
                {patient.allergies?.length > 0 ? (
                  <span className="badge badge-danger">{patient.allergies.join(', ')}</span>
                ) : (
                  <strong>None recorded</strong>
                )}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Medical History:</span>{' '}
                {patient.medicalHistory?.length > 0 ? (
                  <strong>{patient.medicalHistory.join(', ')}</strong>
                ) : (
                  <strong>No chronic conditions noted</strong>
                )}
              </div>
              <div><span style={{ color: 'var(--text-muted)' }}>Registration Date:</span> <strong>{new Date(patient.createdAt).toLocaleDateString('en-IN')}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Last Visit:</span> <strong>{patient.lastVisitAt ? new Date(patient.lastVisitAt).toLocaleDateString('en-IN') : 'None'}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Appointments */}
      {activeTab === 'appointments' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '16px' }}>Appointment History</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>All scheduled consultations and visits for this patient</p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsAppointmentModalOpen(true)}
            >
              <Plus size={14} /> Book New Appointment
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Doctor</th>
                  <th>Service / Purpose</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hub.appointments?.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>No appointment history for this patient yet.</td></tr>
                ) : (
                  hub.appointments?.map((apt) => (
                    <tr
                      key={apt.appointmentId}
                      style={{
                        background: apt.appointmentId === newlyBookedAptId ? '#f0fdf4' : undefined,
                        borderLeft: apt.appointmentId === newlyBookedAptId ? '4px solid #22c55e' : undefined,
                        transition: 'all 0.4s ease'
                      }}
                    >
                      <td>
                        {apt.appointmentId === newlyBookedAptId && (
                          <div style={{ marginBottom: '4px' }}>
                            <span className="badge badge-success" style={{ fontSize: '10.5px', fontWeight: 800 }}>
                              ✨ Just Booked
                            </span>
                          </div>
                        )}
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                          {new Date(apt.scheduledStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                          {new Date(apt.scheduledStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {apt.durationMinutes || 15} mins
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{apt.provider?.name || 'Assigned Doctor'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{apt.provider?.specialty || 'General Practitioner'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{apt.service?.name || apt.reason || 'Consultation'}</div>
                        {apt.reason && apt.service?.name && (
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{apt.reason}</div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                          {apt.appointmentType || 'Scheduled'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          apt.status === 'completed' ? 'badge-success' :
                          apt.status === 'checked_in' ? 'badge-info' :
                          apt.status === 'in_consultation' ? 'badge-warning' :
                          apt.status === 'cancelled' ? 'badge-danger' : 'badge-neutral'
                        }`}>
                          {apt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {apt.status === 'scheduled' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={async () => {
                              try {
                                await api.checkInAppointment(apt.appointmentId);
                                addToast('Patient checked into live queue!', 'success');
                                fetchPatientData();
                              } catch (err) {
                                addToast(err.message, 'error');
                              }
                            }}
                          >
                            <UserCheck size={13} /> Check-in
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Encounters */}
      {activeTab === 'encounters' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Clinical Encounters</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Encounter Date</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {hub.encounters?.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No encounters recorded.</td></tr>
                ) : (
                  hub.encounters?.map((enc) => (
                    <tr key={enc.encounterId}>
                      <td style={{ fontWeight: 600 }}>{new Date(enc.startedAt || enc.createdAt).toLocaleString('en-IN')}</td>
                      <td style={{ textTransform: 'capitalize' }}>{enc.encounterType}</td>
                      <td>
                        <span className={`badge ${enc.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                          {enc.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/clinical/encounters/${enc.encounterId}`)}
                        >
                          <Stethoscope size={13} /> Open Workspace
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Clinical */}
      {activeTab === 'clinical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {hub.clinicalRecords?.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
              No clinical records yet. Start a consultation from the live Queue or Encounters tab.
            </div>
          ) : (
            hub.clinicalRecords?.map((rec) => (
              <div key={rec.clinicalRecordId} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>
                    Consultation Record • {new Date(rec.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <span className="badge badge-success">{rec.status}</span>
                </div>

                {rec.vitals && (
                  <div className="vitals-grid">
                    {rec.vitals.bpSystolic && (
                      <div className="vital-box">
                        <div className="vital-val">{rec.vitals.bpSystolic}/{rec.vitals.bpDiastolic}</div>
                        <div className="vital-name">BP (mmHg)</div>
                      </div>
                    )}
                    {rec.vitals.pulse && (
                      <div className="vital-box">
                        <div className="vital-val">{rec.vitals.pulse}</div>
                        <div className="vital-name">Pulse (bpm)</div>
                      </div>
                    )}
                    {rec.vitals.temperature && (
                      <div className="vital-box">
                        <div className="vital-val">{rec.vitals.temperature}°F</div>
                        <div className="vital-name">Temp</div>
                      </div>
                    )}
                    {rec.vitals.weightKg && (
                      <div className="vital-box">
                        <div className="vital-val">{rec.vitals.weightKg} kg</div>
                        <div className="vital-name">Weight</div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                  {rec.complaint && <div><span style={{ fontWeight: 600 }}>Chief Complaint:</span> {rec.complaint}</div>}
                  {rec.examination && <div><span style={{ fontWeight: 600 }}>Clinical Examination:</span> {rec.examination}</div>}
                  {rec.diagnosis && <div><span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>Diagnosis:</span> <strong>{rec.diagnosis}</strong></div>}
                  {rec.notes && <div><span style={{ fontWeight: 600 }}>Doctor's Advice:</span> {rec.notes}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 5: Treatment & Prescriptions (Merged as per Product Spec) */}
      {activeTab === 'treatments' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Treatments Table */}
          <div className="card">
            <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Procedures & Treatments</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Procedure / Tooth</th>
                    <th>Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hub.treatments?.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '16px' }}>No treatments recorded.</td></tr>
                  ) : (
                    hub.treatments?.map((t) => (
                      <tr key={t.treatmentId}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{t.name}</div>
                          {t.toothNumber && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tooth #{t.toothNumber}</div>}
                        </td>
                        <td style={{ fontWeight: 600 }}>₹{t.cost || 0}</td>
                        <td><span className="badge badge-success">{t.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Prescriptions Table */}
          <div className="card">
            <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Prescriptions</h3>
            {hub.prescriptions?.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>No active prescriptions.</p>
            ) : (
              hub.prescriptions?.map((rx) => (
                <div key={rx.prescriptionId} style={{ marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Prescribed on {new Date(rx.createdAt).toLocaleDateString('en-IN')}
                  </div>
                  {rx.items?.map((item, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', fontSize: '12.5px' }}>
                      <strong>{item.medicineName}</strong> — {item.dosage} ({item.frequency}) for {item.duration}
                      {item.instructions && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.instructions}</div>}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Billing & Payments (Merged as per Product Spec) */}
      {activeTab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Invoices */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '16px' }}>Invoices</h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/billing?patientId=${patient.patientId}&action=new_invoice`)}
              >
                <Plus size={14} /> New Invoice
              </button>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {hub.invoices?.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No invoices.</td></tr>
                  ) : (
                    hub.invoices?.map((inv) => (
                      <tr key={inv.invoiceId}>
                        <td style={{ fontWeight: 700 }}>{inv.invoiceNumber}</td>
                        <td>{new Date(inv.issuedAt || inv.createdAt).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontWeight: 600 }}>₹{inv.total}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>₹{inv.paidAmount}</td>
                        <td style={{ color: inv.balance > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>₹{inv.balance}</td>
                        <td>
                          <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                            {inv.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/billing/invoices/${inv.invoiceId}`)}
                          >
                            <Eye size={13} /> View Bill
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments & Receipts */}
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Payments & Receipts Received</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payment #</th>
                    <th>Receipt #</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hub.payments?.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '16px' }}>No payment records.</td></tr>
                  ) : (
                    hub.payments?.map((pay) => {
                      const receipt = hub.receipts?.find((r) => r.paymentId === pay.paymentId);
                      return (
                        <tr key={pay.paymentId}>
                          <td style={{ fontWeight: 600 }}>{pay.paymentNumber}</td>
                          <td>
                            {receipt ? (
                              <span
                                style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                                onClick={() => navigate(`/billing/receipts/${receipt.receiptId}`)}
                              >
                                {receipt.receiptNumber}
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>{new Date(pay.receivedAt).toLocaleDateString('en-IN')}</td>
                          <td style={{ textTransform: 'uppercase', fontWeight: 600 }}>{pay.method}</td>
                          <td style={{ fontWeight: 700, color: '#10b981' }}>₹{pay.amount}</td>
                          <td>
                            <span className={`badge ${pay.status === 'verified' ? 'badge-success' : 'badge-warning'}`}>
                              {pay.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Documents */}
      {activeTab === 'documents' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '16px' }}>Documents & Radiographs</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/documents?action=upload')}
            >
              <Plus size={14} /> Upload Document
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {hub.documents?.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No documents attached.</td></tr>
                ) : (
                  hub.documents?.map((doc) => (
                    <tr key={doc.documentId}>
                      <td style={{ fontWeight: 600 }}>{doc.title}</td>
                      <td><span className="badge badge-info">{doc.category}</span></td>
                      <td>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          View / Download
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 8: Follow-ups */}
      {activeTab === 'followups' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Scheduled Follow-ups</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scheduled Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {hub.followups?.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No follow-ups scheduled.</td></tr>
                ) : (
                  hub.followups?.map((fup) => (
                    <tr key={fup.followupId}>
                      <td style={{ fontWeight: 600 }}>{new Date(fup.scheduledDate).toLocaleDateString('en-IN')}</td>
                      <td>{fup.reason}</td>
                      <td><span className="badge badge-info">{fup.status}</span></td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/appointments?patientId=${patient.patientId}&action=new`)}
                        >
                          Convert to Appointment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 9: Timeline */}
      {activeTab === 'timeline' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Full Audit History & Patient Timeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <strong>Patient Registration</strong> — Created record {patient.patientNumber} on {new Date(patient.createdAt).toLocaleString('en-IN')}
            </div>
            {hub.encounters?.map((e) => (
              <div key={e.encounterId} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <strong>Encounter Started</strong> — {e.encounterType} on {new Date(e.startedAt || e.createdAt).toLocaleString('en-IN')} ({e.status})
              </div>
            ))}
            {hub.invoices?.map((i) => (
              <div key={i.invoiceId} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <strong>Invoice Issued</strong> — {i.invoiceNumber} for ₹{i.total} on {new Date(i.issuedAt || i.createdAt).toLocaleString('en-IN')} ({i.status})
              </div>
            ))}
            {hub.payments?.map((p) => (
              <div key={p.paymentId} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <strong>Payment Received</strong> — {p.paymentNumber} of ₹{p.amount} via {p.method.toUpperCase()} on {new Date(p.receivedAt).toLocaleString('en-IN')}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Direct Book Appointment Modal */}
      <Modal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        title={`Book Appointment for ${patient?.name} (${patient?.patientNumber})`}
        maxWidth="580px"
      >
        <form onSubmit={handleCreateAppointmentFromProfile} autoComplete="off">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Doctor / Provider *</label>
              <select
                required
                className="form-select"
                value={aptForm.providerId}
                onChange={(e) => setAptForm({ ...aptForm, providerId: e.target.value })}
              >
                <option value="">Select doctor...</option>
                {aptStaffList.filter(s => s.designation?.includes('Doctor') || s.designation?.includes('Surgeon')).map((s) => (
                  <option key={s.staffId} value={s.staffId}>
                    {s.name} ({s.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Service</label>
              <select
                className="form-select"
                value={aptForm.serviceId}
                onChange={(e) => setAptForm({ ...aptForm, serviceId: e.target.value })}
              >
                <option value="">Select service...</option>
                {aptServicesList.map((svc) => (
                  <option key={svc.serviceId} value={svc.serviceId}>
                    {svc.name} - ₹{svc.price}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date & Time *</label>
              <input
                type="datetime-local"
                required
                className="form-input"
                value={aptForm.scheduledStart}
                onChange={(e) => setAptForm({ ...aptForm, scheduledStart: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duration (Minutes)</label>
              <select
                className="form-select"
                value={aptForm.durationMinutes}
                onChange={(e) => setAptForm({ ...aptForm, durationMinutes: e.target.value })}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Chief Complaint / Purpose of Visit</label>
            <input
              type="text"
              name="patient_appointment_reason"
              autoComplete="off"
              className="form-input"
              placeholder="e.g. Tooth sensitivity, regular checkup, filling"
              value={aptForm.reason}
              onChange={(e) => setAptForm({ ...aptForm, reason: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAppointmentModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Book Appointment
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Patient Details Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Patient Details (${patient.patientNumber})`}
        maxWidth="640px"
      >
        <form onSubmit={handleUpdatePatient} autoComplete="off">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Mobile Phone (10 digits) *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  className="form-input"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ maxWidth: '120px' }}>
                <label className="form-label">Age (Years)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ maxWidth: '130px' }}>
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ maxWidth: '130px' }}>
                <label className="form-label">Blood Group</label>
                <select
                  className="form-select"
                  value={editForm.bloodGroup}
                  onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 124, MP Nagar Zone 2"
                  value={editForm.street}
                  onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bhopal"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--text-muted)' }}>Emergency Contact Details</div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11.5px' }}>Contact Person Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sunita Sharma"
                    value={editForm.emergencyName}
                    onChange={(e) => setEditForm({ ...editForm, emergencyName: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11.5px' }}>Relationship</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Spouse / Mother / Father"
                    value={editForm.emergencyRelation}
                    onChange={(e) => setEditForm({ ...editForm, emergencyRelation: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11.5px' }}>Emergency Phone</label>
                  <input
                    type="tel"
                    maxLength={10}
                    className="form-input"
                    placeholder="10-digit phone"
                    value={editForm.emergencyPhone}
                    onChange={(e) => setEditForm({ ...editForm, emergencyPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Allergies (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Penicillin, Sulfa drugs, Latex"
                  value={editForm.allergies}
                  onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Medical History (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Diabetes Type 2, Hypertension"
                  value={editForm.medicalHistory}
                  onChange={(e) => setEditForm({ ...editForm, medicalHistory: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px' }}>
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Batch Download Modal */}
      <Modal isOpen={isBatchDownloadModalOpen} onClose={() => setIsBatchDownloadModalOpen(false)} title="Download Records (Prescriptions & Bills)">
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Select the past appointments/invoices you want to download. A printable PDF layout will be generated for the selected records.
          </p>
          {hub.invoices && hub.invoices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
              {hub.invoices.map((inv) => (
                <div key={inv.invoiceId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <input
                    type="checkbox"
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    checked={selectedBatchInvoices.includes(inv.invoiceId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBatchInvoices([...selectedBatchInvoices, inv.invoiceId]);
                      } else {
                        setSelectedBatchInvoices(selectedBatchInvoices.filter(id => id !== inv.invoiceId));
                      }
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{inv.invoiceNumber}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Date: {new Date(inv.issuedAt || inv.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    ₹{inv.total}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px', background: '#f1f5f9', borderRadius: '8px' }}>
              No completed records/invoices found for this patient.
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={() => setIsBatchDownloadModalOpen(false)}>Cancel</button>
          <button 
            className="btn btn-primary" 
            disabled={selectedBatchInvoices.length === 0}
            onClick={() => {
              window.open(`/batch-print?invoices=${selectedBatchInvoices.join(',')}`, '_blank');
              setIsBatchDownloadModalOpen(false);
            }}
          >
            <Printer size={16} /> Generate Selected PDF
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PatientProfile;
