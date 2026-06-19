import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function AdminPanel({ onBack }) {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('goods');
  const [stats, setStats] = useState(null);
  const [goods, setGoods] = useState([]);
  const [cities, setCities] = useState([]);
  const [connections, setConnections] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <button className="back-button" onClick={onBack}>
            ← 返回游戏
          </button>
          <h2>🎛️ 后台管理系统</h2>
        </div>
        <div className="auth-error" style={{ marginTop: '2rem' }}>
          您没有管理员权限，无法访问此页面
        </div>
      </div>
    );
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'goods') {
      loadGoods();
    } else if (activeTab === 'cities') {
      loadCities();
    } else if (activeTab === 'events') {
      loadEvents();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const data = await api.adminGetStats();
      setStats(data.stats);
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  };

  const loadGoods = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetGoods();
      setGoods(data.goods);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetCities();
      setCities(data.cities);
      setConnections(data.connections);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetEvents();
      setEvents(data.events);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetUsers();
      setUsers(data.users);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGood = async (goodData) => {
    try {
      await api.adminAddGood(goodData);
      showMessage('货物添加成功');
      loadGoods();
      loadStats();
      setShowForm(false);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleUpdateGood = async (id, goodData) => {
    try {
      await api.adminUpdateGood(id, goodData);
      showMessage('货物更新成功');
      loadGoods();
      setEditingItem(null);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleDeleteGood = async (id) => {
    if (!window.confirm('确定要删除这个货物吗？')) return;
    try {
      await api.adminDeleteGood(id);
      showMessage('货物删除成功');
      loadGoods();
      loadStats();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleAddCity = async (cityData) => {
    try {
      await api.adminAddCity(cityData);
      showMessage('城市添加成功');
      loadCities();
      loadStats();
      setShowForm(false);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleUpdateCity = async (id, cityData) => {
    try {
      await api.adminUpdateCity(id, cityData);
      showMessage('城市更新成功');
      loadCities();
      setEditingItem(null);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleDeleteCity = async (id) => {
    if (!window.confirm('确定要删除这个城市吗？相关路线也会被删除。')) return;
    try {
      await api.adminDeleteCity(id);
      showMessage('城市删除成功');
      loadCities();
      loadStats();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleAddEvent = async (eventData) => {
    try {
      await api.adminAddEvent(eventData);
      showMessage('事件添加成功');
      loadEvents();
      loadStats();
      setShowForm(false);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleUpdateEvent = async (id, eventData) => {
    try {
      await api.adminUpdateEvent(id, eventData);
      showMessage('事件更新成功');
      loadEvents();
      setEditingItem(null);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('确定要删除这个事件吗？')) return;
    try {
      await api.adminDeleteEvent(id);
      showMessage('事件删除成功');
      loadEvents();
      loadStats();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleDeleteUser = async (username) => {
    if (!window.confirm(`确定要删除用户 ${username} 吗？`)) return;
    try {
      await api.adminDeleteUser(username);
      showMessage('用户删除成功');
      loadUsers();
      loadStats();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const tabs = [
    { id: 'goods', label: '货物管理', icon: '📦' },
    { id: 'cities', label: '城镇管理', icon: '🏙️' },
    { id: 'events', label: '事件管理', icon: '⚡' },
    { id: 'users', label: '用户管理', icon: '👥' }
  ];

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <button className="back-button" onClick={onBack}>
          ← 返回游戏
        </button>
        <h2>🎛️ 后台管理系统</h2>
        <div className="admin-user">
          管理员: {user?.username}
        </div>
      </div>

      {stats && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-icon">👥</span>
            <span className="stat-value">{stats.userCount}</span>
            <span className="stat-label">用户</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📦</span>
            <span className="stat-value">{stats.goodsCount}</span>
            <span className="stat-label">货物</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🏙️</span>
            <span className="stat-value">{stats.cityCount}</span>
            <span className="stat-label">城市</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🔗</span>
            <span className="stat-value">{stats.connectionCount}</span>
            <span className="stat-label">路线</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⚡</span>
            <span className="stat-value">{stats.eventCount}</span>
            <span className="stat-label">事件</span>
          </div>
        </div>
      )}

      {message && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {loading && <div className="loading">加载中...</div>}

        {activeTab === 'goods' && !loading && (
          <GoodsManager
            goods={goods}
            editingItem={editingItem}
            setEditingItem={setEditingItem}
            showForm={showForm}
            setShowForm={setShowForm}
            onAdd={handleAddGood}
            onUpdate={handleUpdateGood}
            onDelete={handleDeleteGood}
          />
        )}

        {activeTab === 'cities' && !loading && (
          <CitiesManager
            cities={cities}
            connections={connections}
            editingItem={editingItem}
            setEditingItem={setEditingItem}
            showForm={showForm}
            setShowForm={setShowForm}
            onAdd={handleAddCity}
            onUpdate={handleUpdateCity}
            onDelete={handleDeleteCity}
          />
        )}

        {activeTab === 'events' && !loading && (
          <EventsManager
            events={events}
            editingItem={editingItem}
            setEditingItem={setEditingItem}
            showForm={showForm}
            setShowForm={setShowForm}
            onAdd={handleAddEvent}
            onUpdate={handleUpdateEvent}
            onDelete={handleDeleteEvent}
          />
        )}

        {activeTab === 'users' && !loading && (
          <UsersManager
            users={users}
            onDelete={handleDeleteUser}
          />
        )}
      </div>
    </div>
  );
}

function GoodsManager({ goods, editingItem, setEditingItem, showForm, setShowForm, onAdd, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: 30,
    weight: 1,
    icon: '📦'
  });

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      setFormData({ name: '', description: '', basePrice: 30, weight: 1, icon: '📦' });
    }
  }, [editingItem]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      onUpdate(editingItem.id, formData);
    } else {
      onAdd(formData);
    }
  };

  return (
    <div className="manager-section">
      <div className="manager-header">
        <h3>货物列表</h3>
        {!showForm && !editingItem && (
          <button className="add-button" onClick={() => setShowForm(true)}>
            + 添加货物
          </button>
        )}
      </div>

      {(showForm || editingItem) && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h4>{editingItem ? '编辑货物' : '添加货物'}</h4>
          <div className="form-row">
            <div className="form-group">
              <label>名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>图标</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>基础价格</label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                min={1}
                required
              />
            </div>
            <div className="form-group">
              <label>重量</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                min={0.1}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={() => {
              setShowForm(false);
              setEditingItem(null);
            }}>
              取消
            </button>
            <button type="submit" className="submit-button">
              {editingItem ? '保存' : '添加'}
            </button>
          </div>
        </form>
      )}

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>图标</th>
              <th>名称</th>
              <th>描述</th>
              <th>基础价格</th>
              <th>重量</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {goods.map(good => (
              <tr key={good.id}>
                <td className="icon-cell">{good.icon}</td>
                <td>{good.name}</td>
                <td className="description-cell">{good.description}</td>
                <td>{good.basePrice} 💰</td>
                <td>{good.weight} kg</td>
                <td className="actions-cell">
                  <button className="edit-button" onClick={() => setEditingItem(good)}>
                    编辑
                  </button>
                  <button className="delete-button" onClick={() => onDelete(good.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CitiesManager({ cities, connections, editingItem, setEditingItem, showForm, setShowForm, onAdd, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    x: 100,
    y: 100,
    baseDemand: {},
    baseSupply: {}
  });

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      setFormData({
        name: '',
        description: '',
        x: 100,
        y: 100,
        baseDemand: {},
        baseSupply: {}
      });
    }
  }, [editingItem]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      onUpdate(editingItem.id, formData);
    } else {
      onAdd(formData);
    }
  };

  return (
    <div className="manager-section">
      <div className="manager-header">
        <h3>城镇列表</h3>
        {!showForm && !editingItem && (
          <button className="add-button" onClick={() => setShowForm(true)}>
            + 添加城镇
          </button>
        )}
      </div>

      {(showForm || editingItem) && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h4>{editingItem ? '编辑城镇' : '添加城镇'}</h4>
          <div className="form-group">
            <label>名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>X 坐标</label>
              <input
                type="number"
                value={formData.x}
                onChange={(e) => setFormData({ ...formData, x: Number(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label>Y 坐标</label>
              <input
                type="number"
                value={formData.y}
                onChange={(e) => setFormData({ ...formData, y: Number(e.target.value) })}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={() => {
              setShowForm(false);
              setEditingItem(null);
            }}>
              取消
            </button>
            <button type="submit" className="submit-button">
              {editingItem ? '保存' : '添加'}
            </button>
          </div>
        </form>
      )}

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>描述</th>
              <th>坐标</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {cities.map(city => (
              <tr key={city.id}>
                <td>{city.name}</td>
                <td className="description-cell">{city.description}</td>
                <td>({city.x}, {city.y})</td>
                <td className="actions-cell">
                  <button className="edit-button" onClick={() => setEditingItem(city)}>
                    编辑
                  </button>
                  <button className="delete-button" onClick={() => onDelete(city.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="connections-section">
        <h4>路线列表 ({connections.length})</h4>
        <div className="connections-list">
          {connections.map((conn, idx) => {
            const fromCity = cities.find(c => c.id === conn.from);
            const toCity = cities.find(c => c.id === conn.to);
            return (
              <div key={idx} className="connection-item">
                <span>
                  {fromCity?.name || conn.from} ↔ {toCity?.name || conn.to}
                </span>
                <span className="connection-info">
                  距离: {conn.distance} | 危险度: {conn.danger}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventsManager({ events, editingItem, setEditingItem, showForm, setShowForm, onAdd, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'neutral',
    description: '',
    minDanger: 0.2,
    effects: []
  });

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      setFormData({
        name: '',
        type: 'neutral',
        description: '',
        minDanger: 0.2,
        effects: []
      });
    }
  }, [editingItem]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      onUpdate(editingItem.id, formData);
    } else {
      onAdd(formData);
    }
  };

  const getTypeLabel = (type) => {
    const labels = { danger: '危险', good: '好事', neutral: '中性' };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = { danger: '#e74c3c', good: '#2ecc71', neutral: '#f39c12' };
    return colors[type] || '#999';
  };

  return (
    <div className="manager-section">
      <div className="manager-header">
        <h3>事件列表</h3>
        {!showForm && !editingItem && (
          <button className="add-button" onClick={() => setShowForm(true)}>
            + 添加事件
          </button>
        )}
      </div>

      {(showForm || editingItem) && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h4>{editingItem ? '编辑事件' : '添加事件'}</h4>
          <div className="form-group">
            <label>事件名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="danger">危险</option>
                <option value="good">好事</option>
                <option value="neutral">中性</option>
              </select>
            </div>
            <div className="form-group">
              <label>最低危险度触发</label>
              <input
                type="number"
                step="0.1"
                value={formData.minDanger}
                onChange={(e) => setFormData({ ...formData, minDanger: Number(e.target.value) })}
                min={0}
                max={1}
              />
            </div>
          </div>
          <div className="form-group">
            <label>描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={() => {
              setShowForm(false);
              setEditingItem(null);
            }}>
              取消
            </button>
            <button type="submit" className="submit-button">
              {editingItem ? '保存' : '添加'}
            </button>
          </div>
        </form>
      )}

      <div className="events-grid">
        {events.map(event => (
          <div key={event.id} className="event-card">
            <div className="event-card-header">
              <h4 style={{ color: getTypeColor(event.type) }}>{event.name}</h4>
              <span
                className="event-type-badge"
                style={{ backgroundColor: getTypeColor(event.type) }}
              >
                {getTypeLabel(event.type)}
              </span>
            </div>
            <p className="event-description">{event.description}</p>
            <div className="event-meta">
              <span>触发危险度: ≥{event.minDanger}</span>
              <span>效果数: {event.effects?.length || 0}</span>
            </div>
            <div className="event-card-actions">
              <button className="edit-button" onClick={() => setEditingItem(event)}>
                编辑
              </button>
              <button className="delete-button" onClick={() => onDelete(event.id)}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersManager({ users, onDelete }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="manager-section">
      <h3>用户列表</h3>
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>用户名</th>
              <th>角色</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>
                  <span className={`role-badge ${u.role}`}>
                    {u.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </td>
                <td>{formatDate(u.createdAt)}</td>
                <td className="actions-cell">
                  {u.role !== 'admin' && (
                    <button className="delete-button" onClick={() => onDelete(u.username)}>
                      删除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPanel;
