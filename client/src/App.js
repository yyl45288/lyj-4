import React, { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api';
import StartScreen from './components/StartScreen';
import GameMap from './components/GameMap';
import TradePanel from './components/TradePanel';
import Inventory from './components/Inventory';
import MoneyChart from './components/MoneyChart';
import TradeLog from './components/TradeLog';
import EventModal from './components/EventModal';
import DestinationsPanel from './components/DestinationsPanel';
import AuthPage from './components/AuthPage';
import AdminPanel from './components/AdminPanel';
import RecordsModal from './components/RecordsModal';

function GameApp() {
  const { user, logout, isAdmin } = useAuth();
  const [view, setView] = useState('game');
  const [gameStarted, setGameStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [caravan, setCaravan] = useState(null);
  const [currentCity, setCurrentCity] = useState(null);
  const [currentPrices, setCurrentPrices] = useState({});
  const [connectedCities, setConnectedCities] = useState([]);
  const [allGoods, setAllGoods] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [allConnections, setAllConnections] = useState([]);
  const [weight, setWeight] = useState(0);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeEventResult, setActiveEventResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRecords, setShowRecords] = useState(false);

  useEffect(() => {
    api.getCities().then(data => {
      setAllCities(data.cities);
      setAllConnections(data.connections);
    }).catch(err => console.error('加载城市失败:', err));
  }, []);

  const showMessage = useCallback((text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const handleGameStart = useCallback((gameData) => {
    setSessionId(gameData.sessionId);
    setCaravan(gameData.caravan);
    setCurrentCity(gameData.currentCity);
    setCurrentPrices(gameData.currentPrices);
    setConnectedCities(gameData.connectedCities);
    setAllGoods(gameData.allGoods);
    setWeight(gameData.weight);
    setGameStarted(true);
    showMessage(`商队「${gameData.caravan.name}」已创建！祝你好运，${gameData.caravan.leader}！`);
  }, [showMessage]);

  const handleLoadRecord = useCallback(async (recordId) => {
    try {
      setLoading(true);
      const result = await api.loadGame(recordId);
      setSessionId(result.sessionId);
      setCaravan(result.caravan);
      setCurrentCity(result.currentCity);
      setCurrentPrices(result.currentPrices);
      setConnectedCities(result.connectedCities);
      setAllGoods(result.allGoods);
      setWeight(result.weight);
      setGameStarted(true);
      setActiveEvent(result.pendingEvent || null);
      setShowRecords(false);
      showMessage('游戏记录已加载！', 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  const handleSaveGame = useCallback(async () => {
    if (!sessionId) return;
    try {
      await api.saveGame(sessionId);
      showMessage('游戏已保存！', 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  }, [sessionId, showMessage]);

  const handleBuy = useCallback(async (goodId, amount) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await api.buyGoods(sessionId, goodId, amount);
      setCaravan(result.caravan);
      setCurrentPrices(result.currentPrices);
      setWeight(result.weight);
      showMessage(result.message, 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [sessionId, showMessage]);

  const handleSell = useCallback(async (goodId, amount) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await api.sellGoods(sessionId, goodId, amount);
      setCaravan(result.caravan);
      setCurrentPrices(result.currentPrices);
      setWeight(result.weight);
      showMessage(result.message, 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [sessionId, showMessage]);

  const handleTravel = useCallback(async () => {
    if (!sessionId || !selectedDestination) return;
    setLoading(true);
    try {
      const result = await api.startTravel(sessionId, selectedDestination);
      setCaravan(result.caravan);
      setWeight(result.weight);

      if (result.eventOccurred && result.event) {
        setActiveEvent(result.event);
        setActiveEventResult(result.eventResult || null);
      } else if (result.currentCity) {
        setCurrentCity(result.currentCity);
        setCurrentPrices(result.currentPrices);
        setConnectedCities(result.connectedCities);
        setSelectedDestination(null);
        showMessage(`安全抵达「${result.currentCity.name}」！市场价格已更新。`, 'success');
      }
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [sessionId, selectedDestination, showMessage]);

  const handleResolveEvent = useCallback(async (choice) => {
    if (!sessionId || !activeEvent) return;
    setLoading(true);
    try {
      const result = await api.resolveEvent(sessionId, choice, selectedDestination);
      setCaravan(result.caravan);
      setCurrentCity(result.currentCity);
      setCurrentPrices(result.currentPrices);
      setConnectedCities(result.connectedCities);
      setWeight(result.weight);
      setActiveEvent(null);
      setActiveEventResult(null);
      setSelectedDestination(null);

      if (result.messages && result.messages.length > 0) {
        showMessage(result.messages.join(' | '), 'success');
      } else if (result.currentCity) {
        showMessage(`抵达「${result.currentCity.name}」！`, 'success');
      }
    } catch (err) {
      showMessage(err.message, 'error');
      setActiveEvent(null);
      setActiveEventResult(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId, activeEvent, selectedDestination, showMessage]);

  const handleRest = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await api.rest(sessionId);
      setCaravan(result.caravan);
      setCurrentPrices(result.currentPrices);
      setWeight(result.weight);
      showMessage(result.message, 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [sessionId, showMessage]);

  const handleCityClick = useCallback((city) => {
    setSelectedDestination(city.id);
  }, []);

  const handleLogout = useCallback(async () => {
    if (gameStarted && sessionId) {
      try {
        await api.saveGame(sessionId);
      } catch (err) {
        console.error('保存游戏失败:', err);
      }
    }
    await logout();
    setGameStarted(false);
    setSessionId(null);
    setCaravan(null);
    setCurrentCity(null);
    setCurrentPrices({});
    setConnectedCities([]);
    setAllGoods([]);
    setWeight(0);
    setSelectedDestination(null);
    setActiveEvent(null);
    setActiveEventResult(null);
    setView('game');
  }, [logout, gameStarted, sessionId]);

  if (!user) {
    return <AuthPage />;
  }

  if (view === 'admin') {
    return <AdminPanel onBack={() => setView('game')} />;
  }

  if (!gameStarted) {
    return (
      <div className="app">
        <header className="app-header">
          <div>
            <h1>🏜️ 废土商队模拟器</h1>
            <p>在末日废土中建立你的贸易帝国 - 低买高卖，生存致富</p>
          </div>
          <div className="user-nav">
            <span>👤 {user.username}</span>
            <button onClick={() => setShowRecords(true)}>📜 记录</button>
            {isAdmin && (
              <button onClick={() => setView('admin')}>🎛️ 管理</button>
            )}
            <button onClick={handleLogout}>退出</button>
          </div>
        </header>
        <StartScreen onGameStart={handleGameStart} />
        {showRecords && (
          <RecordsModal
            onClose={() => setShowRecords(false)}
            onLoadRecord={handleLoadRecord}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>🏜️ 废土商队模拟器</h1>
          <p>
            {caravan?.name} - 领袖: {caravan?.leader}
            {' | '}旅行次数: {caravan?.travelCount}
            {' | '}当前位置: {currentCity?.name || '旅途中...'}
          </p>
        </div>
        <div className="user-nav">
          <span>👤 {user.username}</span>
          <button onClick={handleSaveGame}>💾 保存</button>
          <button onClick={() => setShowRecords(true)}>📜 记录</button>
          {isAdmin && (
            <button onClick={() => setView('admin')}>🎛️ 管理</button>
          )}
          <button onClick={handleLogout}>退出</button>
        </div>
      </header>

      <div className="main-game">
        <div className="top-bar">
          <div className="stat-card">
            <div className="label">💰 金币</div>
            <div className="value positive">{caravan?.money?.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="label">⚡ 体力</div>
            <div className="value" style={{ color: caravan?.stamina < 30 ? '#e74c3c' : '#2ecc71' }}>
              {caravan?.stamina}/{caravan?.maxStamina}
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill stamina"
                style={{ width: `${(caravan?.stamina / caravan?.maxStamina) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="stat-card">
            <div className="label">⚖️ 负重</div>
            <div className="value" style={{ color: weight > caravan?.maxCarryWeight * 0.9 ? '#e74c3c' : '#f39c12' }}>
              {weight}/{caravan?.maxCarryWeight} kg
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill weight"
                style={{
                  width: `${Math.min(100, (weight / caravan?.maxCarryWeight) * 100)}%`,
                  background: weight > caravan?.maxCarryWeight * 0.9
                    ? 'linear-gradient(90deg, #c0392b 0%, #e74c3c 100%)'
                    : undefined
                }}
              ></div>
            </div>
          </div>
          <div className="stat-card">
            <div className="label">📍 当前城市</div>
            <div className="value" style={{ color: '#e94560', fontSize: '1.1rem' }}>
              {currentCity?.name || '旅途中...'}
            </div>
          </div>
        </div>

        <div className="game-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Inventory
              caravan={caravan}
              allGoods={allGoods}
              weight={weight}
            />
            <MoneyChart moneyHistory={caravan?.moneyHistory} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <GameMap
              cities={allCities}
              connections={allConnections}
              currentCityId={caravan?.currentCityId}
              connectedCities={connectedCities}
              onCityClick={handleCityClick}
              selectedDestination={selectedDestination}
            />
            <TradeLog tradeHistory={caravan?.tradeHistory} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <DestinationsPanel
              connectedCities={connectedCities}
              currentCity={currentCity}
              selectedDestination={selectedDestination}
              onSelectDestination={setSelectedDestination}
              onTravel={handleTravel}
              onRest={handleRest}
              caravan={caravan}
            />
            <TradePanel
              allGoods={allGoods}
              currentPrices={currentPrices}
              caravan={caravan}
              onBuy={handleBuy}
              onSell={handleSell}
              message={message}
            />
          </div>
        </div>
      </div>

      <EventModal
        event={activeEvent}
        eventResult={activeEventResult}
        onResolve={handleResolveEvent}
        caravan={caravan}
      />

      {showRecords && (
        <RecordsModal
          onClose={() => setShowRecords(false)}
          onLoadRecord={handleLoadRecord}
        />
      )}

      {loading && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(233, 69, 96, 0.9)',
          padding: '0.8rem 1.5rem',
          borderRadius: '8px',
          color: 'white',
          fontWeight: '600',
          boxShadow: '0 4px 20px rgba(233, 69, 96, 0.4)'
        }}>
          处理中...
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <GameApp />
    </AuthProvider>
  );
}

export default App;
