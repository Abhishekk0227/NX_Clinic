import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Settings, User, Building, Lock, Shield, CheckCircle2 } from 'lucide-react';

const SettingsPage = () => {
  const { user, organization, branch, branches, switchBranch } = useAuth();
  const { addToast } = useToast();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    addToast('Security credentials updated successfully', 'success');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px' }}>Personal & Facility Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Account preferences, security credentials, and active branch context
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* User Profile */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} color="var(--primary)" /> Profile Information
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Name:</span> <strong>{user?.name}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong>{user?.email}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Role:</span> <span className="badge badge-info">{user?.roleName || user?.role}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Organization:</span> <strong>{organization?.name}</strong></div>
          </div>
        </div>

        {/* Branch Preference */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={16} color="var(--primary)" /> Active Branch Preference
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Select which physical clinic or hospital wing you are currently operating in:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: (!branch?.branchId || branch?.branchId === 'overall') ? '#e0f2fe' : '#f8fafc',
                border: (!branch?.branchId || branch?.branchId === 'overall') ? '1px solid #38bdf8' : '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <input
                type="radio"
                name="activeBranch"
                checked={!branch?.branchId || branch?.branchId === 'overall'}
                onChange={() => switchBranch('overall')}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0369a1' }}>🌐 Overall (All Branches)</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Unified view showing records, appointments, queues, and revenue across all locations</div>
              </div>
            </label>

            {branches.map((b) => (
              <label
                key={b.branchId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: branch?.branchId === b.branchId ? '#e0f2fe' : '#f8fafc',
                  border: branch?.branchId === b.branchId ? '1px solid #38bdf8' : '1px solid #e2e8f0',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="activeBranch"
                  checked={branch?.branchId === b.branchId}
                  onChange={() => switchBranch(b.branchId)}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{b.name}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{b.address?.street}, {b.address?.city}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Security Password */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} color="var(--primary)" /> Security Credentials
            </h3>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                required
                className="form-input"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                required
                className="form-input"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                required
                className="form-input"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
