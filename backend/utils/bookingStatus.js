const STATUS_ALIASES = {
  Accepted: 'Confirmed',
  Updated: 'Negotiating',
  Hired: 'Paid',
};

function canonicalizeStatus(status) {
  return STATUS_ALIASES[status] || status;
}

const PAID_STATUSES = ['Paid', 'Hired'];

function isPaid(status) {
  return canonicalizeStatus(status) === 'Paid';
}

function occupiesDate(status) {
  const value = canonicalizeStatus(status);
  return value === 'Confirmed' || value === 'Paid' || value === 'Negotiating' || value === 'Countered';
}

function coupleCanHire(status) {
  const value = canonicalizeStatus(status);
  return value === 'Confirmed' || value === 'Negotiating';
}

function coupleCanCancel(status) {
  const value = canonicalizeStatus(status);
  return value !== 'Paid' && value !== 'Rejected' && value !== 'Cancelled';
}

const BUSY_STATUSES = ['Confirmed', 'Accepted', 'Paid', 'Hired', 'Negotiating', 'Updated', 'Countered'];

module.exports = {
  canonicalizeStatus,
  isPaid,
  occupiesDate,
  coupleCanHire,
  coupleCanCancel,
  BUSY_STATUSES,
  PAID_STATUSES,
};
