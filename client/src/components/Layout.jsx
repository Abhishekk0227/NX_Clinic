import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  Stethoscope,
  CreditCard,
  FolderArchive,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Building,
  Wifi,
  WifiOff,
  ChevronLeft,
  Menu,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOfflineSync } from '../context/OfflineSyncContext';

const Layout = () => {
  const { user, organization, branch, branches, switchBranch, logout, hasPermission } = useAuth();
  const { isOnline, queueCount, triggerSync, isSyncing } = useOfflineSync();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('hms_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('hms_sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  const closeMobileSidebar = () => {
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Primary 8 Navigation items
  const primaryNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, permission: null },
    { name: 'Patients', path: '/patients', icon: Users, permission: 'patients.view' },
    { name: 'Appointments', path: '/appointments', icon: Calendar, permission: 'appointments.view' },
    { name: 'Queue', path: '/queue', icon: Clock, permission: 'queue.view' },
    { name: 'Clinical', path: '/clinical', icon: Stethoscope, permission: 'clinical.view' },
    { name: 'Billing & Payments', path: '/billing', icon: CreditCard, permission: 'billing.view' },
    { name: 'Documents & Follow-ups', path: '/documents', icon: FolderArchive, permission: 'documents.view' },
    { name: 'Reports', path: '/reports', icon: BarChart3, permission: 'reports.view' }
  ];

  // Visible items based on permissions/role
  const visiblePrimaryItems = primaryNavItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const canAccessAdmin = user?.role === 'admin' || hasPermission('admin.manage');

  // Breadcrumbs calculation
  const pathSnippets = location.pathname.split('/').filter(Boolean);
  const isRoot = pathSnippets.length === 0;

  return (
    <div className="app-layout">
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar - ONLY 8 PRIMARY SECTIONS + Administration + Settings */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">NX</div>
            <div className="logo-text">
              <h2>NX Clinic</h2>
              <p>{organization?.name || 'SMART CLINIC OS'}</p>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-shutter-btn"
            onClick={toggleSidebar}
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">{isCollapsed ? 'Ops' : 'Operations'}</span>
          {visiblePrimaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-item-icon" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <span className="nav-section-label">{isCollapsed ? 'Sys' : 'System'}</span>
            {canAccessAdmin && (
              <NavLink
                to="/admin"
                title={isCollapsed ? 'Administration' : undefined}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <ShieldCheck className="nav-item-icon" />
                <span>Administration</span>
              </NavLink>
            )}
            <NavLink
              to="/settings"
              title={isCollapsed ? 'Settings' : undefined}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Settings className="nav-item-icon" />
              <span>Settings</span>
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={logout}
            className="nav-item"
            title={isCollapsed ? 'Sign Out' : undefined}
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <LogOut className="nav-item-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="main-wrapper">
        <header className="top-header">
          <div className="header-left">
            {/* Sidebar Shutter On / Off Toggle Button */}
            <button
              type="button"
              className="header-shutter-btn"
              onClick={toggleSidebar}
              title={isCollapsed ? "Open / Expand Sidebar" : "Close / Collapse Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={19} color="var(--primary)" /> : <Menu size={19} />}
            </button>

            {/* Branch Switcher */}
            {branches.length > 0 && (
              <div className="branch-select-box">
                <Building size={16} color="#0284c7" />
                <select
                  value={branch?.branchId || 'overall'}
                  onChange={(e) => switchBranch(e.target.value)}
                >
                  <option value="overall">🌐 Overall (All Branches)</option>
                  {branches.map((b) => (
                    <option key={b.branchId} value={b.branchId}>
                      {b.name} {b.isMain ? '(Main)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="header-right">
            {/* Online / Offline Sync status pill */}
            <div
              className={`sync-pill ${isOnline ? 'online' : 'offline'}`}
              onClick={triggerSync}
              title={isOnline ? (queueCount > 0 ? `${queueCount} items pending sync` : 'All changes synced') : 'Offline - changes queued locally'}
            >
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? (isSyncing ? 'Syncing...' : (queueCount > 0 ? `${queueCount} to sync` : 'Online')) : 'Offline'}</span>
            </div>

            {/* User Profile Badge */}
            <div className="user-profile-menu" onClick={() => navigate('/settings')}>
              <div className="user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-info-text">
                <div className="user-name">{user?.name}</div>
                <div className="user-role-badge">{user?.roleName || user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body with Breadcrumbs */}
        <main className="page-container">
          {!isRoot && (
            <div className="breadcrumb-nav">
              <button
                className="back-btn"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/');
                  }
                }}
              >
                <ChevronLeft size={16} /> Back
              </button>
              <span>/</span>
              <span style={{ textTransform: 'capitalize' }}>
                {pathSnippets[0].replace('-', ' ')}
              </span>
              {pathSnippets.length > 1 && (
                <>
                  <span>/</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    {pathSnippets.slice(1).join(' / ')}
                  </span>
                </>
              )}
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
