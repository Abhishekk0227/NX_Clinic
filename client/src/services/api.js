const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = rawApiUrl ? `${rawApiUrl}/api/v1` : '/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('hms_token');
  const branchId = localStorage.getItem('hms_branch_id');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (branchId) headers['x-branch-id'] = branchId;
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok || !data.success) {
    const errorMsg = data?.error?.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.code = data?.error?.code || 'UNKNOWN_ERROR';
    err.details = data?.error?.details;
    throw err;
  }
  return data.data;
};

const toQueryString = (params = {}) => {
  const clean = {};
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '' && val !== 'undefined') {
      clean[key] = val;
    }
  }
  return new URLSearchParams(clean).toString();
};

export const api = {
  // Auth
  login: (credentials) =>
    fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) }).then(handleResponse),
  me: () =>
    fetch(`${API_BASE}/auth/me`, { headers: getHeaders() }).then(handleResponse),
  switchBranch: (branchId) =>
    fetch(`${API_BASE}/auth/switch-branch`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ branchId }) }).then(handleResponse),

  // Organization & Branches
  getOrganization: () =>
    fetch(`${API_BASE}/organizations/current`, { headers: getHeaders() }).then(handleResponse),
  updateOrganization: (body) =>
    fetch(`${API_BASE}/organizations/current`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  getBranches: () =>
    fetch(`${API_BASE}/organizations/branches`, { headers: getHeaders() }).then(handleResponse),
  createBranch: (body) =>
    fetch(`${API_BASE}/organizations/branches`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updateBranch: (id, body) =>
    fetch(`${API_BASE}/organizations/branches/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  deleteBranch: (id) =>
    fetch(`${API_BASE}/organizations/branches/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  getDepartments: () =>
    fetch(`${API_BASE}/organizations/departments`, { headers: getHeaders() }).then(handleResponse),
  createDepartment: (body) =>
    fetch(`${API_BASE}/organizations/departments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),

  // Users, Roles & Staff
  getUsers: () =>
    fetch(`${API_BASE}/users`, { headers: getHeaders() }).then(handleResponse),
  createUser: (body) =>
    fetch(`${API_BASE}/users`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updateUser: (id, body) =>
    fetch(`${API_BASE}/users/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  deleteUser: (id) =>
    fetch(`${API_BASE}/users/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  getRoles: () =>
    fetch(`${API_BASE}/roles`, { headers: getHeaders() }).then(handleResponse),
  createRole: (body) =>
    fetch(`${API_BASE}/roles`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updateRole: (id, body) =>
    fetch(`${API_BASE}/roles/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  getPermissions: () =>
    fetch(`${API_BASE}/permissions`, { headers: getHeaders() }).then(handleResponse),
  getStaff: () =>
    fetch(`${API_BASE}/staff`, { headers: getHeaders() }).then(handleResponse),
  createStaff: (body) =>
    fetch(`${API_BASE}/staff`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updateStaff: (id, body) =>
    fetch(`${API_BASE}/staff/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  deleteStaff: (id) =>
    fetch(`${API_BASE}/staff/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Patients
  getPatients: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/patients?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  getPatientById: (id) =>
    fetch(`${API_BASE}/patients/${id}`, { headers: getHeaders() }).then(handleResponse),
  createPatient: (body) =>
    fetch(`${API_BASE}/patients`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  registerUnifiedPatient: (body) =>
    fetch(`${API_BASE}/patients/register-unified`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updatePatient: (id, body) =>
    fetch(`${API_BASE}/patients/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  archivePatient: (id, reason) =>
    fetch(`${API_BASE}/patients/${id}/archive`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ reason }) }).then(handleResponse),
  getPatientTimeline: (id) =>
    fetch(`${API_BASE}/patients/${id}/timeline`, { headers: getHeaders() }).then(handleResponse),

  // Appointments
  getAppointments: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/appointments?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  getAppointmentById: (id) =>
    fetch(`${API_BASE}/appointments/${id}`, { headers: getHeaders() }).then(handleResponse),
  createAppointment: (body) =>
    fetch(`${API_BASE}/appointments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updateAppointment: (id, body) =>
    fetch(`${API_BASE}/appointments/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updateAppointmentStatus: (id, status, cancellationReason) =>
    fetch(`${API_BASE}/appointments/${id}/status`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ status, cancellationReason }) }).then(handleResponse),
  checkInAppointment: (id, data) =>
    fetch(`${API_BASE}/appointments/${id}/check-in`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data || {}) }).then(handleResponse),


  // Queue
  getQueue: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/queue?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  registerWalkIn: (body) =>
    fetch(`${API_BASE}/queue/walk-in`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  callQueuePatient: (id) =>
    fetch(`${API_BASE}/queue/${id}/call`, { method: 'POST', headers: getHeaders() }).then(handleResponse),
  startConsultation: (id) =>
    fetch(`${API_BASE}/queue/${id}/start-consultation`, { method: 'POST', headers: getHeaders() }).then(handleResponse),
  completeQueue: (id) =>
    fetch(`${API_BASE}/queue/${id}/complete`, { method: 'POST', headers: getHeaders() }).then(handleResponse),
  skipQueue: (id) =>
    fetch(`${API_BASE}/queue/${id}/skip`, { method: 'POST', headers: getHeaders() }).then(handleResponse),

  // Clinical
  getEncounters: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/clinical/encounters?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  getEncounterWorkspace: (id) =>
    fetch(`${API_BASE}/clinical/encounters/${id}`, { headers: getHeaders() }).then(handleResponse),
  saveClinicalRecord: (id, body) =>
    fetch(`${API_BASE}/clinical/encounters/${id}/record`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  addTreatment: (body) =>
    fetch(`${API_BASE}/clinical/treatments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  savePrescription: (body) =>
    fetch(`${API_BASE}/clinical/prescriptions`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  completeEncounter: (id) =>
    fetch(`${API_BASE}/clinical/encounters/${id}/complete`, { method: 'POST', headers: getHeaders() }).then(handleResponse),

  // Services
  getServices: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/services?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  createService: (body) =>
    fetch(`${API_BASE}/services`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updateService: (id, body) =>
    fetch(`${API_BASE}/services/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  deleteService: (id) =>
    fetch(`${API_BASE}/services/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Clinical Vitals & Triage Configuration
  getVitalParams: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/vital-params?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  createVitalParam: (body) =>
    fetch(`${API_BASE}/vital-params`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updateVitalParam: (id, body) =>
    fetch(`${API_BASE}/vital-params/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  deleteVitalParam: (id) =>
    fetch(`${API_BASE}/vital-params/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Billing & Payments
  getInvoices: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/billing/invoices?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  getInvoiceById: (id) =>
    fetch(`${API_BASE}/billing/invoices/${id}`, { headers: getHeaders() }).then(handleResponse),
  createInvoice: (body) =>
    fetch(`${API_BASE}/billing/invoices`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  receivePayment: (body) =>
    fetch(`${API_BASE}/billing/payments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  getPayments: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/billing/payments?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  verifyPayment: (id, body) =>
    fetch(`${API_BASE}/billing/payments/${id}/verify`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  getReceipts: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/billing/receipts?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  getReceiptById: (id) =>
    fetch(`${API_BASE}/billing/receipts/${id}`, { headers: getHeaders() }).then(handleResponse),
  processRefund: (body) =>
    fetch(`${API_BASE}/billing/refunds`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),

  // Dynamic Forms & Workflows
  getForms: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/forms?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  getFormByKey: (key) =>
    fetch(`${API_BASE}/forms/${key}`, { headers: getHeaders() }).then(handleResponse),
  createForm: (body) =>
    fetch(`${API_BASE}/forms`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updateForm: (id, body) =>
    fetch(`${API_BASE}/forms/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  submitFormValues: (body) =>
    fetch(`${API_BASE}/forms/submissions`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  getFormSubmission: (entityId) =>
    fetch(`${API_BASE}/forms/submissions/${entityId}`, { headers: getHeaders() }).then(handleResponse),
  getWorkflows: () =>
    fetch(`${API_BASE}/workflows`, { headers: getHeaders() }).then(handleResponse),

  // Documents & Follow-ups
  getDocuments: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/documents?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  uploadDocument: (body) =>
    fetch(`${API_BASE}/documents`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  getFollowUps: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/followups?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  createFollowUp: (body) =>
    fetch(`${API_BASE}/followups`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  updateFollowUp: (id, body) =>
    fetch(`${API_BASE}/followups/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),

  // Dashboard & Reports
  getDashboardStats: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/dashboard/stats?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  getOperationalReport: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/reports/operational?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  getRevenueReport: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/reports/revenue?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },
  getClinicalReport: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/reports/clinical?${qs}`, { headers: getHeaders() }).then(handleResponse);
  },

  // Offline Sync & Audit
  syncBatch: (operations) =>
    fetch(`${API_BASE}/sync/batch`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ operations }) }).then(handleResponse),
  getSyncStatus: () =>
    fetch(`${API_BASE}/sync/status`, { headers: getHeaders() }).then(handleResponse),
  getAuditLogs: (params = {}) => {
    const qs = toQueryString(params);
    return fetch(`${API_BASE}/audit/logs?${qs}`, { headers: getHeaders() }).then(handleResponse);
  }
};
