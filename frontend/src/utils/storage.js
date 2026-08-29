import { api, setToken } from '../services/api';
import { isPaid } from './bookingStatus';

const ONBOARDING_DRAFT_KEY = 'wowwed_onboarding_draft';

const cache = {
  user: null,
  ownerId: null,
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

export function clearOnboardingDraft() {
  localStorage.removeItem(ONBOARDING_DRAFT_KEY);
}

function resetSessionData() {
  cache.ownerId = null;
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

export function beginGuestOnboarding() {
  clearOnboardingDraft();
  if (!cache.user) {
    cache.onboarding = null;
  }
}

export function getUser() {
  return cache.user;
}

export async function registerUser(userData, onboarding) {
  const ownOnboarding = onboarding || getOnboardingDraft();
  const { token, user } = await api.register({
    fullName: userData.fullName,
    email: userData.email,
    phone: userData.phone,
    password: userData.password,
    role: userData.role || 'couple',
    onboarding: ownOnboarding,
  });

  resetSessionData();
  setToken(token);
  cache.user = user;
  cache.onboarding = ownOnboarding || null;
  clearOnboardingDraft();
  await hydrateUserData();
  return user;
}

export async function loginUser(email, password) {
  resetSessionData();
  clearOnboardingDraft();
  const { token, user } = await api.login({ email, password });
  setToken(token);
  cache.user = user;
  await hydrateUserData();
  return user;
}

export function clearUser() {
  setToken(null);
  cache.user = null;
  resetSessionData();
  clearOnboardingDraft();
}

export async function restoreSession() {
  if (!localStorage.getItem('wowwed_token')) return null;
  resetSessionData();
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

function ownedByOtherUser() {
  return cache.ownerId != null && cache.user && Number(cache.ownerId) !== Number(cache.user.id);
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
    const profileBudget = Number(cache.weddingProfile?.budget) || 0;
    if (profileBudget) {
      const current = cache.budget && typeof cache.budget === 'object'
        ? cache.budget
        : { categories: [], expenses: [] };
      cache.budget = {
        ...current,
        total: profileBudget,
        categories: current.categories || [],
        expenses: current.expenses || [],
      };
    }
  } else {
    cache.vendorProfile = results[3]?.profile || null;
    cache.onboarding = results[4]?.onboarding || null;
  }

  cache.ownerId = cache.user.id;
  cache.hydrated = true;
  notifyDataChanged();
}

export function readCoupleSnapshot() {
  if (!cache.user || ownedByOtherUser()) {
    return {
      userId: null,
      profile: null,
      onboarding: null,
      tasks: [],
      guests: [],
      budget: null,
      seating: { tables: [], assignments: {} },
      crew: [],
      bookings: [],
    };
  }
  return {
    userId: cache.user.id,
    profile: cache.weddingProfile,
    onboarding: cache.onboarding,
    tasks: cache.tasks || [],
    guests: cache.guests || [],
    budget: cache.budget,
    seating: cache.seating || { tables: [], assignments: {} },
    crew: cache.crew || [],
    bookings: cache.bookings || [],
  };
}

export function saveOnboarding(data) {
  saveOnboardingDraft(data);
  cache.onboarding = data;
}

export async function persistOnboarding(data) {
  saveOnboarding(data);
  if (!cache.user) return data;
  const result = await api.saveOnboarding(data);
  cache.onboarding = result.onboarding || data;
  if (result.profile) cache.weddingProfile = result.profile;
  clearOnboardingDraft();
  return cache.onboarding;
}

function dateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function getCoupleBasics() {
  const profile = getWeddingProfile();
  const onboarding = getOnboarding();
  const weddingDate = dateInputValue(profile?.weddingDate || onboarding?.weddingDate);
  const location = String(onboarding?.location || profile?.district || '').trim();
  const district = String(profile?.district || location).trim();
  return {
    weddingDate,
    location,
    district,
    hasDate: Boolean(weddingDate),
    hasLocation: Boolean(location),
    onboardingCompleted: Boolean(onboarding?.completedAt),
  };
}

export function getOnboarding() {
  if (ownedByOtherUser()) return null;
  if (cache.user) return cache.onboarding;
  return getOnboardingDraft();
}

export function getWeddingProfile() {
  if (ownedByOtherUser()) return null;
  return cache.weddingProfile;
}

export async function saveWeddingProfile(profile) {
  const existing = cache.weddingProfile || {};
  const basics = getCoupleBasics();
  const payload = {
    partnerOne: profile.partnerOne || '',
    partnerTwo: profile.partnerTwo || '',
    weddingDate: profile.weddingDate || existing.weddingDate || basics.weddingDate || null,
    venue: profile.venue || existing.venue || '',
    district: profile.district || existing.district || basics.district || '',
    ceremonyType: profile.ceremonyType || existing.ceremonyType || '',
    guestCount: Number(profile.guestCount) || null,
    budget: Number(profile.budget) || null,
    scale: profile.scale || existing.scale || 'standard',
    venueType: existing.venueType || profile.venueType || null,
    planningStage: existing.planningStage || profile.planningStage || null,
  };
  cache.weddingProfile = { ...existing, ...payload };
  if (cache.onboarding) {
    cache.onboarding = {
      ...cache.onboarding,
      location: payload.district || cache.onboarding.location,
      weddingDate: payload.weddingDate || cache.onboarding.weddingDate,
    };
  }
  if (cache.user || localStorage.getItem('wowwed_token')) {
    const { profile: saved } = await api.saveWeddingProfile(payload);
    if (saved) cache.weddingProfile = saved;
  }
  const profileBudget = Number(cache.weddingProfile?.budget) || 0;
  if (profileBudget) {
    const current = cache.budget && typeof cache.budget === 'object'
      ? cache.budget
      : { categories: [], expenses: [] };
    cache.budget = {
      ...current,
      total: profileBudget,
      categories: current.categories || [],
      expenses: current.expenses || [],
    };
  }
  notifyDataChanged();
  return cache.weddingProfile;
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

export async function refreshVendorListings() {
  const { listings } = await api.getVendorListings();
  cache.vendorListings = listings || [];
  return cache.vendorListings;
}

export function getTasks() {
  if (ownedByOtherUser()) return null;
  return cache.tasks;
}

export async function saveTasks(tasks) {
  cache.tasks = tasks;
  if (cache.user) await api.saveData('tasks', tasks);
}

export async function ensureCoupleChecklist() {
  if (!cache.user || cache.user.role !== 'couple') return getTasks() || [];
  const data = await api.getAllData();
  cache.tasks = data.tasks || [];
  cache.guests = data.guests || cache.guests || [];
  cache.budget = data.budget || cache.budget;
  const profileBudget = getProfileBudget();
  if (profileBudget && cache.budget) {
    cache.budget = { ...cache.budget, total: profileBudget };
  }
  return cache.tasks;
}

export function getGuests() {
  if (ownedByOtherUser()) return [];
  return cache.guests;
}

function notifyDataChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('wowwed-data-changed'));
  }
}

