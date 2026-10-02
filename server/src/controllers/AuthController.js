const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Organization, Branch, User, Role, Permission } = require('../models');
const { generateId } = require('../utils/idGenerator');
const AuditService = require('../services/AuditService');

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password, organizationCode } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' }
        });
      }

      // Find user
      const query = { email: email.toLowerCase().trim() };
      let user = await User.findOne(query);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
        });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_INACTIVE', message: 'Your account has been deactivated' }
        });
      }

      // Load Organization
      const organization = await Organization.findOne({ organizationId: user.organizationId });
      // Load Branch
      const branch = user.branchId ? await Branch.findOne({ branchId: user.branchId }) : null;
      // Load Role
      const role = await Role.findOne({ roleId: user.roleId, organizationId: user.organizationId });

      user.lastLogin = new Date();
      await user.save();

      const token = jwt.sign(
        { userId: user.userId, organizationId: user.organizationId, role: role ? role.key : user.roleKey },
        process.env.JWT_SECRET || 'super_secret_hms_jwt_key_2026_production_v1',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      AuditService.log({
        organizationId: user.organizationId,
        branchId: user.branchId,
        actorUserId: user.userId,
        actorName: user.name,
        action: 'user.login',
        entityType: 'user',
        entityId: user.userId,
        reason: 'Successful login',
        ip: req.ip
      });

      return res.json({
        success: true,
        data: {
          token,
          user: {
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: role ? role.key : user.roleKey,
            roleName: role ? role.name : 'User',
            permissions: role ? role.permissions : []
          },
          organization: organization ? {
            organizationId: organization.organizationId,
            name: organization.name,
            code: organization.code,
            type: organization.type,
            currency: organization.currency,
            settings: organization.settings
          } : null,
          branch: branch ? {
            branchId: branch.branchId,
            name: branch.name,
            code: branch.code,
            isMain: branch.isMain
          } : {
            branchId: 'overall',
            name: 'Overall (All Branches)',
            code: 'ALL',
            isOverall: true
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const user = req.user;
      const organization = await Organization.findOne({ organizationId: user.organizationId });
      const branch = (user.branchId && user.branchId !== 'overall') ? await Branch.findOne({ branchId: user.branchId }) : null;
      const role = await Role.findOne({ roleId: user.roleId, organizationId: user.organizationId });
      const allBranches = await Branch.find({ organizationId: user.organizationId, status: 'active' });

      return res.json({
        success: true,
        data: {
          user: {
            userId: user.userId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: role ? role.key : user.roleKey,
            roleName: role ? role.name : 'User',
            permissions: role ? role.permissions : []
          },
          organization: {
            organizationId: organization.organizationId,
            name: organization.name,
            code: organization.code,
            type: organization.type,
            currency: organization.currency,
            settings: organization.settings
          },
          branch: branch ? {
            branchId: branch.branchId,
            name: branch.name,
            code: branch.code,
            isMain: branch.isMain
          } : {
            branchId: 'overall',
            name: 'Overall (All Branches)',
            code: 'ALL',
            isOverall: true
          },
          branches: allBranches.map(b => ({ branchId: b.branchId, name: b.name, code: b.code, isMain: b.isMain }))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async switchBranch(req, res, next) {
    try {
      const { branchId } = req.body;

      if (!branchId || branchId === 'overall' || branchId === 'all') {
        req.user.branchId = null;
        await req.user.save();

        return res.json({
          success: true,
          data: {
            branch: {
              branchId: 'overall',
              name: 'Overall (All Branches)',
              code: 'ALL',
              isOverall: true
            }
          }
        });
      }

      const branch = await Branch.findOne({ branchId, organizationId: req.user.organizationId, status: 'active' });

      if (!branch) {
        return res.status(404).json({
          success: false,
          error: { code: 'BRANCH_NOT_FOUND', message: 'Active branch not found' }
        });
      }

      req.user.branchId = branchId;
      await req.user.save();

      return res.json({
        success: true,
        data: {
          branch: {
            branchId: branch.branchId,
            name: branch.name,
            code: branch.code,
            isMain: branch.isMain
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
