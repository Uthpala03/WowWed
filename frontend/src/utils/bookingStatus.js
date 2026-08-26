export function canonicalizeStatus(status) {
  if (status === 'Accepted') return 'Confirmed';
  if (status === 'Updated') return 'Negotiating';
  if (status === 'Hired') return 'Paid';
  return status || '';
}

export function displayStatus(status) {
  const value = canonicalizeStatus(status);
  if (value === 'Countered') return 'Couple reply';
  if (value === 'Confirmed') return 'Accepted';
  if (value === 'Paid') return 'Booked';
  if (value === 'Negotiating') return 'Counter-offer';
  return value || status || '';
}

export function isPaid(status) {
  return canonicalizeStatus(status) === 'Paid';
}

export function isConfirmedHold(status) {
  return status === 'Confirmed' || status === 'Accepted';
}

export function isNegotiating(status) {
  return status === 'Negotiating' || status === 'Updated';
}

export function needsVendorReply(status) {
  const value = canonicalizeStatus(status);
  return value === 'Pending' || value === 'Countered';
}

export function vendorNeedsDecision(status) {
  return needsVendorReply(status) || isNegotiating(status);
}

export function awaitingCouple(status) {
  return isConfirmedHold(status) || isNegotiating(status);
}

export function occupiesDate(status) {
  return isPaid(status) || isConfirmedHold(status) || isNegotiating(status) || canonicalizeStatus(status) === 'Countered';
}

export function vendorCanRespond(status) {
  return ['Pending', 'Confirmed', 'Accepted', 'Negotiating', 'Updated', 'Countered'].includes(status);
}

export function coupleCanHire(status) {
  return awaitingCouple(status);
}

export function coupleCanAcceptOffer(status) {
  return isNegotiating(status);
}

export function coupleCanReply(status) {
  return vendorCanRespond(status);
}

export function coupleCanCancel(status) {
  const value = canonicalizeStatus(status);
  return value && !isPaid(value) && value !== 'Rejected' && value !== 'Cancelled';
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
  if (isNegotiating(status) || canonicalizeStatus(status) === 'Countered') return 'negotiate';
  if (status === 'Pending') return 'pending';
  return '';
}

export function bookingDateKey(booking) {
  return String(booking?.date || '').slice(0, 10);
}