export async function saveGuests(guests) {
  cache.guests = guests;
  notifyDataChanged();
  if (cache.user) await api.saveData('guests', guests);
}

export function getBudget() {
  if (ownedByOtherUser()) return null;
  return cache.budget;
}

export function getProfileBudget() {
  if (ownedByOtherUser()) return 0;
  return Number(cache.weddingProfile?.budget) || 0;
}

export async function saveBudget(budget) {
  const profileBudget = getProfileBudget();
  const next = {
    ...budget,
    total: profileBudget || Number(budget?.total) || 0,
  };
  cache.budget = next;
  notifyDataChanged();
  if (cache.user) await api.saveData('budget', next);
}

export function getSeating() {
  if (ownedByOtherUser()) return { tables: [], assignments: {} };
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
  notifyDataChanged();
  if (cache.user) await api.saveData('crew', crew);
}

export function getBookings() {
  return cache.bookings;
}

export async function saveBookings(bookings) {
  cache.bookings = bookings;
}

export async function addBooking(booking) {
  if (!booking?.vendorListingId && !booking?.vendorId) {
    throw new Error('This request is not tied to a vendor listing.');
  }
  if (cache.user) {
    const { booking: saved } = await api.createBooking(booking);
    cache.bookings = [...cache.bookings, saved];
    notifyDataChanged();
    return saved;
  }
  cache.bookings = [...cache.bookings, booking];
  notifyDataChanged();
  return booking;
}

export async function refreshBookings() {
  if (!cache.user) return cache.bookings;
  const { bookings } = await api.getBookings();
  cache.bookings = bookings || [];
  notifyDataChanged();
  return cache.bookings;
}

export async function updateBookingStatus(id, status, extra = {}) {
  if (cache.user) {
    const { booking } = await api.updateBooking(id, { status, ...extra });
    cache.bookings = cache.bookings.map((item) => (item.id === id ? booking : item));
    if (isPaid(booking.status)) {
      try {
        const data = await api.getAllData();
        cache.budget = data.budget || cache.budget;
        const profileBudget = getProfileBudget();
        if (profileBudget && cache.budget) {
          cache.budget = { ...cache.budget, total: profileBudget };
        }
      } catch {
        /* keep local budget if refresh fails */
      }
    }
    notifyDataChanged();
    return booking;
  }
  cache.bookings = cache.bookings.map((item) => (item.id === id ? { ...item, status, ...extra } : item));
  notifyDataChanged();
  return cache.bookings.find((item) => item.id === id);
}

export async function getAvailability(listingId, date) {
  if (!listingId || !date) return { available: true, bookings: [] };
  return api.getAvailability(listingId, date);
}

export async function loadReviews(listingId) {
  const { reviews } = await api.getReviews(listingId);
  return reviews || [];
}

export async function addReview(payload) {
  const { review } = await api.createReview(payload);
  return review;
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

export async function initDashboardData() {
  if (!cache.user || cache.user.role !== 'couple') return false;
  if (!Array.isArray(cache.tasks)) cache.tasks = [];
  if (!Array.isArray(cache.guests)) cache.guests = [];
  if (!cache.budget) {
    cache.budget = { total: Number(cache.weddingProfile?.budget) || 0, categories: [], expenses: [] };
  }
  return false;
}

export function isHydrated() {
  return cache.hydrated;
}
