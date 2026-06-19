const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { initAllData, getGoodsData, getCitiesData, getEventsData, getMercenariesData } = require('./data/initData');
const store = require('./data/store');
const { authMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const recordsRoutes = require('./routes/records');
const {
  calculateCityPrices,
  calculateBlackMarketRisk,
  rollBlackMarketEvent,
  calculateTravelCost,
  getConnectedCities,
  calculateCaravanWeight,
  rollRandomEvent,
  applyEventEffect,
  updateCityInventoryAfterTrade,
  simulateMarketFluctuation,
  getAvailableMercenaries,
  calculateMercenaryWage,
  getMercenaryEffects
} = require('./game/gameLogic');

const app = express();
const PORT = process.env.PORT || 5000;

initAllData();

app.use(cors());
app.use(express.json());

const gameSessions = new Map();
const cityInventoriesCache = new Map();
const cityPricesCache = new Map();
const blackMarketPricesCache = new Map();

function verifyGameSession(req, res, next) {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: '缺少会话ID' });
  }
  
  if (!gameSessions.has(sessionId)) {
    if (req.user) {
      const record = store.getGameRecord(req.user.id, sessionId);
      if (record) {
        gameSessions.set(sessionId, record);
        if (record.cityInventories) {
          cityInventoriesCache.set(sessionId, record.cityInventories);
        }
        if (record.cityPrices) {
          cityPricesCache.set(sessionId, record.cityPrices);
        }
        req.game = record;
        return next();
      }
    }
    return res.status(404).json({ error: '游戏会话不存在，请重新开始或加载游戏' });
  }
  
  const game = gameSessions.get(sessionId);
  if (req.user && game.userId !== req.user.id) {
    return res.status(403).json({ error: '无权访问此游戏会话' });
  }
  req.game = game;
  next();
}

function getOrCreateCityPrices(sessionId, cityId, cityInventories, city, goods) {
  if (!cityPricesCache.has(sessionId)) {
    cityPricesCache.set(sessionId, {});
  }
  const sessionPrices = cityPricesCache.get(sessionId);
  
  if (!sessionPrices[cityId]) {
    sessionPrices[cityId] = calculateCityPrices(cityId, cityInventories, city, goods, null, false);
  }
  
  return calculateCityPrices(cityId, cityInventories, city, goods, sessionPrices, false);
}

function getOrCreateBlackMarketPrices(sessionId, cityId, cityInventories, city, goods) {
  if (!blackMarketPricesCache.has(sessionId)) {
    blackMarketPricesCache.set(sessionId, {});
  }
  const sessionPrices = blackMarketPricesCache.get(sessionId);
  
  sessionPrices[cityId] = calculateCityPrices(cityId, cityInventories, city, goods, null, true);
  
  return sessionPrices[cityId];
}

function invalidateCityPrices(sessionId, cityId) {
  if (cityPricesCache.has(sessionId)) {
    const sessionPrices = cityPricesCache.get(sessionId);
    delete sessionPrices[cityId];
  }
  if (blackMarketPricesCache.has(sessionId)) {
    const sessionPrices = blackMarketPricesCache.get(sessionId);
    delete sessionPrices[cityId];
  }
}

function invalidateAllCityPrices(sessionId) {
  cityPricesCache.delete(sessionId);
  blackMarketPricesCache.delete(sessionId);
}

function getCities() {
  return getCitiesData().cities;
}

function getConnections() {
  return getCitiesData().connections;
}

function getGoods() {
  return getGoodsData();
}

function getEvents() {
  return getEventsData();
}

function getMercenariesInfo() {
  return getMercenariesData();
}

function getInitialCityInventories() {
  const cities = getCities();
  const goods = getGoods();
  const inventories = {};
  cities.forEach(city => {
    inventories[city.id] = {};
    goods.forEach(good => {
      if (good.blackMarketOnly) {
        inventories[city.id][good.id] = Math.floor(2 + Math.random() * 10);
      } else {
        inventories[city.id][good.id] = Math.floor(30 + Math.random() * 70);
      }
    });
  });
  return inventories;
}

function getOrCreateCityInventories(sessionId) {
  if (!cityInventoriesCache.has(sessionId)) {
    cityInventoriesCache.set(sessionId, getInitialCityInventories());
  }
  return cityInventoriesCache.get(sessionId);
}

function saveGameRecordForUser(userId, sessionId, game) {
  if (!userId) return;
  const cityInventories = cityInventoriesCache.get(sessionId);
  const cityPrices = cityPricesCache.get(sessionId);
  const blackMarketPrices = blackMarketPricesCache.get(sessionId);
  const record = {
    ...game,
    cityInventories,
    cityPrices,
    blackMarketPrices,
    updatedAt: Date.now()
  };
  store.saveGameRecord(userId, sessionId, record);
}

function getHiredMercenaries(game) {
  const mercData = getMercenariesInfo();
  const hiredIds = game.caravan.mercenaries || [];
  return mercData.mercenaries.filter(m => hiredIds.includes(m.id));
}

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/records', recordsRoutes);

app.get('/api/cities', (req, res) => {
  const citiesData = getCitiesData();
  res.json({ cities: citiesData.cities, connections: citiesData.connections });
});

app.get('/api/goods', (req, res) => {
  res.json({ goods: getGoods() });
});

app.get('/api/events', (req, res) => {
  res.json({ events: getEvents() });
});

