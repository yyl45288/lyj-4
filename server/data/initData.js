const store = require('./store');
const { goods: defaultGoods } = require('./goods');
const { cities: defaultCities, connections: defaultConnections } = require('./cities');
const { events: defaultEvents } = require('./events');
const { mercenaries: defaultMercenaries, cityMercenaryAvailability } = require('./mercenaries');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { ADMIN_USERNAME } = require('../middleware/auth');

function initGoods() {
  const existing = store.getGoods();
  if (!existing || existing.length === 0) {
    store.saveGoods(defaultGoods);
    console.log('已初始化货物数据');
  }
}

function initCities() {
  const existing = store.getCities();
  if (!existing || !existing.cities || existing.cities.length === 0) {
    store.saveCities({ cities: defaultCities, connections: defaultConnections });
    console.log('已初始化城市数据');
  }
}

function initEvents() {
  const existing = store.getEvents();
  if (!existing || existing.length === 0) {
    store.saveEvents(defaultEvents);
    console.log('已初始化事件数据');
  }
}

function initMercenaries() {
  const existing = store.getMercenaries();
  if (!existing || !existing.mercenaries || existing.mercenaries.length === 0) {
    store.saveMercenaries({ 
      mercenaries: defaultMercenaries, 
      cityAvailability: cityMercenaryAvailability 
    });
    console.log('已初始化佣兵数据');
  }
}

function initAdminUser() {
  const admin = store.getUserByUsername(ADMIN_USERNAME);
  if (!admin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const adminUser = {
      id: uuidv4(),
      username: ADMIN_USERNAME,
      password: hashedPassword,
      role: 'admin',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    store.addUser(adminUser);
    console.log('已创建默认管理员账号: admin / admin123');
  }
}

function getGoodsData() {
  const stored = store.getGoods();
  return stored || defaultGoods;
}

function getCitiesData() {
  const stored = store.getCities();
  if (stored && stored.cities) {
    return { cities: stored.cities, connections: stored.connections || defaultConnections };
  }
  return { cities: defaultCities, connections: defaultConnections };
}

function getEventsData() {
  const stored = store.getEvents();
  return stored || defaultEvents;
}

function getMercenariesData() {
  const stored = store.getMercenaries();
  if (stored && stored.mercenaries) {
    return {
      mercenaries: stored.mercenaries,
      cityAvailability: stored.cityAvailability || cityMercenaryAvailability
    };
  }
  return {
    mercenaries: defaultMercenaries,
    cityAvailability: cityMercenaryAvailability
  };
}

function initAllData() {
  store.initDataDir();
  initGoods();
  initCities();
  initEvents();
  initMercenaries();
  initAdminUser();
  console.log('数据初始化完成');
}

module.exports = {
  initAllData,
  getGoodsData,
  getCitiesData,
  getEventsData,
  getMercenariesData
};
