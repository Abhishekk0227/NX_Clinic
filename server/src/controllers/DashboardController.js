const {
  Patient,
  Appointment,
  QueueEntry,
  Invoice,
  Payment,
  Staff,
  Encounter,
  AuditLog,
  Branch
} = require('../models');

class DashboardController {
  static async getStats(req, res, next) {
    try {
      const { branchId } = req.query;
      const orgQuery = { organizationId: req.organizationId };
      const isAll = branchId === 'all' || branchId === 'overall' || req.branchId === 'all' || req.branchId === 'overall';
      const effectiveBranchId = isAll ? null : (branchId && branchId !== 'undefined' ? branchId : req.branchId);
      const branchQuery = effectiveBranchId
        ? { organizationId: req.organizationId, branchId: effectiveBranchId }
        : orgQuery;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const [
        totalPatients,
        todayAppointments,
        todayQueue,
        invoices,
        todayPayments,
        pendingVerificationPayments,
        recentPatients,
        todayAppointmentsList,
        todayQueueList,
        recentActivity
      ] = await Promise.all([
        Patient.countDocuments({ ...branchQuery, status: 'active' }),
        Appointment.countDocuments({
          ...branchQuery,
          scheduledStart: { $gte: todayStart, $lt: todayEnd },
          status: { $ne: 'cancelled' }
        }),
        QueueEntry.countDocuments({
          ...branchQuery,
          createdAt: { $gte: todayStart, $lt: todayEnd },
          status: { $in: ['waiting', 'called', 'in_consultation'] }
        }),
        Invoice.find({ ...branchQuery, status: { $in: ['pending', 'partially_paid'] } }),
        Payment.find({
          ...branchQuery,
          receivedAt: { $gte: todayStart, $lt: todayEnd },
          status: 'verified'
        }),
        Payment.countDocuments({
          ...branchQuery,
          status: 'pending_verification'
        }),
        Patient.find(branchQuery).sort({ createdAt: -1 }).limit(5),
        Appointment.find({
          ...branchQuery,
          scheduledStart: { $gte: todayStart, $lt: todayEnd }
        }).sort({ scheduledStart: 1 }).limit(10),
        QueueEntry.find({
          ...branchQuery,
          createdAt: { $gte: todayStart, $lt: todayEnd },
          status: { $in: ['waiting', 'called', 'in_consultation'] }
        }).sort({ priority: -1, createdAt: 1 }).limit(10),
        AuditLog.find(orgQuery).sort({ timestamp: -1 }).limit(8)
      ]);

      // Calculate totals
      const totalOutstanding = invoices.reduce((acc, cur) => acc + (cur.balance || 0), 0);
      const todayRevenue = todayPayments.reduce((acc, cur) => acc + (cur.amount || 0), 0);

      // Hydrate appointment patient and provider names
      const patientIds = [
        ...new Set([
          ...todayAppointmentsList.map(a => a.patientId),
          ...todayQueueList.map(q => q.patientId)
        ])
      ];
      const providerIds = [
        ...new Set([
          ...todayAppointmentsList.map(a => a.providerId),
          ...todayQueueList.map(q => q.providerId)
        ])
      ];

      const branchIds = [
        ...new Set([
          ...todayAppointmentsList.map(a => a.branchId),
          ...todayQueueList.map(q => q.branchId),
          ...recentPatients.map(p => p.branchId)
        ].filter(Boolean))
      ];

      const [patients, providers, branches] = await Promise.all([
        Patient.find({ patientId: { $in: patientIds } }),
        Staff.find({ staffId: { $in: providerIds } }),
        Branch.find({ branchId: { $in: branchIds } })
      ]);

      const patientMap = {};
      patients.forEach(p => { patientMap[p.patientId] = p; });
      const providerMap = {};
      providers.forEach(p => { providerMap[p.staffId] = p; });
      const branchMap = {};
      branches.forEach(b => { branchMap[b.branchId] = b; });

      const hydratedAppointments = todayAppointmentsList.map(a => ({
        ...a.toObject(),
        patient: patientMap[a.patientId] || null,
        provider: providerMap[a.providerId] || null,
        branch: branchMap[a.branchId] || null
      }));

      const hydratedQueue = todayQueueList.map(q => ({
        ...q.toObject(),
        patient: patientMap[q.patientId] || null,
        provider: providerMap[q.providerId] || null,
        branch: branchMap[q.branchId] || null
      }));

      const hydratedRecentPatients = recentPatients.map(p => ({
        ...p.toObject(),
        branch: branchMap[p.branchId] || null
      }));

      return res.json({
        success: true,
        data: {
          kpis: {
            totalPatients,
            todayAppointments,
            todayQueue,
            todayRevenue,
            totalOutstanding,
            pendingVerificationPayments
          },
          todayAppointments: hydratedAppointments,
          todayQueue: hydratedQueue,
          recentPatients: hydratedRecentPatients,
          recentActivity,
          userRole: req.role
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DashboardController;