app.get('/api/mercenaries', (req, res) => {
  const mercData = getMercenariesInfo();
  res.json({ mercenaries: mercData.mercenaries, cityAvailability: mercData.cityAvailability });
});

app.post('/api/game/create', authMiddleware, (req, res) => {
  const { caravanName, leaderName, startCityId } = req.body;
  const userId = req.user.id;

  if (!caravanName || !leaderName || !startCityId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const cities = getCities();
  const goods = getGoods();
  const connections = getConnections();
  const startCity = cities.find(c => c.id === startCityId);
  if (!startCity) {
    return res.status(400).json({ error: '起始城市不存在' });
  }

  const sessionId = uuidv4();
  const caravan = {
    id: uuidv4(),
    name: caravanName,
    leader: leaderName,
    money: 1000,
    maxCarryWeight: 100,
    stamina: 100,
    maxStamina: 100,
    currentCityId: startCityId,
    inventory: {
      water: 5,
      food: 5,
      medicine: 2,
      weapons: 1,
      scrap: 2
    },
    tradeHistory: [],
    moneyHistory: [{ time: 0, money: 1000 }],
    travelCount: 0,
    reputation: 50,
    mercenaries: []
  };

  const game = {
    userId,
    caravan,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pendingEvent: null
  };

  gameSessions.set(sessionId, game);
  cityInventoriesCache.set(sessionId, getInitialCityInventories());
  cityPricesCache.set(sessionId, {});
  blackMarketPricesCache.set(sessionId, {});

  const cityInventories = cityInventoriesCache.get(sessionId);
  const currentPrices = getOrCreateCityPrices(sessionId, startCityId, cityInventories[startCityId], startCity, goods);
  const connectedCities = getConnectedCities(startCityId, cities, connections);
  const availableMercenaries = getAvailableMercenaries(startCityId, getMercenariesInfo().mercenaries, getMercenariesInfo().cityAvailability);
  const blackMarketPrices = startCity.hasBlackMarket 
    ? getOrCreateBlackMarketPrices(sessionId, startCityId, cityInventories[startCityId], startCity, goods) 
    : {};

  saveGameRecordForUser(userId, sessionId, game);

  res.json({
    sessionId,
    caravan,
    currentCity: startCity,
    currentPrices,
    blackMarketPrices,
    connectedCities,
    weight: calculateCaravanWeight(caravan.inventory, goods),
    allGoods: goods,
    hasBlackMarket: startCity.hasBlackMarket || false,
    blackMarketRisk: startCity.blackMarketRisk || 0,
    availableMercenaries,
    hiredMercenaries: [],
    mercenaryWage: 0
  });
});

app.post('/api/game/load', authMiddleware, (req, res) => {
  const { recordId } = req.body;
  const userId = req.user.id;

  const record = store.getGameRecord(userId, recordId);
  if (!record) {
    return res.status(404).json({ error: '游戏记录不存在' });
  }

  gameSessions.set(recordId, record);
  if (record.cityInventories) {
    cityInventoriesCache.set(recordId, record.cityInventories);
  }
  if (record.cityPrices) {
    cityPricesCache.set(recordId, record.cityPrices);
  }
  if (record.blackMarketPrices) {
    blackMarketPricesCache.set(recordId, record.blackMarketPrices);
  }

  const cities = getCities();
  const goods = getGoods();
  const connections = getConnections();
  const cityInventories = getOrCreateCityInventories(recordId);
  const currentCity = cities.find(c => c.id === record.caravan.currentCityId);
  const currentPrices = getOrCreateCityPrices(recordId, currentCity.id, cityInventories[currentCity.id], currentCity, goods);
  const blackMarketPrices = currentCity.hasBlackMarket 
    ? getOrCreateBlackMarketPrices(recordId, currentCity.id, cityInventories[currentCity.id], currentCity, goods) 
    : {};
  const connectedCities = getConnectedCities(currentCity.id, cities, connections);
  
  const mercInfo = getMercenariesInfo();
  const availableMercenaries = getAvailableMercenaries(currentCity.id, mercInfo.mercenaries, mercInfo.cityAvailability);
  const hiredMercs = getHiredMercenaries(record);
  const mercWage = calculateMercenaryWage(hiredMercs);

  res.json({
    sessionId: recordId,
    caravan: record.caravan,
    currentCity,
    currentPrices,
    blackMarketPrices,
    connectedCities,
    weight: calculateCaravanWeight(record.caravan.inventory, goods),
    allGoods: goods,
    pendingEvent: record.pendingEvent,
    hasBlackMarket: currentCity.hasBlackMarket || false,
    blackMarketRisk: currentCity.blackMarketRisk || 0,
    availableMercenaries,
    hiredMercenaries: hiredMercs,
    mercenaryWage: mercWage
  });
});

app.post('/api/game/save', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.id;
  const game = req.game;

  saveGameRecordForUser(userId, sessionId, game);

  res.json({ success: true, message: '游戏已保存' });
});

