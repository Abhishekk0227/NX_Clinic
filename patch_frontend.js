const fs = require('fs');
const path = require('path');

const fullPath = path.join(__dirname, 'client/src/pages/Administration/AdminHub.jsx');
let content = fs.readFileSync(fullPath, 'utf8');

// 1. Update State variables
const stateAdditions = `
  const [editingServiceId, setEditingServiceId] = useState(null);
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', key: '', description: '', permissions: [] });
  const [editingRoleId, setEditingRoleId] = useState(null);
`;
content = content.replace(
  'const [serviceForm, setServiceForm] = useState({ name: \'\', code: \'\', category: \'Consultation\', price: 0, durationMinutes: 15 });',
  'const [serviceForm, setServiceForm] = useState({ name: \'\', code: \'\', category: \'Consultation\', price: 0, durationMinutes: 15 });\n' + stateAdditions
);

// 2. Change userForm to use roleIds array
content = content.replace(
  /const \[userForm, setUserForm\] = useState\(\{ name: '', email: '', password: '', roleId: '', branchId: '', phone: '', status: 'ACTIVE' \}\);/,
  "const [userForm, setUserForm] = useState({ name: '', email: '', password: '', roleIds: [], branchId: '', phone: '', status: 'ACTIVE' });"
);

content = content.replace(
  /setUserForm\(\{ name: u\.name, email: u\.email, password: '', roleId: u\.roleId, branchId: u\.branchId \|\| '', phone: u\.phone \|\| '', status: u\.status \}\);/,
  "setUserForm({ name: u.name, email: u.email, password: '', roleIds: u.roleIds || [u.roleId], branchId: u.branchId || '', phone: u.phone || '', status: u.status });"
);

content = content.replace(
  /setUserForm\(\{ name: '', email: '', password: '', roleId: '', branchId: '', phone: '', status: 'ACTIVE' \}\);/,
  "setUserForm({ name: '', email: '', password: '', roleIds: [], branchId: '', phone: '', status: 'ACTIVE' });"
);

// 3. User Modal form replace <select> for roles with checkboxes
const userRoleSelectOld = `<div className="form-group">
              <label className="form-label">Role *</label>
              <select required className="form-select" value={userForm.roleId} onChange={e => setUserForm({...userForm, roleId: e.target.value})}>
                <option value="">Select Role</option>
                {roles.map(r => <option key={r.roleId} value={r.roleId}>{r.name}</option>)}
              </select>
            </div>`;
const userRoleSelectNew = `<div className="form-group">
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
            </div>`;
content = content.replace(userRoleSelectOld, userRoleSelectNew);

// 4. Update Service Handler
const handleCreateServiceOld = `const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      await api.createService({
        ...serviceForm,
        price: parseFloat(serviceForm.price) || 0,
        durationMinutes: parseInt(serviceForm.durationMinutes) || 15
      });
      addToast('Service created in catalog!', 'success');
      setIsServiceModalOpen(false);
      setServiceForm({ name: '', code: '', category: 'Consultation', price: 0, durationMinutes: 15 });
      loadAdminData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };`;

const handleCreateServiceNew = `const handleCreateService = async (e) => {
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
      setServiceForm({ name: '', code: '', category: 'Consultation', price: 0, durationMinutes: 15 });
      loadAdminData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const openEditService = (s) => {
    setServiceForm({ name: s.name, code: s.code, category: s.category, price: s.price, durationMinutes: s.durationMinutes });
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
`;
content = content.replace(handleCreateServiceOld, handleCreateServiceNew);

// 5. Update Service UI
const svcTHeadOld = `                  <tr>
                  <th>Code</th>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>`;
const svcTHeadNew = `                  <tr>
                  <th>Code</th>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>`;
content = content.replace(svcTHeadOld, svcTHeadNew);

const svcTBodyOld = `                    <td><span className="badge badge-success">{svc.status}</span></td>
                  </tr>`;
const svcTBodyNew = `                    <td><span className="badge badge-success">{svc.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="btn btn-icon" onClick={() => openEditService(svc)}><Edit2 size={14}/></button>
                        <button className="btn btn-icon" style={{color: 'red'}} onClick={() => handleDeleteService(svc.serviceId)}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>`;
content = content.replace(svcTBodyOld, svcTBodyNew);
content = content.replace('onClick={() => setIsServiceModalOpen(true)}', 'onClick={() => { setEditingServiceId(null); setServiceForm({ name: \'\', code: \'\', category: \'Consultation\', price: 0, durationMinutes: 15 }); setIsServiceModalOpen(true); }}');

content = content.replace('title="Add Catalog Service"', 'title={editingServiceId ? "Edit Catalog Service" : "Add Catalog Service"}');
content = content.replace('Add Service\n            </button>', '{editingServiceId ? "Update Service" : "Add Service"}\n            </button>');


// 6. Role Handlers and UI
const roleHandlers = `
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
`;
content = content.replace('const handleUserSubmit', roleHandlers + '\n  const handleUserSubmit');

const roleTabOld = `<div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Role-Based Access Control (RBAC) Matrix</h3>`;
const roleTabNew = `<div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>Role-Based Access Control (RBAC) Matrix</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingRoleId(null); setRoleForm({ name: '', key: '', description: '', permissions: [] }); setIsRoleModalOpen(true); }}><Plus size={14} /> Add Role</button>
          </div>`;
content = content.replace(roleTabOld, roleTabNew);

const roleCardOld = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--primary-dark)' }}>{r.name}</h4>
                  <span className="badge badge-neutral">{r.key}</span>
                </div>`;
const roleCardNew = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--primary-dark)' }}>{r.name}</h4>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className="badge badge-neutral">{r.key}</span>
                    {!r.isSystem && (
                      <>
                        <button className="btn btn-icon" onClick={() => openEditRole(r)}><Edit2 size={14} /></button>
                        <button className="btn btn-icon" style={{color: 'red'}} onClick={() => handleDeleteRole(r.roleId)}><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>`;
content = content.replace(roleCardOld, roleCardNew);

const roleModal = `
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
              <input type="text" required className="form-input" disabled={editingRoleId} value={roleForm.key} onChange={e => setRoleForm({...roleForm, key: e.target.value.toLowerCase().replace(/\\s+/g, '_')})} />
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
`;

content = content.replace('    </div>\n  );\n};\n\nexport default AdminHub;', roleModal + '\n    </div>\n  );\n};\n\nexport default AdminHub;');

fs.writeFileSync(fullPath, content);
console.log('Frontend patched.');
