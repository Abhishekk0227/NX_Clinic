const { v4: uuidv4 } = require('uuid');

const prefixes = {
  organization: 'org_',
  branch: 'br_',
  department: 'dept_',
  unit: 'unit_',
  resource: 'res_',
  person: 'per_',
  user: 'usr_',
  role: 'role_',
  permission: 'perm_',
  staff: 'stf_',
  patient: 'pat_',
  service: 'svc_',
  appointment: 'apt_',
  queueEntry: 'que_',
  encounter: 'enc_',
  clinicalRecord: 'cln_',
  treatment: 'trt_',
  prescription: 'rx_',
  invoice: 'inv_',
  invoiceItem: 'item_',
  payment: 'pay_',
  receipt: 'rcpt_',
  refund: 'ref_',
  document: 'doc_',
  form: 'frm_',
  formVersion: 'fv_',
  formSubmission: 'fsub_',
  workflow: 'wf_',
  workflowVersion: 'wfv_',
  workflowInstance: 'wfi_',
  followup: 'fup_',
  notification: 'notif_',
  auditLog: 'aud_',
  event: 'evt_',
  sync: 'sync_'
};

const generateId = (type) => {
  const prefix = prefixes[type] || 'ent_';
  return `${prefix}${uuidv4().replace(/-/g, '').substring(0, 16)}`;
};

module.exports = { generateId, prefixes };
