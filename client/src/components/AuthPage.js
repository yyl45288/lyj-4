import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin && password !== confirmPassword) {
        throw new Error('两次输入的密码不一致');
      }

      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>{isLogin ? '登录' : '注册'}</h2>
        <p className="auth-subtitle">
          {isLogin ? '登录以保存你的游戏进度' : '创建账号开始你的废土之旅'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={loading}
              minLength={3}
              maxLength={20}
              required
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={loading}
              minLength={6}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                disabled={loading}
                minLength={6}
                required
              />
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div className="auth-switch">
          <span>{isLogin ? '还没有账号？' : '已有账号？'}</span>
          <button
            type="button"
            className="switch-button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setConfirmPassword('');
            }}
            disabled={loading}
          >
            {isLogin ? '立即注册' : '去登录'}
          </button>
        </div>

        <div className="auth-hint">
          <p>💡 默认管理员账号: admin / admin123</p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