app.post('/api/game/state', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId } = req.body;
  const game = req.game;
  const cities = getCities();
  const goods = getGoods();
  const connections = getConnections();
  const cityInventories = getOrCreateCityInventories(sessionId);
  const currentCity = cities.find(c => c.id === game.caravan.currentCityId);
  const currentPrices = getOrCreateCityPrices(sessionId, currentCity.id, cityInventories[currentCity.id], currentCity, goods);
  const blackMarketPrices = currentCity.hasBlackMarket 
    ? getOrCreateBlackMarketPrices(sessionId, currentCity.id, cityInventories[currentCity.id], currentCity, goods) 
    : {};
  const connectedCities = getConnectedCities(currentCity.id, cities, connections);
  
  const mercInfo = getMercenariesInfo();
  const availableMercenaries = getAvailableMercenaries(currentCity.id, mercInfo.mercenaries, mercInfo.cityAvailability);
  const hiredMercs = getHiredMercenaries(game);
  const mercWage = calculateMercenaryWage(hiredMercs);

  res.json({
    caravan: game.caravan,
    currentCity,
    currentPrices,
    blackMarketPrices,
    connectedCities,
    weight: calculateCaravanWeight(game.caravan.inventory, goods),
    pendingEvent: game.pendingEvent,
    allGoods: goods,
    hasBlackMarket: currentCity.hasBlackMarket || false,
    blackMarketRisk: currentCity.blackMarketRisk || 0,
    availableMercenaries,
    hiredMercenaries: hiredMercs,
    mercenaryWage: mercWage
  });
});

app.post('/api/trade/buy', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId, goodId, amount } = req.body;
  const game = req.game;

  if (!goodId || !amount || amount <= 0) {
    return res.status(400).json({ error: '无效的交易参数' });
  }
  const cityInventories = getOrCreateCityInventories(sessionId);
  const goods = getGoods();
  const cities = getCities();
  const good = goods.find(g => g.id === goodId);

  if (!good) {
    return res.status(400).json({ error: '货物不存在' });
  }
  
  if (good.blackMarketOnly) {
    return res.status(400).json({ error: '此货物只能在黑市交易' });
  }

  const currentCity = cities.find(c => c.id === game.caravan.currentCityId);
  const currentPrices = getOrCreateCityPrices(sessionId, game.caravan.currentCityId, cityInventories[game.caravan.currentCityId], currentCity, goods);
  const priceInfo = currentPrices[goodId];

  if (!priceInfo) {
    return res.status(400).json({ error: '该城市不出售此货物' });
  }

  if (amount > priceInfo.stock) {
    return res.status(400).json({ error: '库存不足' });
  }

  const totalCost = priceInfo.buyPrice * amount;
  if (totalCost > game.caravan.money) {
    return res.status(400).json({ error: '金币不足' });
  }

  const currentWeight = calculateCaravanWeight(game.caravan.inventory, goods);
  const addedWeight = good.weight * amount;
  if (currentWeight + addedWeight > game.caravan.maxCarryWeight) {
    return res.status(400).json({ error: '负重超限' });
  }

  game.caravan.money -= totalCost;
  game.caravan.inventory[goodId] = (game.caravan.inventory[goodId] || 0) + amount;

  cityInventories[game.caravan.currentCityId] = updateCityInventoryAfterTrade(
    game.caravan.currentCityId,
    cityInventories[game.caravan.currentCityId],
    goodId,
    amount,
    true
  );

  game.caravan.tradeHistory.push({
    id: uuidv4(),
    type: 'buy',
    goodId,
    goodName: good.name,
    amount,
    unitPrice: priceInfo.buyPrice,
    totalPrice: totalCost,
    cityId: currentCity.id,
    cityName: currentCity.name,
    time: Date.now()
  });

  game.caravan.moneyHistory.push({
    time: game.caravan.tradeHistory.length,
    money: game.caravan.money
  });

  const updatedPrices = getOrCreateCityPrices(sessionId, game.caravan.currentCityId, cityInventories[game.caravan.currentCityId], currentCity, goods);
  const weight = calculateCaravanWeight(game.caravan.inventory, goods);

  game.updatedAt = Date.now();
  if (game.userId) {
    saveGameRecordForUser(game.userId, sessionId, game);
  }

  res.json({
    success: true,
    caravan: game.caravan,
    currentPrices: updatedPrices,
    weight,
    message: `成功购买 ${amount} 单位 ${good.name}，花费 ${totalCost} 金币`
  });
});

app.post('/api/trade/sell', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId, goodId, amount } = req.body;
  const game = req.game;

  if (!goodId || !amount || amount <= 0) {
    return res.status(400).json({ error: '无效的交易参数' });
  }
  const cityInventories = getOrCreateCityInventories(sessionId);
  const goods = getGoods();
  const cities = getCities();
  const good = goods.find(g => g.id === goodId);

  if (!good) {
    return res.status(400).json({ error: '货物不存在' });
  }

  const playerAmount = game.caravan.inventory[goodId] || 0;
  if (amount > playerAmount) {
    return res.status(400).json({ error: '库存不足' });
  }

  const currentCity = cities.find(c => c.id === game.caravan.currentCityId);
  const currentPrices = getOrCreateCityPrices(sessionId, game.caravan.currentCityId, cityInventories[game.caravan.currentCityId], currentCity, goods);
  const priceInfo = currentPrices[goodId];

  const totalEarning = priceInfo.sellPrice * amount;

  game.caravan.money += totalEarning;
  game.caravan.inventory[goodId] -= amount;

  cityInventories[game.caravan.currentCityId] = updateCityInventoryAfterTrade(
    game.caravan.currentCityId,
    cityInventories[game.caravan.currentCityId],
    goodId,
    amount,
    false
  );

  game.caravan.tradeHistory.push({
    id: uuidv4(),
    type: 'sell',
    goodId,
    goodName: good.name,
    amount,
    unitPrice: priceInfo.sellPrice,
    totalPrice: totalEarning,
    cityId: currentCity.id,
    cityName: currentCity.name,
    time: Date.now()
  });

  game.caravan.moneyHistory.push({
    time: game.caravan.tradeHistory.length,
    money: game.caravan.money
  });

  const updatedPrices = getOrCreateCityPrices(sessionId, game.caravan.currentCityId, cityInventories[game.caravan.currentCityId], currentCity, goods);
  const weight = calculateCaravanWeight(game.caravan.inventory, goods);

  game.updatedAt = Date.now();
  if (game.userId) {
    saveGameRecordForUser(game.userId, sessionId, game);
  }

  res.json({
    success: true,
    caravan: game.caravan,
    currentPrices: updatedPrices,
    weight,
    message: `成功出售 ${amount} 单位 ${good.name}，获得 ${totalEarning} 金币`
  });
});

