import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Calendar,
  Clock,
  IndianRupee,
  AlertCircle,
  FileCheck,
  UserPlus,
  PlusCircle,
  CheckCircle2,
  Stethoscope,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { user, branch, hasPermission } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats({ branchId: branch?.branchId });
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [branch?.branchId]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading live operational dashboard...</div>;
  }

  const kpis = stats?.kpis || {};

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>
            Good day, {user?.name?.split(' ')[0]}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Operational Overview for <strong>{branch?.name || 'All Locations'}</strong> • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Role-Aware Quick Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {hasPermission('patients.create') && (
            <button className="btn btn-primary" onClick={() => navigate('/patients?action=new')}>
              <UserPlus size={16} /> New Patient
            </button>
          )}
          {hasPermission('appointments.create') && (
            <button className="btn btn-secondary" onClick={() => navigate('/appointments?action=new')}>
              <Calendar size={16} /> Book Appointment
            </button>
          )}
          {hasPermission('queue.manage') && (
            <button className="btn btn-secondary" onClick={() => navigate('/queue?action=walkin')}>
              <Clock size={16} /> Walk-in
            </button>
          )}
          {hasPermission('billing.create') && (
            <button className="btn btn-secondary" onClick={() => navigate('/billing?action=new_invoice')}>
              <PlusCircle size={16} /> New Bill
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => navigate('/patients')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="kpi-val">{kpis.totalPatients || 0}</div>
            <div className="kpi-label">Registered Patients</div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/appointments')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="kpi-val">{kpis.todayAppointments || 0}</div>
            <div className="kpi-label">Today's Appointments</div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate('/queue')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrap" style={{ background: '#fce7f3', color: '#db2777' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="kpi-val">{kpis.todayQueue || 0}</div>
            <div className="kpi-label">Active in Queue</div>
          </div>
        </div>

        {hasPermission('billing.view') && (
          <div className="kpi-card" onClick={() => navigate('/billing')} style={{ cursor: 'pointer' }}>
            <div className="kpi-icon-wrap" style={{ background: '#d1fae5', color: '#059669' }}>
              <IndianRupee size={24} />
            </div>
            <div>
              <div className="kpi-val">₹{Number(kpis.todayRevenue || 0).toLocaleString('en-IN')}</div>
              <div className="kpi-label">Today's Revenue</div>
            </div>
          </div>
        )}

        {hasPermission('billing.view') && (
          <div className="kpi-card" onClick={() => navigate('/billing')} style={{ cursor: 'pointer' }}>
            <div className="kpi-icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <div className="kpi-val">₹{Number(kpis.totalOutstanding || 0).toLocaleString('en-IN')}</div>
              <div className="kpi-label">Outstanding Balance</div>
            </div>
          </div>
        )}

        {kpis.pendingVerificationPayments > 0 && (
          <div className="kpi-card" onClick={() => navigate('/billing?tab=verification')} style={{ cursor: 'pointer', border: '1px solid #f59e0b' }}>
            <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#b45309' }}>
              <FileCheck size={24} />
            </div>
            <div>
              <div className="kpi-val" style={{ color: '#b45309' }}>{kpis.pendingVerificationPayments}</div>
              <div className="kpi-label">Payments to Verify</div>
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Operational Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Today's Live Queue Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '16px' }}>Today's Live Queue</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time patient waiting and consultation status</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/queue')}>
              Open Queue Board <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.todayQueue?.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No patients in queue currently.
                    </td>
                  </tr>
                ) : (
                  stats?.todayQueue?.map((q) => (
                    <tr key={q.queueEntryId}>
                      <td>
                        <span className="token-pill" style={{ fontSize: '13px', padding: '2px 8px' }}>
                          {q.tokenNumber}
                        </span>
                        {q.branch?.name && (
                          <div style={{ marginTop: '2px' }}>
                            <span className="badge badge-neutral" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                              {q.branch.name}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{q.patient?.name || 'Walk-in'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{q.patient?.patientNumber}</div>
                      </td>
                      <td>{q.provider?.name || 'Assigned Doctor'}</td>
                      <td>
                        <span className={`badge ${
                          q.status === 'in_consultation' ? 'badge-info' :
                          q.status === 'called' ? 'badge-warning' : 'badge-neutral'
                        }`}>
                          {q.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {q.status === 'in_consultation' ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate(`/clinical/encounters/${q.encounterId}`)}
                          >
                            <Stethoscope size={13} /> Open
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate('/queue')}
                          >
                            Manage
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

        {/* Today's Appointments Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '16px' }}>Today's Scheduled Appointments</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Patients booked for consultation today</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/appointments')}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.todayAppointments?.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No more appointments scheduled for today.
                    </td>
                  </tr>
                ) : (
                  stats?.todayAppointments?.map((apt) => (
                    <tr key={apt.appointmentId}>
                      <td style={{ fontWeight: 600 }}>
                        <div>{new Date(apt.scheduledStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                        {apt.branch?.name && (
                          <div style={{ marginTop: '2px' }}>
                            <span className="badge badge-neutral" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                              {apt.branch.name}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{apt.patient?.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{apt.patient?.phone}</div>
                      </td>
                      <td>{apt.provider?.name}</td>
                      <td>
                        <span className={`badge ${
                          apt.status === 'completed' ? 'badge-success' :
                          apt.status === 'checked_in' ? 'badge-info' :
                          apt.status === 'confirmed' ? 'badge-warning' : 'badge-neutral'
                        }`}>
                          {apt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {apt.status === 'scheduled' || apt.status === 'confirmed' ? (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={async () => {
                              try {
                                await api.checkInAppointment(apt.appointmentId);
                                addToast('Appointment checked in and queued!', 'success');
                                fetchStats();
                              } catch (e) {
                                addToast(e.message, 'error');
                              }
                            }}
                          >
                            <CheckCircle2 size={13} /> Check In
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate('/appointments')}
                          >
                            View
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
      </div>

      {/* Recent Patients */}
      <div style={{ marginTop: '20px' }}>
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '15px' }}>Recently Registered Patients</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/patients')}>
              Patients Directory <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Balance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentPatients?.map((p) => (
                  <tr key={p.patientId}>
                    <td>
                      <span className="badge badge-info">{p.patientNumber}</span>
                      {p.branch?.name && (
                        <div style={{ marginTop: '2px' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                            {p.branch.name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.phone}</td>
                    <td style={{ fontWeight: 600, color: p.balance > 0 ? '#ef4444' : '#10b981' }}>
                      ₹{p.balance || 0}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/patients/${p.patientId}`)}
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
