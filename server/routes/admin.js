const express = require('express');
const store = require('../data/store');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/goods', (req, res) => {
  const goods = store.getGoods();
  res.json({ goods: goods || [] });
});

router.post('/goods', (req, res) => {
  const { name, description, basePrice, weight, icon } = req.body;

  if (!name || !basePrice || !weight) {
    return res.status(400).json({ error: '货物名称、基础价格和重量不能为空' });
  }

  const goods = store.getGoods() || [];
  const newGood = {
    id: `good-${uuidv4().slice(0, 8)}`,
    name,
    description: description || '',
    basePrice: Number(basePrice),
    weight: Number(weight),
    icon: icon || '📦'
  };

  goods.push(newGood);
  store.saveGoods(goods);

  res.json({ success: true, good: newGood, message: '货物添加成功' });
});

router.put('/goods/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, basePrice, weight, icon } = req.body;

  const goods = store.getGoods() || [];
  const index = goods.findIndex(g => g.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '货物不存在' });
  }

  goods[index] = {
    ...goods[index],
    name: name || goods[index].name,
    description: description !== undefined ? description : goods[index].description,
    basePrice: basePrice !== undefined ? Number(basePrice) : goods[index].basePrice,
    weight: weight !== undefined ? Number(weight) : goods[index].weight,
    icon: icon || goods[index].icon
  };

  store.saveGoods(goods);
  res.json({ success: true, good: goods[index], message: '货物更新成功' });
});

router.delete('/goods/:id', (req, res) => {
  const { id } = req.params;
  const goods = store.getGoods() || [];
  const filtered = goods.filter(g => g.id !== id);

  if (filtered.length === goods.length) {
    return res.status(404).json({ error: '货物不存在' });
  }

  store.saveGoods(filtered);
  res.json({ success: true, message: '货物删除成功' });
});

router.get('/cities', (req, res) => {
  const citiesData = store.getCities();
  res.json({ 
    cities: citiesData?.cities || [], 
    connections: citiesData?.connections || [] 
  });
});

router.post('/cities', (req, res) => {
  const { name, description, x, y, baseDemand, baseSupply } = req.body;

  if (!name || !x || !y) {
    return res.status(400).json({ error: '城市名称和坐标不能为空' });
  }

  const citiesData = store.getCities() || { cities: [], connections: [] };
  const newCity = {
    id: `city-${uuidv4().slice(0, 8)}`,
    name,
    description: description || '',
    x: Number(x),
    y: Number(y),
    baseDemand: baseDemand || {},
    baseSupply: baseSupply || {}
  };

  citiesData.cities.push(newCity);
  store.saveCities(citiesData);

  res.json({ success: true, city: newCity, message: '城市添加成功' });
});

router.put('/cities/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, x, y, baseDemand, baseSupply } = req.body;

  const citiesData = store.getCities() || { cities: [], connections: [] };
  const index = citiesData.cities.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '城市不存在' });
  }

  citiesData.cities[index] = {
    ...citiesData.cities[index],
    name: name || citiesData.cities[index].name,
    description: description !== undefined ? description : citiesData.cities[index].description,
    x: x !== undefined ? Number(x) : citiesData.cities[index].x,
    y: y !== undefined ? Number(y) : citiesData.cities[index].y,
    baseDemand: baseDemand || citiesData.cities[index].baseDemand,
    baseSupply: baseSupply || citiesData.cities[index].baseSupply
  };

  store.saveCities(citiesData);
  res.json({ success: true, city: citiesData.cities[index], message: '城市更新成功' });
});

router.delete('/cities/:id', (req, res) => {
  const { id } = req.params;
  const citiesData = store.getCities() || { cities: [], connections: [] };
  
  const filteredCities = citiesData.cities.filter(c => c.id !== id);
  const filteredConnections = citiesData.connections.filter(
    conn => conn.from !== id && conn.to !== id
  );

  if (filteredCities.length === citiesData.cities.length) {
    return res.status(404).json({ error: '城市不存在' });
  }

  store.saveCities({ cities: filteredCities, connections: filteredConnections });
  res.json({ success: true, message: '城市删除成功' });
});

