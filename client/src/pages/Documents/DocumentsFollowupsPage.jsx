import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import {
  FolderArchive,
  CheckCircle2,
  Plus,
  Calendar,
  FileText,
  Search,
  Upload,
  Download
} from 'lucide-react';

const DocumentsFollowupsPage = () => {
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' or 'followups'
  const [documents, setDocuments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDocPage, setCurrentDocPage] = useState(1);
  const [currentFupPage, setCurrentFupPage] = useState(1);
  const pageSize = 10;

  // Upload Document Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'X-Ray',
    entityType: 'patient',
    entityId: '',
    fileUrl: '/uploads/sample_document.pdf'
  });

  // New Follow-up Modal
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [isRescheduleFollowupModalOpen, setIsRescheduleFollowupModalOpen] = useState(false);
  const [rescheduleFupData, setRescheduleFupData] = useState({ id: null, scheduledDate: '' });
  const [followupForm, setFollowupForm] = useState({
    patientId: '',
    providerId: '',
    scheduledDate: '',
    reason: '',
    notes: ''
  });

  const [patients, setPatients] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const { branch, hasPermission } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docs, fups] = await Promise.all([
        api.getDocuments({ branchId: branch?.branchId }),
        api.getFollowUps({ branchId: branch?.branchId })
      ]);
      setDocuments(docs || []);
      setFollowups(fups || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branch?.branchId]);

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [pats, staff] = await Promise.all([
          api.getPatients({ limit: 100 }),
          api.getStaff({ branchId: branch?.branchId })
        ]);
        setPatients(pats || []);
        setStaffList(staff || []);
      } catch (e) {
        // Non-blocking
      }
    };
    loadPrerequisites();

    if (searchParams.get('action') === 'upload') {
      setIsDocModalOpen(true);
    }
    if (searchParams.get('tab') === 'followups') {
      setActiveTab('followups');
    }
  }, [branch?.branchId]);

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    try {
      await api.uploadDocument({
        ...docForm,
        branchId: branch?.branchId
      });
      addToast('Document metadata saved and attached!', 'success');
      setIsDocModalOpen(false);
      setDocForm({
        title: '',
        category: 'X-Ray',
        entityType: 'patient',
        entityId: '',
        fileUrl: '/uploads/sample_document.pdf'
      });
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCreateFollowup = async (e) => {
    e.preventDefault();
    try {
      await api.createFollowUp({
        ...followupForm,
        branchId: branch?.branchId
      });
      addToast('Follow-up scheduled successfully!', 'success');
      setIsFollowupModalOpen(false);
      setFollowupForm({
        patientId: '',
        providerId: '',
        scheduledDate: '',
        reason: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleRescheduleFollowup = async (e) => {
    e.preventDefault();
    try {
      await api.updateFollowUp(rescheduleFupData.id, { scheduledDate: rescheduleFupData.scheduledDate });
      addToast('Follow-up rescheduled successfully!', 'success');
      setIsRescheduleFollowupModalOpen(false);
      setRescheduleFupData({ id: null, scheduledDate: '' });
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleToggleFollowupStatus = async (followupId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
      await api.updateFollowUp(followupId, { status: newStatus });
      addToast(`Follow-up marked as ${newStatus}`, 'info');
      fetchData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px' }}>Documents & Follow-ups</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Supporting patient clinical records, diagnostic attachments, and recall schedules
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'documents' && (
            <button className="btn btn-primary" onClick={() => setIsDocModalOpen(true)}>
              <Upload size={16} /> Upload Document
            </button>
          )}
          {activeTab === 'followups' && (
            <button className="btn btn-primary" onClick={() => setIsFollowupModalOpen(true)}>
              <Plus size={16} /> Schedule Follow-up
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents & Radiographs ({documents.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'followups' ? 'active' : ''}`}
          onClick={() => setActiveTab('followups')}
        >
          Scheduled Appointments ({followups.length})
        </button>
      </div>

      {/* Tab 1: Documents */}
      {activeTab === 'documents' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title & Name</th>
                  <th>Category</th>
                  <th>Linked Entity</th>
                  <th>Upload Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>Loading documents...</td></tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No documents attached yet.
                    </td>
                  </tr>
                ) : (
                  documents.slice((currentDocPage - 1) * pageSize, currentDocPage * pageSize).map((doc) => (
                    <tr key={doc.documentId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{doc.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{doc.fileName}</div>
                      </td>
                      <td><span className="badge badge-info">{doc.category}</span></td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {doc.entityType} ({doc.entityId})
                      </td>
                      <td>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <Download size={13} /> View / Download
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentDocPage}
            totalItems={documents.length}
            pageSize={pageSize}
            onPageChange={setCurrentDocPage}
          />
        </div>
      )}

      {/* Tab 2: Follow-ups */}
      {activeTab === 'followups' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '130px' }}>Scheduled Date</th>
                  <th style={{ minWidth: '160px' }}>Patient</th>
                  <th style={{ minWidth: '150px' }}>Doctor</th>
                  <th style={{ minWidth: '200px' }}>Reason / Clinical Purpose</th>
                  <th style={{ minWidth: '110px' }}>Status</th>
                  <th style={{ textAlign: 'right', minWidth: '280px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>Loading follow-ups...</td></tr>
                ) : followups.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No scheduled follow-up visits.
                    </td>
                  </tr>
                ) : (
                  followups.slice((currentFupPage - 1) * pageSize, currentFupPage * pageSize).map((fup) => (
                    <tr key={fup.followupId}>
                      <td style={{ fontWeight: 700, fontSize: '13.5px', whiteSpace: 'nowrap' }}>
                        {new Date(fup.scheduledDate).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <div
                          style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}
                          onClick={() => navigate(`/patients/${fup.patientId}`)}
                        >
                          {fup.patient?.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fup.patient?.phone}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fup.provider?.name || 'Assigned Doctor'}</td>
                      <td>
                        <div>{fup.reason}</div>
                        {fup.notes && <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{fup.notes}</div>}
                      </td>
                      <td>
                        <span className={`badge ${fup.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                          {fup.status}
                        </span>
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
                            onClick={() => navigate(`/appointments?patientId=${fup.patientId}&action=new`)}
                          >
                            <Calendar size={14} /> Convert to Apt
                          </button>
                          {fup.status !== 'cancelled' && fup.status !== 'completed' && (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#f59e0b', whiteSpace: 'nowrap', fontWeight: 600 }}
                                onClick={() => {
                                  setRescheduleFupData({ id: fup.followupId, scheduledDate: fup.scheduledDate.substring(0, 10) });
                                  setIsRescheduleFollowupModalOpen(true);
                                }}
                                title="Reschedule / Postpone"
                              >
                                Postpone
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#ef4444', whiteSpace: 'nowrap', fontWeight: 600 }}
                                onClick={async () => {
                                  if (window.confirm('Cancel this follow-up?')) {
                                    await api.updateFollowUp(fup.followupId, { status: 'cancelled' });
                                    addToast('Follow-up cancelled', 'info');
                                    fetchData();
                                  }
                                }}
                                title="Cancel Follow-up"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentFupPage}
            totalItems={followups.length}
            pageSize={pageSize}
            onPageChange={setCurrentFupPage}
          />
        </div>
      )}

      {/* Upload Document Modal */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Attach Document"
        maxWidth="500px"
      >
        <form onSubmit={handleUploadDocument}>
          <div className="form-group">
            <label className="form-label">Document Title *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Tooth #46 Pre-op Radiograph"
              value={docForm.title}
              onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Document Category</label>
            <select
              className="form-select"
              value={docForm.category}
              onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
            >
              <option value="X-Ray">Dental X-Ray / RVG</option>
              <option value="Lab Report">Laboratory Report</option>
              <option value="Prescription">Prescription Scan</option>
              <option value="Consent">Consent Form</option>
              <option value="ID Proof">Government ID Proof</option>
              <option value="General">General Record</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Attach To Patient *</label>
            <select
              required
              className="form-select"
              value={docForm.entityId}
              onChange={(e) => setDocForm({ ...docForm, entityId: e.target.value })}
            >
              <option value="">Select Patient...</option>
              {patients.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {p.patientNumber} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Document File URL</label>
            <input
              type="text"
              className="form-input"
              value={docForm.fileUrl}
              onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsDocModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Document
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={isFollowupModalOpen}
        onClose={() => setIsFollowupModalOpen(false)}
        title="Schedule Patient Recall / Follow-up"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateFollowup}>
          <div className="form-group">
            <label className="form-label">Patient *</label>
            <select
              required
              className="form-select"
              value={followupForm.patientId}
              onChange={(e) => setFollowupForm({ ...followupForm, patientId: e.target.value })}
            >
              <option value="">Select Patient...</option>
              {patients.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {p.patientNumber} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Doctor *</label>
            <select
              required
              className="form-select"
              value={followupForm.providerId}
              onChange={(e) => setFollowupForm({ ...followupForm, providerId: e.target.value })}
            >
              <option value="">Select Doctor...</option>
              {staffList.filter(s => s.designation.includes('Doctor') || s.designation.includes('Surgeon')).map((s) => (
                <option key={s.staffId} value={s.staffId}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Scheduled Date *</label>
            <input
              type="date"
              required
              className="form-input"
              value={followupForm.scheduledDate}
              onChange={(e) => setFollowupForm({ ...followupForm, scheduledDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Purpose / Reason *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Suture removal, RCT 2nd sitting, Crown cementation"
              value={followupForm.reason}
              onChange={(e) => setFollowupForm({ ...followupForm, reason: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFollowupModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Schedule Recall
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Follow-up Modal */}
      <Modal
        isOpen={isRescheduleFollowupModalOpen}
        onClose={() => setIsRescheduleFollowupModalOpen(false)}
        title="Reschedule / Postpone Follow-up"
        maxWidth="400px"
      >
        <form onSubmit={handleRescheduleFollowup} autoComplete="off">
          <div className="form-group">
            <label className="form-label">New Scheduled Date *</label>
            <input
              type="date"
              required
              className="form-input"
              value={rescheduleFupData.scheduledDate}
              onChange={(e) => setRescheduleFupData({ ...rescheduleFupData, scheduledDate: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRescheduleFollowupModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: '#f59e0b', color: '#fff', border: 'none' }}>
              Confirm Reschedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DocumentsFollowupsPage;
