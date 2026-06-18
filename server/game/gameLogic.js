function calculateCityPrices(cityId, cityInventory, city, goods) {
  if (!city) return {};

  const prices = {};
  goods.forEach(good => {
    const basePrice = good.basePrice;
    const demand = city.baseDemand[good.id] || 1;
    const supply = city.baseSupply[good.id] || 1;
    const inventory = cityInventory[good.id] || 0;
    const inventoryFactor = Math.max(0.5, Math.min(1.5, 1 - (inventory / 100) * 0.5));
    const demandSupplyRatio = demand / supply;
    const randomFactor = 0.9 + Math.random() * 0.2;
    const finalPrice = Math.round(basePrice * demandSupplyRatio * inventoryFactor * randomFactor);
    prices[good.id] = {
      buyPrice: Math.round(finalPrice * 1.1),
      sellPrice: Math.round(finalPrice * 0.9),
      stock: Math.floor(20 + Math.random() * 80),
      demand: demand > 1.2 ? '高' : demand < 0.8 ? '低' : '中',
      supply: supply > 1.2 ? '充足' : supply < 0.8 ? '稀缺' : '正常'
    };
  });

  return prices;
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

function rollRandomEvent(dangerLevel, events) {
  const eventChance = 0.3 + dangerLevel * 0.4;
  if (Math.random() > eventChance) {
    return null;
  }

  const availableEvents = events.filter(e => dangerLevel >= e.minDanger);
  if (availableEvents.length === 0) {
    return null;
  }

  const weights = availableEvents.map(e => {
    if (e.type === 'danger') return 3;
    if (e.type === 'neutral') return 2;
    return 1;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < availableEvents.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return availableEvents[i];
    }
  }

  return availableEvents[0];
}

function applyEventEffect(event, caravan, goods) {
  const result = {
    event: event,
    messages: [],
    caravanUpdates: {
      money: caravan.money,
      inventory: { ...caravan.inventory },
      stamina: caravan.stamina
    }
  };

  event.effects.forEach(effect => {
    if (Math.random() > effect.chance) return;

    switch (effect.type) {
      case 'loseMoney':
        const moneyLoss = effect.moneyLoss || Math.round(result.caravanUpdates.money * (effect.moneyLossPercent || 0));
        result.caravanUpdates.money = Math.max(0, result.caravanUpdates.money - moneyLoss);
        result.messages.push(`损失了 ${moneyLoss} 金币`);
        break;

      case 'loseGoods':
        Object.keys(result.caravanUpdates.inventory).forEach(goodId => {
          const lossAmount = Math.floor(result.caravanUpdates.inventory[goodId] * (effect.goodsLossPercent || 0.1));
          result.caravanUpdates.inventory[goodId] = Math.max(0, result.caravanUpdates.inventory[goodId] - lossAmount);
          if (lossAmount > 0) {
            const good = goods.find(g => g.id === goodId);
            result.messages.push(`损失了 ${lossAmount} 单位 ${good ? good.name : goodId}`);
          }
        });
        break;

      case 'loseStamina':
        result.caravanUpdates.stamina = Math.max(0, result.caravanUpdates.stamina - (effect.staminaLoss || 10));
        result.messages.push(`体力下降了 ${effect.staminaLoss || 10} 点`);
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
          const availableGoods = goods.filter(g => g.id !== 'drugs');
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
      newInventories[cityId][good.id] = Math.max(5, Math.min(150, current + change));
    });
  });
  return newInventories;
}

module.exports = {
  calculateCityPrices,
  calculateTravelCost,
  getConnectedCities,
  calculateCaravanWeight,
  rollRandomEvent,
  applyEventEffect,
  updateCityInventoryAfterTrade,
  simulateMarketFluctuation
};
