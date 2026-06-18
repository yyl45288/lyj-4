import React from 'react';

function GameMap({ cities, connections, currentCityId, connectedCities, onCityClick, selectedDestination }) {
  const connectedCityIds = new Set(connectedCities.map(c => c.id));
  const mapWidth = 800;
  const mapHeight = 500;

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>🗺️ 废土地图</h3>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        <div className="map-container">
          <svg className="map-svg" viewBox={`0 0 ${mapWidth} ${mapHeight}`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="#0f3460" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect width={mapWidth} height={mapHeight} fill="url(#bgGradient)" />
            
            <g opacity="0.1">
              {[...Array(50)].map((_, i) => (
                <circle
                  key={i}
                  cx={Math.random() * mapWidth}
                  cy={Math.random() * mapHeight}
                  r={Math.random() * 2 + 1}
                  fill="#e8e8e8"
                />
              ))}
            </g>

            {connections.map((conn, idx) => {
              const fromCity = cities.find(c => c.id === conn.from);
              const toCity = cities.find(c => c.id === conn.to);
              if (!fromCity || !toCity) return null;
              
              const isActive = 
                (conn.from === currentCityId && connectedCityIds.has(conn.to)) ||
                (conn.to === currentCityId && connectedCityIds.has(conn.from));
              const isSelected = selectedDestination && 
                ((conn.from === currentCityId && conn.to === selectedDestination) ||
                 (conn.to === currentCityId && conn.from === selectedDestination));

              return (
                <line
                  key={idx}
                  x1={fromCity.x}
                  y1={fromCity.y}
                  x2={toCity.x}
                  y2={toCity.y}
                  className={`route-line ${isActive || isSelected ? 'active' : ''}`}
                  strokeWidth={isSelected ? 4 : 2}
                />
              );
            })}

            {cities.map(city => {
              const isCurrent = city.id === currentCityId;
              const isConnected = connectedCityIds.has(city.id);
              const isSelected = city.id === selectedDestination;
              const nodeClass = `city-node ${isCurrent ? 'current' : ''} ${isConnected ? 'connected' : ''}`;

              return (
                <g
                  key={city.id}
                  className={nodeClass}
                  onClick={() => isConnected && onCityClick(city)}
                  style={{ cursor: isConnected ? 'pointer' : 'default' }}
                >
                  {isCurrent && (
                    <circle
                      cx={city.x}
                      cy={city.y}
                      r={30}
                      fill="none"
                      stroke="#e94560"
                      strokeWidth={2}
                      opacity={0.5}
                    >
                      <animate
                        attributeName="r"
                        values="25;35;25"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0.2;0.6"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  {isSelected && (
                    <circle
                      cx={city.x}
                      cy={city.y}
                      r={25}
                      fill="none"
                      stroke="#27ae60"
                      strokeWidth={3}
                      strokeDasharray="5,5"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`0 ${city.x} ${city.y}`}
                        to={`360 ${city.x} ${city.y}`}
                        dur="4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={15}
                    fill={isCurrent ? '#e94560' : isConnected ? '#27ae60' : '#3a506b'}
                    stroke={isCurrent ? '#ff6b6b' : '#1a1a2e'}
                    strokeWidth={2}
                  />
                  <text
                    x={city.x}
                    y={city.y + 5}
                    fontSize={10}
                    fill={isCurrent || isConnected ? '#fff' : '#a0a0a0'}
                    fontWeight="bold"
                  >
                    {city.name.charAt(0)}
                  </text>
                  <text
                    x={city.x}
                    y={city.y + 35}
                    fontSize={12}
                    fill={isCurrent ? '#e94560' : isConnected ? '#2ecc71' : '#a0a0a0'}
                    fontWeight={isCurrent ? 'bold' : 'normal'}
                  >
                    {city.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ padding: '1rem', fontSize: '0.8rem', color: '#a0a0a0', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#e94560', marginRight: '0.3rem', verticalAlign: 'middle' }}></span>当前位置</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#27ae60', marginRight: '0.3rem', verticalAlign: 'middle' }}></span>可到达</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#3a506b', marginRight: '0.3rem', verticalAlign: 'middle' }}></span>需中转</span>
        </div>
      </div>
    </div>
  );
}

export default GameMap;
