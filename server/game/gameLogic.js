const { weatherTypes, regionWeatherBiases, getWeatherById } = require('../data/weather');
const { questTemplates, QUEST_STATUS, MAX_ACTIVE_QUESTS_PER_CITY } = require('../data/quests');
const { v4: uuidv4 } = require('uuid');

function generateWeatherForCity(cityId, previousWeatherId = null) {
  const regionBias = regionWeatherBiases[cityId];
  if (!regionBias) {
    return weatherTypes[0];
  }

  const availableWeathers = weatherTypes.map(w => {
    let weight = regionBias.biases[w.id] || 0.5;
    if (previousWeatherId && w.id === previousWeatherId) {
      weight *= 2;
    }
    if (previousWeatherId) {
      const prevIdx = weatherTypes.findIndex(pw => pw.id === previousWeatherId);
      const currIdx = weatherTypes.findIndex(cw => cw.id === w.id);
      if (Math.abs(prevIdx - currIdx) <= 1) {
        weight *= 1.5;
      }
    }
    return { weather: w, weight };
  }).filter(w => w.weight > 0);

  const totalWeight = availableWeathers.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of availableWeathers) {
    random -= item.weight;
    if (random <= 0) {
      return item.weather;
    }
  }

  return availableWeathers[0].weather;
}

function generateWeatherForRoute(fromCityId, toCityId, fromWeather) {
  const fromBias = regionWeatherBiases[fromCityId];
  const toBias = regionWeatherBiases[toCityId];
  
  if (!fromBias || !toBias) {
    return fromWeather || weatherTypes[0];
  }

  const blendRatio = 0.5;
  const availableWeathers = weatherTypes.map(w => {
    const fromWeight = fromBias.biases[w.id] || 0.5;
    const toWeight = toBias.biases[w.id] || 0.5;
    let weight = fromWeight * (1 - blendRatio) + toWeight * blendRatio;
    if (fromWeather && w.id === fromWeather.id) {
      weight *= 1.8;
    }
    return { weather: w, weight };
  });

  const totalWeight = availableWeathers.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of availableWeathers) {
    random -= item.weight;
    if (random <= 0) {
      return item.weather;
    }
  }

  return fromWeather || weatherTypes[0];
}

function calculateTravelCostWithWeather(fromCityId, toCityId, connections, weather) {
  const baseCost = calculateTravelCost(fromCityId, toCityId, connections);
  if (!baseCost || !weather) {
    return baseCost;
  }

  const weatherData = typeof weather === 'string' ? getWeatherById(weather) : weather;
  if (!weatherData) {
    return baseCost;
  }

  return {
    ...baseCost,
    staminaCost: Math.max(1, Math.round(baseCost.staminaCost * weatherData.staminaCostMultiplier)),
    fuelCost: Math.max(0, Math.round(baseCost.fuelCost * (weatherData.staminaCostMultiplier * 0.7 + 0.3))),
    waterCost: Math.max(0, Math.round(baseCost.waterCost * (weatherData.staminaCostMultiplier * 0.5 + 0.5))),
    foodCost: baseCost.foodCost,
    effectiveDistance: Math.round(baseCost.distance / weatherData.travelSpeedMultiplier),
    weather: weatherData
  };
}

function calculateGoodsDamage(inventory, goods, weather, mercenaries = []) {
  if (!inventory || !goods || !weather) {
    return { damaged: {}, messages: [] };
  }

  const weatherData = typeof weather === 'string' ? getWeatherById(weather) : weather;
  if (!weatherData || weatherData.goodsDamageChance === 0) {
    return { damaged: {}, messages: [] };
  }

  let totalLossReduction = 0;
  mercenaries.forEach(merc => {
    totalLossReduction += merc.lossReduction || 0;
  });
  totalLossReduction = Math.min(0.6, totalLossReduction);

  const effectiveDamageChance = weatherData.goodsDamageChance * (1 - totalLossReduction);
  const damaged = {};
  const messages = [];

  Object.entries(inventory).forEach(([goodId, amount]) => {
    if (amount <= 0) return;
    if (Math.random() < effectiveDamageChance) {
      const good = goods.find(g => g.id === goodId);
      const damageRatio = 0.05 + Math.random() * 0.15;
      const damagedAmount = Math.max(1, Math.floor(amount * damageRatio * (1 - totalLossReduction)));
      if (damagedAmount > 0) {
        damaged[goodId] = damagedAmount;
        messages.push(`${weatherData.icon} 天气造成 ${good ? good.name : goodId} 损坏了 ${damagedAmount} 单位`);
      }
    }
  });

  return { damaged, messages };
}