app.post('/api/blackmarket/prices', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId } = req.body;
  const game = req.game;
  const cities = getCities();
  const goods = getGoods();
  const currentCity = cities.find(c => c.id === game.caravan.currentCityId);
  
  if (!currentCity.hasBlackMarket) {
    return res.status(400).json({ error: '该城市没有黑市' });
  }
  
  const cityInventories = getOrCreateCityInventories(sessionId);
  const blackMarketPrices = getOrCreateBlackMarketPrices(sessionId, game.caravan.currentCityId, cityInventories[game.caravan.currentCityId], currentCity, goods);
  const risk = calculateBlackMarketRisk(currentCity, {});
  
  res.json({
    success: true,
    blackMarketPrices,
    blackMarketRisk: risk,
    cityName: currentCity.name
  });
});

app.post('/api/blackmarket/buy', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId, goodId, amount } = req.body;
  const game = req.game;

  if (!goodId || !amount || amount <= 0) {
    return res.status(400).json({ error: '无效的交易参数' });
  }

  const cities = getCities();
  const goods = getGoods();
  const currentCity = cities.find(c => c.id === game.caravan.currentCityId);
  
  if (!currentCity.hasBlackMarket) {
    return res.status(400).json({ error: '该城市没有黑市' });
  }

  const good = goods.find(g => g.id === goodId);
  if (!good) {
    return res.status(400).json({ error: '货物不存在' });
  }

  const cityInventories = getOrCreateCityInventories(sessionId);
  const blackMarketPrices = getOrCreateBlackMarketPrices(sessionId, game.caravan.currentCityId, cityInventories[game.caravan.currentCityId], currentCity, goods);
  const priceInfo = blackMarketPrices[goodId];

  if (!priceInfo || priceInfo.stock < amount) {
    return res.status(400).json({ error: '库存不足' });
  }

  const totalCost = priceInfo.buyPrice * amount;
  if (totalCost > game.caravan.money) {
    return res.status(400).json({ error: '金币不足' });
  }

  const currentWeight = calculateCaravanWeight(game.caravan.inventory, goods);
  const addedWeight = good.weight * amount;
  if (currentWeight + addedWeight > game.caravan.maxCarryWeight) {
    return res.status(400).json({ error: '负重超限' });
  }

  game.caravan.money -= totalCost;
  game.caravan.inventory[goodId] = (game.caravan.inventory[goodId] || 0) + amount;

  cityInventories[game.caravan.currentCityId] = updateCityInventoryAfterTrade(
    game.caravan.currentCityId,
    cityInventories[game.caravan.currentCityId],
    goodId,
    amount,
    true
  );

  const goodsBought = { [goodId]: amount };
  const blackMarketEvent = rollBlackMarketEvent(currentCity, goodsBought, game.caravan);
  
  let eventResult = null;
  if (blackMarketEvent) {
    eventResult = blackMarketEvent.messages;
    
    game.caravan.money = Math.max(0, game.caravan.money - blackMarketEvent.moneyLoss);
    game.caravan.stamina = Math.max(0, game.caravan.stamina - blackMarketEvent.staminaLoss);
    
    Object.entries(blackMarketEvent.goodsLoss).forEach(([lostGoodId, lostAmount]) => {
      game.caravan.inventory[lostGoodId] = Math.max(0, (game.caravan.inventory[lostGoodId] || 0) - lostAmount);
    });
  }

  game.caravan.tradeHistory.push({
    id: uuidv4(),
    type: 'blackmarket_buy',
    goodId,
    goodName: good.name,
    amount,
    unitPrice: priceInfo.buyPrice,
    totalPrice: totalCost,
    cityId: currentCity.id,
    cityName: currentCity.name,
    blackMarket: true,
    event: blackMarketEvent ? blackMarketEvent.event : null,
    eventResult: eventResult,
    time: Date.now()
  });

  game.caravan.moneyHistory.push({
    time: game.caravan.tradeHistory.length,
    money: game.caravan.money
  });

  invalidateCityPrices(sessionId, game.caravan.currentCityId);
  const updatedBlackMarketPrices = getOrCreateBlackMarketPrices(sessionId, game.caravan.currentCityId, cityInventories[game.caravan.currentCityId], currentCity, goods);
  const weight = calculateCaravanWeight(game.caravan.inventory, goods);

  game.updatedAt = Date.now();
  if (game.userId) {
    saveGameRecordForUser(game.userId, sessionId, game);
  }

  let message = `成功购买 ${amount} 单位 ${good.name}，花费 ${totalCost} 金币`;
  if (blackMarketEvent) {
    message += ` | 遭遇了${blackMarketEvent.event.name}！`;
  }

  res.json({
    success: true,
    caravan: game.caravan,
    blackMarketPrices: updatedBlackMarketPrices,
    weight,
    message,
    blackMarketEvent,
    eventResult
  });
});

