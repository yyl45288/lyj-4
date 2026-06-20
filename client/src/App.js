import React, { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api';
import StartScreen from './components/StartScreen';
import GameMap from './components/GameMap';
import TradePanel from './components/TradePanel';
import BlackMarketPanel from './components/BlackMarketPanel';
import MercenaryPanel from './components/MercenaryPanel';
import Inventory from './components/Inventory';
import MoneyChart from './components/MoneyChart';
import TradeLog from './components/TradeLog';
import EventModal from './components/EventModal';
import DestinationsPanel from './components/DestinationsPanel';
import AuthPage from './components/AuthPage';
import AdminPanel from './components/AdminPanel';
import RecordsModal from './components/RecordsModal';
import QuestsPanel from './components/QuestsPanel';

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
  const [tradeMessage, setTradeMessage] = useState(null);
  const [blackMarketMessage, setBlackMarketMessage] = useState(null);
  const [mercenaryMessage, setMercenaryMessage] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeEventResult, setActiveEventResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [showNewGame, setShowNewGame] = useState(false);
  const [checkingRecord, setCheckingRecord] = useState(true);
  const [blackMarketPrices, setBlackMarketPrices] = useState({});
  const [showBlackMarket, setShowBlackMarket] = useState(false);
  const [showMercenary, setShowMercenary] = useState(false);
  const [availableMercenaries, setAvailableMercenaries] = useState([]);
  const [hiredMercenaries, setHiredMercenaries] = useState([]);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [cityWeather, setCityWeather] = useState({});
  const [availableQuests, setAvailableQuests] = useState([]);
  const [acceptedQuests, setAcceptedQuests] = useState([]);
  const [questMessage, setQuestMessage] = useState(null);

  useEffect(() => {
    api.getCities().then(data => {
      setAllCities(data.cities);
      setAllConnections(data.connections);
    }).catch(err => console.error('加载城市失败:', err));
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setView('admin');
      setGameStarted(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (view === 'admin' && !isAdmin) {
      setView('game');
    }
  }, [view, isAdmin]);

  useEffect(() => {
    if (!user || isAdmin || gameStarted) {
      setCheckingRecord(false);
      return;
    }

    const loadLatestRecordIfExists = async () => {
      try {
        setCheckingRecord(true);
        const data = await api.getRecords();
        if (data.records && data.records.length > 0) {
          const latestRecord = data.records[0];
          const result = await api.loadGame(latestRecord.id);
          setSessionId(result.sessionId);
          setCaravan(result.caravan);
          setCurrentCity(result.currentCity);
          setCurrentPrices(result.currentPrices);
          setConnectedCities(result.connectedCities);
          setAllGoods(result.allGoods);
          setWeight(result.weight);
          setBlackMarketPrices(result.blackMarketPrices || {});
          setAvailableMercenaries(result.availableMercenaries || []);
          setHiredMercenaries(result.hiredMercenaries || []);
          setCurrentWeather(result.currentWeather || null);
          setCityWeather(result.cityWeather || {});
          setAvailableQuests(result.availableQuests || []);
          setAcceptedQuests(result.acceptedQuests || []);
          setGameStarted(true);
          setActiveEvent(result.pendingEvent || null);
          showMessage(`已自动加载最近存档：${latestRecord.caravanName}`, 'success');
        }
      } catch (err) {
        console.error('自动加载存档失败:', err);
      } finally {
        setCheckingRecord(false);
      }
    };

    loadLatestRecordIfExists();
  }, [user, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setBlackMarketPrices(gameData.blackMarketPrices || {});
    setAvailableMercenaries(gameData.availableMercenaries || []);
    setHiredMercenaries(gameData.hiredMercenaries || []);
    setCurrentWeather(gameData.currentWeather || null);
    setCityWeather(gameData.cityWeather || {});
    setAvailableQuests(gameData.availableQuests || []);
    setAcceptedQuests(gameData.acceptedQuests || []);
    setGameStarted(true);
    setShowNewGame(false);
    showMessage(`商队「${gameData.caravan.name}」已创建！祝你好运，${gameData.caravan.leader}！`);
  }, [showMessage]);

  const handleNewGame = useCallback(() => {
    setShowNewGame(true);
  }, []);

  const handleCancelNewGame = useCallback(() => {
    setShowNewGame(false);
  }, []);

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
      setBlackMarketPrices(result.blackMarketPrices || {});
      setAvailableMercenaries(result.availableMercenaries || []);
      setHiredMercenaries(result.hiredMercenaries || []);
      setCurrentWeather(result.currentWeather || null);
      setCityWeather(result.cityWeather || {});
      setAvailableQuests(result.availableQuests || []);
      setAcceptedQuests(result.acceptedQuests || []);
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
      if (result.availableQuests) setAvailableQuests(result.availableQuests);
      if (result.acceptedQuests) setAcceptedQuests(result.acceptedQuests);
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
      setTradeMessage({ text: result.message, type: 'success' });
      setTimeout(() => setTradeMessage(null), 3000);
    } catch (err) {
      setTradeMessage({ text: err.message, type: 'error' });
      setTimeout(() => setTradeMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const loadBlackMarketPrices = useCallback(async () => {
    if (!sessionId) return;
    try {
      const result = await api.getBlackMarketPrices(sessionId);
      setBlackMarketPrices(result.blackMarketPrices);
    } catch (err) {
      console.error('加载黑市价格失败:', err);
    }
  }, [sessionId]);

  const handleBlackMarketBuy = useCallback(async (goodId, amount) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await api.buyBlackMarket(sessionId, goodId, amount);
      setCaravan(result.caravan);
      setBlackMarketPrices(result.blackMarketPrices);
      setWeight(result.weight);
      
      let messageText = result.message;
      if (result.blackMarketEvent) {
        messageText += ` | ${result.blackMarketEvent.name}: ${result.blackMarketEvent.description}`;
        if (result.blackMarketEvent.messages) {
          messageText += ` | ${result.blackMarketEvent.messages.join(', ')}`;
        }
      }
      
      setBlackMarketMessage({ text: messageText, type: result.blackMarketEvent ? 'error' : 'success' });
      setTimeout(() => setBlackMarketMessage(null), 5000);
    } catch (err) {
      setBlackMarketMessage({ text: err.message, type: 'error' });
      setTimeout(() => setBlackMarketMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const handleBlackMarketSell = useCallback(async (goodId, amount) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await api.sellBlackMarket(sessionId, goodId, amount);
      setCaravan(result.caravan);
      setBlackMarketPrices(result.blackMarketPrices);
      setWeight(result.weight);
      
      let messageText = result.message;
      if (result.blackMarketEvent) {
        messageText += ` | ${result.blackMarketEvent.name}: ${result.blackMarketEvent.description}`;
        if (result.blackMarketEvent.messages) {
          messageText += ` | ${result.blackMarketEvent.messages.join(', ')}`;
        }
      }
      
      setBlackMarketMessage({ text: messageText, type: result.blackMarketEvent ? 'error' : 'success' });
      setTimeout(() => setBlackMarketMessage(null), 5000);
    } catch (err) {
      setBlackMarketMessage({ text: err.message, type: 'error' });
      setTimeout(() => setBlackMarketMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const loadAvailableMercenaries = useCallback(async () => {
    if (!sessionId) return;
    try {
      const result = await api.getAvailableMercenaries(sessionId);
      setAvailableMercenaries(result.availableMercenaries);
      setHiredMercenaries(result.hiredMercenaries || []);
    } catch (err) {
      console.error('加载可雇佣佣兵失败:', err);
    }
  }, [sessionId]);

  const handleHireMercenary = useCallback(async (mercenaryId) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await api.hireMercenary(sessionId, mercenaryId);
      setCaravan(result.caravan);
      setAvailableMercenaries(result.availableMercenaries);
      setHiredMercenaries(result.hiredMercenaries || []);
      setMercenaryMessage({ text: result.message, type: 'success' });
      setTimeout(() => setMercenaryMessage(null), 3000);
    } catch (err) {
      setMercenaryMessage({ text: err.message, type: 'error' });
      setTimeout(() => setMercenaryMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const handleFireMercenary = useCallback(async (mercenaryId) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await api.fireMercenary(sessionId, mercenaryId);
      setCaravan(result.caravan);
      setAvailableMercenaries(result.availableMercenaries);
      setHiredMercenaries(result.hiredMercenaries || []);
      setMercenaryMessage({ text: result.message, type: 'success' });
      setTimeout(() => setMercenaryMessage(null), 3000);
    } catch (err) {
      setMercenaryMessage({ text: err.message, type: 'error' });
      setTimeout(() => setMercenaryMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const handleTravel = useCallback(async () => {
    if (!sessionId || !selectedDestination) return;
    setLoading(true);
    try {
      const result = await api.startTravel(sessionId, selectedDestination);
      setCaravan(result.caravan);
      setWeight(result.weight);

      if (result.hiredMercenaries) {
        setHiredMercenaries(result.hiredMercenaries);
      }
      if (result.availableMercenaries) {
        setAvailableMercenaries(result.availableMercenaries);
      }
      if (result.currentWeather) {
        setCurrentWeather(result.currentWeather);
      }
      if (result.cityWeather) {
        setCityWeather(result.cityWeather);
      }
      if (result.availableQuests) {
        setAvailableQuests(result.availableQuests);
      }
      if (result.acceptedQuests) {
        setAcceptedQuests(result.acceptedQuests);
      }

      let travelMessages = [];
      if (result.weatherDamage && result.weatherDamage.damaged) {
        const damagedCount = result.weatherDamage.damagedItems?.length || 0;
        travelMessages.push(`🌧️ 天气货损${damagedCount}件`);
      }
      if (result.questStatusChanges && result.questStatusChanges.length > 0) {
        result.questStatusChanges.forEach(qc => {
          travelMessages.push(`📜 任务阶段: ${qc.currentStage}`);
        });
      }
      if (result.completedQuests && result.completedQuests.length > 0) {
        result.completedQuests.forEach(cq => {
          travelMessages.push(`🎉 任务完成：+${cq.rewards?.money || 0}💰 +${cq.rewards?.reputation || 0}⭐`);
        });
      }
      if (result.failedQuests && result.failedQuests.length > 0) {
        result.failedQuests.forEach(fq => {
          travelMessages.push(`💥 任务失败：${fq.failureReason || '未知原因'}`);
        });
      }

      if (result.eventOccurred && result.event && result.event.hasChoices) {
        setActiveEvent(result.event);
        setActiveEventResult(result.eventResult || null);
      } else {
        if (result.currentCity) {
          setCurrentCity(result.currentCity);
          setCurrentPrices(result.currentPrices);
          setConnectedCities(result.connectedCities);
          setBlackMarketPrices(result.blackMarketPrices || {});
          setSelectedDestination(null);
        }
        if (result.eventOccurred && result.eventResult) {
          travelMessages.push(`${result.event.name}：${result.eventResult.join(' | ')}`);
          showMessage(travelMessages.join(' | '), travelMessages.some(m => m.includes('完成')) ? 'success' : travelMessages.some(m => m.includes('失败') || m.includes('货损')) ? 'error' : 'success');
        } else if (result.currentCity) {
          travelMessages.unshift(`安全抵达「${result.currentCity.name}」！`);
          showMessage(travelMessages.join(' | '), travelMessages.some(m => m.includes('完成')) ? 'success' : travelMessages.some(m => m.includes('失败') || m.includes('货损')) ? 'error' : 'success');
        } else if (travelMessages.length > 0) {
          showMessage(travelMessages.join(' | '), 'success');
        }
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
      setBlackMarketPrices(result.blackMarketPrices || {});
      setAvailableMercenaries(result.availableMercenaries || []);
      setHiredMercenaries(result.hiredMercenaries || []);
      if (result.currentWeather) setCurrentWeather(result.currentWeather);
      if (result.cityWeather) setCityWeather(result.cityWeather);
      if (result.availableQuests) setAvailableQuests(result.availableQuests);
      if (result.acceptedQuests) setAcceptedQuests(result.acceptedQuests);
      setActiveEvent(null);
      setActiveEventResult(null);
      setSelectedDestination(null);

      let msgs = [];
      if (result.weatherDamage?.damaged) {
        msgs.push(`🌧️ 天气货损${result.weatherDamage.damagedItems?.length || 0}件`);
      }
      if (result.completedQuests?.length > 0) {
        result.completedQuests.forEach(cq => msgs.push(`🎉 +${cq.rewards?.money || 0}💰 +${cq.rewards?.reputation || 0}⭐`));
      }
      if (result.failedQuests?.length > 0) {
        result.failedQuests.forEach(fq => msgs.push(`💥 任务失败`));
      }
      if (result.messages && result.messages.length > 0) {
        msgs.push(result.messages.join(' | '));
      } else if (result.currentCity) {
        msgs.unshift(`抵达「${result.currentCity.name}」！`);
      }
      if (msgs.length > 0) {
        showMessage(msgs.join(' | '), msgs.some(m => m.includes('失败')) ? 'error' : 'success');
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
      setBlackMarketPrices(result.blackMarketPrices || {});
      setWeight(result.weight);
      setAvailableMercenaries(result.availableMercenaries || []);
      setHiredMercenaries(result.hiredMercenaries || []);
      if (result.currentWeather) setCurrentWeather(result.currentWeather);
      if (result.cityWeather) setCityWeather(result.cityWeather);
      if (result.connectedCities) setConnectedCities(result.connectedCities);
      if (result.availableQuests) setAvailableQuests(result.availableQuests);
      if (result.acceptedQuests) setAcceptedQuests(result.acceptedQuests);

      let msgs = [result.message || '休整完成'];
      if (result.expiredQuests?.length > 0) {
        msgs.push(`⌛ ${result.expiredQuests.length}个任务超时`);
      }
      if (result.questsRefreshInfo?.newQuestsCount > 0) {
        msgs.push(`📜 新发布${result.questsRefreshInfo.newQuestsCount}个委托`);
      }
      showMessage(msgs.join(' | '), msgs.some(m => m.includes('超时')) ? 'error' : 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [sessionId, showMessage]);

  const handleAcceptQuest = useCallback(async (questId) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await api.acceptQuest(sessionId, questId);
      if (result.availableQuests) setAvailableQuests(result.availableQuests);
      if (result.acceptedQuests) setAcceptedQuests(result.acceptedQuests);
      setQuestMessage({ text: result.message, type: 'success' });
      setTimeout(() => setQuestMessage(null), 3000);
      showMessage(result.message, 'success');
    } catch (err) {
      setQuestMessage({ text: err.message, type: 'error' });
      setTimeout(() => setQuestMessage(null), 3000);
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [sessionId, showMessage]);

  const handleAbandonQuest = useCallback(async (questId) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await api.abandonQuest(sessionId, questId);
      setCaravan(result.caravan);
      if (result.availableQuests) setAvailableQuests(result.availableQuests);
      if (result.acceptedQuests) setAcceptedQuests(result.acceptedQuests);
      showMessage(result.message || '已放弃任务', 'error');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [sessionId, showMessage]);

  const handleRefreshQuests = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await api.refreshQuests(sessionId);
      if (result.availableQuests) setAvailableQuests(result.availableQuests);
      if (result.acceptedQuests) setAcceptedQuests(result.acceptedQuests);
      const info = result.questsRefreshInfo || {};
      showMessage(`任务刷新：过期${info.expiredCount || 0}个，新增${info.newQuestsCount || 0}个`, 'success');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [sessionId, showMessage]);

  const handleCompleteQuest = useCallback(async (questId) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const result = await api.completeQuest(sessionId, questId);
      setCaravan(result.caravan);
      if (result.availableQuests) setAvailableQuests(result.availableQuests);
      if (result.acceptedQuests) setAcceptedQuests(result.acceptedQuests);
      if (result.quest?.reward) {
        showMessage(`🎉 ${result.message}：+${result.quest.reward.money || 0}💰 +${result.quest.reward.reputation || 0}⭐`, 'success');
      } else {
        showMessage(result.message || '任务完成！', 'success');
      }
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

  if (isAdmin) {
    return <AdminPanel onBack={handleLogout} />;
  }

  if (!gameStarted) {
    if (checkingRecord) {
      return (
        <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#fff', fontSize: '1.2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            正在加载最近存档...
          </div>
        </div>
      );
    }
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
            <button onClick={handleLogout}>退出</button>
          </div>
        </header>
        <StartScreen onGameStart={handleGameStart} />
        {showRecords && (
          <RecordsModal
            onClose={() => setShowRecords(false)}
            onLoadRecord={(recordId) => { handleLoadRecord(recordId); }}
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
          <button onClick={handleNewGame}>🌟 新建游戏</button>
          <button onClick={handleSaveGame}>� 保存</button>
          <button onClick={() => setShowRecords(true)}>📜 记录</button>
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
          <div className="stat-card">
            <div className="label">⭐ 声望</div>
            <div className="value" style={{ color: '#f1c40f' }}>
              {caravan?.reputation || 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="label">⚔️ 佣兵</div>
            <div className="value" style={{ color: '#3498db' }}>
              {caravan?.mercenaries?.length || 0} 人
            </div>
          </div>
          <div className="stat-card">
            <div className="label">🌤️ 当前天气</div>
            {currentWeather ? (
              <>
                <div className="value" style={{
                  color: currentWeather.goodsDamageChance >= 0.2 ? '#e74c3c'
                    : currentWeather.travelSpeedMultiplier <= 0.7 ? '#f39c12' : '#2ecc71',
                  fontSize: '1.05rem',
                  fontWeight: '700'
                }}>
                  {currentWeather.icon} {currentWeather.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#a0a0a0', marginTop: '0.2rem', lineHeight: '1.3' }}>
                  速度×{currentWeather.travelSpeedMultiplier}
                  {' · '}货损{(currentWeather.goodsDamageChance * 100).toFixed(0)}%
                </div>
              </>
            ) : (
              <div className="value" style={{ color: '#888' }}>--</div>
            )}
          </div>
          <div className="stat-card">
            <div className="label">📜 任务</div>
            <div className="value" style={{ color: acceptedQuests?.length >= 3 ? '#e74c3c' : '#9b59b6' }}>
              {acceptedQuests?.length || 0}/3 进行中
            </div>
            {availableQuests?.length > 0 && (
              <div style={{ fontSize: '0.72rem', color: '#a0a0a0', marginTop: '0.2rem' }}>
                {availableQuests.length}个可接
              </div>
            )}
          </div>
        </div>

        <div className="game-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <QuestsPanel
              availableQuests={availableQuests || []}
              acceptedQuests={acceptedQuests || []}
              allGoods={allGoods || []}
              currentCityId={caravan?.currentCityId}
              onAccept={handleAcceptQuest}
              onAbandon={handleAbandonQuest}
              onRefresh={handleRefreshQuests}
              onComplete={handleCompleteQuest}
              loading={loading}
            />
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
              currentWeather={currentWeather}
              selectedDestination={selectedDestination}
              onSelectDestination={setSelectedDestination}
              onTravel={handleTravel}
              onRest={handleRest}
              caravan={caravan}
            />
            
            <div className="panel-tabs">
              <button
                className={`panel-tab ${!showBlackMarket && !showMercenary ? 'active' : ''}`}
                onClick={() => { setShowBlackMarket(false); setShowMercenary(false); }}
              >
                🏪 市场
              </button>
              {currentCity?.hasBlackMarket && (
                <button
                  className={`panel-tab ${showBlackMarket ? 'active' : ''}`}
                  onClick={() => {
                    setShowBlackMarket(true);
                    setShowMercenary(false);
                    loadBlackMarketPrices();
                  }}
                >
                  🌑 黑市
                </button>
              )}
              <button
                className={`panel-tab ${showMercenary ? 'active' : ''}`}
                onClick={() => {
                  setShowMercenary(true);
                  setShowBlackMarket(false);
                  loadAvailableMercenaries();
                }}
              >
                ⚔️ 佣兵
              </button>
            </div>

            {!showBlackMarket && !showMercenary && (
              <TradePanel
                allGoods={allGoods}
                currentPrices={currentPrices}
                caravan={caravan}
                onBuy={handleBuy}
                onSell={handleSell}
                message={tradeMessage}
              />
            )}

            {showBlackMarket && currentCity?.hasBlackMarket && (
              <BlackMarketPanel
                allGoods={allGoods}
                blackMarketPrices={blackMarketPrices}
                caravan={caravan}
                onBuy={handleBlackMarketBuy}
                onSell={handleBlackMarketSell}
                message={blackMarketMessage}
                blackMarketRisk={currentCity?.blackMarketRisk}
              />
            )}

            {showMercenary && (
              <MercenaryPanel
                availableMercenaries={availableMercenaries}
                hiredMercenaries={hiredMercenaries}
                caravan={caravan}
                onHire={handleHireMercenary}
                onFire={handleFireMercenary}
                message={mercenaryMessage}
              />
            )}
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

      {showNewGame && (
        <div className="modal-overlay" onClick={handleCancelNewGame}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🌟 新建游戏</h3>
              <button className="modal-close" onClick={handleCancelNewGame}>×</button>
            </div>
            <p style={{ color: '#e94560', marginBottom: '1rem', fontSize: '0.9rem' }}>
              ⚠️ 注意：新建游戏将覆盖当前未保存的进度，但不会影响已保存的存档
            </p>
            <StartScreen onGameStart={handleGameStart} embedded />
          </div>
        </div>
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
