const { Service } = require('../models');
const { generateId } = require('../utils/idGenerator');
const AuditService = require('../services/AuditService');

class ServiceController {
  static async getServices(req, res, next) {
    try {
      const { category, status, branchId: queryBranchId } = req.query;
      const query = { organizationId: req.organizationId };
      if (category) query.category = category;
      if (status) query.status = status;
      else query.status = { $ne: 'archived' };

      const activeBranchId = req.branchId || (queryBranchId && queryBranchId !== 'all' && queryBranchId !== 'undefined' ? queryBranchId : null);

      if (activeBranchId) {
        query.$or = [{ branchId: activeBranchId }, { branchId: null }, { branchId: { $exists: false } }, { branchId: '' }];
      }

      const services = await Service.find(query).sort({ category: 1, name: 1 });
      return res.json({ success: true, data: services });
    } catch (err) {
      next(err);
    }
  }

  static async createService(req, res, next) {
    try {
      const { name, code, category, durationMinutes = 15, price = 0, taxPercent = 0, requiredFormId, requiredWorkflowId, departmentId, branchId } = req.body;
      if (!name || !code) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Service name and code are required' } });
      }

      const service = await Service.create({
        serviceId: generateId('service'),
        organizationId: req.organizationId,
        branchId: branchId || req.branchId,
        departmentId,
        name,
        code: code.toUpperCase(),
        category: category || 'Consultation',
        durationMinutes,
        price,
        taxPercent,
        requiredFormId,
        requiredWorkflowId
      });

      AuditService.log({
        organizationId: req.organizationId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'service.created',
        entityType: 'service',
        entityId: service.serviceId,
        after: service.toObject()
      });

      return res.status(201).json({ success: true, data: service });
    } catch (err) {
      next(err);
    }
  }

  static async updateService(req, res, next) {
    try {
      const { id } = req.params;
      const service = await Service.findOne({ serviceId: id, organizationId: req.organizationId });
      if (!service) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } });
      }

      const before = service.toObject();
      if (req.body.branchId === '') req.body.branchId = null;
      Object.assign(service, req.body);
      service.version += 1;
      await service.save();

      AuditService.log({
        organizationId: req.organizationId,
        actorUserId: req.user.userId,
        actorName: req.user.name,
        action: 'service.updated',
        entityType: 'service',
        entityId: service.serviceId,
        before,
        after: service.toObject()
      });

      return res.json({ success: true, data: service });
    } catch (err) {
      next(err);
    }
  }

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
  }
}

module.exports = ServiceController;
