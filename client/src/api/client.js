const API_URL = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('fa_token');
}

function setToken(token) {
  if (token) localStorage.setItem('fa_token', token);
  else localStorage.removeItem('fa_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    window.location.href = '/farmalert/login';
    throw new Error('unauthorized');
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(data.error || data.errors?.join(', ') || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  listMedications: () => request('/api/medications'),
  createMedication: (data) =>
    request('/api/medications', { method: 'POST', body: JSON.stringify(data) }),
  updateMedication: (id, data) =>
    request(`/api/medications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedication: (id) =>
    request(`/api/medications/${id}`, { method: 'DELETE' }),

  today: () => request('/api/medications/today'),
  take: (medicationId, scheduledAt) =>
    request('/api/medications/take', {
      method: 'POST',
      body: JSON.stringify({ medicationId, scheduledAt }),
    }),

  vapidKey: () => request('/api/notifications/vapid-key'),
  subscribe: (subscription) =>
    request('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    }),
  testNotification: () =>
    request('/api/notifications/test', { method: 'POST' }),

  adminListUsers: () => request('/api/admin/users'),
  adminCreateUser: (data) =>
    request('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  adminDeleteUser: (id) =>
    request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  adminResetPassword: (id, password) =>
    request(`/api/admin/users/${id}/password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
};

export { getToken, setToken };
