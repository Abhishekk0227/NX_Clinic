const bcrypt = require('bcryptjs');
const { User, Role, Permission, Staff, Branch, Department } = require('../models');
const { generateId } = require('../utils/idGenerator');
const AuditService = require('../services/AuditService');

class UserController {
  static async getUsers(req, res, next) {
    try {
      const users = await User.find({ organizationId: req.organizationId })
        .select('-passwordHash')
        .sort({ createdAt: -1 });

      const roles = await Role.find({ organizationId: req.organizationId });
      const roleMap = {};
      roles.forEach(r => { roleMap[r.roleId] = r; });

      const data = users.map(u => ({
        ...u.toObject(),
        roleName: roleMap[u.roleId] ? roleMap[u.roleId].name : u.roleKey
      }));

      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async createUser(req, res, next) {
    try {
      const { name, email, password, roleId, roleIds, branchId, phone } = req.body;
      if (!name || !email || !password || (!roleId && (!roleIds || !roleIds.length))) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name, email, password, and role are required' } });
      }

      const existing = await User.findOne({ organizationId: req.organizationId, email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'User with this email already exists in organization' } });
      }

      const finalRoleIds = roleIds && roleIds.length ? roleIds : [roleId];
      const roles = await Role.find({ roleId: { $in: finalRoleIds }, organizationId: req.organizationId });
      const role = roles.length ? roles[0] : null;
      if (!role) {
        return res.status(404).json({ success: false, error: { code: 'ROLE_NOT_FOUND', message: 'Selected role not found' } });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        userId: generateId('user'),
        organizationId: req.organizationId,
        branchId: branchId || req.branchId,
        name,
        email: email.toLowerCase().trim(),
        phone,
        passwordHash,
        roleId: finalRoleIds[0],
        roleIds: finalRoleIds,
        roleKey: role.key
      });

      AuditService.log({
        organizationId: req.organizationId,
        branchId: user.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'user.created',
        entityType: 'user',
        entityId: user.userId,
        after: { name, email, roleKey: role.key }
      });

      const userObj = user.toObject();
      delete userObj.passwordHash;
      return res.status(201).json({ success: true, data: userObj });
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, phone, roleId, roleIds, branchId, status, password } = req.body;
      const user = await User.findOne({ userId: id, organizationId: req.organizationId });
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      }

      const before = user.toObject();
      delete before.passwordHash;

      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (branchId) user.branchId = branchId;
      if (status) user.status = status;
      if (roleId) {
        const finalRoleIds = roleIds && roleIds.length ? roleIds : [roleId];
      const roles = await Role.find({ roleId: { $in: finalRoleIds }, organizationId: req.organizationId });
      const role = roles.length ? roles[0] : null;
        if (role) {
          user.roleId = roleId;
          user.roleKey = role.key;
        }
      }
      if (password) {
        user.passwordHash = await bcrypt.hash(password, 10);
      }
      user.version += 1;
      await user.save();

      const after = user.toObject();
      delete after.passwordHash;

      AuditService.log({
        organizationId: req.organizationId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'user.updated',
        entityType: 'user',
        entityId: user.userId,
        before,
        after
      });

      return res.json({ success: true, data: after });
    } catch (err) {
      next(err);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findOne({ userId: id, organizationId: req.organizationId });
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      }

      await user.deleteOne();

      AuditService.log({
        organizationId: req.organizationId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'user.deleted',
        entityType: 'user',
        entityId: user.userId
      });

      return res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async getRoles(req, res, next) {
    try {
      const roles = await Role.find({ organizationId: req.organizationId }).sort({ createdAt: 1 });
      return res.json({ success: true, data: roles });
    } catch (err) {
      next(err);
    }
  }

  static async createRole(req, res, next) {
    try {
      const { name, key, description, permissions } = req.body;
      if (!name || !key) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Role name and key are required' } });
      }

      const role = await Role.create({
        roleId: generateId('role'),
        organizationId: req.organizationId,
        name,
        key: key.toLowerCase().replace(/\s+/g, '_'),
        description,
        permissions: permissions || []
      });

      AuditService.log({
        organizationId: req.organizationId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'role.created',
        entityType: 'role',
        entityId: role.roleId,
        after: role.toObject()
      });

      return res.status(201).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  static async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const role = await Role.findOne({ roleId: id, organizationId: req.organizationId });
      if (!role) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } });
      }

      const before = role.toObject();
      const { name, description, permissions } = req.body;
      if (name) role.name = name;
      if (description !== undefined) role.description = description;
      if (permissions) role.permissions = permissions;
      role.version += 1;
      await role.save();

      AuditService.log({
        organizationId: req.organizationId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'role.updated',
        entityType: 'role',
        entityId: role.roleId,
        before,
        after: role.toObject()
      });

      return res.json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  static async getPermissions(req, res, next) {
    try {
      const permissions = await Permission.find().sort({ category: 1, key: 1 });
      return res.json({ success: true, data: permissions });
    } catch (err) {
      next(err);
    }
  }

  static async getStaff(req, res, next) {
    try {
      const query = { organizationId: req.organizationId };
      if (req.query.branchId && req.query.branchId !== 'all' && req.query.branchId !== 'undefined') {
        query.branchId = req.query.branchId;
      }
      if (req.query.designation) query.designation = req.query.designation;
      if (req.query.status) query.status = req.query.status;

      const staff = await Staff.find(query).sort({ name: 1 });
      return res.json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  }

  static async createStaff(req, res, next) {
    try {
      const { name, designation, specialty, phone, email, licenseNumber, consultationFee, branchId, departmentId, userId } = req.body;
      if (!name || !designation) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and designation are required' } });
      }

      const staff = await Staff.create({
        staffId: generateId('staff'),
        organizationId: req.organizationId,
        branchId: branchId || req.branchId,
        departmentId,
        userId,
        name,
        designation,
        specialty,
        phone,
        email,
        licenseNumber,
        consultationFee: consultationFee || 0
      });

      AuditService.log({
        organizationId: req.organizationId,
        branchId: staff.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'staff.created',
        entityType: 'staff',
        entityId: staff.staffId,
        after: staff.toObject()
      });

      return res.status(201).json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  }

  static async updateStaff(req, res, next) {
    try {
      const { id } = req.params;
      const staff = await Staff.findOne({ staffId: id, organizationId: req.organizationId });
      if (!staff) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Staff member not found' } });
      }

      const before = staff.toObject();
      Object.assign(staff, req.body);
      staff.version += 1;
      await staff.save();

      AuditService.log({
        organizationId: req.organizationId,
        branchId: staff.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'staff.updated',
        entityType: 'staff',
        entityId: staff.staffId,
        before,
        after: staff.toObject()
      });

      return res.json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  }

  static async deleteStaff(req, res, next) {
    try {
      const { id } = req.params;
      const staff = await Staff.findOne({ staffId: id, organizationId: req.organizationId });
      if (!staff) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Staff not found' } });
      }

      await staff.deleteOne();

      AuditService.log({
        organizationId: req.organizationId,
        branchId: staff.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'staff.deleted',
        entityType: 'staff',
        entityId: staff.staffId
      });

      return res.json({ success: true, message: 'Staff member deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
