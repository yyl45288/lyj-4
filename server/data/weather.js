const weatherTypes = [
  {
    id: 'clear',
    name: '晴朗',
    icon: '☀️',
    description: '天空晴朗，适合旅行。',
    travelSpeedMultiplier: 1.0,
    staminaCostMultiplier: 1.0,
    goodsDamageChance: 0.0,
    eventWeightModifiers: {
      danger: 0,
      good: 1,
      neutral: 0
    }
  },
  {
    id: 'cloudy',
    name: '多云',
    icon: '⛅',
    description: '云层密布，天气凉爽。',
    travelSpeedMultiplier: 0.95,
    staminaCostMultiplier: 1.0,
    goodsDamageChance: 0.02,
    eventWeightModifiers: {
      danger: 0,
      good: 1,
      neutral: 1
    }
  },
  {
    id: 'light-rain',
    name: '小雨',
    icon: '🌧️',
    description: '绵绵细雨，道路湿滑。',
    travelSpeedMultiplier: 0.85,
    staminaCostMultiplier: 1.15,
    goodsDamageChance: 0.08,
    eventWeightModifiers: {
      danger: 1,
      good: 0,
      neutral: 1
    }
  },
  {
    id: 'heavy-rain',
    name: '暴雨',
    icon: '⛈️',
    description: '倾盆大雨，能见度极低。',
    travelSpeedMultiplier: 0.65,
    staminaCostMultiplier: 1.4,
    goodsDamageChance: 0.18,
    eventWeightModifiers: {
      danger: 3,
      good: -1,
      neutral: 1
    }
  },
  {
    id: 'sandstorm',
    name: '沙暴',
    icon: '🌪️',
    description: '狂暴的沙尘遮天蔽日。',
    travelSpeedMultiplier: 0.5,
    staminaCostMultiplier: 1.8,
    goodsDamageChance: 0.25,
    eventWeightModifiers: {
      danger: 5,
      good: -2,
      neutral: 0
    }
  },
  {
    id: 'fog',
    name: '浓雾',
    icon: '🌫️',
    description: '浓雾弥漫，视野受阻。',
    travelSpeedMultiplier: 0.75,
    staminaCostMultiplier: 1.2,
    goodsDamageChance: 0.1,
    eventWeightModifiers: {
      danger: 2,
      good: 0,
      neutral: 1
    }
  },
  {
    id: 'heat-wave',
    name: '热浪',
    icon: '🔥',
    description: '灼热的阳光炙烤大地。',
    travelSpeedMultiplier: 0.8,
    staminaCostMultiplier: 1.5,
    goodsDamageChance: 0.12,
    eventWeightModifiers: {
      danger: 2,
      good: 0,
      neutral: 1
    }
  },
  {
    id: 'radiation-storm',
    name: '辐射风暴',
    icon: '☢️',
    description: '致命的辐射粒子随风飘散。',
    travelSpeedMultiplier: 0.55,
    staminaCostMultiplier: 2.0,
    goodsDamageChance: 0.3,
    eventWeightModifiers: {
      danger: 6,
      good: -3,
      neutral: 0
    }
  },
  {
    id: 'thunderstorm',
    name: '雷暴',
    icon: '⚡',
    description: '电闪雷鸣，危险四伏。',
    travelSpeedMultiplier: 0.6,
    staminaCostMultiplier: 1.6,
    goodsDamageChance: 0.2,
    eventWeightModifiers: {
      danger: 4,
      good: -1,
      neutral: 1
    }
  }
];

const regionWeatherBiases = {
  'city-1': {
    name: '灰烬堡垒区域',
    biases: {
      'clear': 2,
      'cloudy': 2,
      'fog': 2,
      'light-rain': 1,
      'heat-wave': 1,
      'radiation-storm': 1,
      'sandstorm': 1,
      'heavy-rain': 0.5,
      'thunderstorm': 0.5
    }
  },
  'city-2': {
    name: '绿洲镇区域',
    biases: {
      'clear': 3,
      'cloudy': 2,
      'light-rain': 2,
      'heat-wave': 1,
      'sandstorm': 1,
      'heavy-rain': 1,
      'fog': 0.5,
      'radiation-storm': 0.3,
      'thunderstorm': 0.5
    }
  },
  'city-3': {
    name: '铁锈港区域',
    biases: {
      'cloudy': 2,
      'fog': 3,
      'light-rain': 2,
      'clear': 1,
      'heavy-rain': 1.5,
      'thunderstorm': 1,
      'sandstorm': 0.5,
      'heat-wave': 0.5,
      'radiation-storm': 0.5
    }
  },
  'city-4': {
    name: '辐射城区域',
    biases: {
      'radiation-storm': 4,
      'sandstorm': 2,
      'fog': 2,
      'heat-wave': 2,
      'cloudy': 1,
      'clear': 0.5,
      'light-rain': 0.5,
      'heavy-rain': 0.3,
      'thunderstorm': 1
    }
  },
  'city-5': {
    name: '沙丘集市区',
    biases: {
      'sandstorm': 4,
      'clear': 3,
      'heat-wave': 3,
      'cloudy': 1,
      'fog': 1,
      'light-rain': 0.3,
      'heavy-rain': 0.2,
      'thunderstorm': 0.3,
      'radiation-storm': 0.5
    }
  }
};

function getWeatherById(weatherId) {
  return weatherTypes.find(w => w.id === weatherId);
}

function getWeatherTypes() {
  return weatherTypes;
}

module.exports = {
  weatherTypes,
  regionWeatherBiases,
  getWeatherById,
  getWeatherTypes
};
