const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { cities, connections } = require('./data/cities');
const { goods } = require('./data/goods');
const {
  calculateCityPrices,
  calculateTravelCost,
  getConnectedCities,
  calculateCaravanWeight,
  rollRandomEvent,
  applyEventEffect,
  updateCityInventoryAfterTrade,
  simulateMarketFluctuation
} = require('./game/gameLogic');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const gameSessions = new Map();
const cityInventoriesCache = new Map();

function getInitialCityInventories() {
  const inventories = {};
  cities.forEach(city => {
    inventories[city.id] = {};
    goods.forEach(good => {
      inventories[city.id][good.id] = Math.floor(30 + Math.random() * 70);
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

app.get('/api/cities', (req, res) => {
  res.json({ cities, connections });
});

app.get('/api/goods', (req, res) => {
  res.json({ goods });
});

app.post('/api/game/create', (req, res) => {
  const { caravanName, leaderName, startCityId } = req.body;

  if (!caravanName || !leaderName || !startCityId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

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
    reputation: 50
  };

  gameSessions.set(sessionId, {
    caravan,
    createdAt: Date.now(),
    pendingEvent: null
  });

  cityInventoriesCache.set(sessionId, getInitialCityInventories());

  const cityInventories = cityInventoriesCache.get(sessionId);
  const currentPrices = calculateCityPrices(startCityId, cityInventories[startCityId]);
  const connectedCities = getConnectedCities(startCityId);

  res.json({
    sessionId,
    caravan,
    currentCity: startCity,
    currentPrices,
    connectedCities,
    weight: calculateCaravanWeight(caravan.inventory),
    allGoods: goods
  });
});

app.post('/api/game/state', (req, res) => {
  const { sessionId } = req.body;

  if (!gameSessions.has(sessionId)) {
    return res.status(404).json({ error: '游戏会话不存在' });
  }

  const game = gameSessions.get(sessionId);
  const cityInventories = getOrCreateCityInventories(sessionId);
  const currentCity = cities.find(c => c.id === game.caravan.currentCityId);
  const currentPrices = calculateCityPrices(currentCity.id, cityInventories[currentCity.id]);
  const connectedCities = getConnectedCities(currentCity.id);

  res.json({
    caravan: game.caravan,
    currentCity,
    currentPrices,
    connectedCities,
    weight: calculateCaravanWeight(game.caravan.inventory),
    pendingEvent: game.pendingEvent,
    allGoods: goods
  });
});

app.post('/api/trade/buy', (req, res) => {
  const { sessionId, goodId, amount } = req.body;

  if (!gameSessions.has(sessionId)) {
    return res.status(404).json({ error: '游戏会话不存在' });
  }

  if (!goodId || !amount || amount <= 0) {
    return res.status(400).json({ error: '无效的交易参数' });
  }

  const game = gameSessions.get(sessionId);
  const cityInventories = getOrCreateCityInventories(sessionId);
  const good = goods.find(g => g.id === goodId);

  if (!good) {
    return res.status(400).json({ error: '货物不存在' });
  }

  const currentPrices = calculateCityPrices(game.caravan.currentCityId, cityInventories[game.caravan.currentCityId]);
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

  const currentWeight = calculateCaravanWeight(game.caravan.inventory);
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

  const currentCity = cities.find(c => c.id === game.caravan.currentCityId);
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

  const updatedPrices = calculateCityPrices(game.caravan.currentCityId, cityInventories[game.caravan.currentCityId]);
  const weight = calculateCaravanWeight(game.caravan.inventory);

  res.json({
    success: true,
    caravan: game.caravan,
    currentPrices: updatedPrices,
    weight,
    message: `成功购买 ${amount} 单位 ${good.name}，花费 ${totalCost} 金币`
  });
});

app.post('/api/trade/sell', (req, res) => {
  const { sessionId, goodId, amount } = req.body;

  if (!gameSessions.has(sessionId)) {
    return res.status(404).json({ error: '游戏会话不存在' });
  }

  if (!goodId || !amount || amount <= 0) {
    return res.status(400).json({ error: '无效的交易参数' });
  }

  const game = gameSessions.get(sessionId);
  const cityInventories = getOrCreateCityInventories(sessionId);
  const good = goods.find(g => g.id === goodId);

  if (!good) {
    return res.status(400).json({ error: '货物不存在' });
  }

  const playerAmount = game.caravan.inventory[goodId] || 0;
  if (amount > playerAmount) {
    return res.status(400).json({ error: '库存不足' });
  }

  const currentPrices = calculateCityPrices(game.caravan.currentCityId, cityInventories[game.caravan.currentCityId]);
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

  const currentCity = cities.find(c => c.id === game.caravan.currentCityId);
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

  const updatedPrices = calculateCityPrices(game.caravan.currentCityId, cityInventories[game.caravan.currentCityId]);
  const weight = calculateCaravanWeight(game.caravan.inventory);

  res.json({
    success: true,
    caravan: game.caravan,
    currentPrices: updatedPrices,
    weight,
    message: `成功出售 ${amount} 单位 ${good.name}，获得 ${totalEarning} 金币`
  });
});

app.post('/api/travel/start', (req, res) => {
  const { sessionId, toCityId } = req.body;

  if (!gameSessions.has(sessionId)) {
    return res.status(404).json({ error: '游戏会话不存在' });
  }

  const game = gameSessions.get(sessionId);

  if (game.pendingEvent) {
    return res.status(400).json({ error: '请先处理当前事件' });
  }

  const travelCost = calculateTravelCost(game.caravan.currentCityId, toCityId);

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

  game.caravan.stamina -= travelCost.staminaCost;
  game.caravan.inventory['water'] -= travelCost.waterCost;
  game.caravan.inventory['food'] -= travelCost.foodCost;
  game.caravan.inventory['fuel'] -= travelCost.fuelCost;
  game.caravan.travelCount += 1;

  const newCityInventories = simulateMarketFluctuation(cityInventoriesCache.get(sessionId));
  cityInventoriesCache.set(sessionId, newCityInventories);

  const randomEvent = rollRandomEvent(travelCost.danger);

  if (randomEvent) {
    if (randomEvent.id === 'friendly-travelers' || randomEvent.id === 'hidden-cache' ||
        randomEvent.id === 'water-source' || randomEvent.id === 'merchant') {
      game.pendingEvent = {
        ...randomEvent,
        toCityId,
        travelCost,
        needsResolution: true
      };
    } else {
      const eventResult = applyEventEffect(randomEvent, game.caravan);
      game.caravan.money = eventResult.caravanUpdates.money;
      game.caravan.inventory = eventResult.caravanUpdates.inventory;
      game.caravan.stamina = eventResult.caravanUpdates.stamina;
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
      const arrivedPrices = calculateCityPrices(toCityId, newCityInventories[toCityId]);
      const connectedCities = getConnectedCities(toCityId);

      res.json({
        success: true,
        eventOccurred: true,
        event: randomEvent,
        eventResult: eventResult.messages,
        caravan: game.caravan,
        currentCity: arrivedCity,
        currentPrices: arrivedPrices,
        connectedCities,
        weight: calculateCaravanWeight(game.caravan.inventory)
      });
      return;
    }
  }

  if (!game.pendingEvent) {
    game.caravan.currentCityId = toCityId;
  }

  const arrivedCity = cities.find(c => c.id === toCityId);
  const arrivedPrices = calculateCityPrices(toCityId, newCityInventories[toCityId]);
  const connectedCities = getConnectedCities(toCityId);

  res.json({
    success: true,
    eventOccurred: !!game.pendingEvent,
    event: game.pendingEvent || null,
    caravan: game.caravan,
    currentCity: game.pendingEvent ? null : arrivedCity,
    currentPrices: game.pendingEvent ? null : arrivedPrices,
    connectedCities: game.pendingEvent ? null : connectedCities,
    weight: calculateCaravanWeight(game.caravan.inventory)
  });
});

app.post('/api/event/resolve', (req, res) => {
  const { sessionId, choice, toCityId } = req.body;

  if (!gameSessions.has(sessionId)) {
    return res.status(404).json({ error: '游戏会话不存在' });
  }

  const game = gameSessions.get(sessionId);

  if (!game.pendingEvent) {
    return res.status(400).json({ error: '没有待处理的事件' });
  }

  const event = game.pendingEvent;
  const targetCityId = toCityId || event.toCityId;
  const resultMessages = [];

  if (event.id === 'friendly-travelers') {
    if (choice === 'accept') {
      game.caravan.money += 100;
      game.caravan.inventory['water'] = (game.caravan.inventory['water'] || 0) + 5;
      game.caravan.inventory['food'] = (game.caravan.inventory['food'] || 0) + 5;
      game.caravan.stamina = Math.min(game.caravan.maxStamina, game.caravan.stamina + 15);
      resultMessages.push('友好的旅人分享了物资，获得净水x5、干粮x5、金币100，体力+15');
    } else {
      resultMessages.push('你礼貌地谢绝了旅人们的好意');
    }
  } else if (event.id === 'hidden-cache') {
    game.caravan.inventory['steel'] = (game.caravan.inventory['steel'] || 0) + 8;
    game.caravan.inventory['scrap'] = (game.caravan.inventory['scrap'] || 0) + 10;
    game.caravan.money += 200;
    resultMessages.push('你打开了补给箱，获得钢材x8、废料x10、金币200');
  } else if (event.id === 'water-source') {
    game.caravan.inventory['water'] = (game.caravan.inventory['water'] || 0) + 10;
    game.caravan.stamina = Math.min(game.caravan.maxStamina, game.caravan.stamina + 10);
    resultMessages.push('你在水源处补充了净水x10，体力恢复10点');
  } else if (event.id === 'merchant') {
    if (choice === 'trade' && game.caravan.money >= 300) {
      game.caravan.money -= 300;
      const rareGoods = ['medicine', 'drugs', 'weapons'];
      const randomGood = rareGoods[Math.floor(Math.random() * rareGoods.length)];
      game.caravan.inventory[randomGood] = (game.caravan.inventory[randomGood] || 0) + 5;
      const good = goods.find(g => g.id === randomGood);
      resultMessages.push(`你用300金币向流浪商人购买了5单位${good ? good.name : randomGood}`);
    } else if (choice === 'trade') {
      resultMessages.push('你的金币不足，流浪商人失望地离开了');
    } else {
      resultMessages.push('你拒绝了流浪商人的神秘交易');
    }
  }

  game.caravan.currentCityId = targetCityId;
  game.pendingEvent = null;

  game.caravan.tradeHistory.push({
    id: uuidv4(),
    type: 'event',
    eventName: event.name,
    eventType: event.type,
    messages: resultMessages,
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
  const arrivedPrices = calculateCityPrices(targetCityId, cityInventories[targetCityId]);
  const connectedCities = getConnectedCities(targetCityId);

  res.json({
    success: true,
    messages: resultMessages,
    caravan: game.caravan,
    currentCity: arrivedCity,
    currentPrices: arrivedPrices,
    connectedCities,
    weight: calculateCaravanWeight(game.caravan.inventory)
  });
});

app.post('/api/rest', (req, res) => {
  const { sessionId } = req.body;

  if (!gameSessions.has(sessionId)) {
    return res.status(404).json({ error: '游戏会话不存在' });
  }

  const game = gameSessions.get(sessionId);
  const restCost = 50;

  if (game.caravan.money < restCost) {
    return res.status(400).json({ error: `休整需要 ${restCost} 金币` });
  }

  const foodNeeded = 3;
  const waterNeeded = 3;

  if ((game.caravan.inventory['food'] || 0) < foodNeeded) {
    return res.status(400).json({ error: `休整需要 ${foodNeeded} 单位干粮` });
  }

  if ((game.caravan.inventory['water'] || 0) < waterNeeded) {
    return res.status(400).json({ error: `休整需要 ${waterNeeded} 单位净水` });
  }

  game.caravan.money -= restCost;
  game.caravan.inventory['food'] -= foodNeeded;
  game.caravan.inventory['water'] -= waterNeeded;
  game.caravan.stamina = Math.min(game.caravan.maxStamina, game.caravan.stamina + 50);

  const cityInventories = cityInventoriesCache.get(sessionId);
  const currentPrices = calculateCityPrices(game.caravan.currentCityId, cityInventories[game.caravan.currentCityId]);

  res.json({
    success: true,
    caravan: game.caravan,
    currentPrices,
    weight: calculateCaravanWeight(game.caravan.inventory),
    message: `商队休整完毕，体力恢复50点。消耗：${restCost}金币、干粮x${foodNeeded}、净水x${waterNeeded}`
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`废土商队模拟器服务器已启动: http://localhost:${PORT}`);
});
