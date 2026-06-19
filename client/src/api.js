const API_BASE = '';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

async function apiCall(endpoint, method = 'GET', body = null, requireAuth = false) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (requireAuth) {
    const token = getToken();
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && requireAuth) {
      clearToken();
    }
    throw new Error(data.error || '请求失败');
  }

  return data;
}

export const api = {
  getCities: () => apiCall('/api/cities'),
  getGoods: () => apiCall('/api/goods'),
  getEvents: () => apiCall('/api/events'),

  createGame: (caravanName, leaderName, startCityId) =>
    apiCall('/api/game/create', 'POST', { caravanName, leaderName, startCityId }, true),

  loadGame: (recordId) =>
    apiCall('/api/game/load', 'POST', { recordId }, true),

  saveGame: (sessionId) =>
    apiCall('/api/game/save', 'POST', { sessionId }, true),

  getGameState: (sessionId) =>
    apiCall('/api/game/state', 'POST', { sessionId }, true),

  buyGoods: (sessionId, goodId, amount) =>
    apiCall('/api/trade/buy', 'POST', { sessionId, goodId, amount }, true),

  sellGoods: (sessionId, goodId, amount) =>
    apiCall('/api/trade/sell', 'POST', { sessionId, goodId, amount }, true),

  startTravel: (sessionId, toCityId) =>
    apiCall('/api/travel/start', 'POST', { sessionId, toCityId }, true),

  resolveEvent: (sessionId, choice, toCityId) =>
    apiCall('/api/event/resolve', 'POST', { sessionId, choice, toCityId }, true),

  rest: (sessionId) =>
    apiCall('/api/rest', 'POST', { sessionId }, true),

  register: (username, password) =>
    apiCall('/api/auth/register', 'POST', { username, password }),

  login: (username, password) =>
    apiCall('/api/auth/login', 'POST', { username, password }),

  logout: () =>
    apiCall('/api/auth/logout', 'POST', null, true),

  getProfile: () =>
    apiCall('/api/auth/profile', 'GET', null, true),

  deleteAccount: () =>
    apiCall('/api/auth/account', 'DELETE', null, true),

  changePassword: (oldPassword, newPassword) =>
    apiCall('/api/auth/password', 'PUT', { oldPassword, newPassword }, true),

  getRecords: () =>
    apiCall('/api/records', 'GET', null, true),

  getRecord: (recordId) =>
    apiCall(`/api/records/${recordId}`, 'GET', null, true),

  deleteRecord: (recordId) =>
    apiCall(`/api/records/${recordId}`, 'DELETE', null, true),

  adminGetGoods: () =>
    apiCall('/api/admin/goods', 'GET', null, true),

  adminAddGood: (goodData) =>
    apiCall('/api/admin/goods', 'POST', goodData, true),

  adminUpdateGood: (id, goodData) =>
    apiCall(`/api/admin/goods/${id}`, 'PUT', goodData, true),

  adminDeleteGood: (id) =>
    apiCall(`/api/admin/goods/${id}`, 'DELETE', null, true),

  adminGetCities: () =>
    apiCall('/api/admin/cities', 'GET', null, true),

  adminAddCity: (cityData) =>
    apiCall('/api/admin/cities', 'POST', cityData, true),

  adminUpdateCity: (id, cityData) =>
    apiCall(`/api/admin/cities/${id}`, 'PUT', cityData, true),

  adminDeleteCity: (id) =>
    apiCall(`/api/admin/cities/${id}`, 'DELETE', null, true),

  adminAddConnection: (connectionData) =>
    apiCall('/api/admin/connections', 'POST', connectionData, true),

  adminDeleteConnection: (from, to) =>
    apiCall(`/api/admin/connections/${from}/${to}`, 'DELETE', null, true),

  adminGetEvents: () =>
    apiCall('/api/admin/events', 'GET', null, true),

  adminAddEvent: (eventData) =>
    apiCall('/api/admin/events', 'POST', eventData, true),

  adminUpdateEvent: (id, eventData) =>
    apiCall(`/api/admin/events/${id}`, 'PUT', eventData, true),

  adminDeleteEvent: (id) =>
    apiCall(`/api/admin/events/${id}`, 'DELETE', null, true),

  adminGetUsers: () =>
    apiCall('/api/admin/users', 'GET', null, true),

  adminDeleteUser: (username) =>
    apiCall(`/api/admin/users/${username}`, 'DELETE', null, true),

  adminGetStats: () =>
    apiCall('/api/admin/stats', 'GET', null, true),

  getToken,
  setToken,
  clearToken
};
