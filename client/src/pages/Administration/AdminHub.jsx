import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import {
  ShieldCheck,
  Building,
  Users,
  KeyRound,
  FileCode,
  GitBranch,
  Layers,
  Plus,
  Edit2,
  CheckCircle2,
  Trash2,
  Shield,
  Activity,
  HeartPulse,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  FileText,
  Globe,
  Tag
} from 'lucide-react';

const AdminHub = () => {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('org');
  const [org, setOrg] = useState(null);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [forms, setForms] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStaffPage, setCurrentStaffPage] = useState(1);
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [currentServicePage, setCurrentServicePage] = useState(1);
  const [currentAuditPage, setCurrentAuditPage] = useState(1);
  const pageSize = 10;

  // Branch Modal & Full Profile Configuration
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    tagline: 'Multi-Specialty Healthcare & Clinic Centre',
    phone: '',
    emergencyPhone: '',
    email: '',
    website: '',
    taxNumber: '', // GST No
    registrationNumber: '', // Clinical Reg No
    clinicHeaderNote: 'Official Medical Prescription & Healthcare Consultation Record',
    clinicFooterNote: 'Thank you for visiting. Valid computer generated healthcare record.',
    street: '',
    city: '',
    state: 'Madhya Pradesh',
    zip: ''
  });

  // Service Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: '', code: '', category: 'Consultation', price: 0, durationMinutes: 15, branchId: '' });

  const [editingServiceId, setEditingServiceId] = useState(null);
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', key: '', description: '', permissions: [] });
  const [editingRoleId, setEditingRoleId] = useState(null);


  // Added States for Edit/Delete
  const [editingBranchId, setEditingBranchId] = useState(null);
  
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', designation: '', specialty: '', phone: '', email: '', licenseNumber: '', consultationFee: 0, branchId: '', departmentId: '' });
  const [editingStaffId, setEditingStaffId] = useState(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', roleIds: [], branchId: '', phone: '', status: 'ACTIVE' });
  const [editingUserId, setEditingUserId] = useState(null);

  // Clinical Vitals & Triage Configuration CRUD state
  const [vitalParams, setVitalParams] = useState([]);
  const [isVitalModalOpen, setIsVitalModalOpen] = useState(false);
  const [vitalForm, setVitalForm] = useState({
    name: '',
    key: '',
    unit: '',
    normalRange: '',
    minVal: '',
    maxVal: '',
    inputType: 'numeric',
    isMandatory: false,
    category: 'general',
    status: 'active',
    order: 0
  });
  const [editingVitalId, setEditingVitalId] = useState(null);

  const { addToast } = useToast();

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [
        orgData,
        branchData,
        deptData,
        userData,
        roleData,
        permData,
        staffData,
        svcData,
        formData,
        wfData,
        auditData,
        vitalData
      ] = await Promise.all([
        api.getOrganization(),
        api.getBranches(),
        api.getDepartments(),
        api.getUsers(),
        api.getRoles(),
        api.getPermissions(),
        api.getStaff(),
        api.getServices(),
        api.getForms(),
        api.getWorkflows(),
        api.getAuditLogs({ limit: 40 }),
        api.getVitalParams()
      ]);

      setOrg(orgData);
      setBranches(branchData || []);
      setDepartments(deptData || []);
      setUsers(userData || []);
      setRoles(roleData || []);
      setPermissions(permData || []);
      setStaff(staffData || []);
      setServices(svcData || []);
      setForms(formData || []);
      setWorkflows(wfData || []);
      setAuditLogs(auditData || []);
      setVitalParams(vitalData || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: branchForm.name,
        code: branchForm.code,
        tagline: branchForm.tagline,
        phone: branchForm.phone,
        emergencyPhone: branchForm.emergencyPhone,
        email: branchForm.email,
        website: branchForm.website,
        taxNumber: branchForm.taxNumber,
        registrationNumber: branchForm.registrationNumber,
        clinicHeaderNote: branchForm.clinicHeaderNote,
        clinicFooterNote: branchForm.clinicFooterNote,
        address: {
          street: branchForm.street,
          city: branchForm.city,
          state: branchForm.state,
          zip: branchForm.zip,
          country: 'India'
        }
      };

      if (editingBranchId) {
        await api.updateBranch(editingBranchId, payload);
        addToast('Branch details & print letterhead updated successfully!', 'success');
      } else {
        await api.createBranch(payload);
        addToast('New branch location created successfully!', 'success');
      }
      setIsBranchModalOpen(false);
      setEditingBranchId(null);
      setBranchForm({
        name: '',
        code: '',
        tagline: 'Multi-Specialty Healthcare & Clinic Centre',
        phone: '',
        emergencyPhone: '',
        email: '',
        website: '',
        taxNumber: '',
        registrationNumber: '',
        clinicHeaderNote: 'Official Medical Prescription & Healthcare Consultation Record',
        clinicFooterNote: 'Thank you for visiting. Valid computer generated healthcare record.',
        street: '',
        city: '',
        state: 'Madhya Pradesh',
        zip: ''
      });
      loadAdminData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const openEditBranch = (b) => {
    setBranchForm({
      name: b.name || '',
      code: b.code || '',
      tagline: b.tagline || 'Multi-Specialty Healthcare & Clinic Centre',
      phone: b.phone || '',
      emergencyPhone: b.emergencyPhone || '',
      email: b.email || '',
      website: b.website || '',
      taxNumber: b.taxNumber || '',
      registrationNumber: b.registrationNumber || '',
      clinicHeaderNote: b.clinicHeaderNote || 'Official Medical Prescription & Healthcare Consultation Record',
      clinicFooterNote: b.clinicFooterNote || 'Thank you for visiting. Valid computer generated healthcare record.',
      street: b.address?.street || '',
      city: b.address?.city || '',
      state: b.address?.state || 'Madhya Pradesh',
      zip: b.address?.zip || ''
    });
    setEditingBranchId(b.branchId);
    setIsBranchModalOpen(true);
  };

  const handleDeleteBranch = async (id) => {
    if(!window.confirm('Are you sure you want to delete this branch?')) return;
    try {
      await api.deleteBranch(id);
      addToast('Branch deleted', 'success');
      loadAdminData();
    } catch(err) {
      addToast(err.message, 'error');
    }
  };

  // Branch Wipe State
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeBranchId, setWipeBranchId] = useState(null);
  const [wipePassword, setWipePassword] = useState('');

  const handleWipeBranch = async (e) => {
    e.preventDefault();
    if(!window.confirm('WARNING: This will permanently delete ALL patient records, invoices, appointments, and encounters for this branch. Are you ABSOLUTELY sure?')) return;
    try {
      await api.wipeBranchData(wipeBranchId, wipePassword);
      addToast('Branch patient data wiped successfully!', 'success');
      setIsWipeModalOpen(false);
      setWipePassword('');
      setWipeBranchId(null);
    } catch(err) {
      addToast(err.message, 'error');
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaffId) {
        await api.updateStaff(editingStaffId, staffForm);
        addToast('Staff updated successfully!', 'success');
      } else {
        await api.createStaff(staffForm);
        addToast('Staff created successfully!', 'success');
      }
      setIsStaffModalOpen(false);
      setEditingStaffId(null);
      setStaffForm({ name: '', designation: '', specialty: '', phone: '', email: '', licenseNumber: '', consultationFee: 0, branchId: '', departmentId: '' });
      loadAdminData();
    } catch(err) {
      addToast(err.message, 'error');
    }
  };

  const openEditStaff = (s) => {
    setStaffForm({ name: s.name, designation: s.designation, specialty: s.specialty || '', phone: s.phone || '', email: s.email || '', licenseNumber: s.licenseNumber || '', consultationFee: s.consultationFee || 0, branchId: s.branchId || '', departmentId: s.departmentId || '' });
    setEditingStaffId(s.staffId);
    setIsStaffModalOpen(true);
  };

  const handleDeleteStaff = async (id) => {
    if(!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await api.deleteStaff(id);
      addToast('Staff deleted', 'success');
      loadAdminData();
    } catch(err) {
      addToast(err.message, 'error');
    }
  };

  
  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoleId) {
        await api.updateRole(editingRoleId, roleForm);
        addToast('Role updated successfully!', 'success');
      } else {
        await api.createRole(roleForm);
        addToast('Role created successfully!', 'success');
      }
      setIsRoleModalOpen(false);
      setEditingRoleId(null);
      setRoleForm({ name: '', key: '', description: '', permissions: [] });
      loadAdminData();
    } catch(err) { addToast(err.message, 'error'); }
  };
  
  const openEditRole = (r) => {
    setRoleForm({ name: r.name, key: r.key, description: r.description || '', permissions: r.permissions || [] });
    setEditingRoleId(r.roleId);
    setIsRoleModalOpen(true);
  };
  
  const handleDeleteRole = async (id) => {
    if(!window.confirm('Delete this role?')) return;
    try {
      await api.deleteRole(id);
      addToast('Role deleted', 'success');
      loadAdminData();
    } catch(err) { addToast(err.message, 'error'); }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await api.updateUser(editingUserId, userForm);
        addToast('User updated successfully!', 'success');
      } else {
        await api.createUser(userForm);
        addToast('User created successfully!', 'success');
      }
      setIsUserModalOpen(false);
      setEditingUserId(null);
      setUserForm({ name: '', email: '', password: '', roleIds: [], branchId: '', phone: '', status: 'ACTIVE' });
      loadAdminData();
    } catch(err) {
      addToast(err.message, 'error');
    }
  };

  const openEditUser = (u) => {
    setUserForm({ name: u.name, email: u.email, password: '', roleIds: u.roleIds || [u.roleId], branchId: u.branchId || '', phone: u.phone || '', status: u.status });
    setEditingUserId(u.userId);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (id) => {
    if(!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteUser(id);
      addToast('User deleted', 'success');
      loadAdminData();
    } catch(err) {
      addToast(err.message, 'error');
    }
  };


  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...serviceForm,
        price: parseFloat(serviceForm.price) || 0,
        durationMinutes: parseInt(serviceForm.durationMinutes) || 15
      };
      if (editingServiceId) {
        await api.updateService(editingServiceId, payload);
        addToast('Service updated successfully!', 'success');
      } else {
        await api.createService(payload);
        addToast('Service created in catalog!', 'success');
      }
      setIsServiceModalOpen(false);
      setEditingServiceId(null);
      setServiceForm({ name: '', code: '', category: 'Consultation', price: 0, durationMinutes: 15, branchId: '' });
      loadAdminData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const openEditService = (s) => {
    setServiceForm({ name: s.name, code: s.code, category: s.category, price: s.price, durationMinutes: s.durationMinutes, branchId: s.branchId || '' });
    setEditingServiceId(s.serviceId);
    setIsServiceModalOpen(true);
  };

  const handleDeleteService = async (id) => {
    if(!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.deleteService(id);
      addToast('Service deleted', 'success');
      loadAdminData();
    } catch(err) { addToast(err.message, 'error'); }
  };

  // Clinical Vitals & Triage Action Handlers
  const openNewVitalModal = () => {
    setVitalForm({
      name: '',
      key: '',
      unit: '',
      normalRange: '',
      minVal: '',
      maxVal: '',
      inputType: 'numeric',
      isMandatory: false,
      category: 'general',
      status: 'active',
      order: vitalParams.length + 1
    });
    setEditingVitalId(null);
    setIsVitalModalOpen(true);
  };

  const openEditVital = (v) => {
    setVitalForm({
      name: v.name,
      key: v.key,
      unit: v.unit || '',
      normalRange: v.normalRange || '',
      minVal: v.minVal !== undefined && v.minVal !== null ? v.minVal : '',
      maxVal: v.maxVal !== undefined && v.maxVal !== null ? v.maxVal : '',
      inputType: v.inputType || 'numeric',
      isMandatory: Boolean(v.isMandatory),
      category: v.category || 'general',
      status: v.status || 'active',
      order: v.order || 0
    });
    setEditingVitalId(v.vitalParamId);
    setIsVitalModalOpen(true);
  };

  const handleVitalSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...vitalForm,
        minVal: vitalForm.minVal !== '' ? Number(vitalForm.minVal) : undefined,
        maxVal: vitalForm.maxVal !== '' ? Number(vitalForm.maxVal) : undefined,
        order: Number(vitalForm.order) || 0
      };

      if (editingVitalId) {
        await api.updateVitalParam(editingVitalId, payload);
        addToast('Clinical vital parameter updated successfully!', 'success');
      } else {
        await api.createVitalParam(payload);
        addToast('New clinical vital parameter configured!', 'success');
      }

      setIsVitalModalOpen(false);
      setEditingVitalId(null);
      loadAdminData();
    } catch (err) {
      addToast(err.message || 'Failed to save vital parameter', 'error');
    }
  };

  const handleDeleteVital = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the clinical vital parameter "${name}"?`)) return;
    try {
      await api.deleteVitalParam(id);
      addToast(`Vital parameter "${name}" deleted successfully!`, 'info');
      loadAdminData();
    } catch (err) {
      addToast(err.message || 'Failed to delete vital parameter', 'error');
    }
  };


  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading administration configuration...</div>;
  }

  const allAdminTabs = [
    { key: 'org', label: 'Organization & Branches', icon: Building, permission: 'admin.branches' },
    { key: 'users', label: `Staff & Users (${users.length})`, icon: Users, permission: 'admin.users' },
    { key: 'roles', label: `Roles & RBAC (${roles.length})`, icon: KeyRound, permission: 'admin.roles' },
    { key: 'services', label: `Services Catalog (${services.length})`, icon: Layers, permission: 'admin.services' },
    { key: 'vitals', label: `Vitals & Triage (${vitalParams.length})`, icon: HeartPulse, permission: 'admin.services' },
    { key: 'forms', label: `Dynamic Forms (${forms.length})`, icon: FileCode, permission: 'admin.forms' },
    { key: 'workflows', label: `Workflows (${workflows.length})`, icon: GitBranch, permission: 'admin.forms' },
    { key: 'audit', label: `Audit & Activity (${auditLogs.length})`, icon: Activity, permission: 'admin.manage' }
  ];

  const adminTabs = allAdminTabs.filter(t => user?.role === 'super_admin' || hasPermission('admin.manage') || hasPermission(t.permission));

  // Automatically select the first available tab if the current activeTab is not permitted
  if (adminTabs.length > 0 && !adminTabs.find(t => t.key === activeTab)) {
    setActiveTab(adminTabs[0].key);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px' }}>System Administration</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Enterprise configuration, multi-branch network, RBAC matrix, and dynamic engines
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        {adminTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={15} />
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Organization & Branches */}
      {activeTab === 'org' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              Organization Profile
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Name:</span> <strong>{org?.name}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Organization Code:</span> <strong>{org?.code}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Facility Type:</span> <span className="badge badge-info">{org?.type?.replace('_', ' ')}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> <strong>{org?.phone}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong>{org?.email}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Address:</span> <strong>{org?.address?.street}, {org?.address?.city}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Base Currency:</span> <strong>{org?.currency} (₹)</strong></div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px' }}>Hospital Branches & Clinics ({branches.length})</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configure branch addresses, contact numbers, GST numbers, and prescription/bill letterheads</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => {
                setEditingBranchId(null);
                setBranchForm({
                  name: '',
                  code: '',
                  tagline: 'Multi-Specialty Healthcare & Clinic Centre',
                  phone: '',
                  emergencyPhone: '',
                  email: '',
                  website: '',
                  taxNumber: '',
                  registrationNumber: '',
                  clinicHeaderNote: 'Official Medical Prescription & Healthcare Consultation Record',
                  clinicFooterNote: 'Thank you for visiting. Valid computer generated healthcare record.',
                  street: '',
                  city: '',
                  state: 'Madhya Pradesh',
                  zip: ''
                });
                setIsBranchModalOpen(true);
              }}>
                <Plus size={14} /> Add Branch
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {branches.map((b) => (
                <div key={b.branchId} style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>{b.name}</strong>
                        {b.isMain ? <span className="badge badge-info" style={{ fontSize: '11px' }}>Main HQ</span> : <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Branch</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                        {b.tagline || 'Multi-Specialty Healthcare & Clinic Centre'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditBranch(b)} title="Edit Branch Profile & Letterhead"><Edit2 size={13} /> Edit Branch</button>
                      <button className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }} onClick={() => { setWipeBranchId(b.branchId); setIsWipeModalOpen(true); }} title="Wipe all patient data for this branch">
                        Wipe Data
                      </button>
                      {!b.isMain && <button className="btn btn-icon" style={{color: 'red'}} onClick={() => handleDeleteBranch(b.branchId)} title="Delete Branch"><Trash2 size={14} /></button>}
                    </div>
                  </div>

                  {/* Branch Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginTop: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', fontSize: '12px' }}>
                    <div><span style={{ color: '#64748b' }}>Code:</span> <strong>{b.code}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Phone:</span> <strong>{b.phone || '—'}</strong></div>
                    {b.emergencyPhone && <div><span style={{ color: '#64748b' }}>Emergency:</span> <strong>{b.emergencyPhone}</strong></div>}
                    <div><span style={{ color: '#64748b' }}>Email:</span> <strong>{b.email || '—'}</strong></div>
                    {b.taxNumber && <div><span style={{ color: '#64748b' }}>GST / Tax ID:</span> <strong>{b.taxNumber}</strong></div>}
                    {b.registrationNumber && <div><span style={{ color: '#64748b' }}>Reg No:</span> <strong>{b.registrationNumber}</strong></div>}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#64748b' }}>Address:</span> <strong>{b.address?.street ? `${b.address.street}, ` : ''}{b.address?.city || 'Bhopal'}, {b.address?.state || 'Madhya Pradesh'} {b.address?.zip || ''}</strong>
                    </div>
                  </div>

                  {/* Letterhead Note Preview */}
                  {(b.clinicHeaderNote || b.clinicFooterNote) && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '6px 10px', borderRadius: '4px' }}>
                      <strong>Prescription & Bill Letterhead:</strong> "{b.clinicHeaderNote || 'Official Medical Prescription'}" • "{b.clinicFooterNote || 'Thank you'}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users & Staff */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px' }}>Staff & Doctor Registry</h3>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditingStaffId(null); setStaffForm({ name: '', designation: '', specialty: '', phone: '', email: '', licenseNumber: '', consultationFee: 0, branchId: '', departmentId: '' }); setIsStaffModalOpen(true); }}><Plus size={14} /> Add Staff</button>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Designation</th>
                    <th>Specialty</th>
                    <th>License / Reg</th>
                    <th>Consultation Fee</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.slice((currentStaffPage - 1) * pageSize, currentStaffPage * pageSize).map((s) => (
                    <tr key={s.staffId}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.designation}</td>
                      <td>{s.specialty || 'General'}</td>
                      <td>{s.licenseNumber || '—'}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{s.consultationFee || 0}</td>
                      <td><span className="badge badge-success">{s.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button className="btn btn-icon" onClick={() => openEditStaff(s)}><Edit2 size={14}/></button>
                          <button className="btn btn-icon" style={{color: 'red'}} onClick={() => handleDeleteStaff(s.staffId)}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentStaffPage}
              totalItems={staff.length}
              pageSize={pageSize}
              onPageChange={setCurrentStaffPage}
            />
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px' }}>System User Accounts</h3>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditingUserId(null); setUserForm({ name: '', email: '', password: '', roleId: '', branchId: '', phone: '', status: 'ACTIVE' }); setIsUserModalOpen(true); }}><Plus size={14} /> Add User</button>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice((currentUserPage - 1) * pageSize, currentUserPage * pageSize).map((u) => (
                    <tr key={u.userId}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className="badge badge-info">{u.roleName || u.roleKey}</span></td>
                      <td><span className="badge badge-success">{u.status}</span></td>
                      <td style={{ fontSize: '12px' }}>
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN') : 'Never logged in'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button className="btn btn-icon" onClick={() => openEditUser(u)}><Edit2 size={14}/></button>
                          <button className="btn btn-icon" style={{color: 'red'}} onClick={() => handleDeleteUser(u.userId)}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentUserPage}
              totalItems={users.length}
              pageSize={pageSize}
              onPageChange={setCurrentUserPage}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Roles & RBAC */}
      {activeTab === 'roles' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>Role-Based Access Control (RBAC) Matrix</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingRoleId(null); setRoleForm({ name: '', key: '', description: '', permissions: [] }); setIsRoleModalOpen(true); }}><Plus size={14} /> Add Role</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {roles.map((r) => (
              <div key={r.roleId} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--primary-dark)' }}>{r.name}</h4>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className="badge badge-neutral">{r.key}</span>
                    <button className="btn btn-icon" onClick={() => openEditRole(r)}><Edit2 size={14} /></button>
                    {r.key !== 'super_admin' && <button className="btn btn-icon" style={{color: 'red'}} onClick={() => handleDeleteRole(r.roleId)}><Trash2 size={14} /></button>}
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{r.description}</p>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Granted Permissions ({r.permissions?.length || 0}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {r.permissions?.slice(0, 10).map((p) => (
                    <span key={p} style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                      {p}
                    </span>
                  ))}
                  {r.permissions?.length > 10 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      +{r.permissions.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Services Catalog */}
      {activeTab === 'services' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', margin: 0 }}>
            <div>
              <h3 style={{ fontSize: '16px' }}>Services & Procedures Catalog</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configure Consultation fees, Dental procedures, Laboratory tests, and OPD charges</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingServiceId(null); setServiceForm({ name: '', code: '', category: 'Consultation', price: 0, durationMinutes: 15 }); setIsServiceModalOpen(true); }}>
              <Plus size={14} /> {editingServiceId ? "Update Service" : "Create Service"}
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.slice((currentServicePage - 1) * pageSize, currentServicePage * pageSize).map((svc) => (
                  <tr key={svc.serviceId}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{svc.code}</td>
                    <td style={{ fontWeight: 600 }}>
                      {svc.name}
                      {svc.branchId && (
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal', marginTop: '2px' }}>
                          Branch ID: {svc.branchId}
                        </div>
                      )}
                      {!svc.branchId && (
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal', marginTop: '2px' }}>
                          All Branches
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-info">{svc.category}</span></td>
                    <td>{svc.durationMinutes} mins</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{svc.price}</td>
                    <td><span className="badge badge-success">{svc.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button className="btn btn-icon" onClick={() => openEditService(svc)} title="Edit Service"><Edit2 size={14}/></button>
                        <button className="btn btn-icon" style={{color: 'red'}} onClick={() => handleDeleteService(svc.serviceId)} title="Delete Service"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentServicePage}
            totalItems={services.length}
            pageSize={pageSize}
            onPageChange={setCurrentServicePage}
          />
        </div>
      )}

      {/* Tab 5: Vitals & Triage Examination Setup */}
      {activeTab === 'vitals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)', border: '1px solid #bae6fd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '17px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HeartPulse size={20} color="#0284c7" /> Clinical Vitals & Triage Configuration
                </h3>
                <p style={{ fontSize: '12.5px', color: '#334155', marginTop: '4px' }}>
                  Manage physiological vitals, triage parameters, normal reference ranges, validation thresholds, and clinical workspace bindings.
                </p>
              </div>
              <button
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
                onClick={openNewVitalModal}
              >
                <Plus size={16} /> Add Vital Parameter
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px' }}>Configured Vitals Parameters ({vitalParams.length})</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time parameters available during Doctor consultations and Nurse triage</p>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Parameter Name</th>
                    <th>Code / Key</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Normal Range</th>
                    <th>Limits (Min - Max)</th>
                    <th>Input Type</th>
                    <th>Requirement</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vitalParams.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No vital parameters configured. Click "Add Vital Parameter" to create one.
                      </td>
                    </tr>
                  ) : (
                    vitalParams.map((v) => (
                      <tr key={v.vitalParamId || v.key}>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{v.name}</td>
                        <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary)' }}>{v.key}</code></td>
                        <td>
                          <span className="badge badge-info" style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                            {v.category || 'general'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{v.unit || '-'}</td>
                        <td>
                          {v.normalRange ? (
                            <span className="badge badge-neutral">{v.normalRange}</span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', color: '#475569' }}>
                          {v.minVal !== undefined && v.maxVal !== undefined
                            ? `${v.minVal} – ${v.maxVal}`
                            : (v.minVal !== undefined ? `≥ ${v.minVal}` : (v.maxVal !== undefined ? `≤ ${v.maxVal}` : 'Dynamic'))}
                        </td>
                        <td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{v.inputType || 'numeric'}</td>
                        <td>
                          {v.isMandatory ? (
                            <span className="badge badge-warning" style={{ fontSize: '11px' }}>Mandatory</span>
                          ) : (
                            <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Optional</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${v.status === 'active' ? 'badge-success' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                            {v.status || 'active'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-sm btn-secondary"
                              title="Edit Parameter"
                              onClick={() => openEditVital(v)}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              title="Delete Parameter"
                              onClick={() => handleDeleteVital(v.vitalParamId, v.name)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Dynamic Forms */}
      {activeTab === 'forms' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Configurable Dynamic Form Schemas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {forms.map((f) => (
              <div key={f.formId} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '15px' }}>{f.name}</h4>
                  <span className="badge badge-success">{f.status}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--primary)', fontFamily: 'monospace', margin: '4px 0 8px' }}>
                  key: {f.key} • version: v{f.currentVersionNumber}
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  {f.description || 'Configured schema for clinical documentation'}
                </p>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>
                  Sections ({f.sections?.length || 0}):
                </div>
                <ul style={{ paddingLeft: '20px', fontSize: '12px', marginTop: '4px', color: '#475569' }}>
                  {f.sections?.map((sec) => (
                    <li key={sec.sectionId}>
                      <strong>{sec.title}</strong> ({sec.fields?.length || 0} fields)
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Workflows */}
      {activeTab === 'workflows' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Configured Operational Workflows</h3>
          {workflows.map((wf) => (
            <div key={wf.workflowId} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: '#f8fafc', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '15px' }}>{wf.name}</h4>
                <span className="badge badge-info">{wf.key}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {wf.steps?.map((step, idx) => (
                  <React.Fragment key={step.stepKey}>
                    <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                      {step.name}
                    </span>
                    {idx < wf.steps.length - 1 && <span style={{ color: '#94a3b8' }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 7: Audit & Activity */}
      {activeTab === 'audit' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px' }}>Immutable Security Audit Trail</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cryptographic tracking of actors, entities, and state mutations</p>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Reason / Summary</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice((currentAuditPage - 1) * pageSize, currentAuditPage * pageSize).map((log) => (
                  <tr key={log.auditLogId}>
                    <td style={{ fontSize: '12px' }}>{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>{log.actorName}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-dark)', fontSize: '12px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{log.entityType}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>{log.entityId}</td>
                    <td style={{ fontSize: '12px' }}>{log.reason || 'Mutation completed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentAuditPage}
            totalItems={auditLogs.length}
            pageSize={pageSize}
            onPageChange={setCurrentAuditPage}
          />
        </div>
      )}

      {/* Create / Edit Branch Modal with Complete Profile & Letterhead Config */}
      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        title={editingBranchId ? "Edit Branch Profile & Print Letterhead" : "Add New Hospital Branch"}
        maxWidth="650px"
      >
        <form onSubmit={handleCreateBranch}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Branch / Hospital Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Apex Multispeciality Hospital - South Clinic"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Branch Code *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. SOUTH-01"
                value={branchForm.code}
                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Clinic Tagline / Sub-heading (Appears on Bills & Rx)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Advanced Dental & Multispeciality OPD Care Centre"
              value={branchForm.tagline}
              onChange={(e) => setBranchForm({ ...branchForm, tagline: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Official Phone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+91 98765 43210"
                value={branchForm.phone}
                onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Helpline Phone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="Emergency No."
                value={branchForm.emergencyPhone}
                onChange={(e) => setBranchForm({ ...branchForm, emergencyPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="clinic@apexhealthcare.in"
                value={branchForm.email}
                onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website / Portal</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://apexhealthcare.in"
                value={branchForm.website}
                onChange={(e) => setBranchForm({ ...branchForm, website: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">GST / Tax Registration No (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="23AAAAA0000A1Z5"
                value={branchForm.taxNumber}
                onChange={(e) => setBranchForm({ ...branchForm, taxNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Establishment Reg No</label>
              <input
                type="text"
                className="form-input"
                placeholder="MP-CLINIC-2024-001"
                value={branchForm.registrationNumber}
                onChange={(e) => setBranchForm({ ...branchForm, registrationNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="Building No, Street name, Sector / Landmark"
              value={branchForm.street}
              onChange={(e) => setBranchForm({ ...branchForm, street: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                placeholder="Bhopal / Indore"
                value={branchForm.city}
                onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                className="form-input"
                placeholder="Madhya Pradesh"
                value={branchForm.state}
                onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input
                type="text"
                className="form-input"
                placeholder="462001"
                value={branchForm.zip}
                onChange={(e) => setBranchForm({ ...branchForm, zip: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bill / Rx Header Note (Title)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Official Medical Prescription & Healthcare Consultation Record"
              value={branchForm.clinicHeaderNote}
              onChange={(e) => setBranchForm({ ...branchForm, clinicHeaderNote: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bill / Rx Footer Disclaimers (Note)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Thank you for visiting. Valid computer generated healthcare record."
              value={branchForm.clinicFooterNote}
              onChange={(e) => setBranchForm({ ...branchForm, clinicFooterNote: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsBranchModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingBranchId ? "Update Branch Details" : "Create Branch Location"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Service Modal */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={editingServiceId ? "Edit Catalog Service" : "Add Catalog Service"}
        maxWidth="500px"
      >
        <form onSubmit={handleCreateService}>
          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Ultrasonic Scaling & Polishing"
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Code *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. DENT-SCAL"
                value={serviceForm.code}
                onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={serviceForm.category}
                onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
              >
                <option value="Consultation">Consultation</option>
                <option value="Dental">Dental</option>
                <option value="Procedure">Procedure</option>
                <option value="Radiology">Radiology</option>
                <option value="Lab">Lab Test</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Branch Allocation</label>
            <select
              className="form-select"
              value={serviceForm.branchId || ''}
              onChange={(e) => setServiceForm({ ...serviceForm, branchId: e.target.value })}
            >
              <option value="">All Branches (Organization Wide)</option>
              {branches.map(b => (
                <option key={b.branchId} value={b.branchId}>{b.name}</option>
              ))}
            </select>
            <span style={{ fontSize: '11px', color: '#64748b' }}>If assigned to a branch, only that branch can use this service.</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input
                type="number"
                required
                className="form-input"
                value={serviceForm.price}
                onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duration (Minutes)</label>
              <input
                type="number"
                className="form-input"
                value={serviceForm.durationMinutes}
                onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsServiceModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Service
            </button>
          </div>
        </form>
      </Modal>


      {/* Staff Modal */}
      <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title={editingStaffId ? "Edit Staff" : "Add Staff"} maxWidth="500px">
        <form onSubmit={handleStaffSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input type="text" required className="form-input" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Designation *</label>
              <input type="text" required className="form-input" value={staffForm.designation} onChange={e => setStaffForm({...staffForm, designation: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Specialty</label>
              <input type="text" className="form-input" value={staffForm.specialty} onChange={e => setStaffForm({...staffForm, specialty: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input 
                type="tel" 
                maxLength={10}
                placeholder="10-digit mobile"
                className="form-input" 
                value={staffForm.phone} 
                onChange={e => setStaffForm({...staffForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">License Number</label>
              <input type="text" className="form-input" value={staffForm.licenseNumber} onChange={e => setStaffForm({...staffForm, licenseNumber: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Consultation Fee</label>
              <input type="number" className="form-input" value={staffForm.consultationFee} onChange={e => setStaffForm({...staffForm, consultationFee: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Allocated Branch *</label>
              <select required className="form-select" value={staffForm.branchId} onChange={e => setStaffForm({...staffForm, branchId: e.target.value})}>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsStaffModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingStaffId ? "Update" : "Save"}</button>
          </div>
        </form>
      </Modal>

      {/* User Modal */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUserId ? "Edit User" : "Add User"} maxWidth="500px">
        <form onSubmit={handleUserSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input type="text" required className="form-input" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" required className="form-input" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input 
                type="tel" 
                maxLength={10}
                placeholder="10-digit mobile"
                className="form-input" 
                value={userForm.phone} 
                onChange={e => setUserForm({...userForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password {!editingUserId && '*'}</label>
              <input type="password" required={!editingUserId} className="form-input" placeholder={editingUserId ? "Leave blank to keep same" : ""} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Roles *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '6px' }}>
                {roles.map(r => (
                  <label key={r.roleId} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <input 
                      type="checkbox" 
                      checked={(userForm.roleIds || []).includes(r.roleId)}
                      onChange={e => {
                        const newRoleIds = e.target.checked 
                          ? [...(userForm.roleIds || []), r.roleId]
                          : (userForm.roleIds || []).filter(id => id !== r.roleId);
                        setUserForm({...userForm, roleIds: newRoleIds});
                      }}
                    />
                    {r.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Allocated Branch *</label>
              <select required className="form-select" value={userForm.branchId} onChange={e => setUserForm({...userForm, branchId: e.target.value})}>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name}</option>)}
              </select>
            </div>
          </div>
          {editingUserId && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={userForm.status} onChange={e => setUserForm({...userForm, status: e.target.value})}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LOCKED">Locked</option>
              </select>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingUserId ? "Update" : "Save"}</button>
          </div>
        </form>
      </Modal>


      {/* Role Modal */}
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={editingRoleId ? "Edit Role" : "Add Role"} maxWidth="700px">
        <form onSubmit={handleRoleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role Name *</label>
              <input type="text" required className="form-input" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Role Key * (No spaces)</label>
              <input type="text" required className="form-input" disabled={editingRoleId} value={roleForm.key} onChange={e => setRoleForm({...roleForm, key: e.target.value.toLowerCase().replace(/\s+/g, '_')})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows="2" value={roleForm.description} onChange={e => setRoleForm({...roleForm, description: e.target.value})}></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Permissions</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px' }}>
              {permissions.map(p => (
                <label key={p.permissionId} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    style={{ marginTop: '3px' }}
                    checked={roleForm.permissions.includes(p.key)}
                    onChange={e => {
                      const newPerms = e.target.checked 
                        ? [...roleForm.permissions, p.key]
                        : roleForm.permissions.filter(k => k !== p.key);
                      setRoleForm({...roleForm, permissions: newPerms});
                    }}
                  />
                  <div>
                    <strong>{p.name}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{p.key}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRoleModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingRoleId ? "Update" : "Save"}</button>
          </div>
        </form>
      </Modal>

      {/* Clinical Vital Parameter Create/Edit Modal */}
      <Modal
        isOpen={isVitalModalOpen}
        onClose={() => setIsVitalModalOpen(false)}
        title={editingVitalId ? "Edit Clinical Vital Parameter" : "Configure New Clinical Vital"}
        maxWidth="600px"
      >
        <form onSubmit={handleVitalSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Parameter Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Random Blood Sugar (RBS)"
                value={vitalForm.name}
                onChange={(e) => setVitalForm({ ...vitalForm, name: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Code / Key *</label>
              <input
                type="text"
                required
                disabled={Boolean(editingVitalId)}
                className="form-input"
                placeholder="e.g. rbs"
                value={vitalForm.key}
                onChange={(e) => setVitalForm({ ...vitalForm, key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Clinical Category</label>
              <select
                className="form-select"
                value={vitalForm.category}
                onChange={(e) => setVitalForm({ ...vitalForm, category: e.target.value })}
              >
                <option value="general">General Physiological</option>
                <option value="cardiac">Cardiovascular / BP</option>
                <option value="respiratory">Respiratory / Pulmonary</option>
                <option value="triage">OPD Triage / Emergency</option>
                <option value="pediatric">Pediatric / Growth</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Unit of Measurement</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. mg/dL, mmHg, °F"
                value={vitalForm.unit}
                onChange={(e) => setVitalForm({ ...vitalForm, unit: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Input Format</label>
              <select
                className="form-select"
                value={vitalForm.inputType}
                onChange={(e) => setVitalForm({ ...vitalForm, inputType: e.target.value })}
              >
                <option value="numeric">Integer (Whole Number)</option>
                <option value="decimal">Decimal (e.g. 98.6)</option>
                <option value="text">Text / String</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Normal Reference Range Text</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 70 - 140 mg/dL"
                value={vitalForm.normalRange}
                onChange={(e) => setVitalForm({ ...vitalForm, normalRange: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Display Order</label>
              <input
                type="number"
                className="form-input"
                placeholder="1"
                value={vitalForm.order}
                onChange={(e) => setVitalForm({ ...vitalForm, order: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Min Threshold (Optional)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                placeholder="e.g. 40"
                value={vitalForm.minVal}
                onChange={(e) => setVitalForm({ ...vitalForm, minVal: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Threshold (Optional)</label>
              <input
                type="number"
                step="any"
                className="form-input"
                placeholder="e.g. 500"
                value={vitalForm.maxVal}
                onChange={(e) => setVitalForm({ ...vitalForm, maxVal: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Parameter Status</label>
              <select
                className="form-select"
                value={vitalForm.status}
                onChange={(e) => setVitalForm({ ...vitalForm, status: e.target.value })}
              >
                <option value="active">Active (Visible in Workspace)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={vitalForm.isMandatory}
                onChange={(e) => setVitalForm({ ...vitalForm, isMandatory: e.target.checked })}
              />
              <span>Mark as Mandatory Field during OPD Triage / Vitals Registration</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsVitalModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingVitalId ? "Update Parameter" : "Create Parameter"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Wipe Branch Modal */}
      <Modal isOpen={isWipeModalOpen} onClose={() => setIsWipeModalOpen(false)} title="Wipe Branch Data (DANGER)">
        <form onSubmit={handleWipeBranch}>
          <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', padding: '12px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
            <strong>WARNING:</strong> You are about to permanently delete all patient-related data (patients, appointments, clinical records, invoices, payments, etc.) for this branch. 
            <br/><br/>
            This action <strong>cannot be undone</strong> and will result in complete data loss for these entities.
          </div>
          <div className="form-group">
            <label className="form-label">Please enter your password to confirm:</label>
            <input 
              type="password" 
              className="form-input" 
              required 
              value={wipePassword} 
              onChange={e => setWipePassword(e.target.value)} 
              placeholder="Your login password"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsWipeModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn" style={{ background: '#ef4444', color: 'white', border: 'none' }}>Wipe All Patient Data</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AdminHub;
