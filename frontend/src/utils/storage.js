import { api, setToken } from '../services/api';

const ONBOARDING_DRAFT_KEY = 'wowwed_onboarding_draft';

const cache = {
  user: null,
  weddingProfile: null,
  onboarding: null,
  vendorProfile: null,
  vendorListings: [],
  tasks: null,
  guests: [],
  budget: null,
  seating: { tables: [], assignments: {} },
  crew: [],
  bookings: [],
  invitation: null,
  hydrated: false,
};

function getOnboardingDraft() {
  const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveOnboardingDraft(data) {
  localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(data));
}

function clearOnboardingDraft() {
  localStorage.removeItem(ONBOARDING_DRAFT_KEY);
}

export function getUser() {
  return cache.user;
}

export async function registerUser(userData, onboarding) {
  const { token, user } = await api.register({
    fullName: userData.fullName,
    email: userData.email,
    phone: userData.phone,
    password: userData.password,
    role: userData.role || 'couple',
    onboarding: onboarding || getOnboardingDraft(),
  });

  setToken(token);
  cache.user = user;
  cache.onboarding = onboarding || getOnboardingDraft();
  clearOnboardingDraft();
  await hydrateUserData();
  return user;
}

export async function loginUser(email, password) {
  const { token, user } = await api.login({ email, password });
  setToken(token);
  cache.user = user;
  await hydrateUserData();
  return user;
}

export function clearUser() {
  setToken(null);
  cache.user = null;
  cache.weddingProfile = null;
  cache.onboarding = null;
  cache.vendorProfile = null;
  cache.vendorListings = [];
  cache.tasks = null;
  cache.guests = [];
  cache.budget = null;
  cache.seating = { tables: [], assignments: {} };
  cache.crew = [];
  cache.bookings = [];
  cache.invitation = null;
  cache.hydrated = false;
}

export async function restoreSession() {
  if (!localStorage.getItem('wowwed_token')) return null;
  try {
    const { user } = await api.me();
    cache.user = user;
    await hydrateUserData();
    return user;
  } catch {
    clearUser();
    return null;
  }
}

export async function hydrateUserData() {
  if (!cache.user) return;

  const requests = [
    api.getAllData(),
    api.getBookings(),
    api.getVendorListings(),
  ];

  if (cache.user.role === 'couple') {
    requests.push(api.getWeddingProfile(), api.getOnboarding());
  } else {
    requests.push(api.getVendorProfile(), api.getOnboarding());
  }

  const results = await Promise.all(requests);
  const data = results[0];
  const bookings = results[1];
  const vendors = results[2];

  cache.tasks = data.tasks;
  cache.guests = data.guests || [];
  cache.budget = data.budget;
  cache.seating = data.seating || { tables: [], assignments: {} };
  cache.crew = data.crew || [];
  cache.invitation = data.invitation;
  cache.bookings = bookings.bookings || [];
  cache.vendorListings = vendors.listings || [];

  if (cache.user.role === 'couple') {
    cache.weddingProfile = results[3]?.profile || null;
    cache.onboarding = results[4]?.onboarding || null;
  } else {
    cache.vendorProfile = results[3]?.profile || null;
    cache.onboarding = results[4]?.onboarding || null;
  }

  cache.hydrated = true;
}

export function saveOnboarding(data) {
  saveOnboardingDraft(data);
  cache.onboarding = data;
}

export function getOnboarding() {
  return cache.onboarding || getOnboardingDraft();
}

export function getWeddingProfile() {
  return cache.weddingProfile;
}

export async function saveWeddingProfile(profile) {
  cache.weddingProfile = profile;
  if (cache.user) {
    const { profile: saved } = await api.saveWeddingProfile(profile);
    cache.weddingProfile = saved;
  }
}

export function getVendorProfile() {
  return cache.vendorProfile;
}

export async function saveVendorProfile(profile) {
  cache.vendorProfile = profile;
  if (cache.user) {
    const { profile: saved } = await api.saveVendorProfile(profile);
    cache.vendorProfile = saved;
    const { listings } = await api.getVendorListings();
    cache.vendorListings = listings;
  }
}

export function getVendorListings() {
  return cache.vendorListings;
}

export function getTasks() {
  return cache.tasks;
}

export async function saveTasks(tasks) {
  cache.tasks = tasks;
  if (cache.user) await api.saveData('tasks', tasks);
}

export function getGuests() {
  return cache.guests;
}

export async function saveGuests(guests) {
  cache.guests = guests;
  if (cache.user) await api.saveData('guests', guests);
}

export function getBudget() {
  return cache.budget;
}

export async function saveBudget(budget) {
  cache.budget = budget;
  if (cache.user) await api.saveData('budget', budget);
}

export function getSeating() {
  return cache.seating;
}

export async function saveSeating(seating) {
  cache.seating = seating;
  if (cache.user) await api.saveData('seating', seating);
}

export function getCrew() {
  return cache.crew;
}

export async function saveCrew(crew) {
  cache.crew = crew;
  if (cache.user) await api.saveData('crew', crew);
}

export function getBookings() {
  return cache.bookings;
}

export async function saveBookings(bookings) {
  cache.bookings = bookings;
}

export async function addBooking(booking) {
  if (cache.user) {
    const { booking: saved } = await api.createBooking(booking);
    cache.bookings = [...cache.bookings, saved];
    return saved;
  }
  cache.bookings = [...cache.bookings, booking];
  return booking;
}

export async function updateBookingStatus(id, status) {
  if (cache.user) {
    const { booking } = await api.updateBooking(id, { status });
    cache.bookings = cache.bookings.map((b) => (b.id === id ? booking : b));
    return booking;
  }
  cache.bookings = cache.bookings.map((b) => (b.id === id ? { ...b, status } : b));
  return cache.bookings.find((b) => b.id === id);
}

export function getInvitation() {
  return cache.invitation;
}

export async function saveInvitation(data) {
  cache.invitation = data;
  if (cache.user) await api.saveData('invitation', data);
}

export async function resetPassword(email, password) {
  await api.resetPassword({ email, password });
}

export async function initDashboardData(defaultTasks, defaultGuests = []) {
  if (!cache.user || cache.user.role !== 'couple') return;

  let changed = false;
  if (!cache.tasks) {
    cache.tasks = defaultTasks;
    await api.saveData('tasks', defaultTasks);
    changed = true;
  }
  if (!cache.guests?.length && defaultGuests.length) {
    cache.guests = defaultGuests;
    await api.saveData('guests', defaultGuests);
    changed = true;
  }
  if (!cache.budget) {
    cache.budget = { total: 10000000, categories: [], expenses: [] };
    await api.saveData('budget', cache.budget);
    changed = true;
  }
  return changed;
}

export function isHydrated() {
  return cache.hydrated;
}