app.post('/api/blackmarket/sell', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId, goodId, amount } = req.body;
  const game = req.game;

  if (!goodId || !amount || amount <= 0) {
    return res.status(400).json({ error: '无效的交易参数' });
  }

  const cities = getCities();
  const goods = getGoods();
  const currentCity = cities.find(c => c.id === game.caravan.currentCityId);
  
  if (!currentCity.hasBlackMarket) {
    return res.status(400).json({ error: '该城市没有黑市' });
  }

  const good = goods.find(g => g.id === goodId);
  if (!good) {
    return res.status(400).json({ error: '货物不存在' });
  }

  const playerAmount = game.caravan.inventory[goodId] || 0;
  if (amount > playerAmount) {
    return res.status(400).json({ error: '库存不足' });
  }

  const cityInventories = getOrCreateCityInventories(sessionId);
  const blackMarketPrices = getOrCreateBlackMarketPrices(sessionId, game.caravan.currentCityId, cityInventories[game.caravan.currentCityId], currentCity, goods);
  const priceInfo = blackMarketPrices[goodId];

  const totalEarning = priceInfo.sellPrice * amount;

  game.caravan.money += totalEarning;
  game.caravan.inventory[goodId] -= amount;

  cityInventories[game.caravan.currentCityId] = updateCityInventoryAfterTrade(
    game.caravan.currentCityId,
    cityInventories[game.caravan.currentCityId],
    goodId,
    amount,
    false
  );

  const goodsSold = { [goodId]: amount };
  const blackMarketEvent = rollBlackMarketEvent(currentCity, goodsSold, game.caravan);
  
  let eventResult = null;
  if (blackMarketEvent) {
    eventResult = blackMarketEvent.messages;
    
    game.caravan.money = Math.max(0, game.caravan.money - blackMarketEvent.moneyLoss);
    game.caravan.stamina = Math.max(0, game.caravan.stamina - blackMarketEvent.staminaLoss);
    
    Object.entries(blackMarketEvent.goodsLoss).forEach(([lostGoodId, lostAmount]) => {
      game.caravan.inventory[lostGoodId] = Math.max(0, (game.caravan.inventory[lostGoodId] || 0) - lostAmount);
    });
  }

  game.caravan.tradeHistory.push({
    id: uuidv4(),
    type: 'blackmarket_sell',
    goodId,
    goodName: good.name,
    amount,
    unitPrice: priceInfo.sellPrice,
    totalPrice: totalEarning,
    cityId: currentCity.id,
    cityName: currentCity.name,
    blackMarket: true,
    event: blackMarketEvent ? blackMarketEvent.event : null,
    eventResult: eventResult,
    time: Date.now()
  });

  game.caravan.moneyHistory.push({
    time: game.caravan.tradeHistory.length,
    money: game.caravan.money
  });

  invalidateCityPrices(sessionId, game.caravan.currentCityId);
  const updatedBlackMarketPrices = getOrCreateBlackMarketPrices(sessionId, game.caravan.currentCityId, cityInventories[game.caravan.currentCityId], currentCity, goods);
  const weight = calculateCaravanWeight(game.caravan.inventory, goods);

  game.updatedAt = Date.now();
  if (game.userId) {
    saveGameRecordForUser(game.userId, sessionId, game);
  }

  let message = `成功出售 ${amount} 单位 ${good.name}，获得 ${totalEarning} 金币`;
  if (blackMarketEvent) {
    message += ` | 遭遇了${blackMarketEvent.event.name}！`;
  }

  res.json({
    success: true,
    caravan: game.caravan,
    blackMarketPrices: updatedBlackMarketPrices,
    weight,
    message,
    blackMarketEvent,
    eventResult
  });
});

app.post('/api/mercenaries/available', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId } = req.body;
  const game = req.game;
  const mercInfo = getMercenariesInfo();
  
  const available = getAvailableMercenaries(game.caravan.currentCityId, mercInfo.mercenaries, mercInfo.cityAvailability);
  const hiredIds = game.caravan.mercenaries || [];
  const hiredMercs = mercInfo.mercenaries.filter(m => hiredIds.includes(m.id));
  const wage = calculateMercenaryWage(hiredMercs);
  
  res.json({
    success: true,
    availableMercenaries: available,
    hiredMercenaries: hiredMercs,
    mercenaryWage: wage,
    effects: getMercenaryEffects(hiredMercs)
  });
});

