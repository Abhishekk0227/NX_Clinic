import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import {
  CreditCard,
  Plus,
  FileText,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileCheck,
  Search,
  Check,
  X,
  Trash2
} from 'lucide-react';

const BillingPage = () => {
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices', 'payments', 'receipts', 'verification'
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState('all'); // 'all', 'today', 'custom'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [currentInvoicePage, setCurrentInvoicePage] = useState(1);
  const [currentPaymentPage, setCurrentPaymentPage] = useState(1);
  const [currentReceiptPage, setCurrentReceiptPage] = useState(1);
  const [currentVerificationPage, setCurrentVerificationPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);

  const [patientsList, setPatientsList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  // Create Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState({
    patientId: '',
    items: [{ serviceId: '', description: '', quantity: 1, unitPrice: 0 }],
    discountTotal: 0,
    taxTotal: 0,
    notes: ''
  });

  // Receive Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'upi',
    reference: '',
    proofUrl: '',
    notes: '',
    needsVerification: false
  });

  const { branch, branches, hasPermission } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const effectiveBranch = (branch?.branchId === 'overall' || branch?.branchId === 'all') ? undefined : branch?.branchId;

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const params = {
        branchId: effectiveBranch,
        status: statusFilter || undefined,
        search
      };

      const todayStr = new Date().toLocaleDateString('en-CA');
      if (dateFilterMode === 'today') {
        params.startDate = todayStr;
        params.endDate = todayStr;
      } else if (dateFilterMode === 'custom' && selectedDate) {
        params.startDate = selectedDate;
        params.endDate = selectedDate;
      }

      const [invs, pays, rcpts] = await Promise.all([
        api.getInvoices(params),
        api.getPayments({ branchId: effectiveBranch }),
        api.getReceipts({ branchId: effectiveBranch })
      ]);
      setInvoices(invs || []);
      setPayments(pays || []);
      setReceipts(rcpts || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [statusFilter, search, dateFilterMode, selectedDate, branch?.branchId]);

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [pats, svcs] = await Promise.all([
          api.getPatients({ limit: 100, branchId: effectiveBranch }),
          api.getServices({ branchId: effectiveBranch })
        ]);
        setPatientsList(pats || []);
        setServicesList(svcs || []);
      } catch (e) {
        // Non-blocking
      }
    };
    loadPrerequisites();

    const paramPatientId = searchParams.get('patientId');
    if (paramPatientId) {
      setInvoiceForm((prev) => ({ ...prev, patientId: paramPatientId }));
    }
    if (searchParams.get('action') === 'new_invoice') {
      setIsInvoiceModalOpen(true);
    }
    if (searchParams.get('tab') === 'verification') {
      setActiveTab('verification');
    }
  }, [branch?.branchId]);

  // Handle Invoice Item Add / Change
  const handleAddItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { serviceId: '', description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...invoiceForm.items];
    updated[index][field] = value;
    if (field === 'serviceId') {
      const svc = servicesList.find((s) => s.serviceId === value);
      if (svc) {
        updated[index].description = svc.name;
        updated[index].unitPrice = svc.price;
      }
    }
    setInvoiceForm({ ...invoiceForm, items: updated });
  };

  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createInvoice({
        ...invoiceForm,
        branchId: (branch?.branchId && branch.branchId !== 'overall') ? branch.branchId : (branches[0]?.branchId || undefined),
        discountTotal: parseFloat(invoiceForm.discountTotal) || 0,
        taxTotal: parseFloat(invoiceForm.taxTotal) || 0
      });
      addToast(`Invoice ${res.invoiceNumber} created successfully!`, 'success');
      setIsInvoiceModalOpen(false);
      setInvoiceForm({
        patientId: '',
        items: [{ serviceId: '', description: '', quantity: 1, unitPrice: 0 }],
        discountTotal: 0,
        taxTotal: 0,
        notes: ''
      });
      fetchBillingData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice? Related payments and receipts will also be deleted.')) return;
    try {
      await api.billing.deleteInvoice(invoiceId);
      addToast('Invoice deleted', 'success');
      fetchBillingData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment? The invoice balance will be updated.')) return;
    try {
      await api.billing.deletePayment(paymentId);
      addToast('Payment deleted', 'success');
      fetchBillingData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleReceivePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    try {
      const res = await api.receivePayment({
        invoiceId: selectedInvoiceForPayment.invoiceId,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference,
        proofUrl: paymentForm.proofUrl,
        notes: paymentForm.notes,
        needsVerification: paymentForm.needsVerification
      });

      addToast(res.message || 'Payment recorded', 'success');
      setIsPaymentModalOpen(false);
      setSelectedInvoiceForPayment(null);
      setPaymentForm({
        amount: '',
        method: 'upi',
        reference: '',
        proofUrl: '',
        notes: '',
        needsVerification: false
      });
      fetchBillingData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleVerifyOfflinePayment = async (paymentId, status) => {
    try {
      const res = await api.verifyPayment(paymentId, { status, notes: `Reviewed by cashier` });
      addToast(res.message || `Payment ${status}`, 'success');
      fetchBillingData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const pendingVerificationList = payments.filter((p) => p.status === 'pending_verification');

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px' }}>Billing & Payments</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Unified invoices, cash/UPI payment collection, offline proof verification, and receipts
          </p>
        </div>

        {hasPermission('billing.create') && (
          <button className="btn btn-primary" onClick={() => setIsInvoiceModalOpen(true)}>
            <Plus size={16} /> Create Invoice
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices ({invoices.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payment Transactions ({payments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'receipts' ? 'active' : ''}`}
          onClick={() => setActiveTab('receipts')}
        >
          Receipts ({receipts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'verification' ? 'active' : ''}`}
          onClick={() => setActiveTab('verification')}
        >
          Offline Verifications {pendingVerificationList.length > 0 && `(${pendingVerificationList.length})`}
        </button>
      </div>

      {/* Tab 1: Invoices Table */}
      {activeTab === 'invoices' && (
        <>
          <div className="card" style={{ padding: '12px 20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Search invoice number, patient name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Date Filter Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${dateFilterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => setDateFilterMode('all')}
                >
                  All Dates
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${dateFilterMode === 'today' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => setDateFilterMode('today')}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${dateFilterMode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => setDateFilterMode('custom')}
                >
                  Specific Date 📅
                </button>
              </div>

              {dateFilterMode === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date:</span>
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '6px 12px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Invoices</option>
                  <option value="pending">Pending</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Fully Paid</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>Loading invoices...</td></tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    invoices.slice((currentInvoicePage - 1) * pageSize, currentInvoicePage * pageSize).map((inv) => (
                      <tr key={inv.invoiceId}>
                        <td style={{ fontWeight: 700 }}>
                          <div>{inv.invoiceNumber}</div>
                          {(inv.branch?.name || branches.find(b => b.branchId === inv.branchId)?.name) && (
                            <div style={{ marginTop: '2px' }}>
                              <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                                {inv.branch?.name || branches.find(b => b.branchId === inv.branchId)?.name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div
                            style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}
                            onClick={() => navigate(`/patients/${inv.patientId}`)}
                          >
                            {inv.patient?.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.patient?.patientNumber}</div>
                        </td>
                        <td>{new Date(inv.issuedAt || inv.createdAt).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontWeight: 600 }}>₹{inv.total}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>₹{inv.paidAmount}</td>
                        <td style={{ fontWeight: 700, color: inv.balance > 0 ? '#ef4444' : '#10b981' }}>
                          ₹{inv.balance}
                        </td>
                        <td>
                          <span className={`badge ${
                            inv.status === 'paid' ? 'badge-success' :
                            inv.status === 'partially_paid' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {inv.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {inv.balance > 0 && hasPermission('payment.create') && (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => {
                                  setSelectedInvoiceForPayment(inv);
                                  setPaymentForm({ ...paymentForm, amount: inv.balance });
                                  setIsPaymentModalOpen(true);
                                }}
                              >
                                <IndianRupee size={13} /> Collect
                              </button>
                            )}
                            {inv.encounterId && (
                              <button
                                className={`btn btn-sm ${inv.status === 'paid' ? 'btn-primary' : 'btn-secondary'}`}
                                disabled={inv.status !== 'paid'}
                                onClick={() => {
                                  if (inv.status === 'paid') navigate(`/clinical/encounters/${inv.encounterId}`);
                                }}
                                title={inv.status === 'paid' ? 'Download Prescription' : 'Pay bill to unlock Prescription'}
                              >
                                <FileText size={13} /> {inv.status === 'paid' ? 'Rx' : 'Rx 🔒'}
                              </button>
                            )}
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => navigate(`/billing/invoices/${inv.invoiceId}`)}
                              >
                                <Eye size={13} /> View
                              </button>
                              {hasPermission('billing.edit') && (
                                <button
                                  className="btn btn-icon btn-sm"
                                  style={{ color: 'red' }}
                                  onClick={() => handleDeleteInvoice(inv.invoiceId)}
                                  title="Delete Invoice"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentInvoicePage}
              totalItems={invoices.length}
              pageSize={pageSize}
              onPageChange={setCurrentInvoicePage}
            />
          </div>
        </>
      )}

      {/* Tab 2: Payments */}
      {activeTab === 'payments' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Patient</th>
                  <th>Date & Time</th>
                  <th>Method</th>
                  <th>Reference / Note</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>No payments recorded.</td></tr>
                ) : (
                  payments.slice((currentPaymentPage - 1) * pageSize, currentPaymentPage * pageSize).map((p) => (
                    <tr key={p.paymentId}>
                      <td style={{ fontWeight: 700 }}>{p.paymentNumber}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.patient?.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.patient?.patientNumber}</div>
                      </td>
                      <td>{new Date(p.receivedAt).toLocaleString('en-IN')}</td>
                      <td><span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>{p.method}</span></td>
                      <td style={{ fontSize: '12px' }}>{p.reference || p.notes || '—'}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{p.amount}</td>
                      <td>
                        <span className={`badge ${p.status === 'verified' ? 'badge-success' : 'badge-warning'}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {hasPermission('payment.edit') && (
                          <button
                            className="btn btn-icon btn-sm"
                            style={{ color: 'red' }}
                            onClick={() => handleDeletePayment(p.paymentId)}
                            title="Delete Payment"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPaymentPage}
            totalItems={payments.length}
            pageSize={pageSize}
            onPageChange={setCurrentPaymentPage}
          />
        </div>
      )}

      {/* Tab 3: Receipts */}
      {activeTab === 'receipts' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Patient</th>
                  <th>Issued Date</th>
                  <th>Payment Method</th>
                  <th>Amount Paid</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>No receipts generated yet.</td></tr>
                ) : (
                  receipts.slice((currentReceiptPage - 1) * pageSize, currentReceiptPage * pageSize).map((r) => (
                    <tr key={r.receiptId}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.receiptNumber}</td>
                      <td style={{ fontWeight: 600 }}>{r.patient?.name}</td>
                      <td>{new Date(r.issuedAt).toLocaleDateString('en-IN')}</td>
                      <td style={{ textTransform: 'uppercase' }}>{r.method}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{r.amount}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/billing/receipts/${r.receiptId}`)}
                        >
                          <Eye size={13} /> View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentReceiptPage}
            totalItems={receipts.length}
            pageSize={pageSize}
            onPageChange={setCurrentReceiptPage}
          />
        </div>
      )}

      {/* Tab 4: Offline Verifications */}
      {activeTab === 'verification' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fffbeb' }}>
            <h3 style={{ fontSize: '15px', color: '#b45309' }}>Pending Offline Payment Verifications</h3>
            <p style={{ fontSize: '12px', color: '#78350f' }}>
              Payments submitted via bank screenshot, manual UPI, or paper receipt requiring staff verification
            </p>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Proof / Reference</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingVerificationList.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No payments currently pending verification. All transactions settled!
                    </td>
                  </tr>
                ) : (
                  pendingVerificationList.slice((currentVerificationPage - 1) * pageSize, currentVerificationPage * pageSize).map((p) => (
                    <tr key={p.paymentId}>
                      <td style={{ fontWeight: 700 }}>{p.paymentNumber}</td>
                      <td style={{ fontWeight: 600 }}>{p.patient?.name}</td>
                      <td>{new Date(p.receivedAt).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: '#0284c7' }}>₹{p.amount}</td>
                      <td>
                        <div>Ref: {p.reference || 'None provided'}</div>
                        {p.proofUrl && (
                          <a href={p.proofUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--primary)' }}>
                            View Proof Screenshot
                          </a>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleVerifyOfflinePayment(p.paymentId, 'verified')}
                          >
                            <Check size={14} /> Accept & Issue Receipt
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleVerifyOfflinePayment(p.paymentId, 'rejected')}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentVerificationPage}
            totalItems={pendingVerificationList.length}
            pageSize={pageSize}
            onPageChange={setCurrentVerificationPage}
          />
        </div>
      )}

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Create New Billing Invoice"
        maxWidth="680px"
      >
        <form onSubmit={handleCreateInvoiceSubmit} autoComplete="off">
          <div className="form-group">
            <label className="form-label">Select Patient *</label>
            <select
              required
              className="form-select"
              value={invoiceForm.patientId}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, patientId: e.target.value })}
            >
              <option value="">Select registered patient...</option>
              {patientsList.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {p.patientNumber} — {p.name} ({p.phone})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="form-label" style={{ margin: 0 }}>Billable Items / Services *</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
                <Plus size={13} /> Add Line Item
              </button>
            </div>

            {invoiceForm.items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <select
                  className="form-select"
                  value={item.serviceId}
                  onChange={(e) => handleItemChange(idx, 'serviceId', e.target.value)}
                >
                  <option value="">Select Service / Custom...</option>
                  {servicesList.map((s) => (
                    <option key={s.serviceId} value={s.serviceId}>{s.name}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                />

                <input
                  type="number"
                  className="form-input"
                  placeholder="Price (₹)"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Discount (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={invoiceForm.discountTotal}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, discountTotal: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tax / GST (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={invoiceForm.taxTotal}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, taxTotal: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Instructions</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Due within 7 days"
              value={invoiceForm.notes}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsInvoiceModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Generate Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Receive Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Receive Payment: ${selectedInvoiceForPayment?.invoiceNumber || ''}`}
        maxWidth="500px"
      >
        <form onSubmit={handleReceivePaymentSubmit} autoComplete="off">
          <div className="form-group">
            <label className="form-label">Amount to Collect (₹) *</label>
            <input
              type="number"
              required
              max={selectedInvoiceForPayment?.balance}
              className="form-input"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method *</label>
            <select
              className="form-select"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              <option value="upi">UPI (GPay, PhonePe, Paytm, QR)</option>
              <option value="cash">Cash</option>
              <option value="card">Credit / Debit Card (POS)</option>
              <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="online_gateway">Online Payment Gateway</option>
              <option value="other">Other / Cheque</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Reference / UTR Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. UPI/628849102911 or Card Approval Code"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={paymentForm.needsVerification}
                onChange={(e) => setPaymentForm({ ...paymentForm, needsVerification: e.target.checked })}
              />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                Hold for cashier verification (offline screenshot / proof pending)
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              Confirm Payment & Issue Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillingPage;
