import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function MoneyChart({ moneyHistory }) {
  if (!moneyHistory || moneyHistory.length < 2) {
    return (
      <div className="money-chart-container">
        <h4 style={{ color: '#e94560', marginBottom: '0.5rem', fontSize: '0.95rem' }}>📈 资金曲线</h4>
        <div className="empty-state" style={{ padding: '1rem' }}>进行更多交易后显示曲线</div>
      </div>
    );
  }

  return (
    <div className="money-chart-container">
      <h4 style={{ color: '#e94560', marginBottom: '0.5rem', fontSize: '0.95rem' }}>📈 资金曲线</h4>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={moneyHistory} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a506b" opacity={0.3} />
          <XAxis
            dataKey="time"
            stroke="#a0a0a0"
            tick={{ fill: '#a0a0a0', fontSize: 10 }}
            label={{ value: '交易次数', position: 'insideBottom', offset: -5, fill: '#a0a0a0', fontSize: 10 }}
          />
          <YAxis
            stroke="#a0a0a0"
            tick={{ fill: '#a0a0a0', fontSize: 10 }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #e94560',
              borderRadius: '6px',
              color: '#e8e8e8'
            }}
            labelStyle={{ color: '#e94560' }}
            formatter={(value) => [`${value} 金币`, '资金']}
          />
          <Line
            type="monotone"
            dataKey="money"
            stroke="#2ecc71"
            strokeWidth={2}
            dot={{ fill: '#e94560', r: 3 }}
            activeDot={{ r: 5, fill: '#ff6b6b' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MoneyChart;
