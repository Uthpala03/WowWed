const STATUS_ALIASES = {
  Accepted: 'Confirmed',
  Updated: 'Negotiating',
  Hired: 'Paid',
};

function canonicalizeStatus(status) {
  return STATUS_ALIASES[status] || status;
}

function isPaid(status) {
  return status === 'Paid' || status === 'Hired';
}

function occupiesDate(status) {
  const value = canonicalizeStatus(status);
  return value === 'Confirmed' || value === 'Paid' || value === 'Negotiating';
}

function coupleCanHire(status) {
  const value = canonicalizeStatus(status);
  return value === 'Confirmed' || value === 'Negotiating';
}

const BUSY_STATUSES = ['Confirmed', 'Accepted', 'Paid', 'Hired'];

module.exports = {
  canonicalizeStatus,
  isPaid,
  occupiesDate,
  coupleCanHire,
  BUSY_STATUSES,
};
