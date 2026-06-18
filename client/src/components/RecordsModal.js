import React, { useState, useEffect } from 'react';
import { api } from '../api';

function RecordsModal({ onClose, onLoadRecord }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await api.getRecords();
      setRecords(data.records);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, recordId) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这个游戏记录吗？')) return;
    try {
      await api.deleteRecord(recordId);
      setRecords(records.filter(r => r.id !== recordId));
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📜 游戏记录</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {loading ? (
          <div className="loading">加载中...</div>
        ) : records.length === 0 ? (
          <div className="no-records">
            <p>暂无游戏记录</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              开始新游戏后，游戏进度会自动保存
            </p>
          </div>
        ) : (
          <div className="records-list">
            {records.map(record => (
              <div
                key={record.id}
                className="record-card"
                onClick={() => onLoadRecord(record.id)}
              >
                <div className="record-card-header">
                  <span className="record-caravan-name">{record.caravanName}</span>
                  <button
                    className="delete-button"
                    onClick={(e) => handleDelete(e, record.id)}
                  >
                    删除
                  </button>
                </div>
                <div className="record-stats">
                  <span>领袖: <strong>{record.leaderName}</strong></span>
                  <span>金币: <strong>{record.money?.toLocaleString()}</strong></span>
                  <span>旅行次数: <strong>{record.travelCount}</strong></span>
                  <span>城市: <strong>{record.currentCity}</strong></span>
                </div>
                <div className="record-date">
                  更新于: {formatDate(record.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecordsModal;
