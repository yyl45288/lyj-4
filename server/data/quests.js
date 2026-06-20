const questTemplates = [
  {
    id: 'delivery',
    name: '货物运送',
    description: '将指定货物安全运送到目标城市。',
    type: 'delivery',
    difficultyRange: [1, 5],
    generateQuest: (difficulty, cities, goods, fromCityId) => {
      const fromCity = cities.find(c => c.id === fromCityId);
      const targetCities = cities.filter(c => c.id !== fromCityId);
      const toCity = targetCities[Math.floor(Math.random() * targetCities.length)];
      const tradeGoods = goods.filter(g => !g.blackMarketOnly);
      const selectedGood = tradeGoods[Math.floor(Math.random() * tradeGoods.length)];
      const amount = 5 + Math.floor(Math.random() * (difficulty * 5));
      const reward = Math.round(selectedGood.basePrice * amount * (1.5 + difficulty * 0.3));
      const reputationReward = 2 + difficulty;
      const timeLimitMinutes = 15 + difficulty * 5;

      return {
        title: `${fromCity.name} → ${toCity.name} ${selectedGood.name}运送`,
        description: `将 ${amount} 单位 ${selectedGood.name} 从${fromCity.name}运送到${toCity.name}，注意时限！`,
        fromCityId,
        toCityId: toCity.id,
        requiredGoods: { [selectedGood.id]: amount },
        reward: {
          money: reward,
          reputation: reputationReward
        },
        penalty: {
          money: Math.round(reward * 0.3),
          reputation: reputationReward
        },
        timeLimitMinutes,
        stages: ['accepted', 'goods_picked', 'in_transit', 'delivered'],
        failureConditions: ['timeout', 'goods_lost'],
        params: {
          requiredGoodId: selectedGood.id,
          requiredAmount: amount
        }
      };
    }
  },
  {
    id: 'escort',
    name: '护卫任务',
    description: '在旅途中护送贵重物资，抵御袭击。',
    type: 'escort',
    difficultyRange: [2, 5],
    generateQuest: (difficulty, cities, goods, fromCityId) => {
      const fromCity = cities.find(c => c.id === fromCityId);
      const targetCities = cities.filter(c => c.id !== fromCityId);
      const toCity = targetCities[Math.floor(Math.random() * targetCities.length)];
      const reward = 500 + difficulty * 400;
      const reputationReward = 5 + difficulty * 2;
      const timeLimitMinutes = 20 + difficulty * 5;

      return {
        title: `${fromCity.name} → ${toCity.name} 贵重物资护送`,
        description: `护送一批贵重物资从${fromCity.name}到${toCity.name}，全程不得离开路线！`,
        fromCityId,
        toCityId: toCity.id,
        requiredGoods: {},
        reward: {
          money: reward,
          reputation: reputationReward
        },
        penalty: {
          money: Math.round(reward * 0.5),
          reputation: reputationReward + 2
        },
        timeLimitMinutes,
        stages: ['accepted', 'escorting', 'arrived'],
        failureConditions: ['timeout', 'wrong_route'],
        params: {
          requireDirectRoute: true
        }
      };
    }
  },
  {
    id: 'procurement',
    name: '物资采购',
    description: '在指定城市采购特定货物并运回。',
    type: 'procurement',
    difficultyRange: [1, 4],
    generateQuest: (difficulty, cities, goods, fromCityId) => {
      const fromCity = cities.find(c => c.id === fromCityId);
      const targetCities = cities.filter(c => c.id !== fromCityId);
      const sourceCity = targetCities[Math.floor(Math.random() * targetCities.length)];
      const tradeGoods = goods.filter(g => !g.blackMarketOnly);
      const selectedGood = tradeGoods[Math.floor(Math.random() * tradeGoods.length)];
      const amount = 8 + Math.floor(Math.random() * (difficulty * 4));
      const reward = Math.round(selectedGood.basePrice * amount * (1.8 + difficulty * 0.25));
      const reputationReward = 3 + difficulty;
      const timeLimitMinutes = 25 + difficulty * 8;

      return {
        title: `从${sourceCity.name}采购 ${selectedGood.name}`,
        description: `前往${sourceCity.name}购买 ${amount} 单位 ${selectedGood.name}，然后返回${fromCity.name}交付。`,
        fromCityId,
        toCityId: sourceCity.id,
        returnCityId: fromCityId,
        requiredGoods: { [selectedGood.id]: amount },
        reward: {
          money: reward,
          reputation: reputationReward
        },
        penalty: {
          money: Math.round(reward * 0.25),
          reputation: reputationReward
        },
        timeLimitMinutes,
        stages: ['accepted', 'traveling_to_source', 'procured', 'returning', 'delivered'],
        failureConditions: ['timeout', 'goods_lost'],
        params: {
          requiredGoodId: selectedGood.id,
          requiredAmount: amount,
          sourceCityId: sourceCity.id,
          needReturn: true
        }
      };
    }
  },
  {
    id: 'smuggling',
    name: '走私任务',
    description: '将黑市货物秘密运送到目的地，高风险高回报。',
    type: 'smuggling',
    difficultyRange: [3, 5],
    generateQuest: (difficulty, cities, goods, fromCityId) => {
      const fromCity = cities.find(c => c.hasBlackMarket && c.id === fromCityId);
      const smugglingFrom = fromCity ? fromCityId : cities.filter(c => c.hasBlackMarket)[0]?.id;
      if (!smugglingFrom) return null;
      
      const targetCities = cities.filter(c => c.id !== smugglingFrom);
      const toCity = targetCities[Math.floor(Math.random() * targetCities.length)];
      const blackMarketGoods = goods.filter(g => g.blackMarketOnly || g.isIllegal);
      if (blackMarketGoods.length === 0) return null;
      
      const selectedGood = blackMarketGoods[Math.floor(Math.random() * blackMarketGoods.length)];
      const amount = 2 + Math.floor(Math.random() * (difficulty * 2));
      const reward = Math.round(selectedGood.basePrice * amount * (2.5 + difficulty * 0.4));
      const reputationReward = -3 - difficulty;
      const timeLimitMinutes = 12 + difficulty * 3;

      return {
        title: `走私 ${selectedGood.name} 到 ${toCity.name}`,
        description: `将 ${amount} 单位 ${selectedGood.name} 秘密运送到${toCity.name}，不能被执法部门发现！`,
        fromCityId: smugglingFrom,
        toCityId: toCity.id,
        requiredGoods: { [selectedGood.id]: amount },
        reward: {
          money: reward,
          reputation: reputationReward
        },
        penalty: {
          money: Math.round(reward * 0.6),
          reputation: Math.abs(reputationReward) + 3
        },
        timeLimitMinutes,
        stages: ['accepted', 'goods_picked', 'in_transit', 'smuggled'],
        failureConditions: ['timeout', 'goods_lost', 'caught_by_authorities'],
        params: {
          requiredGoodId: selectedGood.id,
          requiredAmount: amount,
          isIllegal: true
        },
        isHighRisk: true
      };
    }
  },
  {
    id: 'rescue',
    name: '救援物资',
    description: '向受灾地区运送紧急救援物资。',
    type: 'rescue',
    difficultyRange: [2, 4],
    generateQuest: (difficulty, cities, goods, fromCityId) => {
      const fromCity = cities.find(c => c.id === fromCityId);
      const targetCities = cities.filter(c => c.id !== fromCityId);
      const toCity = targetCities[Math.floor(Math.random() * targetCities.length)];
      const essentialGoods = goods.filter(g => ['water', 'food', 'medicine', 'clothes'].includes(g.id));
      const selectedGood = essentialGoods[Math.floor(Math.random() * essentialGoods.length)];
      const amount = 10 + Math.floor(Math.random() * (difficulty * 6));
      const reward = Math.round(selectedGood.basePrice * amount * (1.2 + difficulty * 0.2));
      const reputationReward = 8 + difficulty * 3;
      const timeLimitMinutes = 18 + difficulty * 4;

      return {
        title: `向${toCity.name}运送${selectedGood.name}`,
        description: `${toCity.name}急需救援物资！将 ${amount} 单位 ${selectedGood.name} 运送到那里。`,
        fromCityId,
        toCityId: toCity.id,
        requiredGoods: { [selectedGood.id]: amount },
        reward: {
          money: reward,
          reputation: reputationReward
        },
        penalty: {
          money: 0,
          reputation: reputationReward + 3
        },
        timeLimitMinutes,
        stages: ['accepted', 'goods_picked', 'in_transit', 'delivered'],
        failureConditions: ['timeout', 'goods_lost'],
        params: {
          requiredGoodId: selectedGood.id,
          requiredAmount: amount,
          priority: 'high'
        },
        isCharity: true
      };
    }
  }
];

const QUEST_STATUS = {
  AVAILABLE: 'available',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  EXPIRED: 'expired'
};

const MAX_ACTIVE_QUESTS_PER_CITY = 3;
const MAX_ACCEPTED_QUESTS = 3;

function getQuestTemplateById(templateId) {
  return questTemplates.find(t => t.id === templateId);
}

function getAllQuestTemplates() {
  return questTemplates;
}

module.exports = {
  questTemplates,
  QUEST_STATUS,
  MAX_ACTIVE_QUESTS_PER_CITY,
  MAX_ACCEPTED_QUESTS,
  getQuestTemplateById,
  getAllQuestTemplates
};
