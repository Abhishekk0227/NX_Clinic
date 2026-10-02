const { Organization, Branch, Department } = require('../models');
const { generateId } = require('../utils/idGenerator');
const AuditService = require('../services/AuditService');

class OrganizationController {
  static async getCurrent(req, res, next) {
    try {
      const org = await Organization.findOne({ organizationId: req.organizationId });
      if (!org) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });
      }
      return res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }

  static async updateCurrent(req, res, next) {
    try {
      const { name, phone, email, address, settings, currency } = req.body;
      const org = await Organization.findOne({ organizationId: req.organizationId });
      if (!org) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });
      }

      const before = org.toObject();
      if (name) org.name = name;
      if (phone) org.phone = phone;
      if (email) org.email = email;
      if (address) org.address = { ...org.address, ...address };
      if (settings) org.settings = { ...org.settings, ...settings };
      if (currency) org.currency = currency;
      org.version += 1;
      await org.save();

      AuditService.log({
        organizationId: req.organizationId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'organization.updated',
        entityType: 'organization',
        entityId: org.organizationId,
        before,
        after: org.toObject()
      });

      return res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }

  static async getBranches(req, res, next) {
    try {
      const branches = await Branch.find({ organizationId: req.organizationId }).sort({ isMain: -1, createdAt: 1 });
      return res.json({ success: true, data: branches });
    } catch (err) {
      next(err);
    }
  }

  static async createBranch(req, res, next) {
    try {
      const { name, code, isMain, phone, email, address } = req.body;
      if (!name || !code) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Branch name and code are required' } });
      }

      const branch = await Branch.create({
        branchId: generateId('branch'),
        organizationId: req.organizationId,
        name,
        code: code.toUpperCase(),
        isMain: !!isMain,
        phone,
        email,
        address
      });

      AuditService.log({
        organizationId: req.organizationId,
        branchId: branch.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'branch.created',
        entityType: 'branch',
        entityId: branch.branchId,
        after: branch.toObject()
      });

      return res.status(201).json({ success: true, data: branch });
    } catch (err) {
      next(err);
    }
  }

  static async updateBranch(req, res, next) {
    try {
      const { id } = req.params;
      const branch = await Branch.findOne({ branchId: id, organizationId: req.organizationId });
      if (!branch) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Branch not found' } });
      }

      const before = branch.toObject();
      Object.assign(branch, req.body);
      branch.version += 1;
      await branch.save();

      AuditService.log({
        organizationId: req.organizationId,
        branchId: branch.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'branch.updated',
        entityType: 'branch',
        entityId: branch.branchId,
        before,
        after: branch.toObject()
      });

      return res.json({ success: true, data: branch });
    } catch (err) {
      next(err);
    }
  }

  static async deleteBranch(req, res, next) {
    try {
      const { id } = req.params;
      const branch = await Branch.findOne({ branchId: id, organizationId: req.organizationId });
      if (!branch) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Branch not found' } });
      }
      if (branch.isMain) {
        return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Cannot delete main branch' } });
      }

      // Check for associated users and staff
      const User = require('../models').User;
      const Staff = require('../models').Staff;
      
      const userCount = await User.countDocuments({ branchId: id, organizationId: req.organizationId });
      const staffCount = await Staff.countDocuments({ branchId: id, organizationId: req.organizationId });
      
      if (userCount > 0 || staffCount > 0) {
        return res.status(400).json({ 
          success: false, 
          error: { 
            code: 'DEPENDENCY_EXISTS', 
            message: `Cannot delete branch. There are ${userCount} users and ${staffCount} staff members associated with it. Please relocate or delete them first.` 
          } 
        });
      }

      await branch.deleteOne();

      AuditService.log({
        organizationId: req.organizationId,
        branchId: branch.branchId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'branch.deleted',
        entityType: 'branch',
        entityId: branch.branchId
      });

      return res.json({ success: true, message: 'Branch deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async getDepartments(req, res, next) {
    try {
      const query = { organizationId: req.organizationId };
      if (req.query.branchId) query.branchId = req.query.branchId;
      const depts = await Department.find(query).sort({ name: 1 });
      return res.json({ success: true, data: depts });
    } catch (err) {
      next(err);
    }
  }

  static async createDepartment(req, res, next) {
    try {
      const { name, code, branchId } = req.body;
      if (!name || !code) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Department name and code are required' } });
      }

      const dept = await Department.create({
        departmentId: generateId('department'),
        organizationId: req.organizationId,
        branchId: branchId || req.branchId,
        name,
        code: code.toUpperCase()
      });

      return res.status(201).json({ success: true, data: dept });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OrganizationController;
