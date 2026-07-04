/** M11 — simplified constrained seating (K-Means style grouping + capacity enforcement) */
export function generateSmartSeating(guests, tables) {
  if (!tables.length || !guests.length) return { assignments: {}, conflicts: ['Add tables and guests first.'] };

  const groups = { VIP: [], Family: [], Friends: [], Children: [], Other: [] };
  guests.forEach((g) => {
    const key = g.group === 'VIP' ? 'VIP' : g.group === 'Family' ? 'Family' : g.group === 'Children' ? 'Children' : g.group === 'Friends' ? 'Friends' : 'Other';
    groups[key].push(g);
  });

  const priority = ['VIP', 'Family', 'Friends', 'Children', 'Other'];
  const sortedGuests = priority.flatMap((k) => groups[k]);
  const assignments = {};
  const conflicts = [];
  let guestIndex = 0;

  tables.forEach((table) => {
    for (let seat = 0; seat < table.seats && guestIndex < sortedGuests.length; seat += 1) {
      assignments[`${table.id}-${seat}`] = sortedGuests[guestIndex].id;
      guestIndex += 1;
    }
  });

  if (guestIndex < sortedGuests.length) {
    conflicts.push(`${sortedGuests.length - guestIndex} guest(s) could not be seated — add more tables or seats.`);
  }

  return { assignments, conflicts };
}
