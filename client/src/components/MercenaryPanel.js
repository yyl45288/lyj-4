import React from 'react';

function MercenaryPanel({ availableMercenaries = [], hiredMercenaries = [], caravan = { money: 0 }, onHire, onFire, message }) {
  const totalWage = hiredMercenaries.reduce((sum, m) => sum + m.wage, 0);
  const totalCombatPower = hiredMercenaries.reduce((sum, m) => sum + m.combatPower, 0);
  const totalRiskReduction = hiredMercenaries.reduce((sum, m) => sum + m.riskReduction, 0);
  const totalLossReduction = hiredMercenaries.reduce((sum, m) => sum + m.lossReduction, 0);

  return (
    <div className="panel mercenary-panel">
      <div className="panel-header">
        <h3>⚔️ 佣兵护卫</h3>
      </div>
      <div className="panel-body">
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}

        {hiredMercenaries.length > 0 && (
          <div className="mercenary-stats">
            <h4>已雇佣佣兵</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">数量</span>
                <span className="stat-value">{hiredMercenaries.length} 人</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">日薪总计</span>
                <span className="stat-value">{totalWage} 💰</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">战斗力</span>
                <span className="stat-value">{totalCombatPower}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">风险降低</span>
                <span className="stat-value">{Math.round(Math.min(totalRiskReduction, 0.7) * 100)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">损失降低</span>
                <span className="stat-value">{Math.round(Math.min(totalLossReduction, 0.6) * 100)}%</span>
              </div>
            </div>

            <ul className="mercenary-list">
              {hiredMercenaries.map(merc => (
                <li key={merc.id} className="mercenary-item">
                  <span className="mercenary-icon">{merc.icon}</span>
                  <div className="mercenary-info">
                    <div className="mercenary-name">{merc.name}</div>
                    <div className="mercenary-details">
                      日薪: {merc.wage}💰 | 战力: {merc.combatPower} | 
                      风险-{Math.round(merc.riskReduction * 100)}% | 
                      损失-{Math.round(merc.lossReduction * 100)}%
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => onFire(merc.id)}
                  >
                    解雇
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="available-mercenaries">
          <h4>可雇佣佣兵</h4>
          {availableMercenaries.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>本城镇无可雇佣的佣兵</p>
          ) : (
            <ul className="mercenary-list">
              {availableMercenaries.map(merc => {
                const canAfford = caravan.money >= merc.wage;
                const alreadyHired = hiredMercenaries.some(m => m.id === merc.id);

                return (
                  <li key={merc.id} className="mercenary-item">
                    <span className="mercenary-icon">{merc.icon}</span>
                    <div className="mercenary-info">
                      <div className="mercenary-name">{merc.name}</div>
                      <div className="mercenary-details">
                        日薪: {merc.wage}💰 | 战力: {merc.combatPower}
                      </div>
                      <div className="mercenary-details" style={{ fontSize: '0.75rem', color: '#666' }}>
                        风险降低: {Math.round(merc.riskReduction * 100)}% | 
                        损失降低: {Math.round(merc.lossReduction * 100)}%
                      </div>
                      <div className="mercenary-description" style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>
                        {merc.description}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onHire(merc.id)}
                      disabled={!canAfford || alreadyHired}
                    >
                      {alreadyHired ? '已雇佣' : '雇佣'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default MercenaryPanel;
