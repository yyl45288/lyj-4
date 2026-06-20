import React from 'react';

const WEATHER_SEVERITY = {
  clear: { level: 0, label: '极好', color: '#2ecc71' },
  cloudy: { level: 1, label: '良好', color: '#3498db' },
  'light-rain': { level: 2, label: '一般', color: '#f1c40f' },
  fog: { level: 3, label: '较差', color: '#e67e22' },
  'heat-wave': { level: 3, label: '较差', color: '#e67e22' },
  'heavy-rain': { level: 4, label: '恶劣', color: '#d35400' },
  thunderstorm: { level: 4, label: '恶劣', color: '#c0392b' },
  sandstorm: { level: 5, label: '极危险', color: '#8e44ad' },
  'radiation-storm': { level: 5, label: '致命', color: '#e94560' }
};

function getWeatherMeta(id) {
  return WEATHER_SEVERITY[id] || { level: 1, label: '未知', color: '#95a5a6' };
}

function WeatherBadge({ weather, size = 'md' }) {
  if (!weather) return null;
  const meta = getWeatherMeta(weather.id);
  const fontClass = size === 'lg' ? '1.4rem' : size === 'sm' ? '0.95rem' : '1.15rem';
  return (
    <span
      className="weather-badge"
      title={`${weather.name}：${weather.description}`}
      style={{
        background: `linear-gradient(135deg, ${meta.color}22 0%, ${meta.color}44 100%)`,
        border: `1px solid ${meta.color}`,
        color: meta.color,
        fontSize: fontClass
      }}
    >
      {weather.icon} {weather.name}
    </span>
  );
}

