import { API_BASE_URL, COST_API_URL, SEATING_API_URL } from '../config/urls';

const TOKEN_KEY = 'wowwed_token';

let token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}

async function postExternal(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detail || `Request failed (${res.status})`);
  }
  return data;
}

export function setToken(next) {
  token = next;
  if (next) localStorage.setItem(TOKEN_KEY, next);
  else localStorage.removeItem(TOKEN_KEY);
}

export const api = {
  register: (body) => request('/api/auth/register', { method: 'POST', body }),
  login: (body) => request('/api/auth/login', { method: 'POST', body }),
  me: () => request('/api/auth/me'),
  resetPassword: (body) => request('/api/auth/reset-password', { method: 'POST', body }),

  getAllData: () => request('/api/data'),
  saveData: (key, data) => request(`/api/data/${key}`, { method: 'PUT', body: { data } }),

  getWeddingProfile: () => request('/api/profiles/wedding'),
  saveWeddingProfile: (profile) => request('/api/profiles/wedding', { method: 'PUT', body: profile }),
  getVendorProfile: () => request('/api/profiles/vendor'),
  saveVendorProfile: (profile) => request('/api/profiles/vendor', { method: 'PUT', body: profile }),
  getOnboarding: () => request('/api/profiles/onboarding'),
  saveOnboarding: (data) => request('/api/profiles/onboarding', { method: 'PUT', body: data }),

  getBookings: () => request('/api/bookings'),
  createBooking: (booking) => request('/api/bookings', { method: 'POST', body: booking }),
  updateBooking: (id, body) => request(`/api/bookings/${id}`, { method: 'PATCH', body }),
  getVendorListings: () => request('/api/profiles/vendor/listings'),

  getAvailability: (listingId, date) => request(`/api/bookings/availability?listingId=${encodeURIComponent(listingId)}&date=${encodeURIComponent(date)}`),
  getReviews: (listingId) => request(`/api/reviews/${listingId}`),
  createReview: (payload) => request('/api/reviews', { method: 'POST', body: payload }),

  optimizeSeating: (body) => postExternal(SEATING_API_URL, body),
  predictCost: (body) => postExternal(COST_API_URL, body),
};