function applyWeatherToEventWeights(events, dangerLevel, weather) {
  if (!weather || !events || events.length === 0) {
    return null;
  }

  const weatherData = typeof weather === 'string' ? getWeatherById(weather) : weather;
  if (!weatherData || !weatherData.eventWeightModifiers) {
    return null;
  }

  const weightAdjustments = {};
  events.forEach(event => {
    const baseType = event.type || 'neutral';
    const modifier = weatherData.eventWeightModifiers[baseType] || 0;
    weightAdjustments[event.id] = modifier;
  });

  return weightAdjustments;
}

function rollRandomEventWithWeather(dangerLevel, events, mercenaries = [], weather) {
  const eventChance = 0.5 + dangerLevel * 0.4;
  
  let totalRiskReduction = 0;
  mercenaries.forEach(merc => {
    totalRiskReduction += merc.riskReduction || 0;
  });
  totalRiskReduction = Math.min(0.5, totalRiskReduction);
  
  const adjustedChance = eventChance * (1 - totalRiskReduction);
  
  const weatherData = typeof weather === 'string' ? getWeatherById(weather) : weather;
  let weatherEventChanceModifier = 1.0;
  if (weatherData) {
    const dangerMod = weatherData.eventWeightModifiers?.danger || 0;
    if (dangerMod > 0) {
      weatherEventChanceModifier = 1 + dangerMod * 0.1;
    } else if (dangerMod < 0) {
      weatherEventChanceModifier = 1 + dangerMod * 0.05;
    }
  }

  if (Math.random() > adjustedChance * weatherEventChanceModifier) {
    return null;
  }

  const availableEvents = events.filter(e => dangerLevel >= e.minDanger);
  if (availableEvents.length === 0) {
    return events[0];
  }

  const weights = availableEvents.map(e => {
    let weight;
    if (e.type === 'danger') weight = 3 + Math.floor(dangerLevel * 5);
    else if (e.type === 'neutral') weight = 2;
    else weight = 1 + Math.floor((1 - dangerLevel) * 3);

    if (weatherData && weatherData.eventWeightModifiers) {
      const modifier = weatherData.eventWeightModifiers[e.type] || 0;
      weight = Math.max(0.1, weight + modifier);
    }
    return weight;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < availableEvents.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return availableEvents[i];
    }
  }

  return availableEvents[availableEvents.length - 1];
}

function generateCityQuests(cityId, cities, goods, existingQuests = []) {
  const city = cities.find(c => c.id === cityId);
  if (!city) return [];

  const existingCount = existingQuests.filter(
    q => q.cityId === cityId && q.status === QUEST_STATUS.AVAILABLE
  ).length;

  const questsToGenerate = Math.max(0, MAX_ACTIVE_QUESTS_PER_CITY - existingCount);
  if (questsToGenerate <= 0) return [];

  const generatedQuests = [];
  const usedTemplates = new Set();

  for (let i = 0; i < questsToGenerate; i++) {
    const availableTemplates = questTemplates.filter(t => !usedTemplates.has(t.id));
    if (availableTemplates.length === 0) break;

    const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    usedTemplates.add(template.id);

    const difficulty = template.difficultyRange[0] + 
      Math.floor(Math.random() * (template.difficultyRange[1] - template.difficultyRange[0] + 1));

    const questData = template.generateQuest(difficulty, cities, goods, cityId);
    if (!questData) continue;

    const now = Date.now();
    const timeLimitMs = questData.timeLimitMinutes * 60 * 1000;

    generatedQuests.push({
      id: uuidv4(),
      templateId: template.id,
      cityId,
      difficulty,
      status: QUEST_STATUS.AVAILABLE,
      createdAt: now,
      expiresAt: now + Math.random() * 30 * 60 * 1000,
      ...questData,
      deadline: null,
      acceptedAt: null,
      completedAt: null,
      failedAt: null,
      failureReason: null,
      currentStage: questData.stages ? questData.stages[0] : null,
      stageHistory: [],
      progress: {}
    });
  }

  return generatedQuests;
}

function acceptQuest(quest, caravan) {
  if (quest.status !== QUEST_STATUS.AVAILABLE) {
    return { success: false, error: '该任务不可接取' };
  }

  const now = Date.now();
  const timeLimitMs = quest.timeLimitMinutes * 60 * 1000;

  const acceptedQuest = {
    ...quest,
    status: QUEST_STATUS.ACCEPTED,
    acceptedAt: now,
    deadline: now + timeLimitMs,
    currentStage: quest.stages ? quest.stages[0] : 'accepted',
    stageHistory: [{ stage: 'accepted', time: now }]
  };

  return { success: true, quest: acceptedQuest };
}