function DestinationsPanel({
  connectedCities,
  currentCity,
  currentWeather,
  selectedDestination,
  onSelectDestination,
  onTravel,
  onRest,
  caravan
}) {
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ margin: 0 }}>{currentCity.name}</h2>
                <p style={{ marginTop: '0.3rem', color: '#a0a0a0' }}>{currentCity.description}</p>
              </div>
              {currentWeather && (
                <div style={{ textAlign: 'right' }}>
                  <WeatherBadge weather={currentWeather} size="lg" />
                  <div style={{ fontSize: '0.75rem', color: '#a0a0a0', marginTop: '0.3rem' }}>
                    速度×{currentWeather.travelSpeedMultiplier} · 
                    货损率 {(currentWeather.goodsDamageChance * 100).toFixed(0)}% · 
                    消耗×{currentWeather.staminaCostMultiplier?.toFixed?.(2) || '1.0'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="action-row">
          <button className="btn btn-success btn-sm" onClick={onRest}>
            🏨 休整 (30💰 + 🍞x2 + 💧x2)
          </button>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#a0a0a0' }}>
            消耗：30金币、干粮x2、净水x2 &nbsp;|&nbsp; 恢复：体力+60
          </div>
        </div>

        <h4 style={{ color: '#e94560', margin: '1.2rem 0 0.8rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🌍 可到达城市 ({connectedCities.length})</span>
          <span style={{ color: '#a0a0a0', fontSize: '0.8rem', fontWeight: 'normal', marginLeft: 'auto' }}>
            点击选择目的地
          </span>
        </h4>

        {connectedCities.length === 0 ? (
          <div className="empty-state">没有可到达的城市</div>
        ) : (
          <ul className="destinations-list weather-enhanced">
            {connectedCities.map(city => {
              const travel = city.travel;
              const weather = city.routeWeather || travel?.weather;
              const danger = dangerLabel(travel.danger);
              const isSelected = selectedDestination === city.id;
              const weatherMeta = weather ? getWeatherMeta(weather.id) : null;

              const baseDistance = travel.distance;
              const effectiveDistance = travel.effectiveDistance || baseDistance;
              const speedPenalty = effectiveDistance > baseDistance
                ? `慢 ${(((effectiveDistance / baseDistance) - 1) * 100).toFixed(0)}%`
                : effectiveDistance < baseDistance
                ? `快 ${((1 - effectiveDistance / baseDistance) * 100).toFixed(0)}%`
                : '正常';
              const speedColor = effectiveDistance > baseDistance * 1.3 ? '#e74c3c'
                : effectiveDistance > baseDistance ? '#f39c12' : '#2ecc71';

              return (
                <li
                  key={city.id}
                  className="destination-item"
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(233, 69, 96, 0.15)' : 'transparent',
                    border: isSelected ? '2px solid #e94560' : `2px solid ${weatherMeta ? `${weatherMeta.color}33` : 'transparent'}`,
                    borderRadius: '8px',
                    margin: '0.5rem 0',
                    transition: 'all 0.3s ease',
                    padding: '0.8rem 1rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => onSelectDestination(city.id)}
                >
                  {weatherMeta && weatherMeta.level >= 4 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        padding: '0.15rem 0.6rem',
                        background: weatherMeta.color,
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        borderBottomLeftRadius: '6px'
                      }}
                    >
                      ⚠ {weatherMeta.label}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: '700', color: isSelected ? '#e94560' : '#e8e8e8', fontSize: '1.05rem' }}>
                          → {city.name}
                        </span>
                        {weather && <WeatherBadge weather={weather} size="sm" />}
                      </div>

                      <div className="destination-info" style={{ marginBottom: '0.3rem' }}>
                        <span style={{
                          background: danger.color + '22',
                          color: danger.color,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          marginRight: '0.5rem'
                        }}>
                          危险{danger.text} {(travel.danger * 100).toFixed(0)}%
                        </span>
                        <span style={{
                          background: speedColor + '22',
                          color: speedColor,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          速度{speedPenalty}
                        </span>
                      </div>

                      <div className="destination-info" style={{ color: '#c0c0c0', fontSize: '0.9rem' }}>
                        距离: <strong style={{ color: '#e8e8e8' }}>{baseDistance}km</strong>
                        {effectiveDistance !== baseDistance && (
                          <span style={{ color: speedColor, marginLeft: '0.3rem' }}>
                            → 实际 {effectiveDistance}km
                          </span>
                        )}
                        <span style={{ margin: '0 0.5rem', color: '#555' }}>|</span>
                        体力: <span style={{ color: travel.staminaCost > 40 ? '#e74c3c' : '#2ecc71' }}>-{travel.staminaCost}</span>
                      </div>

                      <div className="destination-info" style={{ marginTop: '0.4rem', fontSize: '0.95rem', fontWeight: '500' }}>
                        <span style={{ color: '#3498db', marginRight: '0.8rem' }}>💧 {travel.waterCost}</span>
                        <span style={{ color: '#f39c12', marginRight: '0.8rem' }}>🍞 {travel.foodCost}</span>
                        <span style={{ color: '#e67e22' }}>⛽ {travel.fuelCost}</span>
                        {weather && weather.goodsDamageChance > 0.05 && (
                          <span style={{
                            marginLeft: '0.8rem',
                            color: weather.goodsDamageChance >= 0.2 ? '#e74c3c' : '#e67e22',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}>
                            📦 货损 {(weather.goodsDamageChance * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{ color: '#e94560', fontWeight: '700', fontSize: '1.5rem', alignSelf: 'center' }}>
                        ✓
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {selectedCity && (
          <div style={{
            marginTop: '1.2rem',
            padding: '1.2rem',
            background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.12) 0%, rgba(233, 69, 96, 0.2) 100%)',
            borderRadius: '10px',
            border: '1px solid #e94560'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p style={{ margin: 0, color: '#e8e8e8' }}>
                前往：<strong style={{ color: '#e94560', fontSize: '1.1rem' }}>{selectedCity.name}</strong>
              </p>
              {selectedCity.routeWeather && <WeatherBadge weather={selectedCity.routeWeather} size="md" />}
            </div>

            {selectedCity.routeWeather && selectedCity.routeWeather.description && (
              <p style={{
                fontSize: '0.85rem',
                color: '#c0c0c0',
                marginBottom: '0.8rem',
                padding: '0.5rem 0.8rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '6px'
              }}>
                💬 {selectedCity.routeWeather.description}
              </p>
            )}

            <button
              className="btn btn-primary"
              onClick={onTravel}
              style={{ width: '100%', padding: '0.8rem', fontSize: '1.05rem' }}
            >
              🚀 出发前往{selectedCity.name}！
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DestinationsPanel;
