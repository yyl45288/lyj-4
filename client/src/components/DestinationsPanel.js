import React from 'react';

function DestinationsPanel({ connectedCities, currentCity, selectedDestination, onSelectDestination, onTravel, onRest, caravan }) {
  const selectedCity = connectedCities.find(c => c.id === selectedDestination);

  const dangerLabel = (danger) => {
    if (danger < 0.3) return { text: '低', color: '#2ecc71' };
    if (danger < 0.5) return { text: '中', color: '#f39c12' };
    return { text: '高', color: '#e74c3c' };
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>🚗 出发旅行</h3>
      </div>
      <div className="panel-body">
        {currentCity && (
          <div className="city-info">
            <h2>{currentCity.name}</h2>
            <p>{currentCity.description}</p>
          </div>
        )}

        <div className="action-row">
          <button className="btn btn-success btn-sm" onClick={onRest}>
            🏨 休整 (50💰 + 🍞x3 + 💧x3)
          </button>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#a0a0a0' }}>
            消耗：50金币、干粮x3、净水x3 &nbsp;|&nbsp; 恢复：体力+50
          </div>
        </div>

        <h4 style={{ color: '#e94560', margin: '1.2rem 0 0.8rem', fontSize: '1rem' }}>
          🌍 可到达城市 ({connectedCities.length})
        </h4>

        {connectedCities.length === 0 ? (
          <div className="empty-state">没有可到达的城市</div>
        ) : (
          <ul className="destinations-list">
            {connectedCities.map(city => {
              const travel = city.travel;
              const danger = dangerLabel(travel.danger);
              const isSelected = selectedDestination === city.id;

              return (
                <li
                  key={city.id}
                  className="destination-item"
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(233, 69, 96, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid #e94560' : '1px solid transparent',
                    borderRadius: '6px',
                    margin: '0.3rem 0',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => onSelectDestination(city.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: isSelected ? '#e94560' : '#e8e8e8' }}>
                      {city.name}
                    </div>
                    <div className="destination-info">
                      距离: {travel.distance}km | 体力: -{travel.staminaCost}
                      {' | '}
                      <span className="danger" style={{ color: danger.color }}>
                        危险度: {danger.text} ({(travel.danger * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="destination-info" style={{ marginTop: '0.2rem' }}>
                      消耗: 💧{travel.waterCost} 🍞{travel.foodCost} ⛽{travel.fuelCost}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {selectedCity && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(233, 69, 96, 0.1)', borderRadius: '8px' }}>
            <p style={{ marginBottom: '0.5rem', color: '#a0a0a0', fontSize: '0.85rem' }}>
              前往：<strong style={{ color: '#e94560' }}>{selectedCity.name}</strong>
            </p>
            <button
              className="btn btn-primary"
              onClick={onTravel}
              style={{ width: '100%' }}
            >
              🚀 出发！
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DestinationsPanel;
