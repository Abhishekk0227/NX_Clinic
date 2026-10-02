const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/pages/Administration/AdminHub.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add state for editing and modals
const stateAdditions = `
  // Added States for Edit/Delete
  const [editingBranchId, setEditingBranchId] = useState(null);
  
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', designation: '', specialty: '', phone: '', email: '', licenseNumber: '', consultationFee: 0, branchId: '', departmentId: '' });
  const [editingStaffId, setEditingStaffId] = useState(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', roleId: '', branchId: '', phone: '', status: 'ACTIVE' });
  const [editingUserId, setEditingUserId] = useState(null);
`;
content = content.replace('const [serviceForm, setServiceForm] = useState({ name: \'\', code: \'\', category: \'Consultation\', price: 0, durationMinutes: 15 });', 'const [serviceForm, setServiceForm] = useState({ name: \'\', code: \'\', category: \'Consultation\', price: 0, durationMinutes: 15 });\n' + stateAdditions);

// 2. Add imports if needed (Trash2 icon)
content = content.replace('CheckCircle2,', 'CheckCircle2,\n  Trash2,');

// 3. Update handleCreateBranch to handle edit
const branchLogic = `
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      if (editingBranchId) {
        await api.updateBranch(editingBranchId, branchForm);
        addToast('Branch updated successfully!', 'success');
      } else {
        await api.createBranch({
          name: branchForm.name,
          code: branchForm.code,
          phone: branchForm.phone,
          email: branchForm.email,
          address: { street: branchForm.street, city: branchForm.city }
        });
        addToast('Branch created successfully!', 'success');
      }
      setIsBranchModalOpen(false);
      setEditingBranchId(null);
      setBranchForm({ name: '', code: '', phone: '', email: '', street: '', city: '' });
      loadAdminData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const openEditBranch = (b) => {
    setBranchForm({ name: b.name, code: b.code, phone: b.phone || '', email: b.email || '', street: b.address?.street || '', city: b.address?.city || '' });
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
      setUserForm({ name: '', email: '', password: '', roleId: '', branchId: '', phone: '', status: 'ACTIVE' });
      loadAdminData();
    } catch(err) {
      addToast(err.message, 'error');
    }
  };

  const openEditUser = (u) => {
    setUserForm({ name: u.name, email: u.email, password: '', roleId: u.roleId, branchId: u.branchId || '', phone: u.phone || '', status: u.status });
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
`;
content = content.replace(/const handleCreateBranch = async \(e\) => \{[\s\S]*?catch \(err\) \{\s*addToast\(err\.message, 'error'\);\s*\}\s*\};/, branchLogic);

// 4. Update Branch UI
const branchUIOld = `                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{b.name}</strong>
                    {b.isMain ? <span className="badge badge-info">Main Location</span> : <span className="badge badge-neutral">Branch</span>}
                  </div>`;
const branchUINew = `                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{b.name}</strong>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {b.isMain ? <span className="badge badge-info">Main Location</span> : <span className="badge badge-neutral">Branch</span>}
                      <button className="btn btn-icon" onClick={() => openEditBranch(b)}><Edit2 size={14} /></button>
                      {!b.isMain && <button className="btn btn-icon" style={{color: 'red'}} onClick={() => handleDeleteBranch(b.branchId)}><Trash2 size={14} /></button>}
                    </div>
                  </div>`;
content = content.replace(branchUIOld, branchUINew);

// 5. Update Staff UI
const staffTHead = `                  <tr>
                    <th>Staff Name</th>
                    <th>Designation</th>
                    <th>Specialty</th>
                    <th>License / Reg</th>
                    <th>Consultation Fee</th>
                    <th>Status</th>
                  </tr>`;
const staffTHeadNew = `                  <tr>
                    <th>Staff Name</th>
                    <th>Designation</th>
                    <th>Specialty</th>
                    <th>License / Reg</th>
                    <th>Consultation Fee</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>`;
content = content.replace(staffTHead, staffTHeadNew);

const staffTBodyOld = `                      <td><span className="badge badge-success">{s.status}</span></td>
                    </tr>`;
