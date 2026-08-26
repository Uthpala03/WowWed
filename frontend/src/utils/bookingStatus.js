export function canonicalizeStatus(status) {
  if (status === 'Accepted') return 'Confirmed';
  if (status === 'Updated') return 'Negotiating';
  if (status === 'Hired') return 'Paid';
  return status || '';
}

export function displayStatus(status) {
  return canonicalizeStatus(status) || status || '';
}

export function isPaid(status) {
  return status === 'Paid' || status === 'Hired';
}

export function isConfirmedHold(status) {
  return status === 'Confirmed' || status === 'Accepted';
}

export function isNegotiating(status) {
  return status === 'Negotiating' || status === 'Updated';
}

export function needsVendorReply(status) {
  return status === 'Pending';
}

export function awaitingCouple(status) {
  return isConfirmedHold(status) || isNegotiating(status);
}

export function occupiesDate(status) {
  return isPaid(status) || isConfirmedHold(status) || isNegotiating(status);
}

export function vendorCanRespond(status) {
  return ['Pending', 'Confirmed', 'Accepted', 'Negotiating', 'Updated'].includes(status);
}

export function coupleCanHire(status) {
  return awaitingCouple(status);
}

export function statusTone(status) {
  const value = canonicalizeStatus(status).toLowerCase();
  if (value === 'paid' || value === 'confirmed') return 'accepted';
  if (value === 'rejected' || value === 'cancelled') return 'rejected';
  return 'pending';
}

export function calendarKind(status) {
  if (isPaid(status)) return 'paid';
  if (isConfirmedHold(status)) return 'confirmed';
  if (isNegotiating(status)) return 'negotiate';
  if (status === 'Pending') return 'pending';
  return '';
}

export function bookingDateKey(booking) {
  return String(booking?.date || '').slice(0, 10);
}
