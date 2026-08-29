/** 40 wedding checklist tasks — 8 per planning stage (ceremony-specific rows added separately). */
const CHECKLIST_TEMPLATES = [
  { title: 'Set the wedding budget', category: 'budget', phase: 'from_start', ceremony: 'all', sort_order: 1 },
  { title: 'Confirm wedding date with both families', category: 'ceremony', phase: 'from_start', ceremony: 'all', sort_order: 2 },
  { title: 'Book the wedding venue or reception hall', category: 'venue', phase: 'from_start', ceremony: 'all', sort_order: 3 },
  { title: 'Hire photographer and videographer', category: 'vendors', phase: 'from_start', ceremony: 'all', sort_order: 4 },
  { title: 'Book bridal dressing (Kandyan, Indian or Western)', category: 'suite', phase: 'from_start', ceremony: 'all', sort_order: 5 },
  { title: 'Book groom national dress or suit', category: 'suite', phase: 'from_start', ceremony: 'all', sort_order: 6 },
  { title: 'Choose wedding theme and colours', category: 'decorations', phase: 'from_start', ceremony: 'all', sort_order: 7 },
  { title: 'Shortlist and compare key vendors', category: 'vendors', phase: 'from_start', ceremony: 'all', sort_order: 8 },

  { title: 'Book catering (rice and curry or hotel package)', category: 'catering', phase: 'six_months', ceremony: 'all', sort_order: 9 },
  { title: 'Book florist and jasmine decorations', category: 'decorations', phase: 'six_months', ceremony: 'all', sort_order: 10 },
  { title: 'Order the wedding cake', category: 'catering', phase: 'six_months', ceremony: 'all', sort_order: 11 },
  { title: 'Book band, DJ or Kandyan dancers', category: 'entertainment', phase: 'six_months', ceremony: 'all', sort_order: 12 },
  { title: 'Send save-the-date cards', category: 'guests', phase: 'six_months', ceremony: 'all', sort_order: 13 },
  { title: 'Book hotel rooms for outstation guests', category: 'logistics', phase: 'six_months', ceremony: 'all', sort_order: 14 },
  { title: 'Book hair and makeup artist (trial date)', category: 'suite', phase: 'six_months', ceremony: 'all', sort_order: 15 },
  { title: 'Plan honeymoon travel', category: 'logistics', phase: 'six_months', ceremony: 'all', sort_order: 16 },

  { title: 'Order wedding invitations', category: 'guests', phase: 'three_months', ceremony: 'all', sort_order: 17 },
  { title: 'Mail or hand-deliver invitations', category: 'guests', phase: 'three_months', ceremony: 'all', sort_order: 18 },
  { title: 'Confirm vendor contracts', category: 'vendors', phase: 'three_months', ceremony: 'all', sort_order: 19 },
  { title: 'Collect RSVPs', category: 'guests', phase: 'three_months', ceremony: 'all', sort_order: 20 },
  { title: 'Bride clothing fitting', category: 'suite', phase: 'three_months', ceremony: 'all', sort_order: 21 },
  { title: 'Groom clothing fitting', category: 'suite', phase: 'three_months', ceremony: 'all', sort_order: 22 },
  { title: 'Order bridal jewellery', category: 'suite', phase: 'three_months', ceremony: 'all', sort_order: 23 },
  { title: 'Plan welcome drinks and bar menu', category: 'catering', phase: 'three_months', ceremony: 'all', sort_order: 24 },

  { title: 'Create the seating chart', category: 'guests', phase: 'one_month', ceremony: 'all', sort_order: 25 },
  { title: 'Arrange guest buses and parking', category: 'logistics', phase: 'one_month', ceremony: 'all', sort_order: 26 },
  { title: 'Confirm final headcount with caterer', category: 'catering', phase: 'one_month', ceremony: 'all', sort_order: 27 },
  { title: 'Create the wedding-day timeline', category: 'logistics', phase: 'one_month', ceremony: 'all', sort_order: 28 },
  { title: 'Pack an emergency wedding kit', category: 'other', phase: 'one_month', ceremony: 'all', sort_order: 29 },
  { title: 'Arrange ceremony rehearsal', category: 'ceremony', phase: 'one_month', ceremony: 'all', sort_order: 30 },
  { title: 'Confirm ceremony readings and music', category: 'ceremony', phase: 'one_month', ceremony: 'all', sort_order: 31 },
  { title: 'Prepare marriage certificate documents', category: 'ceremony', phase: 'one_month', ceremony: 'all', sort_order: 32 },

  { title: 'Confirm vendor arrival times', category: 'vendors', phase: 'wedding_week', ceremony: 'all', sort_order: 33 },
  { title: 'Final dress and suit pickup', category: 'suite', phase: 'wedding_week', ceremony: 'all', sort_order: 34 },
  { title: 'Deliver final timeline to vendors', category: 'logistics', phase: 'wedding_week', ceremony: 'all', sort_order: 35 },
  { title: 'Confirm guest seating and place cards', category: 'guests', phase: 'wedding_week', ceremony: 'all', sort_order: 36 },
  { title: 'Pack wedding day survival kit', category: 'other', phase: 'wedding_week', ceremony: 'all', sort_order: 37 },
  { title: 'Confirm hair and makeup schedule', category: 'suite', phase: 'wedding_week', ceremony: 'all', sort_order: 38 },
  { title: 'Charge phones and prepare cash envelopes', category: 'logistics', phase: 'wedding_week', ceremony: 'all', sort_order: 39 },
  { title: 'Enjoy your wedding day', category: 'other', phase: 'wedding_week', ceremony: 'all', sort_order: 40 },
];

