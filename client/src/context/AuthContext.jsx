import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [branch, setBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('hms_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.me();
        setUser(data.user);
        setOrganization(data.organization);
        setBranches(data.branches || []);

        const savedBranchId = localStorage.getItem('hms_branch_id');
        if (savedBranchId === 'overall') {
          setBranch({
            branchId: 'overall',
            name: 'Overall (All Branches)',
            code: 'ALL',
            isOverall: true
          });
        } else {
          setBranch(data.branch || {
            branchId: 'overall',
            name: 'Overall (All Branches)',
            code: 'ALL',
            isOverall: true
          });
          if (data.branch?.branchId) {
            localStorage.setItem('hms_branch_id', data.branch.branchId);
          }
        }
      } catch (err) {
        console.error('Session restore failed:', err);
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_branch_id');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.login({ email, password });
      localStorage.setItem('hms_token', data.token);
      setUser(data.user);
      setOrganization(data.organization);
      setBranch(data.branch);
      if (data.branch?.branchId) {
        localStorage.setItem('hms_branch_id', data.branch.branchId);
      }

      // Fetch all branches
      try {
        const branchesData = await api.getBranches();
        setBranches(branchesData);
      } catch (e) {
        // Non-blocking
      }

      addToast(`Welcome back, ${data.user.name}!`, 'success');
      return data;
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_branch_id');
    setUser(null);
    setOrganization(null);
    setBranch(null);
    setBranches([]);
    addToast('Logged out successfully', 'info');
  };

  const switchBranch = async (branchId) => {
    try {
      const res = await api.switchBranch(branchId);
      setBranch(res.branch);
      localStorage.setItem('hms_branch_id', res.branch.branchId);
      addToast(`Switched active location to ${res.branch.name}`, 'info');
      window.location.reload(); // Reload to refresh branch-scoped queries
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const hasPermission = (permissionKey) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (user.permissions?.includes('*')) return true;
    return user.permissions?.includes(permissionKey);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        branch,
        branches,
        loading,
        login,
        logout,
        switchBranch,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