function updateQuestProgress(quest, caravan, currentCityId, action, params = {}) {
  if (!quest || quest.status !== QUEST_STATUS.ACCEPTED) {
    return { updated: false, quest };
  }

  const updatedQuest = { ...quest, progress: { ...quest.progress } };
  let updated = false;
  const now = Date.now();

  switch (action) {
    case 'arrive_city':
      if (quest.fromCityId === currentCityId && updatedQuest.currentStage === 'accepted') {
        updatedQuest.currentStage = quest.stages?.[1] || 'goods_picked';
        updatedQuest.stageHistory.push({ stage: updatedQuest.currentStage, time: now, city: currentCityId });
        updated = true;
      }
      if (quest.params?.needReturn && 
          updatedQuest.currentStage === 'returning' && 
          currentCityId === quest.returnCityId) {
        updatedQuest.currentStage = quest.stages?.[4] || 'delivered';
        updatedQuest.stageHistory.push({ stage: updatedQuest.currentStage, time: now, city: currentCityId });
        updated = true;
      }
      if (quest.toCityId === currentCityId && 
          !quest.params?.needReturn &&
          (updatedQuest.currentStage === 'in_transit' || 
           updatedQuest.currentStage === 'escorting' ||
           updatedQuest.currentStage === 'goods_picked')) {
        updatedQuest.currentStage = quest.stages?.[quest.stages.length - 1] || 'delivered';
        updatedQuest.stageHistory.push({ stage: updatedQuest.currentStage, time: now, city: currentCityId });
        updated = true;
      }
      if (quest.params?.sourceCityId === currentCityId && 
          updatedQuest.currentStage === 'traveling_to_source') {
        updatedQuest.currentStage = quest.stages?.[2] || 'procured';
        updatedQuest.stageHistory.push({ stage: updatedQuest.currentStage, time: now, city: currentCityId });
        updated = true;
      }
      break;

    case 'depart_city':
      if (currentCityId === quest.fromCityId && 
          (updatedQuest.currentStage === 'accepted' || updatedQuest.currentStage === 'goods_picked')) {
        updatedQuest.currentStage = quest.stages?.[2] || 'in_transit';
        updatedQuest.stageHistory.push({ stage: updatedQuest.currentStage, time: now, from: currentCityId });
        updated = true;
      }
      if (quest.params?.needReturn && 
          updatedQuest.currentStage === 'procured' &&
          currentCityId === quest.params?.sourceCityId) {
        updatedQuest.currentStage = quest.stages?.[3] || 'returning';
        updatedQuest.stageHistory.push({ stage: updatedQuest.currentStage, time: now, from: currentCityId });
        updated = true;
      }
      break;

    case 'buy_goods':
      if (params.goodId && params.amount) {
        if (!updatedQuest.progress.collectedGoods) {
          updatedQuest.progress.collectedGoods = {};
        }
        const currentCollected = updatedQuest.progress.collectedGoods[params.goodId] || 0;
        updatedQuest.progress.collectedGoods[params.goodId] = currentCollected + params.amount;
        updated = true;
      }
      break;
  }

  return { updated, quest: updatedQuest };
}

function checkQuestFailure(quest, caravan, currentCityId) {
  if (!quest || quest.status !== QUEST_STATUS.ACCEPTED) {
    return { failed: false };
  }

  const now = Date.now();

  if (quest.deadline && now > quest.deadline) {
    return {
      failed: true,
      reason: 'timeout',
      message: '任务超时！委托方已取消任务。'
    };
  }

  if (quest.requiredGoods && Object.keys(quest.requiredGoods).length > 0) {
    for (const [goodId, requiredAmount] of Object.entries(quest.requiredGoods)) {
      const inventoryAmount = caravan.inventory?.[goodId] || 0;
      const collectedAmount = quest.progress?.collectedGoods?.[goodId] || 0;
      
      if (quest.currentStage === 'in_transit' || 
          quest.currentStage === 'returning' ||
          quest.currentStage === 'delivered') {
        if (inventoryAmount < requiredAmount && 
            quest.currentStage !== 'delivered' &&
            collectedAmount >= requiredAmount) {
          return {
            failed: true,
            reason: 'goods_lost',
            message: `任务所需的货物已丢失！`
          };
        }
      }
    }
  }

  if (quest.params?.wrongRouteDetected) {
    return {
      failed: true,
      reason: 'wrong_route',
      message: '偏离了指定路线，任务失败！'
    };
  }

  return { failed: false };
}

