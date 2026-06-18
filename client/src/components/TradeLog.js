import React from 'react';

function TradeLog({ tradeHistory }) {
  if (!tradeHistory || tradeHistory.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h3>📜 交易日志</h3>
        </div>
        <div className="panel-body">
          <div className="empty-state">暂无交易记录</div>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'buy': return { label: '买入', className: 'buy' };
      case 'sell': return { label: '卖出', className: 'sell' };
      case 'event': return { label: '事件', className: 'event' };
      default: return { label: '其他', className: '' };
    }
  };

  const reversedHistory = [...tradeHistory].reverse();

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>📜 交易日志</h3>
      </div>
      <div className="panel-body" style={{ maxHeight: '300px' }}>
        <ul className="trade-log-list">
          {reversedHistory.map((log) => {
            const typeInfo = getTypeLabel(log.type);
            return (
              <li key={log.id} className="trade-log-item">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`trade-log-type ${typeInfo.className}`}>{typeInfo.label}</span>
                  <span className="trade-log-meta">{log.cityName} | {formatTime(log.time)}</span>
                </div>
                {log.type === 'event' ? (
                  <div>
                    <div className="trade-log-text" style={{ color: '#f39c12' }}>
                      【{log.eventName}】
                    </div>
                    {log.messages && log.messages.map((msg, idx) => (
                      <div key={idx} className="trade-log-text" style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>
                        • {msg}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="trade-log-text">
                    {log.goodName} × {log.amount}
                    {' | '}
                    {log.type === 'buy' ? '花费' : '获得'} {log.totalPrice} 金币
                    {' '}
                    <span style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>
                      (单价 {log.unitPrice})
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default TradeLog;