/** Extra tasks merged per ceremony type (keeps total at 40 by swapping generic rows). */
const CEREMONY_SWAPS = {
  church: [
    { replaces: 'Shortlist and compare key vendors', title: 'Book the church and priest', category: 'ceremony', phase: 'from_start', sort_order: 8 },
    { replaces: 'Plan welcome drinks and bar menu', title: 'Prepare marriage certificate documents', category: 'ceremony', phase: 'three_months', sort_order: 24 },
    { replaces: 'Arrange ceremony rehearsal', title: 'Arrange the church rehearsal', category: 'ceremony', phase: 'one_month', sort_order: 30 },
    { replaces: 'Confirm ceremony readings and music', title: 'Plan church aisle flowers and decor', category: 'decorations', phase: 'one_month', sort_order: 31 },
    { replaces: 'Confirm vendor arrival times', title: 'Confirm church arrival time', category: 'ceremony', phase: 'wedding_week', sort_order: 33 },
  ],
  poruwa: [
    { replaces: 'Shortlist and compare key vendors', title: 'Confirm auspicious date and nekatha with an astrologer', category: 'ceremony', phase: 'from_start', sort_order: 8 },
    { replaces: 'Book florist and jasmine decorations', title: 'Book the Poruwa and ashtaka items', category: 'ceremony', phase: 'six_months', sort_order: 10 },
    { replaces: 'Book band, DJ or Kandyan dancers', title: 'Find Jayamangala Gatha singers', category: 'ceremony', phase: 'six_months', sort_order: 12 },
    { replaces: 'Plan welcome drinks and bar menu', title: 'Arrange kiribath and traditional sweetmeats', category: 'catering', phase: 'three_months', sort_order: 24 },
    { replaces: 'Arrange ceremony rehearsal', title: 'Plan the Magul homecoming', category: 'ceremony', phase: 'one_month', sort_order: 30 },
    { replaces: 'Confirm vendor arrival times', title: 'Confirm Poruwa setup and ashtaka', category: 'ceremony', phase: 'wedding_week', sort_order: 33 },
  ],
};

function templatesForCeremony(ceremonyKey) {
  const swaps = CEREMONY_SWAPS[ceremonyKey] || [];
  const swapMap = new Map(swaps.map((row) => [row.replaces, row]));
  return CHECKLIST_TEMPLATES.map((row, index) => {
    const swap = swapMap.get(row.title);
    if (!swap) return { ...row, id: index + 1 };
    return {
      ...row,
      ...swap,
      ceremony: ceremonyKey,
      id: index + 1,
    };
  });
}

function allTemplatesForDb() {
  return CHECKLIST_TEMPLATES.map((row, index) => ({ ...row, id: index + 1 }));
}

module.exports = {
  CHECKLIST_TEMPLATES,
  CEREMONY_SWAPS,
  templatesForCeremony,
  allTemplatesForDb,
};