function canCompleteQuest(quest, caravan, currentCityId) {
  if (!quest || quest.status !== QUEST_STATUS.ACCEPTED) {
    return { canComplete: false };
  }

  const finalStage = quest.stages?.[quest.stages.length - 1];
  if (quest.currentStage !== finalStage) {
    return { canComplete: false, reason: '尚未到达最终阶段' };
  }

  const targetCity = quest.params?.needReturn ? quest.returnCityId : quest.toCityId;
  if (currentCityId !== targetCity) {
    return { canComplete: false, reason: '未到达目标城市' };
  }

  if (quest.requiredGoods && Object.keys(quest.requiredGoods).length > 0) {
    for (const [goodId, requiredAmount] of Object.entries(quest.requiredGoods)) {
      const inventoryAmount = caravan.inventory?.[goodId] || 0;
      if (inventoryAmount < requiredAmount) {
        return {
          canComplete: false,
          reason: `缺少任务货物`,
          missingGood: goodId,
          missingAmount: requiredAmount - inventoryAmount
        };
      }
    }
  }

  return { canComplete: true };
}

function completeQuest(quest, caravan, goods) {
  const check = canCompleteQuest(quest, caravan, caravan.currentCityId);
  if (!check.canComplete) {
    return { success: false, error: check.reason, caravanUpdates: null };
  }

  const updatedCaravan = {
    ...caravan,
    inventory: { ...caravan.inventory },
    money: caravan.money,
    reputation: caravan.reputation || 50
  };

  if (quest.requiredGoods) {
    Object.entries(quest.requiredGoods).forEach(([goodId, amount]) => {
      updatedCaravan.inventory[goodId] = Math.max(0, (updatedCaravan.inventory[goodId] || 0) - amount);
    });
  }

  if (quest.reward?.money) {
    updatedCaravan.money += quest.reward.money;
  }
  if (quest.reward?.reputation) {
    updatedCaravan.reputation = Math.max(0, Math.min(100, 
      updatedCaravan.reputation + quest.reward.reputation
    ));
  }

  const messages = [];
  if (quest.reward?.money) {
    messages.push(`获得任务奖励：${quest.reward.money} 金币`);
  }
  if (quest.reward?.reputation) {
    const repChange = quest.reward.reputation;
    if (repChange > 0) {
      messages.push(`声望提升了 ${repChange} 点`);
    } else if (repChange < 0) {
      messages.push(`声望下降了 ${Math.abs(repChange)} 点`);
    }
  }
  if (quest.requiredGoods) {
    Object.entries(quest.requiredGoods).forEach(([goodId, amount]) => {
      const good = goods?.find(g => g.id === goodId);
      messages.push(`交付了 ${amount} 单位 ${good?.name || goodId}`);
    });
  }

  const completedQuest = {
    ...quest,
    status: QUEST_STATUS.COMPLETED,
    completedAt: Date.now(),
    currentStage: 'completed',
    stageHistory: [...(quest.stageHistory || []), { stage: 'completed', time: Date.now() }]
  };

  return {
    success: true,
    quest: completedQuest,
    caravanUpdates: updatedCaravan,
    messages
  };
}

function failQuest(quest, caravan, failureReason) {
  const failedQuest = {
    ...quest,
    status: QUEST_STATUS.FAILED,
    failedAt: Date.now(),
    failureReason,
    currentStage: 'failed',
    stageHistory: [...(quest.stageHistory || []), { stage: 'failed', time: Date.now(), reason: failureReason }]
  };

  const updatedCaravan = {
    ...caravan,
    money: caravan.money,
    reputation: caravan.reputation || 50
  };

  const messages = [];

  if (quest.penalty?.money) {
    const penalty = Math.min(quest.penalty.money, updatedCaravan.money);
    updatedCaravan.money = Math.max(0, updatedCaravan.money - penalty);
    messages.push(`任务失败，扣除违约金：${penalty} 金币`);
  }
  if (quest.penalty?.reputation) {
    const repPenalty = quest.penalty.reputation;
    updatedCaravan.reputation = Math.max(0, updatedCaravan.reputation - repPenalty);
    messages.push(`声望下降了 ${repPenalty} 点`);
  }

  return {
    quest: failedQuest,
    caravanUpdates: updatedCaravan,
    messages
  };
}