app.post('/api/mercenaries/hire', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId, mercenaryId } = req.body;
  const game = req.game;
  
  if (!mercenaryId) {
    return res.status(400).json({ error: '缺少佣兵ID' });
  }
  
  const mercInfo = getMercenariesInfo();
  const mercenary = mercInfo.mercenaries.find(m => m.id === mercenaryId);
  
  if (!mercenary) {
    return res.status(404).json({ error: '佣兵不存在' });
  }
  
  const available = getAvailableMercenaries(game.caravan.currentCityId, mercInfo.mercenaries, mercInfo.cityAvailability);
  if (!available.find(m => m.id === mercenaryId)) {
    return res.status(400).json({ error: '该城市没有这个佣兵' });
  }
  
  if (game.caravan.mercenaries && game.caravan.mercenaries.includes(mercenaryId)) {
    return res.status(400).json({ error: '你已经雇佣了这个佣兵' });
  }
  
  if (game.caravan.money < mercenary.wage) {
    return res.status(400).json({ error: '金币不足，无法支付首日工资' });
  }
  
  game.caravan.money -= mercenary.wage;
  game.caravan.mercenaries = game.caravan.mercenaries || [];
  game.caravan.mercenaries.push(mercenaryId);
  
  game.caravan.tradeHistory.push({
    id: uuidv4(),
    type: 'mercenary_hire',
    mercenaryId,
    mercenaryName: mercenary.name,
    wage: mercenary.wage,
    cityId: game.caravan.currentCityId,
    time: Date.now()
  });
  
  game.caravan.moneyHistory.push({
    time: game.caravan.tradeHistory.length,
    money: game.caravan.money
  });
  
  const hiredIds = game.caravan.mercenaries;
  const hiredMercs = mercInfo.mercenaries.filter(m => hiredIds.includes(m.id));
  const wage = calculateMercenaryWage(hiredMercs);
  const availableMercs = getAvailableMercenaries(game.caravan.currentCityId, mercInfo.mercenaries, mercInfo.cityAvailability);
  
  game.updatedAt = Date.now();
  if (game.userId) {
    saveGameRecordForUser(game.userId, sessionId, game);
  }
  
  res.json({
    success: true,
    message: `成功雇佣了 ${mercenary.name}，首日工资 ${mercenary.wage} 金币`,
    caravan: game.caravan,
    availableMercenaries: availableMercs,
    hiredMercenaries: hiredMercs,
    mercenaryWage: wage,
    effects: getMercenaryEffects(hiredMercs)
  });
});

app.post('/api/mercenaries/fire', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId, mercenaryId } = req.body;
  const game = req.game;
  
  if (!mercenaryId) {
    return res.status(400).json({ error: '缺少佣兵ID' });
  }
  
  const mercInfo = getMercenariesInfo();
  const mercenary = mercInfo.mercenaries.find(m => m.id === mercenaryId);
  
  if (!game.caravan.mercenaries || !game.caravan.mercenaries.includes(mercenaryId)) {
    return res.status(400).json({ error: '你没有雇佣这个佣兵' });
  }
  
  game.caravan.mercenaries = game.caravan.mercenaries.filter(id => id !== mercenaryId);
  
  game.caravan.tradeHistory.push({
    id: uuidv4(),
    type: 'mercenary_fire',
    mercenaryId,
    mercenaryName: mercenary ? mercenary.name : mercenaryId,
    cityId: game.caravan.currentCityId,
    time: Date.now()
  });
  
  const hiredIds = game.caravan.mercenaries;
  const hiredMercs = mercInfo.mercenaries.filter(m => hiredIds.includes(m.id));
  const wage = calculateMercenaryWage(hiredMercs);
  const availableMercs = getAvailableMercenaries(game.caravan.currentCityId, mercInfo.mercenaries, mercInfo.cityAvailability);
  
  game.updatedAt = Date.now();
  if (game.userId) {
    saveGameRecordForUser(game.userId, sessionId, game);
  }
  
  res.json({
    success: true,
    message: `已解雇 ${mercenary ? mercenary.name : mercenaryId}`,
    caravan: game.caravan,
    availableMercenaries: availableMercs,
    hiredMercenaries: hiredMercs,
    mercenaryWage: wage,
    effects: getMercenaryEffects(hiredMercs)
  });
});

