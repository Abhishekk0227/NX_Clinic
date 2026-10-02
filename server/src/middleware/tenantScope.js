const { Role } = require('../models');

const tenantScope = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'User context is missing' }
      });
    }

    // Default to user's assigned organization
    req.organizationId = req.user.organizationId;

    // Branch context: default to header x-branch-id if provided, else user's branchId
    const headerBranch = req.headers['x-branch-id'];
    if (headerBranch === 'overall' || headerBranch === 'all') {
      req.branchId = null;
    } else {
      req.branchId = headerBranch || req.user.branchId || null;
      if (req.branchId === 'overall' || req.branchId === 'all') {
        req.branchId = null;
      }
    }

    // Load Role and Granular Permissions
    const roles = await Role.find({ roleId: { $in: req.user.roleIds && req.user.roleIds.length ? req.user.roleIds : [req.user.roleId] }, organizationId: req.organizationId });
    const role = roles.length ? roles[0] : null;

    req.role = role ? role.key : req.user.roleKey;
    req.permissions = roles.reduce((acc, r) => [...acc, ...(r.permissions || [])], []);

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'TENANT_SCOPE_ERROR', message: 'Failed to resolve tenant scope', details: error.message }
    });
  }
};

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    // Admin role has universal bypass
    if (req.role === 'admin' || req.permissions.includes('*')) {
      return next();
    }

    if (!req.permissions || !req.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Permission denied. Required permission: '${requiredPermission}'`
        }
      });
    }

    next();
  };
};

module.exports = { tenantScope, checkPermission };
