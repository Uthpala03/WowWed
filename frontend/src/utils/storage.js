const USER_KEY = 'wowwed_user';
const PROFILE_KEY = 'wowwed_wedding_profile';
const ONBOARDING_KEY = 'wowwed_onboarding';
const TASKS_KEY = 'wowwed_tasks';
const GUESTS_KEY = 'wowwed_guests';
const BUDGET_KEY = 'wowwed_budget';
const SEATING_KEY = 'wowwed_seating';
const CREW_KEY = 'wowwed_crew';
const BOOKINGS_KEY = 'wowwed_bookings';
const VENDOR_PROFILE_KEY = 'wowwed_vendor_profile';
const INVITATIONS_KEY = 'wowwed_invitations';
const VENDOR_LISTINGS_KEY = 'wowwed_vendor_listings';

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

export function saveWeddingProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getWeddingProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveOnboarding(data) {
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
}

export function getOnboarding() {
  const raw = localStorage.getItem(ONBOARDING_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getTasks() {
  const raw = localStorage.getItem(TASKS_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function getGuests() {
  const raw = localStorage.getItem(GUESTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveGuests(guests) {
  localStorage.setItem(GUESTS_KEY, JSON.stringify(guests));
}

export function getBudget() {
  const raw = localStorage.getItem(BUDGET_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveBudget(budget) {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
}

export function getSeating() {
  const raw = localStorage.getItem(SEATING_KEY);
  return raw ? JSON.parse(raw) : { tables: [], assignments: {} };
}

export function saveSeating(seating) {
  localStorage.setItem(SEATING_KEY, JSON.stringify(seating));
}

export function getCrew() {
  const raw = localStorage.getItem(CREW_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveCrew(crew) {
  localStorage.setItem(CREW_KEY, JSON.stringify(crew));
}

export function getBookings() {
  const raw = localStorage.getItem(BOOKINGS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveBookings(bookings) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

export function getVendorProfile() {
  const raw = localStorage.getItem(VENDOR_PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveVendorProfile(profile) {
  localStorage.setItem(VENDOR_PROFILE_KEY, JSON.stringify(profile));
  const listings = getVendorListings().filter((v) => v.ownerEmail !== profile.ownerEmail);
  listings.push({
    id: profile.id || `v-${Date.now()}`,
    name: profile.businessName,
    category: profile.category,
    city: profile.district,
    district: profile.district,
    priceRange: profile.priceRange,
    description: profile.description,
    rating: profile.rating || 4.5,
    ownerEmail: profile.ownerEmail,
    spotlight: false,
  });
  localStorage.setItem(VENDOR_LISTINGS_KEY, JSON.stringify(listings));
}

export function getVendorListings() {
  const raw = localStorage.getItem(VENDOR_LISTINGS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getInvitation() {
  const raw = localStorage.getItem(INVITATIONS_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveInvitation(data) {
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(data));
}

export function initDashboardData(defaultTasks, defaultGuests = []) {
  if (!getTasks()) saveTasks(defaultTasks);
  if (getGuests().length === 0 && defaultGuests.length) saveGuests(defaultGuests);
  if (!getBudget()) {
    saveBudget({ total: 10000000, categories: [], expenses: [] });
  }
}
