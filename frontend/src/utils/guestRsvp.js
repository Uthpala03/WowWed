export function normalizeRsvp(value) {
  const v = String(value || '').trim().toLowerCase();
  if (['accepted', 'coming', 'yes', 'y', 'confirmed', 'confirm'].includes(v)) return 'Accepted';
  if (['rejected', 'declined', 'not coming', 'no', 'n'].includes(v)) return 'Rejected';
  return 'Pending';
}

export function countRsvpAccepted(guests) {
  return (guests || []).filter((guest) => normalizeRsvp(guest.rsvp) === 'Accepted').length;
}

/** Guest count for budget/catering — RSVP accepted, else planned profile count, else list size. */
export function resolveBudgetGuestCount(guests, profileGuestCount) {
  const accepted = countRsvpAccepted(guests);
  if (accepted > 0) return accepted;
  const planned = Number(profileGuestCount) || 0;
  if (planned > 0) return planned;
  const listed = (guests || []).length;
  return listed > 0 ? listed : 150;
}

export function rsvpGuestSummary(guests, profileGuestCount) {
  const listed = (guests || []).length;
  const accepted = countRsvpAccepted(guests);
  const pending = (guests || []).filter((g) => normalizeRsvp(g.rsvp) === 'Pending').length;
  const count = resolveBudgetGuestCount(guests, profileGuestCount);
  const source = accepted > 0 ? 'rsvp' : (Number(profileGuestCount) > 0 ? 'planned' : 'list');
  return { count, accepted, pending, listed, source };
}
