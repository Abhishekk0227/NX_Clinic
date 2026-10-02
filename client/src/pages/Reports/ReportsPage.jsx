import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  BarChart3,
  Calendar,
  IndianRupee,
  Users,
  Printer,
  Download,
  CheckCircle2,
  TrendingUp,
  Stethoscope
} from 'lucide-react';

const ReportsPage = () => {
  const [operational, setOperational] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [clinical, setClinical] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const { branch } = useAuth();
  const { addToast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [op, rev, clin] = await Promise.all([
        api.getOperationalReport({ branchId: branch?.branchId, ...dateRange }),
        api.getRevenueReport({ branchId: branch?.branchId, ...dateRange }),
        api.getClinicalReport({ branchId: branch?.branchId, ...dateRange })
      ]);
      setOperational(op);
      setRevenue(rev);
      setClinical(clin);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [branch?.branchId]);

  const handleExportCSV = () => {
    if (!revenue) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Billed', `₹${revenue.totalBilled}`],
      ['Total Collected', `₹${revenue.totalCollected}`],
      ['Total Outstanding', `₹${revenue.totalOutstanding}`],
      ['Total Encounters', operational?.summary?.totalEncounters || 0],
      ['Total Appointments', operational?.summary?.totalAppointments || 0],
      ['Completion Rate', `${operational?.summary?.completionRate || 0}%`]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hms_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV Report exported successfully!', 'success');
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Generating operational analytics...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px' }}>Operational & Financial Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Executive summaries of hospital patient throughput, collections, and clinical procedures
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print Report
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>From:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>To:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>

          <button className="btn btn-primary btn-sm" onClick={fetchReports}>
            Filter Reports
          </button>
        </div>
      </div>

      {/* Executive Financial Summary Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <div className="kpi-val">₹{Number(revenue?.totalBilled || 0).toLocaleString('en-IN')}</div>
            <div className="kpi-label">Total Invoiced Amount</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#d1fae5', color: '#047857' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="kpi-val">₹{Number(revenue?.totalCollected || 0).toLocaleString('en-IN')}</div>
            <div className="kpi-label">Total Revenue Collected</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <div className="kpi-val">₹{Number(revenue?.totalOutstanding || 0).toLocaleString('en-IN')}</div>
            <div className="kpi-label">Accounts Receivable (Due)</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#b45309' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="kpi-val">{operational?.summary?.completionRate || 0}%</div>
            <div className="kpi-label">Appointment Fulfillment</div>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Payment Collection Channels */}
        <div className="card">
          <h3 style={{ fontSize: '15px', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            Revenue by Payment Channel
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {revenue?.byMethod && Object.entries(revenue.byMethod).length > 0 ? (
              Object.entries(revenue.byMethod).map(([method, amt]) => (
                <div
                  key={method}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '13px' }}>{method}</span>
                  <span style={{ fontWeight: 800, color: '#10b981', fontSize: '15px' }}>₹{amt}</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>No payments collected.</p>
            )}
          </div>
        </div>

        {/* Clinical Procedures Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: '15px', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            Top Procedures & Clinical Services
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {clinical?.popularTreatments && clinical.popularTreatments.length > 0 ? (
              clinical.popularTreatments.map((t) => (
                <div
                  key={t.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{t.name}</span>
                  <span className="badge badge-info">{t.count} performed</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>No procedures recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
