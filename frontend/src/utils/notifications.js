import { getBudget, getCoupleBasics, getGuests, getTasks, getWeddingProfile, getBookings, getUser } from './storage';
import { needsVendorReply } from './bookingStatus';

const DISMISSED_KEY_PREFIX = 'wowwed_dismissed_notifications';

function dismissedStorageKey() {
  const userId = getUser()?.id;
  return userId ? `${DISMISSED_KEY_PREFIX}_${userId}` : DISMISSED_KEY_PREFIX;
}

function getDismissedMap() {
  try {
    return JSON.parse(localStorage.getItem(dismissedStorageKey())) || {};
  } catch {
    return {};
  }
}

function saveDismissedMap(map) {
  try {
    localStorage.setItem(dismissedStorageKey(), JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('wowwed-notifications-changed'));
  }
}

export function isNotificationDismissed(id, signature) {
  const stored = getDismissedMap()[id];
  if (stored == null) return false;
  if (signature == null) return true;
  return String(stored) === String(signature);
}

export function dismissNotification(id, signature) {
  const map = getDismissedMap();
  map[id] = signature != null ? String(signature) : '1';
  saveDismissedMap(map);
}

export function clearDismissedNotifications() {
  try {
    localStorage.removeItem(dismissedStorageKey());
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('wowwed-notifications-changed'));
  }
}

export function buildNotifications() {
  return buildAllNotifications().filter(
    (item) => !isNotificationDismissed(item.id, item.signature),
  );
}

function buildAllNotifications() {
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
      list.push({
        id: 'countdown',
        type: 'info',
        icon: 'hearts',
        title: 'Wedding countdown',
        text: `Only ${days} day${days === 1 ? '' : 's'} until your wedding!`,
        link: '/dashboard',
        signature: String(days),
      });
    }
  }

  const pendingRsvp = guests.filter((g) => g.rsvp === 'Pending').length;
  if (pendingRsvp > 0) {
    list.push({
      id: 'rsvp',
      type: 'guest',
      icon: 'guests',
      title: 'Guest RSVPs',
      text: `${pendingRsvp} guest${pendingRsvp === 1 ? '' : 's'} still waiting to reply`,
      link: '/dashboard/guests',
      signature: String(pendingRsvp),
    });
  }

  const todo = tasks.filter((t) => !t.done).length;
  if (todo > 5) {
    list.push({
      id: 'tasks',
      type: 'checklist',
      icon: 'checklist',
      title: 'Checklist',
      text: `${todo} tasks still to do`,
      link: '/dashboard/checklist',
      signature: String(todo),
    });
  }

  if (budget?.total) {
    const spent = (budget.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
    if (spent > budget.total) {
      list.push({
        id: 'overspend',
        type: 'danger',
        icon: 'budget',
        title: 'Budget alert',
        text: 'Expenses exceed your total wedding budget',
        link: '/dashboard/budget',
        signature: `${spent}-${budget.total}`,
      });
    } else if (spent / budget.total > 0.9) {
      list.push({
        id: 'budget90',
        type: 'warning',
        icon: 'budget',
        title: 'Budget nearly used',
        text: 'You have used over 90% of your wedding budget',
        link: '/dashboard/budget',
        signature: String(Math.round((spent / budget.total) * 100)),
      });
    }
  }

  const pendingBookings = bookings.filter((b) => needsVendorReply(b.status)).length;
  if (pendingBookings > 0) {
    list.push({
      id: 'bookings',
      type: 'booking',
      icon: 'vendors',
      title: 'Vendor requests',
      text: `${pendingBookings} request${pendingBookings === 1 ? '' : 's'} waiting for a vendor reply`,
      link: '/dashboard/bookings',
      signature: String(pendingBookings),
    });
  }

  const readyToHire = (bookings || []).filter((b) => (
    b.status === 'Confirmed'
    || b.status === 'Accepted'
    || b.status === 'Negotiating'
    || b.status === 'Updated'
  )).length;
  if (readyToHire > 0) {
    list.push({
      id: 'hire',
      type: 'warning',
      icon: 'vendors',
      title: 'Ready to confirm',
      text: `${readyToHire} vendor${readyToHire === 1 ? '' : 's'} ready — confirm to add to your budget`,
      link: '/dashboard/bookings',
      signature: String(readyToHire),
    });
  }

  return list;
}

export function dismissAllNotifications(notifications) {
  const map = getDismissedMap();
  const rows = notifications?.length ? notifications : buildAllNotifications();
  rows.forEach((item) => {
    map[item.id] = item.signature != null ? String(item.signature) : '1';
  });
  saveDismissedMap(map);
}

export function getReadinessStatus(score) {
  if (score >= 70) return { label: 'On track', className: 'is-green' };
  if (score >= 40) return { label: 'Making progress', className: 'is-yellow' };
  return { label: 'Needs attention', className: 'is-red' };
}
