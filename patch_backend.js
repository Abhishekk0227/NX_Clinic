const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replacement) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(searchRegex, replacement);
  fs.writeFileSync(fullPath, content);
}

// 1. Update IdentityModels.js
replaceInFile(
  'server/src/models/IdentityModels.js',
  /roleId: \{ type: String, required: true, index: true \},/g,
  'roleId: { type: String, index: true },\n  roleIds: [{ type: String }],'
);

// 2. Update tenantScope.js
replaceInFile(
  'server/src/middleware/tenantScope.js',
  /const role = await Role\.findOne\(\{\s*roleId: req\.user\.roleId,\s*organizationId: req\.organizationId\s*\}\);/g,
  'const roles = await Role.find({ roleId: { $in: req.user.roleIds && req.user.roleIds.length ? req.user.roleIds : [req.user.roleId] }, organizationId: req.organizationId });\n    const role = roles.length ? roles[0] : null;'
);
replaceInFile(
  'server/src/middleware/tenantScope.js',
  /req\.permissions = role \? role\.permissions : \[\];/g,
  'req.permissions = roles.reduce((acc, r) => [...acc, ...(r.permissions || [])], []);'
);

// 3. Update UserController.js
replaceInFile(
  'server/src/controllers/UserController.js',
  /const { name, email, password, roleId, branchId, phone } = req\.body;/g,
  'const { name, email, password, roleId, roleIds, branchId, phone } = req.body;'
);
replaceInFile(
  'server/src/controllers/UserController.js',
  /if \(\!name \|\| \!email \|\| \!password \|\| \!roleId\) \{/g,
  'if (!name || !email || !password || (!roleId && (!roleIds || !roleIds.length))) {'
);
replaceInFile(
  'server/src/controllers/UserController.js',
  /const role = await Role\.findOne\(\{ roleId, organizationId: req\.organizationId \}\);/g,
  'const finalRoleIds = roleIds && roleIds.length ? roleIds : [roleId];\n      const roles = await Role.find({ roleId: { $in: finalRoleIds }, organizationId: req.organizationId });\n      const role = roles.length ? roles[0] : null;'
);
replaceInFile(
  'server/src/controllers/UserController.js',
  /roleId,/g,
  'roleId: finalRoleIds[0],\n        roleIds: finalRoleIds,'
);

replaceInFile(
  'server/src/controllers/UserController.js',
  /const { name, phone, roleId, branchId, status, password } = req\.body;/g,
  'const { name, phone, roleId, roleIds, branchId, status, password } = req.body;'
);
replaceInFile(
  'server/src/controllers/UserController.js',
  /if \(roleId\) \{\s*const role = await Role\.findOne\(\{ roleId, organizationId: req\.organizationId \}\);\s*if \(role\) \{\s*user\.roleId = roleId;\s*user\.roleKey = role\.key;\s*\}\s*\}/g,
  'if (roleIds || roleId) {\n        const finalRoleIds = roleIds && roleIds.length ? roleIds : [roleId];\n        const roles = await Role.find({ roleId: { $in: finalRoleIds }, organizationId: req.organizationId });\n        if (roles.length) {\n          user.roleId = finalRoleIds[0];\n          user.roleIds = finalRoleIds;\n          user.roleKey = roles[0].key;\n        }\n      }'
);

// 4. Update ServiceController.js for deleteService
let svcController = fs.readFileSync(path.join(__dirname, 'server/src/controllers/ServiceController.js'), 'utf8');
if (!svcController.includes('deleteService')) {
  svcController = svcController.replace(
    /  static async updateService[\s\S]*?\} catch \(err\) \{\s*next\(err\);\s*\}\s*\}/,
    `$&

  static async deleteService(req, res, next) {
    try {
      const { id } = req.params;
      const service = await Service.findOne({ serviceId: id, organizationId: req.organizationId });
      if (!service) return res.status(404).json({ success: false, error: { message: 'Service not found' } });
      await service.deleteOne();
      AuditService.log({
        organizationId: req.organizationId, actorUserId: req.user.userId, actorName: req.user.name,
        action: 'service.deleted', entityType: 'service', entityId: service.serviceId
      });
      return res.json({ success: true, message: 'Service deleted' });
    } catch(err) { next(err); }
  }`
  );
  fs.writeFileSync(path.join(__dirname, 'server/src/controllers/ServiceController.js'), svcController);
}

// 5. Update index.js (routes)
replaceInFile(
  'server/src/routes/index.js',
  /router\.put\('\/services\/:id', checkPermission\('admin\.manage'\), ServiceController\.updateService\);/g,
  `router.put('/services/:id', checkPermission('admin.manage'), ServiceController.updateService);\nrouter.delete('/services/:id', checkPermission('admin.manage'), ServiceController.deleteService);`
);
replaceInFile(
  'server/src/routes/index.js',
  /router\.put\('\/roles\/:id', checkPermission\('admin\.manage'\), UserController\.updateRole\);/g,
  `router.put('/roles/:id', checkPermission('admin.manage'), UserController.updateRole);\nrouter.delete('/roles/:id', checkPermission('admin.manage'), async (req, res, next) => {
    try {
      const role = await require('../models').Role.findOne({ roleId: req.params.id, organizationId: req.organizationId });
      if(!role) return res.status(404).json({success: false});
      await role.deleteOne();
      res.json({success: true});
    } catch(err){next(err);}
  });`
);

// 6. Update api.js
let apiJs = fs.readFileSync(path.join(__dirname, 'client/src/services/api.js'), 'utf8');
if (!apiJs.includes('deleteService')) {
  apiJs = apiJs.replace(
    /updateService: \(id, body\) =>\s*fetch\([^)]+\)\.then\(handleResponse\),/g,
    `$&
  deleteService: (id) => fetch(\`\${API_BASE}/services/\${id}\`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),`
  );
}
if (!apiJs.includes('deleteRole')) {
  apiJs = apiJs.replace(
    /updateRole: \(id, body\) =>\s*fetch\([^)]+\)\.then\(handleResponse\),/g,
    `$&
  deleteRole: (id) => fetch(\`\${API_BASE}/roles/\${id}\`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),`
  );
}
fs.writeFileSync(path.join(__dirname, 'client/src/services/api.js'), apiJs);

console.log('Backend & API Patched.');