function refreshExpiredQuests(quests, currentTime = Date.now()) {
  const refreshed = quests.map(q => {
    if (q.status === QUEST_STATUS.AVAILABLE && q.expiresAt && currentTime > q.expiresAt) {
      return { ...q, _expired: true };
    }
    return q;
  });

  const expired = refreshed.filter(q => q._expired);
  const active = refreshed.filter(q => !q._expired);

  return { active, expiredCount: expired.length };
}

function calculateCityPrices(cityId, cityInventory, city, goods, priceCache, isBlackMarket = false) {
  if (!city) return {};

  if (priceCache && priceCache[cityId] && !isBlackMarket) {
    const cachedPrices = {};
    goods.forEach(good => {
      if (priceCache[cityId][good.id]) {
        const inventory = cityInventory[good.id] || 0;
        cachedPrices[good.id] = {
          ...priceCache[cityId][good.id],
          stock: Math.max(0, inventory)
        };
      }
    });
    if (Object.keys(cachedPrices).length === goods.length) {
      return cachedPrices;
    }
  }

  const prices = {};
  goods.forEach(good => {
    if (!isBlackMarket && good.blackMarketOnly) {
      return;
    }

    const basePrice = good.basePrice;
    const demand = city.baseDemand[good.id] || 1;
    const supply = city.baseSupply[good.id] || 1;
    const inventory = cityInventory[good.id] || 0;
    const inventoryFactor = Math.max(0.5, Math.min(1.5, 1 - (inventory / 100) * 0.5));
    const demandSupplyRatio = demand / supply;
    
    const randomRange = isBlackMarket ? 0.4 : 0.2;
    const randomFactor = (1 - randomRange / 2) + Math.random() * randomRange;
    
    let finalPrice = Math.round(basePrice * demandSupplyRatio * inventoryFactor * randomFactor);
    
    if (isBlackMarket) {
      const priceMultiplier = good.blackMarketOnly ? 1.3 : 1.1;
      finalPrice = Math.round(finalPrice * priceMultiplier);
    }

    prices[good.id] = {
      buyPrice: Math.round(finalPrice * (isBlackMarket ? 1.05 : 1.1)),
      sellPrice: Math.round(finalPrice * (isBlackMarket ? 0.95 : 0.9)),
      stock: Math.max(0, inventory),
      demand: demand > 1.2 ? '高' : demand < 0.8 ? '低' : '中',
      supply: supply > 1.2 ? '充足' : supply < 0.8 ? '稀缺' : '正常',
      isIllegal: good.isIllegal || false,
      blackMarketOnly: good.blackMarketOnly || false
    };
  });

  return prices;
}

function calculateBlackMarketRisk(city, goodsBought, mercenaries = []) {
  const baseRisk = city.blackMarketRisk || 0.15;
  let riskMultiplier = 1;
  
  let illegalValue = 0;
  Object.entries(goodsBought).forEach(([goodId, amount]) => {
    if (amount > 0) {
      illegalValue += amount;
    }
  });
  
  riskMultiplier += illegalValue * 0.02;
  
  let totalRiskReduction = 0;
  mercenaries.forEach(merc => {
    totalRiskReduction += merc.riskReduction || 0;
  });
  totalRiskReduction = Math.min(0.7, totalRiskReduction);
  
  return Math.min(0.8, baseRisk * riskMultiplier * (1 - totalRiskReduction));
}