app.post('/api/travel/start', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId, toCityId } = req.body;
  const game = req.game;
  const connections = getConnections();
  const cities = getCities();
  const goods = getGoods();
  const events = getEvents();
  const mercInfo = getMercenariesInfo();

  if (game.pendingEvent) {
    return res.status(400).json({ error: '请先处理当前事件' });
  }

  const travelCost = calculateTravelCost(game.caravan.currentCityId, toCityId, connections);

  if (!travelCost) {
    return res.status(400).json({ error: '无法到达该城市' });
  }

  if (game.caravan.stamina < travelCost.staminaCost) {
    return res.status(400).json({ error: '体力不足，无法出发。请在城市休整恢复体力。' });
  }

  if ((game.caravan.inventory['water'] || 0) < travelCost.waterCost) {
    return res.status(400).json({ error: `净水不足！本次旅行需要 ${travelCost.waterCost} 单位净水` });
  }

  if ((game.caravan.inventory['food'] || 0) < travelCost.foodCost) {
    return res.status(400).json({ error: `干粮不足！本次旅行需要 ${travelCost.foodCost} 单位干粮` });
  }

  if ((game.caravan.inventory['fuel'] || 0) < travelCost.fuelCost) {
    return res.status(400).json({ error: `燃料不足！本次旅行需要 ${travelCost.fuelCost} 单位燃料` });
  }

  const hiredMercIds = game.caravan.mercenaries || [];
  const hiredMercs = mercInfo.mercenaries.filter(m => hiredMercIds.includes(m.id));
  const totalWage = calculateMercenaryWage(hiredMercs);
  
  if (game.caravan.money < totalWage) {
    return res.status(400).json({ error: `金币不足，无法支付佣兵工资！本次旅行佣兵工资为 ${totalWage} 金币` });
  }

  game.caravan.stamina -= travelCost.staminaCost;
  game.caravan.inventory['water'] -= travelCost.waterCost;
  game.caravan.inventory['food'] -= travelCost.foodCost;
  game.caravan.inventory['fuel'] -= travelCost.fuelCost;
  game.caravan.money -= totalWage;
  game.caravan.travelCount += 1;

  const newCityInventories = simulateMarketFluctuation(cityInventoriesCache.get(sessionId), goods);
  cityInventoriesCache.set(sessionId, newCityInventories);
  invalidateAllCityPrices(sessionId);

  const randomEvent = rollRandomEvent(travelCost.danger, events);

  if (randomEvent) {
    if (randomEvent.hasChoices) {
      game.pendingEvent = {
        ...randomEvent,
        toCityId,
        travelCost,
        needsResolution: true
      };
    } else {
      const eventResult = applyEventEffect(randomEvent, null, game.caravan, goods, hiredMercs);
      game.caravan.money = eventResult.caravanUpdates.money;
      game.caravan.inventory = eventResult.caravanUpdates.inventory;
      game.caravan.stamina = eventResult.caravanUpdates.stamina;
      game.caravan.reputation = eventResult.caravanUpdates.reputation;
      game.caravan.currentCityId = toCityId;

      game.caravan.tradeHistory.push({
        id: uuidv4(),
        type: 'event',
        eventName: randomEvent.name,
        eventType: randomEvent.type,
        messages: eventResult.messages,
        cityId: toCityId,
        time: Date.now()
      });

      game.caravan.moneyHistory.push({
        time: game.caravan.tradeHistory.length,
        money: game.caravan.money
      });

      const arrivedCity = cities.find(c => c.id === toCityId);
      const arrivedPrices = getOrCreateCityPrices(sessionId, toCityId, newCityInventories[toCityId], arrivedCity, goods);
      const blackMarketPrices = arrivedCity.hasBlackMarket 
        ? getOrCreateBlackMarketPrices(sessionId, toCityId, newCityInventories[toCityId], arrivedCity, goods) 
        : {};
      const connectedCities = getConnectedCities(toCityId, cities, connections);
      
      const availableMercenaries = getAvailableMercenaries(toCityId, mercInfo.mercenaries, mercInfo.cityAvailability);
      const newHiredMercs = mercInfo.mercenaries.filter(m => (game.caravan.mercenaries || []).includes(m.id));
      const mercWage = calculateMercenaryWage(newHiredMercs);

      game.updatedAt = Date.now();
      if (game.userId) {
        saveGameRecordForUser(game.userId, sessionId, game);
      }

      res.json({
        success: true,
        eventOccurred: true,
        event: randomEvent,
        eventResult: eventResult.messages,
        caravan: game.caravan,
        currentCity: arrivedCity,
        currentPrices: arrivedPrices,
        blackMarketPrices,
        connectedCities,
        weight: calculateCaravanWeight(game.caravan.inventory, goods),
        hasBlackMarket: arrivedCity.hasBlackMarket || false,
        availableMercenaries,
        hiredMercenaries: newHiredMercs,
        mercenaryWage: mercWage
      });
      return;
    }
  }

  if (!game.pendingEvent) {
    game.caravan.currentCityId = toCityId;
  }

  const arrivedCity = cities.find(c => c.id === toCityId);
  const arrivedPrices = getOrCreateCityPrices(sessionId, toCityId, newCityInventories[toCityId], arrivedCity, goods);
  const blackMarketPrices = arrivedCity.hasBlackMarket 
    ? getOrCreateBlackMarketPrices(sessionId, toCityId, newCityInventories[toCityId], arrivedCity, goods) 
    : {};
  const connectedCities = getConnectedCities(toCityId, cities, connections);
  
  const availableMercenaries = getAvailableMercenaries(toCityId, mercInfo.mercenaries, mercInfo.cityAvailability);
  const newHiredMercs = mercInfo.mercenaries.filter(m => (game.caravan.mercenaries || []).includes(m.id));
  const mercWage = calculateMercenaryWage(newHiredMercs);

  game.updatedAt = Date.now();
  if (game.userId) {
    saveGameRecordForUser(game.userId, sessionId, game);
  }

  res.json({
    success: true,
    eventOccurred: !!game.pendingEvent,
    event: game.pendingEvent || null,
    caravan: game.caravan,
    currentCity: game.pendingEvent ? null : arrivedCity,
    currentPrices: game.pendingEvent ? null : arrivedPrices,
    blackMarketPrices: game.pendingEvent ? null : blackMarketPrices,
    connectedCities: game.pendingEvent ? null : connectedCities,
    weight: calculateCaravanWeight(game.caravan.inventory, goods),
    hasBlackMarket: game.pendingEvent ? false : (arrivedCity.hasBlackMarket || false),
    availableMercenaries: game.pendingEvent ? null : availableMercenaries,
    hiredMercenaries: game.pendingEvent ? null : newHiredMercs,
    mercenaryWage: game.pendingEvent ? null : mercWage
  });
});

