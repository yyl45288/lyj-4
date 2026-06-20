import React, { useState } from 'react';

const DIFFICULTY_STARS = (d) => {
  const max = 5;
  const stars = Math.min(d, max);
  return '★'.repeat(stars) + '☆'.repeat(max - stars);
};

const STAGE_LABELS = {
  accepted: '待出发',
  goods_picked: '已提货',
  in_transit: '运输中',
  delivered: '待交付',
  escorting: '护送中',
  arrived: '已到达',
  traveling_to_source: '前往采购地',
  procured: '已采购',
  returning: '返回中',
  smuggling_transit: '走私运输中'
};

const TYPE_LABELS = {
  delivery: { icon: '📦', name: '货物运送', color: '#3498db' },
  escort: { icon: '🛡️', name: '护卫任务', color: '#9b59b6' },
  procurement: { icon: '🛒', name: '物资采购', color: '#f39c12' },
  smuggling: { icon: '🏴‍☠️', name: '走私任务', color: '#2c3e50' },
  rescue: { icon: '🚨', name: '救援物资', color: '#e74c3c' }
};

const FAILURE_LABELS = {
  timeout: '超时',
  goods_lost: '货物丢失',
  wrong_route: '偏离路线',
  caught: '被查获'
};

function TimeRemaining({ deadline }) {
  const [, setTick] = useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  if (!deadline) return null;
  const ms = deadline - Date.now();
  if (ms <= 0) return <span style={{ color: '#e74c3c', fontWeight: '600' }}>已过期</span>;
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  const secs = Math.floor((ms % 60000) / 1000);
  const color = ms < 300000 ? '#e74c3c' : ms < 600000 ? '#f39c12' : '#2ecc71';
  return (
    <span style={{ color, fontWeight: '600', fontFamily: 'monospace' }}>
      {hours > 0 ? `${hours}h ` : ''}{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

function QuestsPanel({
  availableQuests = [],
  acceptedQuests = [],
  allGoods = [],
  currentCityId,
  onAccept,
  onAbandon,
  onRefresh,
  onComplete,
  loading = false
}) {
  const [activeTab, setActiveTab] = useState('available');

  const typeMeta = (t) => TYPE_LABELS[t] || { icon: '📜', name: t, color: '#95a5a6' };
  const goodName = (id) => allGoods.find(g => g.id === id)?.name || id;

  const renderQuestCard = (q, actions = null) => {
    const meta = typeMeta(q.templateId || q.type);
    const isUrgent = q.deadline && (q.deadline - Date.now() < 600000);
    return (
      <div
        key={q.id}
        className="quest-card"
        style={{
          borderLeft: `4px solid ${meta.color}`,
          opacity: q.status === 'failed' ? 0.6 : 1,
          filter: q.status === 'expired' ? 'grayscale(0.6)' : 'none'
        }}
      >
        <div className="quest-header">
          <div>
            <span style={{ fontSize: '1.1rem', marginRight: '0.4rem' }}>{meta.icon}</span>
            <strong style={{ color: isUrgent ? '#e74c3c' : '#e8e8e8' }}>{q.title}</strong>
          </div>
          <div className="quest-difficulty" title={`难度 ${q.difficulty}/5`}>
            <span style={{ color: '#f1c40f' }}>{DIFFICULTY_STARS(q.difficulty)}</span>
          </div>
        </div>
        <div className="quest-subheader">
          <span className="quest-tag" style={{ background: meta.color, color: '#fff' }}>
            {meta.name}
          </span>
          {q.status === 'accepted' && (
            <span className="quest-tag quest-status-accepted">
              进行中 · {STAGE_LABELS[q.currentStage] || q.currentStage}
            </span>
          )}
          {q.status === 'completed' && (
            <span className="quest-tag quest-status-completed">✓ 已完成</span>
          )}
          {q.status === 'failed' && (
            <span className="quest-tag quest-status-failed">
              ✗ 失败：{FAILURE_LABELS[q.failureReason] || q.failureReason || '未知'}
            </span>
          )}
          {q.status === 'expired' && (
            <span className="quest-tag quest-status-expired">⌛ 已过期</span>
          )}
          {q.timeLimitMinutes && q.status === 'available' && (
            <span className="quest-tag quest-tag-time">⏱ {q.timeLimitMinutes}分钟</span>
          )}
        </div>
        <p className="quest-description">{q.description}</p>

        {q.requiredGoods && Object.keys(q.requiredGoods).length > 0 && (
          <div className="quest-required-goods">
            <span style={{ color: '#a0a0a0', fontSize: '0.85rem' }}>所需货物：</span>
            {Object.entries(q.requiredGoods).map(([gid, amt]) => (
              <span key={gid} className="quest-good-tag">
                {goodName(gid)} × {amt}
              </span>
            ))}
          </div>
        )}

        <div className="quest-rewards">
          <div className="quest-reward-item">
            <span className="quest-reward-label">奖励</span>
            <span className="quest-reward-value positive">💰 {q.reward?.money?.toLocaleString() || 0}</span>
            <span className="quest-reward-value" style={{ color: '#f1c40f' }}>⭐ {q.reward?.reputation || 0}</span>
          </div>
          <div className="quest-reward-item">
            <span className="quest-reward-label">失败惩罚</span>
            <span className="quest-reward-value negative">-💰 {q.penalty?.money?.toLocaleString() || 0}</span>
            <span className="quest-reward-value" style={{ color: '#e67e22' }}>-⭐ {q.penalty?.reputation || 0}</span>
          </div>
        </div>

        {q.failureConditions && q.failureConditions.length > 0 && (
          <div className="quest-fail-cond">
            <span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>
              失败条件：{q.failureConditions.map(f => FAILURE_LABELS[f] || f).join(' / ')}
            </span>
          </div>
        )}

        {q.status === 'accepted' && q.deadline && (
          <div className="quest-deadline">
            <span style={{ color: '#a0a0a0', fontSize: '0.85rem' }}>剩余时间：</span>
            <TimeRemaining deadline={q.deadline} />
          </div>
        )}

        {actions}
      </div>
    );
  };

  return (
    <div className="panel quest-panel">
      <div className="panel-header">
        <h3>📜 委托任务</h3>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={loading}
          title="刷新当前城市可用任务"
        >
          🔄 刷新
        </button>
      </div>

      <div className="quest-tabs">
        <button
          className={`quest-tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          可接任务 <span className="quest-count">{availableQuests.length}</span>
        </button>
        <button
          className={`quest-tab ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          已接任务 <span className="quest-count accepted-count">{acceptedQuests.length}/3</span>
        </button>
      </div>

      <div className="panel-body quest-body">
        {activeTab === 'available' && (
          <>
            {availableQuests.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
                当前城市暂无可接委托，点击刷新看看？
              </div>
            ) : (
              availableQuests.map(q => renderQuestCard(q, (
                <div style={{ marginTop: '0.8rem' }}>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => onAccept(q.id)}
                    disabled={loading || acceptedQuests.length >= 3}
                  >
                    {acceptedQuests.length >= 3 ? '已达接取上限 (3)' : '📝 接取委托'}
                  </button>
                </div>
              )))
            )}
          </>
        )}

        {activeTab === 'accepted' && (
          <>
            {acceptedQuests.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📋</div>
                还没有接取任何任务，去「可接任务」里看看吧！
              </div>
            ) : (
              acceptedQuests.map(q => {
                const canComplete = q.status === 'accepted' &&
                  q.toCityId === currentCityId &&
                  (!q.returnCityId || q.currentStage === 'returning' || q.currentStage === 'delivered');
                return renderQuestCard(q, (
                  <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem' }}>
                    {canComplete && (
                      <button
                        className="btn btn-success"
                        style={{ flex: 1 }}
                        onClick={() => onComplete(q.id)}
                        disabled={loading}
                      >
                        ✅ 交付
                      </button>
                    )}
                    <button
                      className="btn btn-danger"
                      style={{ flex: canComplete ? '0 0 auto' : 1 }}
                      onClick={() => {
                        if (window.confirm(`确定放弃「${q.title}」？\n将扣除惩罚：${q.penalty?.money || 0}金币、${q.penalty?.reputation || 0}声望`)) {
                          onAbandon(q.id);
                        }
                      }}
                      disabled={loading}
                    >
                      ✗ 放弃
                    </button>
                  </div>
                ));
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default QuestsPanel;
