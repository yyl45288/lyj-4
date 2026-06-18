const jwt = require('jsonwebtoken');
const store = require('../data/store');

const JWT_SECRET = process.env.JWT_SECRET || 'wasteland-caravan-secret-key-2024';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }

  const user = store.getUserByUsername(decoded.username);
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }

  req.user = user;
  next();
}

function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  adminMiddleware,
  JWT_SECRET,
  ADMIN_USERNAME
};
