import React from 'react';

function EventModal({ event, eventResult, onResolve, caravan }) {
  if (!event) return null;

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'danger': return { label: '⚠️ 危险事件', className: 'danger' };
      case 'good': return { label: '✨ 幸运事件', className: 'good' };
      case 'neutral': return { label: '⚖️ 中立事件', className: 'neutral' };
      default: return { label: '📢 事件', className: '' };
    }
  };

  const typeInfo = getEventTypeLabel(event.type);
  const requiresChoice = event.needsResolution || event.id === 'friendly-travelers' || event.id === 'merchant';

  const renderChoiceButtons = () => {
    if (event.id === 'friendly-travelers') {
      return (
        <div className="event-actions">
          <button className="btn btn-success" onClick={() => onResolve('accept')}>
            🤝 接受帮助
          </button>
          <button className="btn btn-secondary" onClick={() => onResolve('decline')}>
            👋 礼貌谢绝
          </button>
        </div>
      );
    }

    if (event.id === 'merchant') {
      return (
        <div className="event-actions">
          <button
            className="btn btn-warning"
            onClick={() => onResolve('trade')}
            disabled={caravan.money < 300}
          >
            💰 交易 (300金币)
          </button>
          <button className="btn btn-secondary" onClick={() => onResolve('decline')}>
            ❌ 拒绝
          </button>
        </div>
      );
    }

    if (event.id === 'hidden-cache' || event.id === 'water-source') {
      return (
        <div className="event-actions">
          <button className="btn btn-success" onClick={() => onResolve('take')}>
            ✅ 继续前进
          </button>
        </div>
      );
    }

    return (
      <div className="event-actions">
        <button className="btn btn-primary" onClick={() => onResolve('continue')}>
          继续旅程
        </button>
      </div>
    );
  };

  return (
    <div className="event-modal-overlay">
      <div className="event-modal">
        <div style={{ textAlign: 'center' }}>
          <span className={`event-type ${typeInfo.className}`}>{typeInfo.label}</span>
        </div>
        <h2>{event.name}</h2>
        <p className="event-description">{event.description}</p>

        {eventResult && eventResult.length > 0 && (
          <div className="event-results">
            <ul>
              {eventResult.map((msg, idx) => (
                <li key={idx}>• {msg}</li>
              ))}
            </ul>
          </div>
        )}

        {event.id === 'merchant' && (
          <div style={{ textAlign: 'center', color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '1rem' }}>
            神秘商人提供一笔特殊交易（300金币购买5单位稀有物资）
          </div>
        )}

        {requiresChoice ? renderChoiceButtons() : (
          <div className="event-actions">
            <button className="btn btn-primary" onClick={() => onResolve('continue')}>
              继续旅程
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventModal;
