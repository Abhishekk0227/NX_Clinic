const { AuditLog, OutboxEvent } = require('../models');
const { generateId } = require('../utils/idGenerator');

class AuditService {
  static async log({
    organizationId,
    branchId,
    actorUserId,
    actorName,
    action,
    entityType,
    entityId,
    before = null,
    after = null,
    reason = '',
    ip = '',
    userAgent = '',
    correlationId = ''
  }) {
    try {
      const auditLog = await AuditLog.create({
        auditLogId: generateId('auditLog'),
        organizationId,
        branchId,
        actorUserId: actorUserId || 'system',
        actorName: actorName || 'System',
        action,
        entityType,
        entityId,
        before,
        after,
        reason,
        ip,
        userAgent,
        correlationId,
        timestamp: new Date()
      });

      // Also publish to outbox for event subscribers
      await OutboxEvent.create({
        eventId: generateId('event'),
        eventType: `${action}.v1`,
        eventVersion: 'v1',
        organizationId,
        branchId,
        actorUserId,
        entityType,
        entityId,
        payload: { after, reason },
        status: 'dispatched'
      });

      return auditLog;
    } catch (err) {
      console.error('[AuditService Error] Failed to write audit log:', err.message);
    }
  }
}

module.exports = AuditService;
