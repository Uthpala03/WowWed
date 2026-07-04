import { SeatingChart } from '../models/Seating';

/** @deprecated Use SeatingChart.autoSeatAll() — kept for backward compatibility */
export function generateSmartSeating(guests, tables) {
  const chart = new SeatingChart({ tables, assignments: {} }, guests);
  const { filled, conflicts } = chart.autoSeatAll();
  if (!filled && !tables.length) {
    return { assignments: {}, conflicts: ['Add tables and guests first.'] };
  }
  return { assignments: chart.assignments, conflicts };
}
