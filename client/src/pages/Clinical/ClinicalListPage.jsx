import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Stethoscope, Clock, CheckCircle2, Search, Eye } from 'lucide-react';
import Pagination from '../../components/Pagination';

const ClinicalListPage = () => {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { branch } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchEncounters = async () => {
    try {
      setLoading(true);
      const data = await api.getEncounters({
        branchId: (branch?.branchId === 'overall' || branch?.branchId === 'all') ? undefined : branch?.branchId,
        status: statusFilter || undefined
      });
      setEncounters(data || []);
      setCurrentPage(1);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncounters();
  }, [statusFilter, branch?.branchId]);

  const filteredEncounters = encounters.filter((enc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      enc.patient?.name?.toLowerCase().includes(q) ||
      enc.patient?.phone?.includes(q) ||
      enc.patient?.patientNumber?.toLowerCase().includes(q) ||
      enc.provider?.name?.toLowerCase().includes(q) ||
      enc.service?.name?.toLowerCase().includes(q)
    );
  });

  const paginatedEncounters = filteredEncounters.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px' }}>Clinical Encounters</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Doctor consultations, patient examinations, procedures, and prescriptions
          </p>
        </div>
      </div>

      {/* Filter Bar with Search */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px', maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '32px' }}
                placeholder="Search patient name, phone, or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Encounters</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Encounters Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '150px' }}>Date & Time</th>
                <th style={{ minWidth: '160px' }}>Patient</th>
                <th style={{ minWidth: '150px' }}>Doctor</th>
                <th style={{ minWidth: '120px' }}>Branch</th>
                <th style={{ minWidth: '150px' }}>Service / Reason</th>
                <th style={{ minWidth: '120px' }}>Encounter Type</th>
                <th style={{ minWidth: '110px' }}>Status</th>
                <th style={{ textAlign: 'right', minWidth: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>Loading encounters...</td></tr>
              ) : encounters.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No encounters found.
                  </td>
                </tr>
              ) : (
                paginatedEncounters.map((enc) => (
                  <tr key={enc.encounterId}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {new Date(enc.startedAt || enc.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{enc.patient?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {enc.patient?.patientNumber} • {enc.patient?.phone}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{enc.provider?.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{enc.provider?.specialty}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                        {enc.branch?.name || 'Main Branch'}
                      </span>
                    </td>
                    <td>{enc.service?.name || 'Consultation'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{enc.encounterType}</td>
                    <td>
                      <span className={`badge ${enc.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {enc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`/clinical/encounters/${enc.encounterId}`)}
                      >
                        <Stethoscope size={13} /> {enc.status === 'completed' ? 'View Record' : 'Open Workspace'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={filteredEncounters.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default ClinicalListPage;