const staffTBodyNew = `                      <td><span className="badge badge-success">{s.status}</span></td>
                      <td>
                        <button className="btn btn-icon" onClick={() => openEditStaff(s)}><Edit2 size={14}/></button>
                        <button className="btn btn-icon" style={{color: 'red'}} onClick={() => handleDeleteStaff(s.staffId)}><Trash2 size={14}/></button>
                      </td>
                    </tr>`;
content = content.replace(staffTBodyOld, staffTBodyNew);
content = content.replace('Staff & Doctor Registry</h3>', 'Staff & Doctor Registry</h3>\n              <button className="btn btn-primary btn-sm" onClick={() => { setEditingStaffId(null); setStaffForm({ name: \'\', designation: \'\', specialty: \'\', phone: \'\', email: \'\', licenseNumber: \'\', consultationFee: 0, branchId: \'\', departmentId: \'\' }); setIsStaffModalOpen(true); }}><Plus size={14} /> Add Staff</button>');

// 6. Update User UI
const userTHead = `                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th>Last Active</th>
                  </tr>`;
const userTHeadNew = `                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>`;
content = content.replace(userTHead, userTHeadNew);

const userTBodyOld = `                      <td style={{ fontSize: '12px' }}>
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN') : 'Never logged in'}
                      </td>
                    </tr>`;
const userTBodyNew = `                      <td style={{ fontSize: '12px' }}>
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN') : 'Never logged in'}
                      </td>
                      <td>
                        <button className="btn btn-icon" onClick={() => openEditUser(u)}><Edit2 size={14}/></button>
                        <button className="btn btn-icon" style={{color: 'red'}} onClick={() => handleDeleteUser(u.userId)}><Trash2 size={14}/></button>
                      </td>
                    </tr>`;
content = content.replace(userTBodyOld, userTBodyNew);
content = content.replace('System User Accounts</h3>', 'System User Accounts</h3>\n              <button className="btn btn-primary btn-sm" onClick={() => { setEditingUserId(null); setUserForm({ name: \'\', email: \'\', password: \'\', roleId: \'\', branchId: \'\', phone: \'\', status: \'ACTIVE\' }); setIsUserModalOpen(true); }}><Plus size={14} /> Add User</button>');

// 7. Fix modal header for Branch
content = content.replace('title="Add Hospital Branch"', 'title={editingBranchId ? "Edit Hospital Branch" : "Add Hospital Branch"}');
content = content.replace('Create Branch\n            </button>', '{editingBranchId ? "Update Branch" : "Create Branch"}\n            </button>');


// 8. Add Staff and User Modals at the bottom
const modals = `

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
              <input type="tel" className="form-input" value={staffForm.phone} onChange={e => setStaffForm({...staffForm, phone: e.target.value})} />
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
              <input type="tel" className="form-input" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password {!editingUserId && '*'}</label>
              <input type="password" required={!editingUserId} className="form-input" placeholder={editingUserId ? "Leave blank to keep same" : ""} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select required className="form-select" value={userForm.roleId} onChange={e => setUserForm({...userForm, roleId: e.target.value})}>
                <option value="">Select Role</option>
                {roles.map(r => <option key={r.roleId} value={r.roleId}>{r.name}</option>)}
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
`;

content = content.replace('    </div>\n  );\n};\n\nexport default AdminHub;', modals + '\n    </div>\n  );\n};\n\nexport default AdminHub;');

// Add CSS fixes for headers that were replaced
content = content.replace(
  '<div style={{ padding: \'16px 20px\', borderBottom: \'1px solid #e2e8f0\' }}>\n              <h3 style={{ fontSize: \'16px\' }}>Staff & Doctor Registry</h3>\n              <button',
  '<div style={{ padding: \'16px 20px\', borderBottom: \'1px solid #e2e8f0\', display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\' }}>\n              <h3 style={{ fontSize: \'16px\' }}>Staff & Doctor Registry</h3>\n              <button'
);

content = content.replace(
  '<div style={{ padding: \'16px 20px\', borderBottom: \'1px solid #e2e8f0\' }}>\n              <h3 style={{ fontSize: \'16px\' }}>System User Accounts</h3>\n              <button',
  '<div style={{ padding: \'16px 20px\', borderBottom: \'1px solid #e2e8f0\', display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\' }}>\n              <h3 style={{ fontSize: \'16px\' }}>System User Accounts</h3>\n              <button'
);

fs.writeFileSync(filePath, content);
console.log('AdminHub patched successfully.');
