const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'db');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GOODS_FILE = path.join(DATA_DIR, 'goods.json');
const CITIES_FILE = path.join(DATA_DIR, 'cities.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const MERCENARIES_FILE = path.join(DATA_DIR, 'mercenaries.json');
const RECORDS_DIR = path.join(DATA_DIR, 'records');

function initDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RECORDS_DIR)) {
    fs.mkdirSync(RECORDS_DIR, { recursive: true });
  }
}

function readJSON(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (err) {
    console.error(`读取文件失败 ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`写入文件失败 ${filePath}:`, err);
    return false;
  }
}

function getUsers() {
  return readJSON(USERS_FILE, []);
}

function saveUsers(users) {
  return writeJSON(USERS_FILE, users);
}

function getUserByUsername(username) {
  const users = getUsers();
  return users.find(u => u.username === username);
}

function addUser(user) {
  const users = getUsers();
  users.push(user);
  return saveUsers(users);
}

function updateUser(username, updates) {
  const users = getUsers();
  const index = users.findIndex(u => u.username === username);
  if (index === -1) return false;
  users[index] = { ...users[index], ...updates, updatedAt: Date.now() };
  return saveUsers(users);
}

function deleteUser(username) {
  const users = getUsers();
  const filtered = users.filter(u => u.username !== username);
  if (filtered.length === users.length) return false;
  return saveUsers(filtered);
}

function getGoods() {
  return readJSON(GOODS_FILE, null);
}

function saveGoods(goods) {
  return writeJSON(GOODS_FILE, goods);
}

function getCities() {
  return readJSON(CITIES_FILE, null);
}

function saveCities(cities) {
  return writeJSON(CITIES_FILE, cities);
}

function getEvents() {
  return readJSON(EVENTS_FILE, null);
}

function saveEvents(events) {
  return writeJSON(EVENTS_FILE, events);
}

function getMercenaries() {
  return readJSON(MERCENARIES_FILE, null);
}

function saveMercenaries(mercenariesData) {
  return writeJSON(MERCENARIES_FILE, mercenariesData);
}

function saveGameRecord(userId, recordId, record) {
  const userDir = path.join(RECORDS_DIR, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  const recordFile = path.join(userDir, `${recordId}.json`);
  return writeJSON(recordFile, record);
}

function getGameRecord(userId, recordId) {
  const recordFile = path.join(RECORDS_DIR, userId, `${recordId}.json`);
  return readJSON(recordFile, null);
}

function getUserGameRecords(userId) {
  const userDir = path.join(RECORDS_DIR, userId);
  if (!fs.existsSync(userDir)) return [];
  
  try {
    const files = fs.readdirSync(userDir);
    const records = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const recordId = file.replace('.json', '');
        const record = readJSON(path.join(userDir, file), null);
        if (record) {
          records.push({
            id: recordId,
            caravanName: record.caravan?.name || '未知商队',
            leaderName: record.caravan?.leader || '未知领袖',
            money: record.caravan?.money || 0,
            travelCount: record.caravan?.travelCount || 0,
            currentCity: record.caravan?.currentCityId || '未知',
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
          });
        }
      }
    }
    return records.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.error('获取游戏记录失败:', err);
    return [];
  }
}

function deleteGameRecord(userId, recordId) {
  const recordFile = path.join(RECORDS_DIR, userId, `${recordId}.json`);
  try {
    if (fs.existsSync(recordFile)) {
      fs.unlinkSync(recordFile);
      return true;
    }
    return false;
  } catch (err) {
    console.error('删除游戏记录失败:', err);
    return false;
  }
}

module.exports = {
  initDataDir,
  getUsers,
  saveUsers,
  getUserByUsername,
  addUser,
  updateUser,
  deleteUser,
  getGoods,
  saveGoods,
  getCities,
  saveCities,
  getEvents,
  saveEvents,
  getMercenaries,
  saveMercenaries,
  saveGameRecord,
  getGameRecord,
  getUserGameRecords,
  deleteGameRecord
};
