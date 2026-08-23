import { getBudget, getCoupleBasics, getGuests, getTasks, getWeddingProfile, getBookings } from './storage';

export function buildNotifications() {
  const list = [];
  const profile = getWeddingProfile();
  const tasks = getTasks() || [];
  const guests = getGuests();
  const budget = getBudget();
  const bookings = getBookings();

  const weddingDate = profile?.weddingDate || getCoupleBasics().weddingDate;
  if (weddingDate) {
    const days = Math.ceil((new Date(weddingDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days >= 0 && days <= 30) {
      list.push({ id: 'countdown', type: 'info', text: `Only ${days} days until your wedding!`, link: '/dashboard' });
    }
  }

  const pendingRsvp = guests.filter((g) => g.rsvp === 'Pending').length;
  if (pendingRsvp > 0) {
    list.push({ id: 'rsvp', type: 'warning', text: `${pendingRsvp} guest(s) still pending RSVP`, link: '/dashboard/guests' });
  }

  const todo = tasks.filter((t) => !t.done).length;
  if (todo > 5) {
    list.push({ id: 'tasks', type: 'info', text: `${todo} checklist tasks remaining`, link: '/dashboard/checklist' });
  }

  if (budget?.total) {
    const spent = (budget.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
    if (spent > budget.total) {
      list.push({ id: 'overspend', type: 'danger', text: 'Budget overspend alert — expenses exceed your total budget', link: '/dashboard/budget' });
    } else if (spent / budget.total > 0.9) {
      list.push({ id: 'budget90', type: 'warning', text: 'You have used over 90% of your wedding budget', link: '/dashboard/budget' });
    }
  }

  const pendingBookings = bookings.filter((b) => b.status === 'Pending').length;
  if (pendingBookings > 0) {
    list.push({ id: 'bookings', type: 'info', text: `${pendingBookings} vendor booking request(s) awaiting response`, link: '/dashboard/vendors' });
  }

  return list;
}

export function getReadinessStatus(score) {
  if (score >= 70) return { label: 'On track', className: 'is-green' };
  if (score >= 40) return { label: 'Making progress', className: 'is-yellow' };
  return { label: 'Needs attention', className: 'is-red' };
}
