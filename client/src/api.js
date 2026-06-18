const API_BASE = '';

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

export const api = {
  getCities: () => apiCall('/api/cities'),
  getGoods: () => apiCall('/api/goods'),

  createGame: (caravanName, leaderName, startCityId) =>
    apiCall('/api/game/create', 'POST', { caravanName, leaderName, startCityId }),

  getGameState: (sessionId) =>
    apiCall('/api/game/state', 'POST', { sessionId }),

  buyGoods: (sessionId, goodId, amount) =>
    apiCall('/api/trade/buy', 'POST', { sessionId, goodId, amount }),

  sellGoods: (sessionId, goodId, amount) =>
    apiCall('/api/trade/sell', 'POST', { sessionId, goodId, amount }),

  startTravel: (sessionId, toCityId) =>
    apiCall('/api/travel/start', 'POST', { sessionId, toCityId }),

  resolveEvent: (sessionId, choice, toCityId) =>
    apiCall('/api/event/resolve', 'POST', { sessionId, choice, toCityId }),

  rest: (sessionId) =>
    apiCall('/api/rest', 'POST', { sessionId }),
};