function rollBlackMarketEvent(city, goodsBought, caravan, mercenaries = []) {
  const risk = calculateBlackMarketRisk(city, goodsBought, mercenaries);
  
  if (Math.random() > risk) {
    return null;
  }
  
  let totalLossReduction = 0;
  mercenaries.forEach(merc => {
    totalLossReduction += merc.lossReduction || 0;
  });
  totalLossReduction = Math.min(0.6, totalLossReduction);
  
  const eventTypes = [
    { id: 'police-raid', name: '执法突袭', weight: 2, type: 'danger' },
    { id: 'robbery', name: '黑市抢劫', weight: 3, type: 'danger' },
    { id: 'informant', name: '告密者', weight: 1, type: 'danger' }
  ];
  
  const totalWeight = eventTypes.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  let selectedEvent = eventTypes[0];
  
  for (const event of eventTypes) {
    random -= event.weight;
    if (random <= 0) {
      selectedEvent = event;
      break;
    }
  }
  
  const result = {
    event: selectedEvent,
    messages: [],
    moneyLoss: 0,
    goodsLoss: {},
    staminaLoss: 0
  };
  
  const illegalGoods = Object.entries(goodsBought).filter(([id, amt]) => amt > 0);
  
  switch (selectedEvent.id) {
    case 'police-raid':
      result.messages.push('执法人员突袭了黑市！');
      
      const confiscationRate = (0.3 + Math.random() * 0.4) * (1 - totalLossReduction);
      illegalGoods.forEach(([goodId, amount]) => {
        const lost = Math.floor(amount * confiscationRate);
        if (lost > 0) {
          result.goodsLoss[goodId] = lost;
          result.messages.push(`${goodId} 被没收了 ${lost} 单位`);
        }
      });
      
      const fine = Math.floor(caravan.money * (0.1 + Math.random() * 0.15) * (1 - totalLossReduction));
      result.moneyLoss = fine;
      result.messages.push(`被罚款 ${fine} 金币`);
      result.staminaLoss = Math.floor(15 * (1 - totalLossReduction * 0.5));
      break;
      
    case 'robbery':
      result.messages.push('一群劫匪盯上了你的黑市货物！');
      
      const robberyRate = (0.2 + Math.random() * 0.3) * (1 - totalLossReduction);
      illegalGoods.forEach(([goodId, amount]) => {
        const lost = Math.floor(amount * robberyRate);
        if (lost > 0) {
          result.goodsLoss[goodId] = lost;
          result.messages.push(`${goodId} 被抢走了 ${lost} 单位`);
        }
      });
      
      result.staminaLoss = Math.floor(20 * (1 - totalLossReduction * 0.5));
      break;
      
    case 'informant':
      result.messages.push('有人向当局告密了你的交易！');
      
      const infoConfiscation = (0.15 + Math.random() * 0.2) * (1 - totalLossReduction);
      illegalGoods.forEach(([goodId, amount]) => {
        const lost = Math.floor(amount * infoConfiscation);
        if (lost > 0) {
          result.goodsLoss[goodId] = lost;
          result.messages.push(`${goodId} 被收缴了 ${lost} 单位`);
        }
      });
      
      result.moneyLoss = Math.floor(caravan.money * 0.05 * (1 - totalLossReduction));
      result.staminaLoss = Math.floor(10 * (1 - totalLossReduction * 0.5));
      break;
  }
  
  return result;
}

function calculateTravelCost(fromCityId, toCityId, connections) {
  const connection = connections.find(
    c => (c.from === fromCityId && c.to === toCityId) || (c.from === toCityId && c.to === fromCityId)
  );
  if (!connection) {
    return null;
  }

  const staminaCost = Math.round(connection.distance * 0.15);
  const fuelCost = Math.round(connection.distance * 0.05);
  const waterCost = Math.round(connection.distance * 0.03);
  const foodCost = Math.round(connection.distance * 0.02);
  const danger = connection.danger;

  return {
    connection,
    distance: connection.distance,
    staminaCost,
    fuelCost,
    waterCost,
    foodCost,
    danger
  };
}

function getConnectedCities(cityId, cities, connections) {
  const connectedIds = new Set();
  connections.forEach(conn => {
    if (conn.from === cityId) connectedIds.add(conn.to);
    if (conn.to === cityId) connectedIds.add(conn.from);
  });

  return cities.filter(c => connectedIds.has(c.id)).map(city => {
    const travel = calculateTravelCost(cityId, city.id, connections);
    return {
      ...city,
      travel
    };
  });
}

function calculateCaravanWeight(inventory, goods) {
  let weight = 0;
  Object.entries(inventory).forEach(([goodId, amount]) => {
    const good = goods.find(g => g.id === goodId);
    if (good) {
      weight += good.weight * amount;
    }
  });
  return Math.round(weight * 10) / 10;
}

function rollRandomEvent(dangerLevel, events, mercenaries = []) {
  const eventChance = 0.5 + dangerLevel * 0.4;
  
  let totalRiskReduction = 0;
  mercenaries.forEach(merc => {
    totalRiskReduction += merc.riskReduction || 0;
  });
  totalRiskReduction = Math.min(0.5, totalRiskReduction);
  
  const adjustedChance = eventChance * (1 - totalRiskReduction);
  
  if (Math.random() > adjustedChance) {
    return null;
  }

  const availableEvents = events.filter(e => dangerLevel >= e.minDanger);
  if (availableEvents.length === 0) {
    return events[0];
  }

  const weights = availableEvents.map(e => {
    if (e.type === 'danger') return 3 + Math.floor(dangerLevel * 5);
    if (e.type === 'neutral') return 2;
    return 1 + Math.floor((1 - dangerLevel) * 3);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < availableEvents.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return availableEvents[i];
    }
  }

  return availableEvents[availableEvents.length - 1];
}

