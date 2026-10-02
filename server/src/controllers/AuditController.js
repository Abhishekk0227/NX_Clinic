const { AuditLog } = require('../models');

class AuditController {
  static async getLogs(req, res, next) {
    try {
      const { entityType, entityId, actorUserId, limit = 50 } = req.query;
      const query = { organizationId: req.organizationId };

      if (entityType) query.entityType = entityType;
      if (entityId) query.entityId = entityId;
      if (actorUserId) query.actorUserId = actorUserId;

      const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit));

      return res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuditController;