app.post('/api/event/resolve', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId, choice, toCityId } = req.body;
  const game = req.game;

  if (!game.pendingEvent) {
    return res.status(400).json({ error: '没有待处理的事件' });
  }

  const event = game.pendingEvent;
  const targetCityId = toCityId || event.toCityId;
  const goods = getGoods();
  const cities = getCities();
  const connections = getConnections();
  const mercInfo = getMercenariesInfo();

  const hiredMercIds = game.caravan.mercenaries || [];
  const hiredMercs = mercInfo.mercenaries.filter(m => hiredMercIds.includes(m.id));

  const eventResult = applyEventEffect(event, choice, game.caravan, goods, hiredMercs);
  
  game.caravan.money = eventResult.caravanUpdates.money;
  game.caravan.inventory = eventResult.caravanUpdates.inventory;
  game.caravan.stamina = eventResult.caravanUpdates.stamina;
  game.caravan.reputation = eventResult.caravanUpdates.reputation;

  game.caravan.currentCityId = targetCityId;
  game.pendingEvent = null;

  game.caravan.tradeHistory.push({
    id: uuidv4(),
    type: 'event',
    eventName: event.name,
    eventType: event.type,
    messages: eventResult.messages,
    choice: choice,
    cityId: targetCityId,
    time: Date.now()
  });

  game.caravan.moneyHistory.push({
    time: game.caravan.tradeHistory.length,
    money: game.caravan.money
  });

  const cityInventories = cityInventoriesCache.get(sessionId);
  const arrivedCity = cities.find(c => c.id === targetCityId);
  const arrivedPrices = getOrCreateCityPrices(sessionId, targetCityId, cityInventories[targetCityId], arrivedCity, goods);
  const blackMarketPrices = arrivedCity.hasBlackMarket 
    ? getOrCreateBlackMarketPrices(sessionId, targetCityId, cityInventories[targetCityId], arrivedCity, goods) 
    : {};
  const connectedCities = getConnectedCities(targetCityId, cities, connections);
  
  const availableMercenaries = getAvailableMercenaries(targetCityId, mercInfo.mercenaries, mercInfo.cityAvailability);
  const currentHiredMercs = mercInfo.mercenaries.filter(m => (game.caravan.mercenaries || []).includes(m.id));
  const mercWage = calculateMercenaryWage(currentHiredMercs);

  game.updatedAt = Date.now();
  if (game.userId) {
    saveGameRecordForUser(game.userId, sessionId, game);
  }

  res.json({
    success: true,
    messages: eventResult.messages,
    caravan: game.caravan,
    currentCity: arrivedCity,
    currentPrices: arrivedPrices,
    blackMarketPrices,
    connectedCities,
    weight: calculateCaravanWeight(game.caravan.inventory, goods),
    hasBlackMarket: arrivedCity.hasBlackMarket || false,
    availableMercenaries,
    hiredMercenaries: currentHiredMercs,
    mercenaryWage: mercWage
  });
});

app.post('/api/rest', authMiddleware, verifyGameSession, (req, res) => {
  const { sessionId } = req.body;
  const game = req.game;
  const goods = getGoods();
  const cities = getCities();
  const mercInfo = getMercenariesInfo();
  const restCost = 50;

  const hiredMercIds = game.caravan.mercenaries || [];
  const hiredMercs = mercInfo.mercenaries.filter(m => hiredMercIds.includes(m.id));
  const mercWage = calculateMercenaryWage(hiredMercs);
  const totalCost = restCost + mercWage;

  if (game.caravan.money < totalCost) {
    return res.status(400).json({ error: `休整总共需要 ${totalCost} 金币（休整费${restCost} + 佣兵工资${mercWage}）` });
  }

  const foodNeeded = 3;
  const waterNeeded = 3;

  if ((game.caravan.inventory['food'] || 0) < foodNeeded) {
    return res.status(400).json({ error: `休整需要 ${foodNeeded} 单位干粮` });
  }

  if ((game.caravan.inventory['water'] || 0) < waterNeeded) {
    return res.status(400).json({ error: `休整需要 ${waterNeeded} 单位净水` });
  }

  game.caravan.money -= totalCost;
  game.caravan.inventory['food'] -= foodNeeded;
  game.caravan.inventory['water'] -= waterNeeded;
  game.caravan.stamina = Math.min(game.caravan.maxStamina, game.caravan.stamina + 50);

  const cityInventories = cityInventoriesCache.get(sessionId);
  const currentCity = cities.find(c => c.id === game.caravan.currentCityId);
  const currentPrices = getOrCreateCityPrices(sessionId, game.caravan.currentCityId, cityInventories[game.caravan.currentCityId], currentCity, goods);
  const blackMarketPrices = currentCity.hasBlackMarket 
    ? getOrCreateBlackMarketPrices(sessionId, game.caravan.currentCityId, cityInventories[game.caravan.currentCityId], currentCity, goods) 
    : {};
  
  const availableMercenaries = getAvailableMercenaries(game.caravan.currentCityId, mercInfo.mercenaries, mercInfo.cityAvailability);

  game.updatedAt = Date.now();
  if (game.userId) {
    saveGameRecordForUser(game.userId, sessionId, game);
  }

  let message = `商队休整完毕，体力恢复50点。消耗：${restCost}金币、干粮x${foodNeeded}、净水x${waterNeeded}`;
  if (hiredMercs.length > 0) {
    message += `，佣兵工资${mercWage}金币`;
  }

  res.json({
    success: true,
    caravan: game.caravan,
    currentPrices,
    blackMarketPrices,
    weight: calculateCaravanWeight(game.caravan.inventory, goods),
    message,
    availableMercenaries,
    hiredMercenaries: hiredMercs,
    mercenaryWage: mercWage
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`废土商队模拟器服务器已启动: http://0.0.0.0:${PORT}`);
});
