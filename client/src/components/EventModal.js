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
  const hasChoices = event.hasChoices && event.choices && event.choices.length > 0;

  const isChoiceDisabled = (choice) => {
    if (!choice.requirements) return false;
    
    if (choice.requirements.minMoney && caravan.money < choice.requirements.minMoney) {
      return true;
    }
    if (choice.requirements.minReputation && caravan.reputation < choice.requirements.minReputation) {
      return true;
    }
    
    return false;
  };

  const getDisabledReason = (choice) => {
    if (!choice.requirements) return '';
    if (choice.requirements.minMoney && caravan.money < choice.requirements.minMoney) {
      return `需要 ${choice.requirements.minMoney} 金币`;
    }
    if (choice.requirements.minReputation && caravan.reputation < choice.requirements.minReputation) {
      return `需要 ${choice.requirements.minReputation} 声望`;
    }
    return '';
  };

  const renderChoiceButtons = () => {
    if (hasChoices) {
      return (
        <div className="event-choices">
          {event.choices.map(choice => {
            const disabled = isChoiceDisabled(choice);
            const reason = getDisabledReason(choice);
            
            return (
              <div key={choice.id} className="event-choice-item">
                <button
                  className={`btn btn-choice ${choice.id === 'fight' ? 'btn-danger' : choice.id === 'pay' ? 'btn-warning' : 'btn-secondary'}`}
                  onClick={() => onResolve(choice.id)}
                  disabled={disabled}
                >
                  {choice.label}
                </button>
                {disabled && reason && (
                  <span className="choice-disabled-reason">{reason}</span>
                )}
                {choice.description && (
                  <p className="choice-description">{choice.description}</p>
                )}
              </div>
            );
          })}
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
            <h4>结果:</h4>
            <ul>
              {eventResult.map((msg, idx) => (
                <li key={idx}>• {msg}</li>
              ))}
            </ul>
          </div>
        )}

        {hasChoices && !eventResult ? (
          <div className="event-choices-section">
            <h4 style={{ marginBottom: '0.75rem' }}>你的选择:</h4>
            {renderChoiceButtons()}
          </div>
        ) : (
          renderChoiceButtons()
        )}
      </div>
    </div>
  );
}

export default EventModal;
