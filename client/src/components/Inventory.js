import React from 'react';

function Inventory({ caravan, allGoods, weight }) {
  const inventoryItems = Object.entries(caravan.inventory)
    .filter(([_, amount]) => amount > 0)
    .map(([goodId, amount]) => {
      const good = allGoods.find(g => g.id === goodId);
      return { goodId, amount, good };
    })
    .filter(item => item.good);

  const weightPercent = (weight / caravan.maxCarryWeight) * 100;
  const staminaPercent = (caravan.stamina / caravan.maxStamina) * 100;

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>🎒 商队状态</h3>
      </div>
      <div className="panel-body">
        <div style={{ marginBottom: '1rem' }}>
          <div className="stat-card" style={{ marginBottom: '0.8rem' }}>
            <div className="label">🏕️ {caravan.name} - 领袖: {caravan.leader}</div>
          </div>

          <div className="stat-card" style={{ marginBottom: '0.8rem' }}>
            <div className="label">💰 金币</div>
            <div className="value positive">{caravan.money.toLocaleString()}</div>
          </div>

          <div className="stat-card" style={{ marginBottom: '0.8rem' }}>
            <div className="label">⚡ 体力 ({caravan.stamina}/{caravan.maxStamina})</div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill stamina"
                style={{ width: `${staminaPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="stat-card">
            <div className="label">⚖️ 负重 ({weight}/{caravan.maxCarryWeight} kg)</div>
            <div className="progress-bar">
              <div
                className={`progress-bar-fill weight`}
                style={{
                  width: `${Math.min(100, weightPercent)}%`,
                  background: weightPercent > 90 ? 'linear-gradient(90deg, #c0392b 0%, #e74c3c 100%)' : undefined
                }}
              ></div>
            </div>
          </div>
        </div>

        <h4 style={{ color: '#e94560', marginBottom: '0.8rem', fontSize: '1rem' }}>📦 货物清单</h4>
        {inventoryItems.length === 0 ? (
          <div className="empty-state">库存为空</div>
        ) : (
          <ul className="inventory-list">
            {inventoryItems.map(({ goodId, amount, good }) => (
              <li key={goodId} className="inventory-item">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="goods-icon">{good.icon}</span>
                  <div>
                    <div className="goods-name">{good.name}</div>
                    <div className="goods-details">{good.weight}kg × {amount} = {(good.weight * amount).toFixed(1)}kg</div>
                  </div>
                </div>
                <div style={{ color: '#e94560', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  x{amount}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Inventory;
