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

const SIDEBAR_TABS = [
  { id: 'travel', icon: '🚗', label: '旅行', fullLabel: '出发旅行', desc: '选择目的地并出发' },
  { id: 'trade', icon: '🏪', label: '市场', fullLabel: '市场交易', desc: '买卖常规货物' },
  { id: 'blackmarket', icon: '🌑', label: '黑市', fullLabel: '黑市交易', desc: '稀有和非法交易', requires: 'hasBlackMarket' },
  { id: 'mercenary', icon: '⚔️', label: '佣兵', fullLabel: '雇佣兵', desc: '雇佣或解雇佣兵' },
  { id: 'quests', icon: '📜', label: '任务', fullLabel: '委托任务', desc: '接取和完成任务' },
  { id: 'inventory', icon: '🎒', label: '背包', fullLabel: '物品背包', desc: '查看货物和状态' },
  { id: 'log', icon: '📋', label: '日志', fullLabel: '交易日志', desc: '查看历史交易记录' },
  { id: 'stats', icon: '📊', label: '统计', fullLabel: '资金统计', desc: '资金变化图表' },
];

const MODAL_TAB_LABELS = {
  travel: { icon: '🚗', title: '出发旅行' },
  trade: { icon: '🏪', title: '市场交易' },
  blackmarket: { icon: '🌑', title: '黑市交易' },
  mercenary: { icon: '⚔️', title: '雇佣兵' },
  quests: { icon: '📜', title: '委托任务' },
  inventory: { icon: '🎒', title: '物品背包' },
  log: { icon: '📋', title: '交易日志' },
  stats: { icon: '📊', title: '资金统计' },
};

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
  const [availableMercenaries, setAvailableMercenaries] = useState([]);
  const [hiredMercenaries, setHiredMercenaries] = useState([]);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [cityWeather, setCityWeather] = useState({});
  const [availableQuests, setAvailableQuests] = useState([]);
  const [acceptedQuests, setAcceptedQuests] = useState([]);
  const [questMessage, setQuestMessage] = useState(null);

  const [activeModalTab, setActiveModalTab] = useState(null);

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
  }, [user, isAdmin]);

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
    setActiveModalTab(null);
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
    setActiveModalTab('travel');
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
    setActiveModalTab(null);
  }, [logout, gameStarted, sessionId]);

  const handleSidebarTabClick = useCallback((tabId) => {
    if (activeModalTab === tabId) {
      setActiveModalTab(null);
      return;
    }
    setActiveModalTab(tabId);
    if (tabId === 'blackmarket') {
      loadBlackMarketPrices();
    } else if (tabId === 'mercenary') {
      loadAvailableMercenaries();
    }
  }, [activeModalTab, loadBlackMarketPrices, loadAvailableMercenaries]);

  const closeModalTab = useCallback(() => {
    setActiveModalTab(null);
    setTradeMessage(null);
    setBlackMarketMessage(null);
    setMercenaryMessage(null);
    setQuestMessage(null);
  }, []);

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

  const inventoryCount = Object.values(caravan?.inventory || {}).reduce((sum, v) => sum + (v || 0), 0);
  const staminaPercent = caravan ? (caravan.stamina / caravan.maxStamina) * 100 : 0;
  const weightPercent = caravan && caravan.maxCarryWeight ? (weight / caravan.maxCarryWeight) * 100 : 0;

  const renderModalContent = () => {
    switch (activeModalTab) {
      case 'travel':
        return (
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
        );
      case 'trade':
        return (
          <TradePanel
            allGoods={allGoods}
            currentPrices={currentPrices}
            caravan={caravan}
            onBuy={handleBuy}
            onSell={handleSell}
            message={tradeMessage}
          />
        );
      case 'blackmarket':
        return currentCity?.hasBlackMarket ? (
          <BlackMarketPanel
            allGoods={allGoods}
            blackMarketPrices={blackMarketPrices}
            caravan={caravan}
            onBuy={handleBlackMarketBuy}
            onSell={handleBlackMarketSell}
            message={blackMarketMessage}
            blackMarketRisk={currentCity?.blackMarketRisk}
          />
        ) : (
          <div className="panel">
            <div className="panel-header"><h3>🌑 黑市</h3></div>
            <div className="panel-body">
              <div className="empty-state">当前城市没有黑市</div>
            </div>
          </div>
        );
      case 'mercenary':
        return (
          <MercenaryPanel
            availableMercenaries={availableMercenaries}
            hiredMercenaries={hiredMercenaries}
            caravan={caravan}
            onHire={handleHireMercenary}
            onFire={handleFireMercenary}
            message={mercenaryMessage}
          />
        );
      case 'quests':
        return (
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
        );
      case 'inventory':
        return (
          <Inventory
            caravan={caravan}
            allGoods={allGoods}
            weight={weight}
          />
        );
      case 'log':
        return (
          <TradeLog tradeHistory={caravan?.tradeHistory} />
        );
      case 'stats':
        return (
          <div className="panel">
            <div className="panel-header"><h3>📊 资金变化</h3></div>
            <div className="panel-body">
              <MoneyChart moneyHistory={caravan?.moneyHistory} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const modalLabel = activeModalTab ? MODAL_TAB_LABELS[activeModalTab] : null;

  return (
    <div className="app app-new-layout">
      <header className="app-header compact-header">
        <div className="header-left">
          <h1 className="compact-title">🏜️ 废土商队</h1>
          <div className="compact-subtitle">
            {caravan?.name} · 领袖 {caravan?.leader}
            {' · '}旅行 {caravan?.travelCount}次
            {' · '}📍 {currentCity?.name || '旅途中'}
          </div>
        </div>
        <div className="user-nav compact-nav">
          <div className="quick-stats">
            <span className="qs-item qs-money" title="金币">💰 {caravan?.money?.toLocaleString()}</span>
            <span className="qs-item qs-stamina" title="体力">
              ⚡ {caravan?.stamina}/{caravan?.maxStamina}
              <span className="qs-minibar"><span style={{ width: `${staminaPercent}%` }}></span></span>
            </span>
            <span className="qs-item qs-weight" title="负重">
              ⚖️ {weight}/{caravan?.maxCarryWeight}
              <span className="qs-minibar weight-bar"><span style={{ width: `${Math.min(100, weightPercent)}%` }}></span></span>
            </span>
            <span className="qs-item qs-rep" title="声望">⭐ {caravan?.reputation || 0}</span>
            <span className="qs-item qs-merc" title="佣兵">⚔️ {caravan?.mercenaries?.length || 0}</span>
            <span className="qs-item qs-quest" title="任务">📜 {acceptedQuests?.length || 0}/3</span>
            <span className="qs-item qs-inv" title="货物件数">📦 {inventoryCount}</span>
            {currentWeather && (
              <span className="qs-item qs-weather" title={`${currentWeather.name}: ${currentWeather.description}`}>
                {currentWeather.icon} {currentWeather.name}
              </span>
            )}
          </div>
          <button onClick={handleNewGame} title="新建游戏">🌟 新档</button>
          <button onClick={handleSaveGame} title="保存游戏">💾 保存</button>
          <button onClick={() => setShowRecords(true)} title="游戏记录">📜 存档</button>
          <button onClick={handleLogout} title="退出登录">🚪 退出</button>
        </div>
      </header>

      <div className="new-main-container v2">
        <aside className="sidebar-nav">
          {SIDEBAR_TABS.map(tab => {
            if (tab.requires === 'hasBlackMarket' && !currentCity?.hasBlackMarket) {
              return null;
            }
            const isActive = activeModalTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`sidebar-tab ${isActive ? 'active' : ''}`}
                onClick={() => handleSidebarTabClick(tab.id)}
                title={tab.desc}
              >
                <span className="sidebar-tab-icon">{tab.icon}</span>
                <span className="sidebar-tab-label">{tab.label}</span>
                {tab.id === 'quests' && availableQuests?.length > 0 && (
                  <span className="sidebar-tab-badge">{availableQuests.length}</span>
                )}
                {tab.id === 'inventory' && inventoryCount > 0 && (
                  <span className="sidebar-tab-badge info">{inventoryCount}</span>
                )}
              </button>
            );
          })}
        </aside>

        <main className="main-content-area v2">
          <div className="summary-cards top-cards">
            <div className="summary-card sc-city">
              <div className="sc-label">📍 当前</div>
              <div className="sc-value">{currentCity?.name || '—'}</div>
              <div className="sc-sub">{currentCity?.description || ''}</div>
            </div>
            {selectedDestination && (
              <div className="summary-card sc-dest highlight">
                <div className="sc-label">🎯 目的地</div>
                <div className="sc-value">
                  → {connectedCities.find(c => c.id === selectedDestination)?.name || '—'}
                </div>
                <div className="sc-sub">
                  {(() => {
                    const dest = connectedCities.find(c => c.id === selectedDestination);
                    if (!dest?.travel) return '';
                    const t = dest.travel;
                    return `${t.distance}km · 体力-${t.staminaCost} · 💧${t.waterCost} 🍞${t.foodCost} ⛽${t.fuelCost}`;
                  })()}
                </div>
              </div>
            )}
            {acceptedQuests?.slice(0, 2).map(q => (
              <div key={q.id} className="summary-card sc-quest">
                <div className="sc-label">📜 {q.title?.slice(0, 10) || '任务'}</div>
                <div className="sc-value small">
                  {q.currentStage === 'delivered' || q.currentStage === 'returning' ? '✅ 可交付' : `进行中·${q.currentStage}`}
                </div>
                <div className="sc-sub">💰{q.reward?.money || 0} ⭐{q.reward?.reputation || 0}</div>
              </div>
            ))}
          </div>

          <div className="map-wrapper v2">
            <GameMap
              cities={allCities}
              connections={allConnections}
              currentCityId={caravan?.currentCityId}
              connectedCities={connectedCities}
              onCityClick={handleCityClick}
              selectedDestination={selectedDestination}
            />
          </div>
        </main>
      </div>

      {activeModalTab && (
        <div className="modal-overlay center-modal" onClick={closeModalTab}>
          <div className="modal center-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header center-modal-header">
              <h3>
                {modalLabel?.icon} {modalLabel?.title}
              </h3>
              <button className="modal-close" onClick={closeModalTab} title="关闭">×</button>
            </div>
            <div className="center-modal-body">
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}

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

      {message && (
        <div className={`toast-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>处理中...</span>
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
