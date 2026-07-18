const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

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

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
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
  getOnboarding: () => fetchApi('/api/profiles/onboarding'),
  getVendorProfile: () => fetchApi('/api/profiles/vendor'),
  saveVendorProfile: (profile) => fetchApi('/api/profiles/vendor', { method: 'PUT', body: JSON.stringify(profile) }),
  uploadVendorPdf: (payload) => fetchApi('/api/profiles/vendor/pdf', { method: 'POST', body: JSON.stringify(payload) }),
  getVendorListings: () => fetchApi('/api/profiles/vendors'),

  getBookings: () => fetchApi('/api/bookings'),
  createBooking: (booking) => fetchApi('/api/bookings', { method: 'POST', body: JSON.stringify(booking) }),
  updateBooking: (id, payload) => fetchApi(`/api/bookings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
};
