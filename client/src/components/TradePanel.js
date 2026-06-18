import React, { useState } from 'react';

function TradePanel({ allGoods, currentPrices, caravan, onBuy, onSell, message }) {
  const [amounts, setAmounts] = useState({});
  const [activeTab, setActiveTab] = useState('buy');

  const getAmount = (goodId) => amounts[goodId] || 1;

  const setAmount = (goodId, value) => {
    const num = parseInt(value) || 0;
    setAmounts(prev => ({ ...prev, [goodId]: Math.max(1, num) }));
  };

  const getPriceClass = (goodId) => {
    const good = allGoods.find(g => g.id === goodId);
    if (!good || !currentPrices[goodId]) return 'price-normal';
    const basePrice = good.basePrice;
    const currentBuy = currentPrices[goodId].buyPrice;
    if (currentBuy > basePrice * 1.3) return 'price-high';
    if (currentBuy < basePrice * 0.7) return 'price-low';
    return 'price-normal';
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>🏪 市场交易</h3>
      </div>
      <div className="panel-body">
        {message && <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>{message.text}</div>}

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
          {allGoods.map(good => {
            const priceInfo = currentPrices[good.id];
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
                    <div className="goods-name">{good.name}</div>
                    <div className="goods-details">
                      <span className={getPriceClass(good.id)}>
                        买入: {priceInfo.buyPrice}💰
                      </span>
                      {' | '}库存: {priceInfo.stock}
                      {' | '}需求: {priceInfo.demand}
                      {' | '}{good.weight}kg
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
                      className="btn btn-success btn-sm"
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
                    <div className="goods-name">{good.name}</div>
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
                      className="btn btn-danger btn-sm"
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

export default TradePanel;
