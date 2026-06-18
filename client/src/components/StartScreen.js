import React, { useState, useEffect } from 'react';
import { api } from '../api';

function StartScreen({ onGameStart }) {
  const [cities, setCities] = useState([]);
  const [caravanName, setCaravanName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [startCityId, setStartCityId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCities().then(data => {
      setCities(data.cities);
      if (data.cities.length > 0) {
        setStartCityId(data.cities[0].id);
      }
    }).catch(err => {
      setError('加载城市数据失败: ' + err.message);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!caravanName.trim() || !leaderName.trim() || !startCityId) {
      setError('请填写所有必要信息');
      return;
    }

    setLoading(true);
    try {
      const gameData = await api.createGame(caravanName.trim(), leaderName.trim(), startCityId);
      onGameStart(gameData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="start-screen">
      <div className="create-caravan-card">
        <h2>🏜️ 创建你的商队</h2>
        <p style={{ textAlign: 'center', color: '#a0a0a0', marginBottom: '1.5rem' }}>
          在末日废土中开启你的贸易帝国
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>商队名称</label>
            <input
              type="text"
              placeholder="例如：沙暴商队"
              value={caravanName}
              onChange={(e) => setCaravanName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>领袖姓名</label>
            <input
              type="text"
              placeholder="你的名字"
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>起始城市</label>
            <select
              value={startCityId}
              onChange={(e) => setStartCityId(e.target.value)}
            >
              {cities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name} - {city.description}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(15, 52, 96, 0.3)', borderRadius: '8px', fontSize: '0.85rem', color: '#a0a0a0' }}>
            <p style={{ marginBottom: '0.5rem', color: '#e8e8e8', fontWeight: '600' }}>🎒 初始物资：</p>
            <p>• 1000 金币</p>
            <p>• 净水 x5, 干粮 x5</p>
            <p>• 药品 x2, 武器 x1, 废料 x2</p>
            <p>• 最大负重：100 kg</p>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '1.5rem' }}
            disabled={loading}
          >
            {loading ? '创建中...' : '🚀 开启废土之旅'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StartScreen;
