import React, { useState } from 'react';

function BlackMarketPanel({ allGoods, blackMarketPrices, caravan, onBuy, onSell, message, blackMarketRisk }) {
  const [amounts, setAmounts] = useState({});
  const [activeTab, setActiveTab] = useState('buy');

  const getAmount = (goodId) => amounts[goodId] || 1;

  const setAmount = (goodId, value) => {
    const num = parseInt(value) || 0;
    setAmounts(prev => ({ ...prev, [goodId]: Math.max(1, num) }));
  };

  const getPriceClass = (goodId) => {
    const good = allGoods.find(g => g.id === goodId);
    if (!good || !blackMarketPrices[goodId]) return 'price-normal';
    const basePrice = good.basePrice;
    const currentBuy = blackMarketPrices[goodId].buyPrice;
    if (currentBuy > basePrice * 1.5) return 'price-high';
    if (currentBuy < basePrice * 0.6) return 'price-low';
    return 'price-normal';
  };

  const blackMarketGoods = allGoods.filter(g => g.isIllegal || g.blackMarketOnly);

  return (
    <div className="panel black-market-panel">
      <div className="panel-header">
        <h3>🌑 黑市交易</h3>
        {blackMarketRisk !== undefined && (
          <div className="risk-info">
            <span style={{ color: '#e74c3c', fontSize: '0.85rem' }}>
              ⚠️ 风险等级: {Math.round(blackMarketRisk * 100)}%
            </span>
          </div>
        )}
      </div>
      <div className="panel-body">
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}

        <div className="black-market-warning">
          <p style={{ color: '#e74c3c', fontSize: '0.85rem', margin: 0 }}>
            ⚠️ 黑市交易有风险！可能遭遇执法突袭或抢劫！
          </p>
        </div>

        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
            onClick={() => setActiveTab('buy')}
          >
            🛒 购买
          </button>
          <button
            className={`tab-btn ${activeTab === 'sell' ? 'active' : ''}`}
            onClick={() => setActiveTab('sell')}
          >
            💰 出售
          </button>
        </div>

        <ul className="goods-list">
          {blackMarketGoods.map(good => {
            const priceInfo = blackMarketPrices[good.id];
            if (!priceInfo) return null;
            const inventoryAmount = caravan.inventory[good.id] || 0;
            const amount = getAmount(good.id);

            if (activeTab === 'buy') {
              const totalCost = priceInfo.buyPrice * amount;
              const canAfford = caravan.money >= totalCost;
              const hasStock = priceInfo.stock >= amount;

              return (
                <li key={good.id} className="goods-item">
                  <span className="goods-icon">{good.icon}</span>
                  <div className="goods-info">
                    <div className="goods-name">
                      {good.name}
                      {good.blackMarketOnly && <span className="badge badge-rare">稀有</span>}
                      {good.isIllegal && !good.blackMarketOnly && <span className="badge badge-illegal">非法</span>}
                    </div>
                    <div className="goods-details">
                      <span className={getPriceClass(good.id)}>
                        买入: {priceInfo.buyPrice}💰
                      </span>
                      {' | '}库存: {priceInfo.stock}
                      {' | '}需求: {priceInfo.demand}
                      {' | '}{good.weight}kg
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>
                      {good.description}
                    </div>
                  </div>
                  <div className="goods-actions">
                    <input
                      type="number"
                      className="amount-input"
                      min={1}
                      max={priceInfo.stock}
                      value={amount}
                      onChange={(e) => setAmount(good.id, e.target.value)}
                    />
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onBuy(good.id, amount)}
                      disabled={!canAfford || !hasStock}
                    >
                      购买
                    </button>
                  </div>
                </li>
              );
            } else {
              const totalEarning = priceInfo.sellPrice * amount;
              const hasEnough = inventoryAmount >= amount;

              return (
                <li key={good.id} className="goods-item">
                  <span className="goods-icon">{good.icon}</span>
                  <div className="goods-info">
                    <div className="goods-name">
                      {good.name}
                      {good.blackMarketOnly && <span className="badge badge-rare">稀有</span>}
                      {good.isIllegal && !good.blackMarketOnly && <span className="badge badge-illegal">非法</span>}
                    </div>
                    <div className="goods-details">
                      卖出: {priceInfo.sellPrice}💰
                      {' | '}你有: {inventoryAmount}
                      {' | '}重量: {good.weight}kg
                    </div>
                  </div>
                  <div className="goods-actions">
                    <input
                      type="number"
                      className="amount-input"
                      min={1}
                      max={inventoryAmount}
                      value={amount}
                      onChange={(e) => setAmount(good.id, e.target.value)}
                    />
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => onSell(good.id, amount)}
                      disabled={!hasEnough || inventoryAmount === 0}
                    >
                      出售
                    </button>
                  </div>
                </li>
              );
            }
          })}
        </ul>
      </div>
    </div>
  );
}

export default BlackMarketPanel;