router.post('/connections', (req, res) => {
  const { from, to, distance, danger } = req.body;

  if (!from || !to || !distance) {
    return res.status(400).json({ error: '起点、终点和距离不能为空' });
  }

  const citiesData = store.getCities() || { cities: [], connections: [] };
  
  const exists = citiesData.connections.some(
    c => (c.from === from && c.to === to) || (c.from === to && c.to === from)
  );

  if (exists) {
    return res.status(400).json({ error: '该路线已存在' });
  }

  const newConnection = {
    from,
    to,
    distance: Number(distance),
    danger: danger !== undefined ? Number(danger) : 0.3
  };

  citiesData.connections.push(newConnection);
  store.saveCities(citiesData);

  res.json({ success: true, connection: newConnection, message: '路线添加成功' });
});

router.delete('/connections/:from/:to', (req, res) => {
  const { from, to } = req.params;
  const citiesData = store.getCities() || { cities: [], connections: [] };

  const filtered = citiesData.connections.filter(
    c => !((c.from === from && c.to === to) || (c.from === to && c.to === from))
  );

  if (filtered.length === citiesData.connections.length) {
    return res.status(404).json({ error: '路线不存在' });
  }

  store.saveCities({ cities: citiesData.cities, connections: filtered });
  res.json({ success: true, message: '路线删除成功' });
});

router.get('/events', (req, res) => {
  const events = store.getEvents();
  res.json({ events: events || [] });
});

router.post('/events', (req, res) => {
  const { name, type, description, minDanger, effects } = req.body;

  if (!name || !type || !description) {
    return res.status(400).json({ error: '事件名称、类型和描述不能为空' });
  }

  const events = store.getEvents() || [];
  const newEvent = {
    id: `event-${uuidv4().slice(0, 8)}`,
    name,
    type,
    description,
    minDanger: minDanger !== undefined ? Number(minDanger) : 0.2,
    effects: effects || []
  };

  events.push(newEvent);
  store.saveEvents(events);

  res.json({ success: true, event: newEvent, message: '事件添加成功' });
});

router.put('/events/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, description, minDanger, effects } = req.body;

  const events = store.getEvents() || [];
  const index = events.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '事件不存在' });
  }

  events[index] = {
    ...events[index],
    name: name || events[index].name,
    type: type || events[index].type,
    description: description !== undefined ? description : events[index].description,
    minDanger: minDanger !== undefined ? Number(minDanger) : events[index].minDanger,
    effects: effects || events[index].effects
  };

  store.saveEvents(events);
  res.json({ success: true, event: events[index], message: '事件更新成功' });
});

router.delete('/events/:id', (req, res) => {
  const { id } = req.params;
  const events = store.getEvents() || [];
  const filtered = events.filter(e => e.id !== id);

  if (filtered.length === events.length) {
    return res.status(404).json({ error: '事件不存在' });
  }

  store.saveEvents(filtered);
  res.json({ success: true, message: '事件删除成功' });
});

router.get('/users', (req, res) => {
  const users = store.getUsers();
  const safeUsers = users.map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  }));
  res.json({ users: safeUsers });
});

router.delete('/users/:username', (req, res) => {
  const { username } = req.params;

  if (username === req.user.username) {
    return res.status(400).json({ error: '不能删除自己的账号' });
  }

  if (store.deleteUser(username)) {
    res.json({ success: true, message: '用户删除成功' });
  } else {
    res.status(404).json({ error: '用户不存在' });
  }
});

router.get('/stats', (req, res) => {
  const users = store.getUsers();
  const goods = store.getGoods() || [];
  const citiesData = store.getCities() || { cities: [], connections: [] };
  const events = store.getEvents() || [];

  res.json({
    stats: {
      userCount: users.length,
      goodsCount: goods.length,
      cityCount: citiesData.cities.length,
      connectionCount: citiesData.connections.length,
      eventCount: events.length
    }
  });
});

module.exports = router;