function applyEventEffect(event, choiceId, caravan, goods, mercenaries = []) {
  const result = {
    event: event,
    choice: choiceId,
    messages: [],
    caravanUpdates: {
      money: caravan.money,
      inventory: { ...caravan.inventory },
      stamina: caravan.stamina,
      reputation: caravan.reputation || 50
    }
  };

  let effects = [];
  if (event.hasChoices && event.choices) {
    const choice = event.choices.find(c => c.id === choiceId);
    if (choice) {
      effects = choice.effects || [];
      
      if (choice.rewardReputation) {
        result.caravanUpdates.reputation = Math.max(0, Math.min(100, 
          result.caravanUpdates.reputation + choice.rewardReputation
        ));
        if (choice.rewardReputation > 0) {
          result.messages.push(`声望提升了 ${choice.rewardReputation} 点`);
        } else if (choice.rewardReputation < 0) {
          result.messages.push(`声望下降了 ${Math.abs(choice.rewardReputation)} 点`);
        }
      }
    }
  } else {
    effects = event.effects || [];
  }

  let totalRiskReduction = 0;
  let totalLossReduction = 0;
  mercenaries.forEach(merc => {
    totalRiskReduction += merc.riskReduction || 0;
    totalLossReduction += merc.lossReduction || 0;
  });
  totalRiskReduction = Math.min(0.7, totalRiskReduction);
  totalLossReduction = Math.min(0.6, totalLossReduction);

  effects.forEach(effect => {
    let effectChance = effect.chance;
    
    if (effect.type === 'loseGoods' || effect.type === 'loseMoney' || effect.type === 'loseStamina') {
      effectChance = effect.chance * (1 - totalRiskReduction);
    }
    
    if (Math.random() > effectChance) return;

    switch (effect.type) {
      case 'loseMoney':
        let moneyLoss = effect.moneyLoss || Math.round(result.caravanUpdates.money * (effect.moneyLossPercent || 0));
        moneyLoss = Math.round(moneyLoss * (1 - totalLossReduction));
        result.caravanUpdates.money = Math.max(0, result.caravanUpdates.money - moneyLoss);
        result.messages.push(`损失了 ${moneyLoss} 金币`);
        break;

      case 'loseGoods':
        Object.keys(result.caravanUpdates.inventory).forEach(goodId => {
          let lossAmount = Math.floor(result.caravanUpdates.inventory[goodId] * (effect.goodsLossPercent || 0.1));
          lossAmount = Math.floor(lossAmount * (1 - totalLossReduction));
          result.caravanUpdates.inventory[goodId] = Math.max(0, result.caravanUpdates.inventory[goodId] - lossAmount);
          if (lossAmount > 0) {
            const good = goods.find(g => g.id === goodId);
            result.messages.push(`损失了 ${lossAmount} 单位 ${good ? good.name : goodId}`);
          }
        });
        break;

      case 'loseStamina':
        let staminaLoss = effect.staminaLoss || 10;
        staminaLoss = Math.round(staminaLoss * (1 - totalLossReduction * 0.5));
        result.caravanUpdates.stamina = Math.max(0, result.caravanUpdates.stamina - staminaLoss);
        result.messages.push(`体力下降了 ${staminaLoss} 点`);
        break;

      case 'restoreStamina':
        result.caravanUpdates.stamina = Math.min(caravan.maxStamina, result.caravanUpdates.stamina + (effect.staminaRestore || 10));
        result.messages.push(`体力恢复了 ${effect.staminaRestore || 10} 点`);
        break;

      case 'gainMoney':
        result.caravanUpdates.money += effect.moneyGain || 100;
        result.messages.push(`获得了 ${effect.moneyGain || 100} 金币`);
        break;

      case 'gainGoods':
        let gainGoodId = effect.goodsId;
        if (effect.randomGoods || !gainGoodId) {
          const availableGoods = goods.filter(g => !g.blackMarketOnly);
          gainGoodId = availableGoods[Math.floor(Math.random() * availableGoods.length)].id;
        }
        result.caravanUpdates.inventory[gainGoodId] = (result.caravanUpdates.inventory[gainGoodId] || 0) + (effect.amount || 5);
        const gainedGood = goods.find(g => g.id === gainGoodId);
        result.messages.push(`获得了 ${effect.amount || 5} 单位 ${gainedGood ? gainedGood.name : gainGoodId}`);
        break;

      case 'useGoods':
        const requiredGood = effect.requiredGoods;
        if ((result.caravanUpdates.inventory[requiredGood] || 0) >= effect.amount) {
          result.caravanUpdates.inventory[requiredGood] -= effect.amount;
          const usedGood = goods.find(g => g.id === requiredGood);
          result.messages.push(`使用了 ${effect.amount} 单位 ${usedGood ? usedGood.name : requiredGood}`);
          if (effect.staminaRestore) {
            result.caravanUpdates.stamina = Math.min(caravan.maxStamina, result.caravanUpdates.stamina + effect.staminaRestore);
            result.messages.push(`体力恢复了 ${effect.staminaRestore} 点`);
          }
          if (effect.staminaLoss) {
            result.caravanUpdates.stamina = Math.max(0, result.caravanUpdates.stamina - effect.staminaLoss);
            result.messages.push(`体力下降了 ${effect.staminaLoss} 点`);
          }
        } else {
          const usedGood = goods.find(g => g.id === requiredGood);
          result.messages.push(`缺少 ${usedGood ? usedGood.name : requiredGood}，情况恶化了`);
          result.caravanUpdates.stamina = Math.max(0, result.caravanUpdates.stamina - 15);
        }
        break;

      case 'fightBack':
        if (caravan.inventory['weapons'] && caravan.inventory['weapons'] >= 2) {
          result.caravanUpdates.money += effect.rewardMoney || 200;
          result.messages.push(`击退了敌人，缴获了 ${effect.rewardMoney || 200} 金币`);
        } else {
          result.messages.push(`没有足够的武器自卫，损失惨重`);
          result.caravanUpdates.stamina = Math.max(0, result.caravanUpdates.stamina - 10);
        }
        break;

      case 'delay':
        result.caravanUpdates.stamina = Math.max(0, result.caravanUpdates.stamina - (effect.extraStaminaCost || 10));
        result.messages.push(`被耽搁了，额外消耗了 ${effect.extraStaminaCost || 10} 点体力`);
        break;

      case 'charity':
      case 'specialTrade':
        result.requiresChoice = true;
        result.choiceType = effect.type;
        break;
    }
  });

  return result;
}

