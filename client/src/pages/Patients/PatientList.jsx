import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import {
  Users,
  Search,
  UserPlus,
  Clock,
  MoreVertical,
  Calendar,
  CreditCard,
  Archive,
  Eye,
  FileText
} from 'lucide-react';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // New Patient Unified Registration Modal state
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [patientForm, setPatientForm] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'male',
    // Unified additions
    symptoms: '',
    actionType: 'walkin', // 'walkin' or 'appointment'
    providerId: '',
    serviceIds: [],
    paymentStatus: 'paid', // for walkin
    scheduledStart: '', // for appointment
    billingDetails: { discount: 0, paidAmount: '' }
  });
  const [currentServiceId, setCurrentServiceId] = useState('');
  // Walk-in Modal state
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [selectedPatientForWalkIn, setSelectedPatientForWalkIn] = useState(null);
  const [walkInForm, setWalkInForm] = useState({
    providerId: '',
    serviceId: '',
    priority: 'normal',
    notes: ''
  });
  const [staffList, setStaffList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  // Archive modal state
  const [archiveModal, setArchiveModal] = useState({ isOpen: false, patient: null, reason: '' });
  const [newlyCreatedPatientId, setNewlyCreatedPatientId] = useState(null);

  // Duplicate Patient Warning Modal state (TC-06)
  const [duplicateWarning, setDuplicateWarning] = useState({
    isOpen: false,
    message: '',
    existingPatient: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { branch, branches, hasPermission } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients({
        search,
        status,
        branchId: (branch?.branchId === 'overall' || branch?.branchId === 'all') ? 'all' : branch?.branchId
      });
      setPatients(data || []);
      setCurrentPage(1);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, status, branch?.branchId]);

  // Load staff & services for walk-in modal
  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [staff, services] = await Promise.all([
          api.getStaff({ branchId: (branch?.branchId === 'overall' || branch?.branchId === 'all') ? undefined : branch?.branchId }),
          api.getServices({ branchId: (branch?.branchId === 'overall' || branch?.branchId === 'all') ? undefined : branch?.branchId })
        ]);
        setStaffList(staff || []);
        setServicesList(services || []);
      } catch (e) {
        // Non-blocking
      }
    };
    loadPrerequisites();

    // Check if ?action=new was passed from quick actions
    if (searchParams.get('action') === 'new') {
      setIsNewPatientOpen(true);
    }
  }, [branch?.branchId]);

  // Close 3-dot action dropdown when clicking anywhere outside on the screen
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.patient-action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [activeMenuId]);

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: patientForm.name,
        phone: patientForm.phone,
        email: patientForm.email,
        branchId: (branch?.branchId && branch.branchId !== 'overall') ? branch.branchId : (branches[0]?.branchId || undefined),
        age: patientForm.age ? parseInt(patientForm.age) : undefined,
        gender: patientForm.gender,
        symptoms: patientForm.symptoms,
        actionType: patientForm.actionType,
        providerId: patientForm.providerId,
        serviceIds: patientForm.serviceIds,
        paymentStatus: patientForm.paymentStatus,
        scheduledStart: patientForm.scheduledStart,
        billingDetails: { ...patientForm.billingDetails, generateInvoice: true }
      };

      // Validate exactly 10 digit mobile number
      const cleanPhone = (patientForm.phone || '').replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        addToast('Please enter a valid 10-digit mobile number.', 'error');
        return;
      }
      payload.phone = cleanPhone;

      if (!payload.providerId) {
         addToast('Please assign a Doctor / Provider.', 'error');
         return;
      }

      if (payload.actionType === 'appointment' && !payload.scheduledStart) {
         addToast('Please select a Scheduled Start time for the appointment.', 'error');
         return;
      }

      const res = await api.registerUnifiedPatient(payload);
      
      const pName = res.patient.name;
      if (payload.actionType === 'walkin') {
         addToast(`Patient ${pName} Registered & Walk-in Token ${res.tokenNumber} Generated!`, 'success', 3000);
      } else {
         addToast(`Patient ${pName} Registered & Appointment Scheduled!`, 'success', 3000);
      }

      setIsNewPatientOpen(false);
      
      setPatientForm({
        name: '', phone: '', email: '', age: '', gender: 'male',
        symptoms: '', actionType: 'walkin', providerId: '', serviceIds: [], paymentStatus: 'paid', scheduledStart: '', billingDetails: { discount: 0, paidAmount: '' }
      });
      fetchPatients();
    } catch (err) {
      if (err.code === 'PATIENT_ALREADY_EXISTS' && err.details?.existingPatient) {
        setDuplicateWarning({
          isOpen: true,
          message: err.message || 'A patient with this mobile number already exists in your organization.',
          existingPatient: err.details.existingPatient
        });
      } else {
        addToast(err.message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientForWalkIn) return;

    try {
      const res = await api.registerWalkIn({
        patientId: selectedPatientForWalkIn.patientId,
        providerId: walkInForm.providerId,
        serviceId: walkInForm.serviceId,
        priority: walkInForm.priority,
        notes: walkInForm.notes
      });
      addToast(res.message || 'Walk-in registered successfully', 'success');
      setIsWalkInOpen(false);
      navigate('/queue');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleArchivePatient = async () => {
    if (!archiveModal.patient) return;
    try {
      await api.archivePatient(archiveModal.patient.patientId, archiveModal.reason);
      addToast(`Patient ${archiveModal.patient.name} archived`, 'info');
      setArchiveModal({ isOpen: false, patient: null, reason: '' });
      fetchPatients();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px' }}>Patients Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Central patient index and medical record repository
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {hasPermission('patients.create') && (
            <button className="btn btn-primary" onClick={() => setIsNewPatientOpen(true)}>
              <UserPlus size={16} /> New Patient
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px', position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by name, phone, or ID (e.g. P0001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active Patients</option>
              <option value="archived">Archived / Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name & Demographics</th>
                <th>Phone</th>
                <th>Allergies & Alerts</th>
                <th>Last Visit</th>
                <th>Balance</th>
                <th>Active Visit / Apt</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px' }}>Loading patients...</td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No patients found matching your search.
                  </td>
                </tr>
              ) : (
                (() => {
                  const sorted = [...patients].sort((a, b) => {
                    if (newlyCreatedPatientId) {
                      if (a.patientId === newlyCreatedPatientId) return -1;
                      if (b.patientId === newlyCreatedPatientId) return 1;
                    }
                    return 0;
                  });
                  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

                  return paginated.map((pat) => (
                  <tr
                    key={pat.patientId}
                    style={{
                      background: pat.patientId === newlyCreatedPatientId ? '#f0fdf4' : undefined,
                      borderLeft: pat.patientId === newlyCreatedPatientId ? '4px solid #22c55e' : undefined,
                      transition: 'all 0.4s ease'
                    }}
                  >
                    <td>
                      {pat.patientId === newlyCreatedPatientId && (
                        <div style={{ marginBottom: '4px' }}>
                          <span className="badge badge-success" style={{ fontSize: '11px', fontWeight: 800 }}>
                            ✨ Just Registered
                          </span>
                        </div>
                      )}
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>
                        {pat.patientNumber}
                      </span>
                      {(pat.branch?.name || branches.find(b => b.branchId === pat.branchId)?.name) && (
                        <div style={{ marginTop: '3px' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                            {pat.branch?.name || branches.find(b => b.branchId === pat.branchId)?.name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div
                        style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}
                        onClick={() => navigate(`/patients/${pat.patientId}`)}
                      >
                        {pat.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {pat.age ? `${pat.age} yrs` : 'Age N/A'} • {pat.gender} • {pat.bloodGroup || 'Blood Group N/A'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{pat.phone}</td>
                    <td>
                      {pat.allergies && pat.allergies.length > 0 ? (
                        <span className="badge badge-danger">
                          Allergy: {pat.allergies.join(', ')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>None noted</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      {pat.lastVisitAt ? new Date(pat.lastVisitAt).toLocaleDateString('en-IN') : 'New Patient'}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: pat.balance > 0 ? '#ef4444' : '#10b981' }}>
                        ₹{pat.balance || 0}
                      </span>
                    </td>
                    <td>
                      {pat.activeQueue ? (
                        <div>
                          <span className="badge badge-warning" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                            <Clock size={11} /> Walk-in Token #{pat.activeQueue.tokenNumber}
                          </span>
                          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                            Status: {pat.activeQueue.status}
                          </div>
                        </div>
                      ) : pat.upcomingAppointment ? (
                        <div>
                          <span className="badge badge-info" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                            <Calendar size={11} /> Scheduled Apt
                          </span>
                          <div style={{ fontSize: '10.5px', color: '#0369a1', marginTop: '2px', fontWeight: 600 }}>
                            {new Date(pat.upcomingAppointment.scheduledStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} • {new Date(pat.upcomingAppointment.scheduledStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>No Active Visit</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${pat.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                        {pat.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', position: 'relative' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        {pat.activeQueue && (
                          <button
                            className="btn btn-warning btn-sm"
                            style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '11.5px', gap: '4px' }}
                            onClick={() => navigate('/queue')}
                            title="Go to Live Queue for this patient"
                          >
                            <Clock size={13} /> View in Queue
                          </button>
                        )}
                        {pat.upcomingAppointment && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11.5px', gap: '4px' }}
                            onClick={() => navigate(`/appointments`)}
                            title="Go to Appointments list for this scheduled appointment"
                          >
                            <Calendar size={13} /> View in Apt List
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/patients/${pat.patientId}`)}
                          title="View Comprehensive Patient Hub"
                        >
                          <Eye size={14} /> Profile
                        </button>

                        <div className="patient-action-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 6px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === pat.patientId ? null : pat.patientId);
                            }}
                          >
                            <MoreVertical size={15} />
                          </button>

                          {/* More ⋮ Dropdown Menu */}
                          {activeMenuId === pat.patientId && (
                            <div
                              style={{
                                position: 'absolute',
                                right: '0',
                                top: '34px',
                                background: '#ffffff',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                              boxShadow: 'var(--shadow-lg)',
                              width: '180px',
                              zIndex: 50,
                              display: 'flex',
                              flexDirection: 'column',
                              padding: '6px 0',
                              textAlign: 'left'
                            }}
                          >
                            <button
                              style={{ padding: '8px 14px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}
                              onClick={() => {
                                setActiveMenuId(null);
                                navigate(`/appointments?patientId=${pat.patientId}&action=new`);
                              }}
                            >
                              <Calendar size={14} /> Book Appointment
                            </button>
                            <button
                              style={{ padding: '8px 14px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}
                              onClick={() => {
                                setActiveMenuId(null);
                                setSelectedPatientForWalkIn(pat);
                                setIsWalkInOpen(true);
                              }}
                            >
                              <Clock size={14} /> Register Walk-in
                            </button>
                            <button
                              style={{ padding: '8px 14px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}
                              onClick={() => {
                                setActiveMenuId(null);
                                navigate(`/billing?patientId=${pat.patientId}&action=new_invoice`);
                              }}
                            >
                              <CreditCard size={14} /> Create Bill
                            </button>
                            <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                            <button
                              style={{ padding: '8px 14px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}
                              onClick={() => {
                                setActiveMenuId(null);
                                setArchiveModal({ isOpen: true, patient: pat, reason: '' });
                              }}
                            >
                              <Archive size={14} /> Archive Patient
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={patients.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* New Patient Registration Modal */}
      <Modal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        title="Register New Patient"
        maxWidth="680px"
      >
        <form onSubmit={handleCreatePatient} autoComplete="off">
          
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--primary)' }}>1. Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" required className="form-input" placeholder="e.g. Ramesh Chandra" value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Phone Number *</label>
                <input 
                  type="tel" 
                  required 
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className="form-input" 
                  placeholder="10-digit mobile (e.g. 9876543210)" 
                  value={patientForm.phone} 
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPatientForm({ ...patientForm, phone: onlyNums });
                  }} 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="patient@example.com" value={patientForm.email} onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })} />
              </div>
              <div className="form-group" style={{ maxWidth: '120px' }}>
                <label className="form-label">Age (Years)</label>
                <input type="number" className="form-input" placeholder="e.g. 32" value={patientForm.age} onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })} />
              </div>
              <div className="form-group" style={{ maxWidth: '150px' }}>
                <label className="form-label">Gender</label>
                <select className="form-select" value={patientForm.gender} onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '8px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#b45309' }}>2. Visit Intent (Symptoms / Reason)</h3>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea rows={2} className="form-textarea" placeholder="Describe symptoms, duration, or reason for visit..." value={patientForm.symptoms} onChange={(e) => setPatientForm({ ...patientForm, symptoms: e.target.value })} />
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#15803d' }}>3. Route Patient</h3>
            
            <div className="form-group" style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
                <input type="radio" name="actionType" value="walkin" checked={patientForm.actionType === 'walkin'} onChange={(e) => setPatientForm({ ...patientForm, actionType: e.target.value })} /> 
                Walk-In Now (Live Queue)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
                <input type="radio" name="actionType" value="appointment" checked={patientForm.actionType === 'appointment'} onChange={(e) => setPatientForm({ ...patientForm, actionType: e.target.value })} /> 
                Schedule Future Appointment
              </label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assign Doctor *</label>
                <select required className="form-select" value={patientForm.providerId} onChange={(e) => setPatientForm({ ...patientForm, providerId: e.target.value })}>
                  <option value="">Select Doctor...</option>
                  {staffList.filter(s => s.designation.includes('Doctor') || s.designation.includes('Surgeon')).map((s) => (
                    <option key={s.staffId} value={s.staffId}>{s.name} ({s.specialty})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Services (Optional)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    className="form-select" 
                    value={currentServiceId} 
                    onChange={(e) => setCurrentServiceId(e.target.value)}
                  >
                    <option value="">Select a service...</option>
                    {servicesList.map((svc) => (
                      <option key={svc.serviceId} value={svc.serviceId}>{svc.name} - ₹{svc.price}</option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      if (currentServiceId && !patientForm.serviceIds.includes(currentServiceId)) {
                        setPatientForm({ ...patientForm, serviceIds: [...patientForm.serviceIds, currentServiceId] });
                        setCurrentServiceId('');
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                
                {patientForm.serviceIds.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {patientForm.serviceIds.map(id => {
                      const svc = servicesList.find(s => s.serviceId === id);
                      return svc ? (
                        <div key={id} style={{ display: 'inline-flex', alignItems: 'center', background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>
                          <span>{svc.name}</span>
                          <button 
                            type="button" 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '6px', color: '#64748b', display: 'flex', alignItems: 'center' }}
                            onClick={() => setPatientForm({ ...patientForm, serviceIds: patientForm.serviceIds.filter(sid => sid !== id) })}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Billing Summary Section */}
            {(patientForm.actionType === 'walkin' || patientForm.paymentStatus === 'paid') && (() => {
              const docFee = staffList.find(s => s.staffId === patientForm.providerId)?.consultationFee || 0;
              const svcFee = patientForm.serviceIds.reduce((sum, id) => sum + (servicesList.find(s => s.serviceId === id)?.price || 0), 0);
              const discountVal = Number(patientForm.billingDetails?.discount) || 0;
              const finalPrice = Math.max(0, docFee + svcFee - discountVal);

              return (
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#334155' }}>Billing Summary</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                    <span>Doctor Fee:</span>
                    <span>₹{docFee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                    <span>Services Fee:</span>
                    <span>₹{svcFee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', alignItems: 'center' }}>
                    <span>Discount:</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '80px', padding: '4px', fontSize: '12px' }}
                      value={patientForm.billingDetails?.discount ?? ''}
                      onChange={(e) => {
                        const newDiscount = e.target.value === '' ? '' : Number(e.target.value);
                        const calcFinal = Math.max(0, docFee + svcFee - (Number(newDiscount) || 0));
                        setPatientForm({
                          ...patientForm,
                          billingDetails: {
                            ...patientForm.billingDetails,
                            discount: newDiscount,
                            paidAmount: calcFinal
                          }
                        });
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginBottom: '8px' }}>
                    <span>Final Price (After Discount):</span>
                    <span style={{ color: '#0f172a' }}>₹{finalPrice}</span>
                  </div>
                  
                  {patientForm.paymentStatus === 'paid' && (
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: patientForm.billingDetails?.paymentMethod === 'mixed' ? '1.2fr 1fr 1fr' : '1fr 120px', gap: '15px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534', marginBottom: '4px', display: 'block' }}>Payment Method</label>
                          <select
                            className="form-input"
                            style={{ padding: '6px', fontSize: '13px', borderColor: '#86efac', width: '100%' }}
                            value={patientForm.billingDetails?.paymentMethod || 'cash'}
                            onChange={(e) => setPatientForm({
                              ...patientForm,
                              billingDetails: {
                                ...patientForm.billingDetails,
                                paymentMethod: e.target.value,
                                paidAmount: e.target.value !== 'mixed' ? (patientForm.billingDetails?.paidAmount ?? finalPrice) : 0,
                                cashAmount: e.target.value === 'mixed' ? (patientForm.billingDetails?.cashAmount || 0) : 0,
                                onlineAmount: e.target.value === 'mixed' ? (patientForm.billingDetails?.onlineAmount || 0) : 0
                              }
                            })}
                          >
                            <option value="cash">Cash</option>
                            <option value="upi">Online / UPI</option>
                            <option value="mixed">Mixed</option>
                          </select>
                        </div>
                        {patientForm.billingDetails?.paymentMethod !== 'mixed' && (
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534', marginBottom: '4px', display: 'block' }}>Amount Paid</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{color: '#15803d', fontWeight: 'bold'}}>₹</span>
                              <input
                                type="number" required
                                className="form-input"
                                style={{ padding: '6px', fontWeight: 'bold', color: '#15803d', borderColor: '#86efac', width: '100%' }}
                                value={patientForm.billingDetails?.paidAmount ?? finalPrice}
                                onChange={(e) => setPatientForm({
                                  ...patientForm,
                                  billingDetails: { ...patientForm.billingDetails, paidAmount: e.target.value === '' ? '' : Number(e.target.value) }
                                })}
                              />
                            </div>
                          </div>
                        )}
                        {patientForm.billingDetails?.paymentMethod === 'mixed' && (
                          <>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534', marginBottom: '4px', display: 'block' }}>Cash Amt</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{color: '#15803d', fontWeight: 'bold'}}>₹</span>
                                <input type="number" required className="form-input" style={{ padding: '6px', borderColor: '#86efac', width: '100%' }}
                                  value={patientForm.billingDetails?.cashAmount || ''}
                                  onChange={(e) => setPatientForm({
                                    ...patientForm,
                                    billingDetails: { ...patientForm.billingDetails, cashAmount: Number(e.target.value) }
                                  })}
                                />
                              </div>
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534', marginBottom: '4px', display: 'block' }}>Online Amt</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{color: '#15803d', fontWeight: 'bold'}}>₹</span>
                                <input type="number" required className="form-input" style={{ padding: '6px', borderColor: '#86efac', width: '100%' }}
                                  value={patientForm.billingDetails?.onlineAmount || ''}
                                  onChange={(e) => setPatientForm({
                                    ...patientForm,
                                    billingDetails: { ...patientForm.billingDetails, onlineAmount: Number(e.target.value) }
                                  })}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Payment Choice for both Walk-in and Appointment */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Choice (Consultation & Services)</label>
              <div style={{ display: 'flex', gap: '15px', padding: '6px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>
                  <input type="radio" name="paymentStatus" value="paid" checked={patientForm.paymentStatus === 'paid'} onChange={(e) => setPatientForm({ ...patientForm, paymentStatus: e.target.value })} /> 
                  Pay Now (Advance / Cash Collected)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>
                  <input type="radio" name="paymentStatus" value="pending" checked={patientForm.paymentStatus === 'pending'} onChange={(e) => setPatientForm({ ...patientForm, paymentStatus: e.target.value })} /> 
                  Pay After Consultation
                </label>
              </div>
            </div>

            {patientForm.actionType === 'appointment' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Scheduled Date & Time *</label>
                <input type="datetime-local" className="form-input" required={patientForm.actionType === 'appointment'} value={patientForm.scheduledStart} onChange={(e) => setPatientForm({ ...patientForm, scheduledStart: e.target.value })} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewPatientOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 24px', fontSize: '15px', fontWeight: 600 }} disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : (patientForm.actionType === 'walkin' ? 'Register & Generate Token' : 'Register & Schedule')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Walk-in Queue Registration Modal */}
      <Modal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        title={`Register Walk-in: ${selectedPatientForWalkIn?.name || ''}`}
        maxWidth="500px"
      >
        <form onSubmit={handleWalkInSubmit}>
          <div className="form-group">
            <label className="form-label">Assign Doctor / Provider *</label>
            <select
              required
              className="form-select"
              value={walkInForm.providerId}
              onChange={(e) => setWalkInForm({ ...walkInForm, providerId: e.target.value })}
            >
              <option value="">Select Doctor...</option>
              {staffList.filter(s => s.designation.includes('Doctor') || s.designation.includes('Surgeon')).map((s) => (
                <option key={s.staffId} value={s.staffId}>
                  {s.name} ({s.specialty || s.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Service / Reason</label>
            <select
              className="form-select"
              value={walkInForm.serviceId}
              onChange={(e) => setWalkInForm({ ...walkInForm, serviceId: e.target.value })}
            >
              <option value="">General Consultation</option>
              {servicesList.map((svc) => (
                <option key={svc.serviceId} value={svc.serviceId}>
                  {svc.name} - ₹{svc.price}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Queue Priority</label>
            <select
              className="form-select"
              value={walkInForm.priority}
              onChange={(e) => setWalkInForm({ ...walkInForm, priority: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent / Acute Pain</option>
              <option value="vip">Senior Citizen / Priority</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Visit Notes / Chief Complaint</label>
            <textarea
              rows={2}
              className="form-textarea"
              placeholder="e.g. Chief complaint, symptoms, or reason for visit..."
              value={walkInForm.notes}
              onChange={(e) => setWalkInForm({ ...walkInForm, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsWalkInOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Assign Token & Start Queue
            </button>
          </div>
        </form>
      </Modal>

      {/* Archive Modal */}
      <Modal
        isOpen={archiveModal.isOpen}
        onClose={() => setArchiveModal({ isOpen: false, patient: null, reason: '' })}
        title="Archive Patient Record"
        maxWidth="450px"
      >
        <p style={{ fontSize: '13.5px', marginBottom: '16px', color: '#475569' }}>
          Are you sure you want to archive <strong>{archiveModal.patient?.name}</strong>? Archiving preserves all historical clinical records and financial invoices according to healthcare policy.
        </p>

        <div className="form-group">
          <label className="form-label">Reason for Archiving</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Relocated to another city"
            value={archiveModal.reason}
            onChange={(e) => setArchiveModal({ ...archiveModal, reason: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setArchiveModal({ isOpen: false, patient: null, reason: '' })}
          >
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleArchivePatient}>
            Confirm Archive
          </button>
        </div>
      </Modal>

      {/* Duplicate Patient Warning Modal (TC-06) */}
      <Modal
        isOpen={duplicateWarning.isOpen}
        onClose={() => setDuplicateWarning({ isOpen: false, message: '', existingPatient: null })}
        title="⚠️ Existing Patient Found"
        maxWidth="480px"
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '12px 14px', borderRadius: '8px', color: '#92400e', fontSize: '13.5px', marginBottom: '16px', lineHeight: 1.5 }}>
            {duplicateWarning.message}
          </div>

          {duplicateWarning.existingPatient && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                {duplicateWarning.existingPatient.name}
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span>ID: <strong>{duplicateWarning.existingPatient.patientNumber || duplicateWarning.existingPatient.patientId}</strong></span>
                <span>Phone: <strong>{duplicateWarning.existingPatient.phone}</strong></span>
                {duplicateWarning.existingPatient.email && <span>Email: {duplicateWarning.existingPatient.email}</span>}
              </div>
            </div>
          )}

          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
            Would you like to open this existing patient's profile to view clinical history or start a new visit?
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDuplicateWarning({ isOpen: false, message: '', existingPatient: null })}
            >
              Keep Editing
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const targetId = duplicateWarning.existingPatient?.patientId || duplicateWarning.existingPatient?._id;
                setDuplicateWarning({ isOpen: false, message: '', existingPatient: null });
                setIsNewPatientOpen(false);
                if (targetId) {
                  navigate(`/patients/${targetId}`);
                }
              }}
            >
              Open Patient Profile
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PatientList;
