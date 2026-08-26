import { getReadinessStatus } from './notifications';

export function computeReadiness({ tasks = [], guests = [], budget = null } = {}) {
  const done = tasks.filter((task) => task.done).length;
  const accepted = guests.filter((guest) => guest.rsvp === 'Accepted').length;
  const spent = (budget?.expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const taskPct = Math.round((done / Math.max(tasks.length, 1)) * 100);
  const guestPct = guests.length ? Math.round((accepted / guests.length) * 100) : 0;
  const budgetPct = budget?.total ? Math.min(100, Math.round((spent / Number(budget.total)) * 100)) : 0;
  const score = Math.min(100, Math.max(0, Math.round(taskPct * 0.4 + guestPct * 0.35 + budgetPct * 0.25)));
  return {
    score,
    taskPct,
    guestPct,
    budgetPct,
    done,
    taskCount: tasks.length,
    accepted,
    guestCount: guests.length,
    status: getReadinessStatus(score),
  };
}
