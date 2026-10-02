import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  Filter,
  UserCheck,
  ChevronRight
} from 'lucide-react';

const AppointmentsPage = () => {
  const { branch, hasPermission } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [appointments, setAppointments] = useState([]);
  const [followups, setFollowups] = useState([]);

  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState(() => branch?.branchId || 'all');
  const [branchesList, setBranchesList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState('all'); // 'all', 'today', 'upcoming', 'custom'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [viewMode, setViewMode] = useState('appointments'); // 'appointments' or 'followups'
  const [currentAppointmentsPage, setCurrentAppointmentsPage] = useState(1);
  const [currentFollowupsPage, setCurrentFollowupsPage] = useState(1);
  const pageSize = 10;

  // Confirm modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmApt, setConfirmApt] = useState(null);
  const [confirmBilling, setConfirmBilling] = useState({
    payNow: false,
    discount: '',
    paidAmount: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('recent'); // 'recent', 'earliest', 'latest'
  const [newlyCreatedId, setNewlyCreatedId] = useState(null);




  // Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ id: null, scheduledStart: '', patientName: '' });
  const [isRescheduleFollowupModalOpen, setIsRescheduleFollowupModalOpen] = useState(false);
  const [rescheduleFupData, setRescheduleFupData] = useState({ id: null, scheduledDate: '', patientName: '' });
  const [cancelModal, setCancelModal] = useState({ isOpen: false, type: 'appointment', id: null, patientName: '', reason: '' });
  const [patients, setPatients] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  const [form, setForm] = useState({
    patientId: '',
    providerId: '',
    serviceId: '',
    branchId: branch?.branchId || '',
    scheduledStart: '',
    durationMinutes: 15,
    appointmentType: 'scheduled',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    if (branch?.branchId) {
      const isOverall = branch.branchId === 'overall';
      setBranchFilter(isOverall ? 'all' : branch.branchId);
      setForm((prev) => ({
        ...prev,
        branchId: isOverall ? (branchesList[0]?.branchId || '') : branch.branchId
      }));
    }
  }, [branch?.branchId, branchesList]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = {
        branchId: (branchFilter === 'all' || branchFilter === 'overall') ? undefined : (branchFilter || undefined),
        status: statusFilter || undefined,
        providerId: providerFilter || undefined
      };

      const todayStr = new Date().toLocaleDateString('en-CA');

      if (dateFilterMode === 'today') {
        params.startDate = todayStr;
        params.endDate = todayStr;
      } else if (dateFilterMode === 'upcoming') {
        params.startDate = todayStr;
      } else if (dateFilterMode === 'custom') {
        params.startDate = selectedDate || undefined;
        params.endDate = selectedDate || undefined;
      }
      // 'all' mode passes no startDate/endDate so all appointments are returned!

      const [aptData, fupData] = await Promise.all([
        api.getAppointments(params),
        api.getFollowUps(params)
      ]);
      setAppointments(aptData || []);
      setFollowups(fupData || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [dateFilterMode, selectedDate, statusFilter, providerFilter, branchFilter]);

  const refreshPatients = async () => {
    try {
      const pats = await api.getPatients({ limit: 500, branchId: 'all' });
      setPatients(pats || []);
    } catch (e) {
      // Non-blocking
    }
  };

  useEffect(() => {
    if (isNewModalOpen) {
      refreshPatients();
    }
  }, [isNewModalOpen]);

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const activeBranch = branchFilter === 'all' ? undefined : (branchFilter || branch?.branchId || undefined);
        const [pats, staff, svcs, branchesData] = await Promise.all([
          api.getPatients({ limit: 500, branchId: 'all' }),
          api.getStaff({ branchId: activeBranch }),
          api.getServices({ branchId: activeBranch }),
          api.getBranches()
        ]);
        setPatients(pats || []);
        setStaffList(staff || []);
        setServicesList(svcs || []);
        setBranchesList(branchesData || []);
      } catch (e) {
        // Non-blocking
      }
    };
    loadPrerequisites();
  }, [branchFilter, branch?.branchId]);

  useEffect(() => {
    const paramPatientId = searchParams.get('patientId');
    const action = searchParams.get('action');
    if (paramPatientId) {
      setForm((prev) => ({ ...prev, patientId: paramPatientId }));
    }
    if (action === 'new') {
      setIsNewModalOpen(true);
    }
  }, [searchParams]);

  const handleConvertFollowup = (fup) => {
    if (!fup) return;
    const dateStr = fup.scheduledDate ? fup.scheduledDate.substring(0, 10) : '';
    setForm((prev) => ({
      ...prev,
      patientId: fup.patientId || '',
      providerId: fup.providerId || '',
      reason: fup.reason ? `Follow-up: ${fup.reason}` : 'Follow-up visit',
      scheduledStart: dateStr ? `${dateStr}T10:00` : ''
    }));
    setIsNewModalOpen(true);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createAppointment({
        ...form,
        branchId: form.branchId || branch?.branchId || branchesList[0]?.branchId,
        durationMinutes: parseInt(form.durationMinutes) || 15
      });
      addToast('Appointment scheduled successfully!', 'success');
      setIsNewModalOpen(false);
      setSearchParams({}); // Clean query params

      const createdId = res?.appointmentId || res?.data?.appointmentId;
      if (createdId) {
        setNewlyCreatedId(createdId);
        setTimeout(() => setNewlyCreatedId(null), 10000);
      }

      // Reset view filters so newly created appointment is immediately visible at the top
      setSearchQuery('');
      setDateFilterMode('all');
      setStatusFilter('');
      setSortOrder('recent');

      setForm({
        patientId: '',
        providerId: '',
        serviceId: '',
        scheduledStart: '',
        durationMinutes: 15,
        appointmentType: 'scheduled',
        reason: '',
        notes: ''
      });
      fetchAppointments();
    } catch (err) {
      if (err.code === 'DOCTOR_SLOT_CONFLICT') {
        addToast(`⚠️ Doctor Slot Conflict: ${err.message}`, 'warning', 6000);
      } else {
        addToast(err.message || 'Failed to schedule appointment', 'error');
      }
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await api.updateAppointment(rescheduleData.id, { scheduledStart: rescheduleData.scheduledStart });
      addToast('Appointment postponed / rescheduled successfully with new time!', 'success');
      setIsRescheduleModalOpen(false);
      setRescheduleData({ id: null, scheduledStart: '', patientName: '' });
      fetchAppointments();
    } catch (err) {
      if (err.code === 'DOCTOR_SLOT_CONFLICT') {
        addToast(`⚠️ Doctor Slot Conflict: ${err.message}`, 'warning', 6000);
      } else {
        addToast(err.message || 'Failed to reschedule appointment', 'error');
      }
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModal.id) return;
    try {
      if (cancelModal.type === 'appointment') {
        await api.updateAppointmentStatus(cancelModal.id, 'cancelled', cancelModal.reason || 'Cancelled by clinic / patient request');
        addToast('Appointment cancelled and reason logged!', 'info');
      } else {
        await api.updateFollowUp(cancelModal.id, {
          status: 'cancelled',
          cancellationReason: cancelModal.reason || 'Cancelled by clinic / patient request'
        });
        addToast('Follow-up cancelled and reason logged!', 'info');
      }
      setCancelModal({ isOpen: false, type: 'appointment', id: null, patientName: '', reason: '' });
      fetchAppointments();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCheckIn = async (apt) => {
    try {
      const res = await api.checkInAppointment(apt.appointmentId);
      const token = res.data?.tokenNumber || (res.tokenNumber ? res.tokenNumber : '');
      const tokenMsg = token ? ` (Token: #${token})` : '';
      addToast(`Patient checked in successfully${tokenMsg}! Added to Live Queue.`, 'success');
      fetchAppointments();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await api.updateAppointmentStatus(appointmentId, newStatus);
      addToast(`Appointment marked as ${newStatus}`, 'info');
      fetchAppointments();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Follow-up handlers (same as Documents page)
  const handleToggleFollowupStatus = async (followupId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
      await api.updateFollowUp(followupId, { status: newStatus });
      addToast(`Follow-up marked as ${newStatus}`, 'info');
      fetchAppointments();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleRescheduleFollowup = async (e) => {
    e.preventDefault();
    try {
      await api.updateFollowUp(rescheduleFupData.id, { scheduledDate: rescheduleFupData.scheduledDate });
      addToast('Scheduled follow-up postponed with updated date & time!', 'success');
      setIsRescheduleFollowupModalOpen(false);
      setRescheduleFupData({ id: null, scheduledDate: '', patientName: '' });
      fetchAppointments();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Confirm appointment with billing modal
  const handleConfirmClick = (apt) => {
    setConfirmApt(apt);
    setConfirmBilling({ payNow: false, discount: '', paidAmount: '' });
    setIsConfirmModalOpen(true);
  };

  const calculateConfirmTotal = () => {
    if (!confirmApt) return 0;
    let total = 0;
    const provider = staffList.find(s => s.staffId === confirmApt.providerId);
    if (provider && provider.consultationFee) total += provider.consultationFee;
    if (confirmApt.serviceId) {
      const svc = servicesList.find(x => x.serviceId === confirmApt.serviceId);
      if (svc) total += svc.price;
    }
    if (confirmApt.serviceIds && confirmApt.serviceIds.length > 0) {
      confirmApt.serviceIds.forEach(id => {
        const svc = servicesList.find(x => x.serviceId === id);
        if (svc) total += svc.price;
      });
    }
    return total;
  };

  const handleConfirmSubmit = async () => {
    try {
      // First confirm the appointment
      await api.updateAppointmentStatus(confirmApt.appointmentId, 'confirmed');

      // If paying now, also check-in with billing
      if (confirmBilling.payNow) {
        const payload = {
          paymentStatus: 'paid',
          billingDetails: {
            discount: confirmBilling.discount,
            paidAmount: confirmBilling.paidAmount
          }
        };
        await api.checkInAppointment(confirmApt.appointmentId, payload);
        addToast('Appointment confirmed & payment processed! Patient checked in.', 'success');
      } else {
        addToast('Appointment confirmed successfully! Payment will be taken after consultation.', 'success');
      }

      setIsConfirmModalOpen(false);
      fetchAppointments();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px' }}>Appointments Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Consultation scheduling, provider calendars, and patient check-in
          </p>
        </div>

        {hasPermission('appointments.create') && (
          <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
            <Plus size={16} /> New Appointment
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${viewMode === 'appointments' ? 'active' : ''}`}
          onClick={() => setViewMode('appointments')}
        >
          Appointments ({appointments.length})
        </button>
        <button
          className={`tab-btn ${viewMode === 'followups' ? 'active' : ''}`}
          onClick={() => setViewMode('followups')}
        >
          Scheduled Appointments ({followups.length})
        </button>
      </div>

      {/* Filter / Date Bar applied to both Appointments and Scheduled Appointments */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Quick Date Mode Pills + Search */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
              <button
                type="button"
                className={`btn btn-sm ${dateFilterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', borderRadius: '8px' }}
                onClick={() => setDateFilterMode('all')}
              >
                All {viewMode === 'followups' ? 'Scheduled' : 'Appointments'}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${dateFilterMode === 'today' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', borderRadius: '8px' }}
                onClick={() => setDateFilterMode('today')}
              >
                Today
              </button>
              <button
                type="button"
                className={`btn btn-sm ${dateFilterMode === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', borderRadius: '8px' }}
                onClick={() => setDateFilterMode('upcoming')}
              >
                Upcoming
              </button>
              <button
                type="button"
                className={`btn btn-sm ${dateFilterMode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', borderRadius: '8px' }}
                onClick={() => setDateFilterMode('custom')}
              >
                Specific Date 📅
              </button>
            </div>

            {/* Search Input */}
            <div style={{ flex: '1', maxWidth: '320px', minWidth: '220px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={viewMode === 'followups' ? "Search patient, reason, doctor..." : "Search patient, phone, or MRN..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Secondary Filters: Specific Date (if custom mode), Doctor, Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
            {dateFilterMode === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Select Date:</span>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Branch:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                <option value="all">All Branches</option>
                {branchesList.map((b) => (
                  <option key={b.branchId} value={b.branchId}>
                    {b.name} {b.isMain ? '(Main)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Doctor:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
              >
                <option value="">All Doctors</option>
                {staffList.map((s) => (
                  <option key={s.staffId} value={s.staffId}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="in_consultation">In Consultation</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Sort:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '12.5px' }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="recent">Recently Booked First</option>
                <option value="earliest">Scheduled Time (Earliest First)</option>
                <option value="latest">Scheduled Time (Latest First)</option>
              </select>
            </div>

            {(statusFilter || providerFilter || searchQuery || dateFilterMode !== 'all' || branchFilter !== 'all') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11.5px', padding: '4px 10px', marginLeft: 'auto' }}
                onClick={() => {
                  setStatusFilter('');
                  setProviderFilter('');
                  setSearchQuery('');
                  setDateFilterMode('all');
                  setBranchFilter('all');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'appointments' && (
      <>

      {/* Appointments Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          className="table-responsive"
          style={{
            overflowX: 'auto',
            width: '100%',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'auto',
            scrollbarColor: '#94a3b8 #f1f5f9'
          }}
        >
          <table className="data-table" style={{ minWidth: '980px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '140px' }}>Date & Slot</th>
                <th style={{ minWidth: '160px' }}>Patient</th>
                <th style={{ minWidth: '140px' }}>Doctor</th>
                <th style={{ minWidth: '190px' }}>Service / Reason</th>
                <th style={{ minWidth: '130px' }}>Branch</th>
                <th style={{ minWidth: '100px' }}>Type</th>
                <th style={{ minWidth: '110px' }}>Status</th>
                <th style={{ textAlign: 'right', minWidth: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>Loading appointments...</td></tr>
              ) : (() => {
                const displayed = appointments
                  .filter((a) => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      a.patient?.name?.toLowerCase().includes(q) ||
                      a.patient?.phone?.includes(q) ||
                      a.patient?.patientNumber?.toLowerCase().includes(q) ||
                      a.reason?.toLowerCase().includes(q)
                    );
                  })
                  .sort((a, b) => {
                    if (newlyCreatedId) {
                      if (a.appointmentId === newlyCreatedId) return -1;
                      if (b.appointmentId === newlyCreatedId) return 1;
                    }
                    if (sortOrder === 'recent') {
                      return new Date(b.createdAt || b.scheduledStart) - new Date(a.createdAt || a.scheduledStart);
                    }
                    if (sortOrder === 'earliest') {
                      return new Date(a.scheduledStart) - new Date(b.scheduledStart);
                    }
                    return new Date(b.scheduledStart) - new Date(a.scheduledStart);
                  });

                if (displayed.length === 0) {
                  return (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No appointments found matching this filter.
                      </td>
                    </tr>
                  );
                }
                let sorted = displayed;
                const paginatedAppointments = sorted.slice((currentAppointmentsPage - 1) * pageSize, currentAppointmentsPage * pageSize);

                return paginatedAppointments.map((apt) => (
                  <tr
                    key={apt.appointmentId}
                    style={{
                      background: apt.appointmentId === newlyCreatedId ? '#f0fdf4' : undefined,
                      borderLeft: apt.appointmentId === newlyCreatedId ? '4px solid #22c55e' : undefined,
                      transition: 'all 0.4s ease'
                    }}
                  >
                    <td>
                      {apt.appointmentId === newlyCreatedId && (
                        <div style={{ marginBottom: '4px' }}>
                          <span className="badge badge-success" style={{ fontSize: '11px', fontWeight: 800 }}>
                            ✨ Just Booked
                          </span>
                        </div>
                      )}
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                        {new Date(apt.scheduledStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                        {new Date(apt.scheduledStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {apt.durationMinutes} mins
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{apt.patient?.name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {apt.patient?.patientNumber} • {apt.patient?.phone}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{apt.provider?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{apt.provider?.specialty}</div>
                    </td>
                    <td>
                      <div>{apt.service?.name || 'General Consultation'}</div>
                      {apt.reason && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{apt.reason}</div>}
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                        {apt.branch?.name || (branchesList.find(b => b.branchId === apt.branchId)?.name) || 'Main Branch'}
                      </span>
                    </td>
                    <td><span className="badge badge-neutral">{apt.appointmentType}</span></td>
                    <td>
                      <span className={`badge ${apt.status === 'completed' ? 'badge-success' :
                        apt.status === 'checked_in' ? 'badge-info' :
                          apt.status === 'in_consultation' ? 'badge-warning' :
                            apt.status === 'cancelled' ? 'badge-danger' : 'badge-neutral'
                        }`}>
                        {apt.status.replace('_', ' ')}
                      </span>
                      {apt.status === 'cancelled' && apt.cancellationReason && (
                        <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px', fontWeight: 600 }} title={apt.cancellationReason}>
                          Reason: {apt.cancellationReason}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {apt.status === 'scheduled' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleConfirmClick(apt)}
                            title="Confirm appointment & payment details"
                          >
                            <CheckCircle2 size={14} /> Confirm
                          </button>
                        )}
                        {apt.status === 'confirmed' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleCheckIn(apt)}
                            title="Check-in patient to Live Queue (generates queue token)"
                          >
                            <UserCheck size={14} /> Check In
                          </button>
                        )}
                        {apt.status === 'checked_in' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate('/queue')}
                            title="Patient is currently in Live Queue. Click to view board."
                          >
                            <Clock size={13} /> View in Queue
                          </button>
                        )}
                        {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#f59e0b' }}
                              onClick={() => {
                                setRescheduleData({
                                  id: apt.appointmentId,
                                  scheduledStart: apt.scheduledStart.substring(0, 16),
                                  patientName: apt.patient?.name || 'Patient'
                                });
                                setIsRescheduleModalOpen(true);
                              }}
                              title="Reschedule / Postpone (Select Date & Time)"
                            >
                              <Calendar size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#ef4444' }}
                              onClick={() => {
                                setCancelModal({
                                  isOpen: true,
                                  type: 'appointment',
                                  id: apt.appointmentId,
                                  patientName: apt.patient?.name || 'Patient',
                                  reason: ''
                                });
                              }}
                              title="Cancel Appointment with Reason"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
        {(() => {
          const filteredCount = appointments.filter((a) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
              a.patient?.name?.toLowerCase().includes(q) ||
              a.patient?.phone?.includes(q) ||
              a.patient?.patientNumber?.toLowerCase().includes(q) ||
              a.reason?.toLowerCase().includes(q)
            );
          }).length;
          return (
            <Pagination
              currentPage={currentAppointmentsPage}
              totalItems={filteredCount}
              pageSize={pageSize}
              onPageChange={setCurrentAppointmentsPage}
            />
          );
        })()}
      </div>

      </>
      )}

      {/* Tab 2: Scheduled Appointments (Follow-ups) — Same UI as Documents page */}
      {viewMode === 'followups' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            className="table-responsive"
            style={{
              overflowX: 'auto',
              width: '100%',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'auto',
              scrollbarColor: '#94a3b8 #f1f5f9'
            }}
          >
            <table className="data-table" style={{ minWidth: '980px', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '140px' }}>Scheduled Date</th>
                  <th style={{ minWidth: '170px' }}>Patient</th>
                  <th style={{ minWidth: '150px' }}>Doctor</th>
                  <th style={{ minWidth: '220px' }}>Reason / Clinical Purpose</th>
                  <th style={{ minWidth: '110px' }}>Status</th>
                  <th style={{ textAlign: 'right', minWidth: '280px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredFollowups = followups.filter((fup) => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (fup.patient?.name && fup.patient.name.toLowerCase().includes(q)) ||
                      (fup.patientName && fup.patientName.toLowerCase().includes(q)) ||
                      (fup.patient?.phone && fup.patient.phone.includes(q)) ||
                      (fup.provider?.name && fup.provider.name.toLowerCase().includes(q)) ||
                      (fup.reason && fup.reason.toLowerCase().includes(q)) ||
                      (fup.notes && fup.notes.toLowerCase().includes(q))
                    );
                  });

                  if (loading) {
                    return <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>Loading follow-ups...</td></tr>;
                  }
                  if (filteredFollowups.length === 0) {
                    return (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No scheduled appointments found.
                        </td>
                      </tr>
                    );
                  }

                  return filteredFollowups
                    .slice((currentFollowupsPage - 1) * pageSize, currentFollowupsPage * pageSize)
                    .map((fup) => (
                      <tr key={fup.followupId}>
                        <td style={{ fontWeight: 700, fontSize: '13.5px', whiteSpace: 'nowrap' }}>
                          {new Date(fup.scheduledDate).toLocaleDateString('en-IN')}
                        </td>
                        <td>
                          <div
                            style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}
                            onClick={() => navigate(`/patients/${fup.patientId}`)}
                          >
                            {fup.patient?.name || fup.patientName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fup.patient?.phone}</div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{fup.provider?.name || fup.providerName || 'Assigned Doctor'}</td>
                        <td>
                          <div>{fup.reason}</div>
                          {fup.notes && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{fup.notes}</div>}
                        </td>
                        <td>
                          <span className={`badge ${fup.status === 'completed' ? 'badge-success' : fup.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                            {fup.status}
                          </span>
                          {fup.status === 'cancelled' && fup.cancellationReason && (
                            <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px', fontWeight: 600 }} title={fup.cancellationReason}>
                              Reason: {fup.cancellationReason}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            overflowX: 'auto',
                            maxWidth: '100%',
                            padding: '2px 0',
                            scrollbarWidth: 'thin'
                          }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ whiteSpace: 'nowrap', gap: '5px' }}
                              onClick={() => handleToggleFollowupStatus(fup.followupId, fup.status)}
                            >
                              <CheckCircle2 size={14} color={fup.status === 'completed' ? '#10b981' : '#64748b'} />
                              {fup.status === 'completed' ? 'Mark Pending' : 'Mark Done'}
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ whiteSpace: 'nowrap', gap: '5px' }}
                              onClick={() => handleConvertFollowup(fup)}
                            >
                              <Calendar size={14} /> Convert to Apt
                            </button>
                            {fup.status !== 'cancelled' && fup.status !== 'completed' && (
                              <>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ color: '#f59e0b', whiteSpace: 'nowrap', fontWeight: 600 }}
                                  onClick={() => {
                                    setRescheduleFupData({
                                      id: fup.followupId,
                                      scheduledDate: fup.scheduledDate.substring(0, 16),
                                      patientName: fup.patient?.name || fup.patientName || 'Patient'
                                    });
                                    setIsRescheduleFollowupModalOpen(true);
                                  }}
                                  title="Reschedule / Postpone (Select Date & Time)"
                                >
                                  Postpone
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ color: '#ef4444', whiteSpace: 'nowrap', fontWeight: 600 }}
                                  onClick={() => {
                                    setCancelModal({
                                      isOpen: true,
                                      type: 'followup',
                                      id: fup.followupId,
                                      patientName: fup.patient?.name || fup.patientName || 'Patient',
                                      reason: ''
                                    });
                                  }}
                                  title="Cancel Follow-up with Reason"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                })()}
              </tbody>
            </table>
          </div>
          {(() => {
            const filteredCount = followups.filter((fup) => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return (
                (fup.patient?.name && fup.patient.name.toLowerCase().includes(q)) ||
                (fup.patientName && fup.patientName.toLowerCase().includes(q)) ||
                (fup.patient?.phone && fup.patient.phone.includes(q)) ||
                (fup.provider?.name && fup.provider.name.toLowerCase().includes(q)) ||
                (fup.reason && fup.reason.toLowerCase().includes(q)) ||
                (fup.notes && fup.notes.toLowerCase().includes(q))
              );
            }).length;

            return (
              <Pagination
                currentPage={currentFollowupsPage}
                totalItems={filteredCount}
                pageSize={pageSize}
                onPageChange={setCurrentFollowupsPage}
              />
            );
          })()}
        </div>
      )}

      {/* New Appointment Modal */}

      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Schedule New Appointment"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateAppointment} autoComplete="off">
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Select Patient *</label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {patients.length} registered patient{patients.length !== 1 ? 's' : ''}
              </span>
            </div>
            <select
              required
              className="form-select"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            >
              <option value="">Select registered patient...</option>
              {patients.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {p.patientNumber} — {p.name} ({p.phone}) {p.branch?.name ? `• ${p.branch.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          {branchesList.length > 1 && (
            <div className="form-group">
              <label className="form-label">Branch Location *</label>
              <select
                required
                className="form-select"
                value={form.branchId || branch?.branchId || branchesList[0]?.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              >
                {branchesList.map((b) => (
                  <option key={b.branchId} value={b.branchId}>
                    {b.name} {b.isMain ? '(Main)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Doctor / Provider *</label>
              <select
                required
                className="form-select"
                value={form.providerId}
                onChange={(e) => setForm({ ...form, providerId: e.target.value })}
              >
                <option value="">Select doctor...</option>
                {staffList.filter(s => s.designation.includes('Doctor') || s.designation.includes('Surgeon')).map((s) => (
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
                value={form.serviceId}
                onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              >
                <option value="">Select service...</option>
                {servicesList.map((svc) => (
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
                value={form.scheduledStart}
                onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duration (Minutes)</label>
              <select
                className="form-select"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
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
            {(branchFilter === 'br_1b8ebeea30984a7a' || branch?.branchId === 'br_1b8ebeea30984a7a') && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {[
                  'High fever (102°F) with chills',
                  'Severe dry cough & sore throat',
                  'Phlegm & chest congestion',
                  'Acute cold, sneezing & headache',
                  'Viral flu follow-up'
                ].map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    className="badge"
                    style={{ cursor: 'pointer', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '11px', padding: '3px 8px' }}
                    onClick={() => setForm((prev) => ({ ...prev, reason: symptom }))}
                  >
                    + {symptom}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              className="form-input"
              placeholder={(branchFilter === 'br_1b8ebeea30984a7a' || branch?.branchId === 'br_1b8ebeea30984a7a') ? "e.g. High fever (102°F) with chills, dry cough, severe cold" : "e.g. Tooth sensitivity, checkup, filling"}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Book Appointment
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Appointment Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule / Postpone Appointment"
        maxWidth="450px"
      >
        <form onSubmit={handleReschedule} autoComplete="off">
          {rescheduleData.patientName && (
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '14px', fontSize: '13px' }}>
              Patient: <strong style={{ color: '#0f172a' }}>{rescheduleData.patientName}</strong>
            </div>
          )}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>New Postponed Date & Time *</label>
            <input
              type="datetime-local"
              required
              className="form-input"
              value={rescheduleData.scheduledStart}
              onChange={(e) => setRescheduleData({ ...rescheduleData, scheduledStart: e.target.value })}
            />
            <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Select the new date and time slot for the patient consultation.
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRescheduleModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 600 }}>
              Confirm & Postpone
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Appointment Modal with Billing */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Appointment"
        maxWidth="500px"
      >
        {confirmApt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Appointment Info */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, color: '#334155', marginBottom: '10px', fontSize: '14px' }}>Appointment Details</div>
              <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Patient:</span>
                  <strong>{confirmApt.patient?.name || confirmApt.patientName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Doctor:</span>
                  <strong>{confirmApt.provider?.name || staffList.find(s => s.staffId === confirmApt.providerId)?.name || '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Service:</span>
                  <strong>{confirmApt.service?.name || servicesList.find(s => s.serviceId === confirmApt.serviceId)?.name || 'General Consultation'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Schedule:</span>
                  <strong>{new Date(confirmApt.scheduledStart).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                </div>
              </div>
            </div>

            {/* Billing Summary */}
            <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '10px', fontSize: '14px' }}>Billing Summary</div>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(() => {
                  const provider = staffList.find(s => s.staffId === confirmApt.providerId);
                  const svc = servicesList.find(s => s.serviceId === confirmApt.serviceId);
                  return (
                    <>
                      {provider && provider.consultationFee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Consultation Fee ({provider.name}):</span>
                          <strong>₹{provider.consultationFee}</strong>
                        </div>
                      )}
                      {svc && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Service ({svc.name}):</span>
                          <strong>₹{svc.price}</strong>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #bfdbfe', paddingTop: '8px', marginTop: '4px', fontWeight: 700, fontSize: '15px' }}>
                  <span>Total:</span>
                  <span>₹{calculateConfirmTotal()}</span>
                </div>
              </div>
            </div>

            {/* Payment Choice */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Payment</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn ${!confirmBilling.payNow ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setConfirmBilling({ ...confirmBilling, payNow: false })}
                >
                  Pay After Consultation
                </button>
                <button
                  type="button"
                  className={`btn ${confirmBilling.payNow ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setConfirmBilling({ ...confirmBilling, payNow: true })}
                >
                  Pay Now (Advance)
                </button>
              </div>
            </div>

            {/* Pay Now fields */}
            {confirmBilling.payNow && (() => {
              const confirmTotal = calculateConfirmTotal();
              const discountVal = parseFloat(confirmBilling.discount) || 0;
              const finalPrice = Math.max(0, confirmTotal - discountVal);

              return (
                <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Discount (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={confirmBilling.discount}
                        onChange={(e) => {
                          const newDisc = e.target.value;
                          const newFinal = Math.max(0, confirmTotal - (parseFloat(newDisc) || 0));
                          setConfirmBilling({
                            ...confirmBilling,
                            discount: newDisc,
                            paidAmount: newFinal
                          });
                        }}
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Amount Paid (Exact ₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        style={{ borderColor: '#86efac', fontWeight: 700, color: '#166534' }}
                        value={confirmBilling.paidAmount !== '' ? confirmBilling.paidAmount : finalPrice}
                        onChange={(e) => setConfirmBilling({ ...confirmBilling, paidAmount: e.target.value })}
                        placeholder={String(finalPrice)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px', borderTop: '1px solid #bbf7d0', paddingTop: '8px' }}>
                    <span>Final Price (After Discount):</span>
                    <span style={{ color: '#166534' }}>₹{finalPrice}</span>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsConfirmModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmSubmit}>
                {confirmBilling.payNow ? 'Confirm & Process Payment' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Follow-up Modal */}
      <Modal
        isOpen={isRescheduleFollowupModalOpen}
        onClose={() => setIsRescheduleFollowupModalOpen(false)}
        title="Reschedule / Postpone Scheduled Follow-up"
        maxWidth="450px"
      >
        <form onSubmit={handleRescheduleFollowup} autoComplete="off">
          {rescheduleFupData.patientName && (
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '14px', fontSize: '13px' }}>
              Patient: <strong style={{ color: '#0f172a' }}>{rescheduleFupData.patientName}</strong>
            </div>
          )}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>New Scheduled Date & Time *</label>
            <input
              type="datetime-local"
              required
              className="form-input"
              value={rescheduleFupData.scheduledDate}
              onChange={(e) => setRescheduleFupData({ ...rescheduleFupData, scheduledDate: e.target.value })}
            />
            <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Select the new recall date and time slot.
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRescheduleFollowupModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 600 }}>
              Confirm & Postpone
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Appointment / Follow-up with Reason Modal */}
      <Modal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, type: 'appointment', id: null, patientName: '', reason: '' })}
        title={`Cancel ${cancelModal.type === 'appointment' ? 'Appointment' : 'Scheduled Follow-up'}`}
        maxWidth="480px"
      >
        <form onSubmit={handleCancelSubmit} autoComplete="off">
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#991b1b', fontWeight: 700 }}>
              Are you sure you want to cancel this {cancelModal.type === 'appointment' ? 'appointment' : 'follow-up'}?
            </div>
            {cancelModal.patientName && (
              <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>
                Patient: <strong>{cancelModal.patientName}</strong>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>Reason for Cancellation *</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {[
                'Patient requested cancellation',
                'Doctor unavailable / Emergency',
                'Patient feeling better / Not required',
                'Duplicate booking',
                'Rescheduled for another clinic branch'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="badge"
                  style={{ cursor: 'pointer', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => setCancelModal(prev => ({ ...prev, reason: preset }))}
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              required
              rows={3}
              className="form-textarea"
              placeholder="Provide detailed cancellation reason for audit and patient history..."
              value={cancelModal.reason}
              onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCancelModal({ isOpen: false, type: 'appointment', id: null, patientName: '', reason: '' })}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              style={{ padding: '8px 18px', fontWeight: 700 }}
            >
              Confirm Cancellation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
