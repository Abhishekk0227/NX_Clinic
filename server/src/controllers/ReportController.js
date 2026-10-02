const {
  Patient,
  Appointment,
  Encounter,
  ClinicalRecord,
  Treatment,
  Invoice,
  Payment
} = require('../models');

class ReportController {
  static async getOperationalReport(req, res, next) {
    try {
      const { startDate, endDate, branchId } = req.query;
      const query = { organizationId: req.organizationId };
      const isAll = branchId === 'all' || branchId === 'overall' || req.branchId === 'all' || req.branchId === 'overall';
      const effectiveBranchId = isAll ? null : (branchId && branchId !== 'undefined' ? branchId : req.branchId);
      if (effectiveBranchId) query.branchId = effectiveBranchId;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      const [newPatients, totalAppointments, completedAppointments, totalEncounters] = await Promise.all([
        Patient.countDocuments(query),
        Appointment.countDocuments(query),
        Appointment.countDocuments({ ...query, status: 'completed' }),
        Encounter.countDocuments(query)
      ]);

      return res.json({
        success: true,
        data: {
          summary: {
            newPatients,
            totalAppointments,
            completedAppointments,
            totalEncounters,
            completionRate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getRevenueReport(req, res, next) {
    try {
      const { startDate, endDate, branchId } = req.query;
      const query = { organizationId: req.organizationId };
      const isAll = branchId === 'all' || branchId === 'overall' || req.branchId === 'all' || req.branchId === 'overall';
      const effectiveBranchId = isAll ? null : (branchId && branchId !== 'undefined' ? branchId : req.branchId);
      if (effectiveBranchId) query.branchId = effectiveBranchId;

      if (startDate || endDate) {
        query.receivedAt = {};
        if (startDate) query.receivedAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.receivedAt.$lte = end;
        }
      }

      const payments = await Payment.find({ ...query, status: 'verified' }).sort({ receivedAt: -1 });
      const invoices = await Invoice.find({ organizationId: req.organizationId });

      const totalBilled = invoices.reduce((acc, cur) => acc + (cur.total || 0), 0);
      const totalCollected = payments.reduce((acc, cur) => acc + (cur.amount || 0), 0);
      const totalOutstanding = invoices.reduce((acc, cur) => acc + (cur.balance || 0), 0);

      // Group payments by method
      const byMethod = {};
      payments.forEach(p => {
        byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
      });

      return res.json({
        success: true,
        data: {
          totalBilled,
          totalCollected,
          totalOutstanding,
          byMethod,
          paymentsCount: payments.length,
          recentPayments: payments.slice(0, 15)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getClinicalReport(req, res, next) {
    try {
      const { startDate, endDate, branchId } = req.query;
      const query = { organizationId: req.organizationId };
      const isAll = branchId === 'all' || branchId === 'overall' || req.branchId === 'all' || req.branchId === 'overall';
      const effectiveBranchId = isAll ? null : (branchId && branchId !== 'undefined' ? branchId : req.branchId);
      if (effectiveBranchId) query.branchId = effectiveBranchId;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      const [totalEncounters, treatments] = await Promise.all([
        Encounter.countDocuments(query),
        Treatment.find(query)
      ]);

      const treatmentsCount = treatments.length;
      const treatmentRevenue = treatments.reduce((acc, cur) => acc + (cur.cost || 0), 0);

      // Group by treatment name
      const byTreatment = {};
      treatments.forEach(t => {
        byTreatment[t.name] = (byTreatment[t.name] || 0) + 1;
      });

      return res.json({
        success: true,
        data: {
          totalEncounters,
          treatmentsCount,
          treatmentRevenue,
          popularTreatments: Object.entries(byTreatment).map(([name, count]) => ({ name, count }))
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReportController;
