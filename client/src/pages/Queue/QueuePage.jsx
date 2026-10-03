import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import {
  Clock,
  UserCheck,
  Megaphone,
  Stethoscope,
  CheckCircle2,
  Plus,
  SkipForward,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

const QueuePage = () => {
  const { branch, hasPermission } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState(() => branch?.branchId || 'all');
  const [branchesList, setBranchesList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  // Walk-in Modal state
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    patientId: '',
    providerId: '',
    serviceId: '',
    branchId: branch?.branchId || '',
    priority: 'normal',
    paymentStatus: 'paid',
    caseType: 'new',
    notes: ''
  });

  useEffect(() => {
    if (branch?.branchId) {
      const isOverall = branch.branchId === 'overall';
      setBranchFilter(isOverall ? 'all' : branch.branchId);
      setWalkInForm((prev) => ({
        ...prev,
        branchId: isOverall ? (branchesList[0]?.branchId || '') : branch.branchId
      }));
    }
  }, [branch?.branchId, branchesList]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await api.getQueue({
        branchId: (branchFilter === 'all' || branchFilter === 'overall') ? undefined : (branchFilter || undefined),
        providerId: providerFilter || undefined,
        status: undefined // Backend returns waiting, called, in_consultation
      });
      setQueue(data || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [providerFilter, branchFilter]);

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [staff, pats, svcs, branches] = await Promise.all([
          api.getStaff({ branchId: branchFilter === 'all' ? undefined : (branchFilter || undefined) }),
          api.getPatients({ limit: 500, branchId: 'all' }),
          api.getServices(),
          api.getBranches()
        ]);
        setStaffList(staff || []);
        setPatientsList(pats || []);
        setServicesList(svcs || []);
        setBranchesList(branches || []);
        if (branches && branches.length > 0 && !walkInForm.branchId) {
          setWalkInForm(prev => ({ ...prev, branchId: branch?.branchId || branches[0].branchId }));
        }
      } catch (e) {
        // Non-blocking
      }
    };
    loadPrerequisites();

    if (searchParams.get('action') === 'walkin') {
      setIsWalkInOpen(true);
    }
  }, [branchFilter, branch?.branchId]);

  useEffect(() => {
    if (isWalkInOpen) {
      api.getPatients({ limit: 500, branchId: 'all' }).then(pats => {
        if (pats) setPatientsList(pats);
      }).catch(() => {});
    }
  }, [isWalkInOpen]);

  const handleCall = async (queueEntryId) => {
    try {
      const res = await api.callQueuePatient(queueEntryId);
      addToast(res.message || 'Token called', 'info');
      fetchQueue();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleStartConsultation = async (entry) => {
    try {
      const res = await api.startConsultation(entry.queueEntryId);
      addToast('Consultation started! Opening Clinical Workspace...', 'success');
      // Direct navigation into Clinical Workspace
      navigate(`/clinical/encounters/${entry.encounterId}`);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleComplete = async (queueEntryId) => {
    try {
      await api.completeQueue(queueEntryId);
      addToast('Patient consultation completed', 'success');
      fetchQueue();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSkip = async (queueEntryId) => {
    try {
      await api.skipQueue(queueEntryId);
      addToast('Token marked as skipped', 'warning');
      fetchQueue();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleRestore = async (queueEntryId) => {
    try {
      await api.restoreQueue(queueEntryId);
      addToast('Token restored to waiting', 'success');
      fetchQueue();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.registerWalkIn({
        ...walkInForm,
        branchId: walkInForm.branchId || branch?.branchId
      });
      addToast(res.message || 'Walk-in registered successfully', 'success');
      setIsWalkInOpen(false);
      setWalkInForm({
        patientId: '',
        providerId: '',
        serviceId: '',
        branchId: branch?.branchId || '',
        priority: 'normal',
        paymentStatus: 'paid',
        caseType: 'new',
        notes: ''
      });
      fetchQueue();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Group tokens by column
  const waitingTokens = queue.filter((q) => q.status === 'waiting');
  const calledTokens = queue.filter((q) => q.status === 'called');
  const activeConsultationTokens = queue.filter((q) => q.status === 'in_consultation');
  const skippedTokens = queue.filter((q) => q.status === 'skipped');

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px' }}>Live Patient Queue</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Continuous operating desk for tokens, consultation dispatch, and walk-in arrivals
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchQueue}>
            <RotateCcw size={14} /> Refresh Board
          </button>
          {hasPermission('queue.manage') && (
            <button className="btn btn-primary" onClick={() => setIsWalkInOpen(true)}>
              <Plus size={16} /> Register Walk-in
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Branch:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px' }}
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                <option value="all">All Branches</option>
                {branchesList.map((b) => (
                  <option key={b.branchId} value={b.branchId}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Filter by Doctor:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px' }}
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
              >
                <option value="">All Doctors & OPDs</option>
                {staffList.filter(s => s.designation.includes('Doctor') || s.designation.includes('Surgeon')).map((s) => (
                  <option key={s.staffId} value={s.staffId}>{s.name} ({s.specialty})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Total in queue: <strong>{queue.length}</strong>
          </div>
        </div>
      </div>

      {/* 3-Column Kanban Style Queue Board */}
      <div className="queue-board">
        {/* Column 1: Waiting */}
        <div className="queue-col">
          <div className="queue-col-header">
            <span style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="#0284c7" /> Waiting ({waitingTokens.length})
            </span>
          </div>

          {waitingTokens.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 10px', fontSize: '13px' }}>
              No patients waiting in queue.
            </p>
          ) : (
            waitingTokens.map((entry) => (
              <div key={entry.queueEntryId} className="queue-token-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="token-pill">{entry.tokenNumber}</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {entry.branch?.name && (
                      <span className="badge badge-neutral" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                        {entry.branch.name}
                      </span>
                    )}
                    {entry.priority === 'urgent' && <span className="badge badge-danger">Urgent</span>}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{entry.patient?.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {entry.patient?.patientNumber} • {entry.service?.name || 'Consultation'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    Dr: {entry.provider?.name || 'Unassigned'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleCall(entry.queueEntryId)}
                  >
                    <Megaphone size={13} /> Call
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSkip(entry.queueEntryId)}
                    title="Skip"
                  >
                    <SkipForward size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Column 2: Called */}
        <div className="queue-col" style={{ background: '#fffbeb', borderColor: '#fef3c7' }}>
          <div className="queue-col-header" style={{ borderColor: '#fde68a' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309' }}>
              <Megaphone size={16} /> Called to Room ({calledTokens.length})
            </span>
          </div>

          {calledTokens.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 10px', fontSize: '13px' }}>
              No called patients right now.
            </p>
          ) : (
            calledTokens.map((entry) => (
              <div key={entry.queueEntryId} className="queue-token-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="token-pill" style={{ background: '#fef3c7', color: '#b45309' }}>
                    {entry.tokenNumber}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {entry.branch?.name && (
                      <span className="badge badge-neutral" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                        {entry.branch.name}
                      </span>
                    )}
                    <span className="badge badge-warning">Called</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{entry.patient?.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {entry.patient?.patientNumber} • {entry.service?.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    Called at {new Date(entry.calledAt || entry.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button
                    className="btn btn-success btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleStartConsultation(entry)}
                  >
                    <Stethoscope size={13} /> Start Consultation
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCall(entry.queueEntryId)}
                    title="Recall"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Column 3: In Consultation */}
        <div className="queue-col" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
          <div className="queue-col-header" style={{ borderColor: '#bbf7d0' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d' }}>
              <Stethoscope size={16} /> In Consultation ({activeConsultationTokens.length})
            </span>
          </div>

          {activeConsultationTokens.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 10px', fontSize: '13px' }}>
              No consultations currently active.
            </p>
          ) : (
            activeConsultationTokens.map((entry) => (
              <div key={entry.queueEntryId} className="queue-token-card" style={{ borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="token-pill" style={{ background: '#d1fae5', color: '#065f46' }}>
                    {entry.tokenNumber}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {entry.branch?.name && (
                      <span className="badge badge-neutral" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                        {entry.branch.name}
                      </span>
                    )}
                    <span className="badge badge-success">With Doctor</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{entry.patient?.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {entry.patient?.patientNumber} • Dr. {entry.provider?.name}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => navigate(`/clinical/encounters/${entry.encounterId}`)}
                  >
                    <Stethoscope size={13} /> Open Workspace
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleComplete(entry.queueEntryId)}
                    title="Mark Done"
                  >
                    <CheckCircle2 size={14} color="#10b981" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Column 4: Skipped */}
        <div className="queue-col" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
          <div className="queue-col-header" style={{ borderColor: '#fca5a5' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c' }}>
              <SkipForward size={16} /> Skipped ({skippedTokens.length})
            </span>
          </div>

          {skippedTokens.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 10px', fontSize: '13px' }}>
              No skipped tokens.
            </p>
          ) : (
            skippedTokens.map((entry) => (
              <div key={entry.queueEntryId} className="queue-token-card" style={{ borderLeft: '4px solid #ef4444', opacity: 0.85 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="token-pill" style={{ background: '#fee2e2', color: '#991b1b' }}>
                    {entry.tokenNumber}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {entry.branch?.name && (
                      <span className="badge badge-neutral" style={{ fontSize: '10.5px', padding: '2px 6px' }}>
                        {entry.branch.name}
                      </span>
                    )}
                    <span className="badge badge-danger">Skipped</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{entry.patient?.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {entry.patient?.patientNumber} • Dr. {entry.provider?.name || 'Unassigned'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleRestore(entry.queueEntryId)}
                  >
                    <RotateCcw size={13} /> Restore to Waiting
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Walk-in Registration Modal */}
      <Modal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        title="Register Patient Walk-in"
        maxWidth="500px"
      >
        <form onSubmit={handleWalkInSubmit} autoComplete="off">
          {branchesList.length > 1 && (
            <div className="form-group">
              <label className="form-label">Branch Location *</label>
              <select
                required
                className="form-select"
                value={walkInForm.branchId}
                onChange={(e) => setWalkInForm({ ...walkInForm, branchId: e.target.value })}
              >
                {branchesList.map((b) => (
                  <option key={b.branchId} value={b.branchId}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Select Patient *</label>
              <button 
                type="button" 
                onClick={() => {
                  setIsWalkInOpen(false);
                  navigate('/patients?action=new');
                }}
                style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={12} /> Register New Patient
              </button>
            </div>
            <select
              required
              className="form-select"
              value={walkInForm.patientId}
              onChange={(e) => setWalkInForm({ ...walkInForm, patientId: e.target.value })}
            >
              <option value="">Select registered patient...</option>
              {patientsList.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {p.patientNumber} — {p.name} ({p.phone}) {p.branch?.name ? `• ${p.branch.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Doctor / Room *</label>
            <select
              required
              className="form-select"
              value={walkInForm.providerId}
              onChange={(e) => setWalkInForm({ ...walkInForm, providerId: e.target.value })}
            >
              <option value="">Assign Doctor...</option>
              {staffList.filter(s => s.designation.includes('Doctor') || s.designation.includes('Surgeon')).map((s) => (
                <option key={s.staffId} value={s.staffId}>
                  {s.name} ({s.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Choice</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="paymentStatus"
                    value="paid"
                    checked={walkInForm.paymentStatus === 'paid'}
                    onChange={(e) => setWalkInForm({ ...walkInForm, paymentStatus: e.target.value })}
                  /> Pay Now
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="paymentStatus"
                    value="pending"
                    checked={walkInForm.paymentStatus === 'pending'}
                    onChange={(e) => setWalkInForm({ ...walkInForm, paymentStatus: e.target.value })}
                  /> Pay After Consultancy
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Visit Type</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="caseType"
                    value="new"
                    checked={walkInForm.caseType === 'new'}
                    onChange={(e) => setWalkInForm({ ...walkInForm, caseType: e.target.value })}
                  /> New Case
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="caseType"
                    value="follow_up"
                    checked={walkInForm.caseType === 'follow_up'}
                    onChange={(e) => setWalkInForm({ ...walkInForm, caseType: e.target.value })}
                  /> Continue Treatment
                </label>
              </div>
            </div>
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
            <label className="form-label">Priority</label>
            <select
              className="form-select"
              value={walkInForm.priority}
              onChange={(e) => setWalkInForm({ ...walkInForm, priority: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="urgent">{(branchFilter === 'br_1b8ebeea30984a7a' || branch?.branchId === 'br_1b8ebeea30984a7a') ? 'Urgent / High Fever (>102°F)' : 'Urgent / Severe Pain'}</option>
              <option value="vip">Senior Citizen / Priority</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Visit Notes / Chief Symptom</label>
            {(branchFilter === 'br_1b8ebeea30984a7a' || branch?.branchId === 'br_1b8ebeea30984a7a') && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {[
                  'High Fever (102°F) & Shivering',
                  'Severe Dry Cough',
                  'Phlegm & Chest Congestion',
                  'Acute Cold & Sneezing'
                ].map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    className="badge"
                    style={{ cursor: 'pointer', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '11px', padding: '3px 8px' }}
                    onClick={() => setWalkInForm((prev) => ({ ...prev, notes: symptom }))}
                  >
                    + {symptom}
                  </button>
                ))}
              </div>
            )}
            <textarea
              rows={2}
              className="form-textarea"
              placeholder={(branchFilter === 'br_1b8ebeea30984a7a' || branch?.branchId === 'br_1b8ebeea30984a7a') ? "e.g. High fever 102°F, continuous shivering, throat pain" : "e.g. Swelling, toothache"}
              value={walkInForm.notes}
              onChange={(e) => setWalkInForm({ ...walkInForm, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsWalkInOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Issue Queue Token
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QueuePage;
