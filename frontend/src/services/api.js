import { API_BASE_URL } from '../config/urls';

function getToken() {
  return localStorage.getItem('wowwed_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('wowwed_token', token);
  else localStorage.removeItem('wowwed_token');
}

export async function fetchApi(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Cannot reach the WowWed server. Start the backend and try again.');
  }
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `API error: ${response.status}`);
  }

  return body;
}

export const api = {
  register: (payload) => fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => fetchApi('/api/auth/me'),
  resetPassword: (payload) => fetchApi('/api/auth/password', { method: 'PUT', body: JSON.stringify(payload) }),

  getAllData: () => fetchApi('/api/data'),
  getData: (key) => fetchApi(`/api/data/${key}`),
  saveData: (key, data) => fetchApi(`/api/data/${key}`, { method: 'PUT', body: JSON.stringify(data) }),

  getWeddingProfile: () => fetchApi('/api/profiles/wedding'),
  saveWeddingProfile: (profile) => fetchApi('/api/profiles/wedding', { method: 'PUT', body: JSON.stringify(profile) }),
  ensureChecklist: () => fetchApi('/api/data'),
  getOnboarding: () => fetchApi('/api/profiles/onboarding'),
  saveOnboarding: (onboarding) => fetchApi('/api/profiles/onboarding', { method: 'PUT', body: JSON.stringify(onboarding) }),
  getVendorProfile: () => fetchApi('/api/profiles/vendor'),
  saveVendorProfile: (profile) => fetchApi('/api/profiles/vendor', { method: 'PUT', body: JSON.stringify(profile) }),
  uploadVendorPdf: (payload) => fetchApi('/api/profiles/vendor/pdf', { method: 'POST', body: JSON.stringify(payload) }),
  getVendorListings: () => fetchApi('/api/profiles/vendors'),

  getBookings: () => fetchApi('/api/bookings'),
  createBooking: (booking) => fetchApi('/api/bookings', { method: 'POST', body: JSON.stringify(booking) }),
  updateBooking: (id, payload) => fetchApi(`/api/bookings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getAvailability: (listingId, date) => fetchApi(`/api/bookings/availability?listingId=${encodeURIComponent(listingId)}&date=${encodeURIComponent(date)}`),

  getReviews: (listingId) => fetchApi(listingId ? `/api/reviews?listingId=${encodeURIComponent(listingId)}` : '/api/reviews'),
  createReview: (payload) => fetchApi('/api/reviews', { method: 'POST', body: JSON.stringify(payload) }),

  getNotifications: () => fetchApi('/api/notifications'),
  markNotificationRead: (id) => fetchApi(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => fetchApi('/api/notifications/read-all', { method: 'PUT' }),

  predictCost: (payload) => fetchApi('/api/ml/cost', { method: 'POST', body: JSON.stringify(payload) }),
  optimizeSeating: (payload) => fetchApi('/api/ml/seating', { method: 'POST', body: JSON.stringify(payload) }),
};