function updateCityInventoryAfterTrade(cityId, cityInventory, goodId, amount, isBuy) {
  const newInventory = { ...cityInventory };
  if (isBuy) {
    newInventory[goodId] = Math.max(0, (newInventory[goodId] || 0) - amount);
  } else {
    newInventory[goodId] = (newInventory[goodId] || 0) + amount;
  }
  return newInventory;
}

function simulateMarketFluctuation(cityInventories, goods) {
  const newInventories = {};
  Object.keys(cityInventories).forEach(cityId => {
    newInventories[cityId] = {};
    goods.forEach(good => {
      const current = cityInventories[cityId]?.[good.id] || 50;
      const change = Math.floor((Math.random() - 0.5) * 20);
      const minStock = good.blackMarketOnly ? 2 : 5;
      const maxStock = good.blackMarketOnly ? 30 : 150;
      newInventories[cityId][good.id] = Math.max(minStock, Math.min(maxStock, current + change));
    });
  });
  return newInventories;
}

function getAvailableMercenaries(cityId, allMercenaries, cityAvailability) {
  const availableIds = cityAvailability[cityId] || [];
  return allMercenaries.filter(m => availableIds.includes(m.id));
}

function calculateMercenaryWage(mercenaries) {
  return mercenaries.reduce((total, m) => total + m.wage, 0);
}

function getMercenaryEffects(mercenaries) {
  let totalRiskReduction = 0;
  let totalLossReduction = 0;
  let totalCombatPower = 0;
  
  mercenaries.forEach(merc => {
    totalRiskReduction += merc.riskReduction || 0;
    totalLossReduction += merc.lossReduction || 0;
    totalCombatPower += merc.combatPower || 0;
  });
  
  return {
    riskReduction: Math.min(0.7, totalRiskReduction),
    lossReduction: Math.min(0.6, totalLossReduction),
    combatPower: totalCombatPower
  };
}

module.exports = {
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
  getMercenaryEffects,
  generateWeatherForCity,
  generateWeatherForRoute,
  calculateTravelCostWithWeather,
  calculateGoodsDamage,
  applyWeatherToEventWeights,
  rollRandomEventWithWeather,
  generateCityQuests,
  acceptQuest,
  updateQuestProgress,
  checkQuestFailure,
  canCompleteQuest,
  completeQuest,
  failQuest,
  refreshExpiredQuests
};
