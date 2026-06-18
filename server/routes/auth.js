const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度必须在3-20个字符之间' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6个字符' });
  }

  if (store.getUserByUsername(username)) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const user = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    role: 'user',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  if (store.addUser(user)) {
    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } else {
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = store.getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(user);
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt
    }
  });
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({ success: true, message: '已退出登录' });
});

router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      createdAt: req.user.createdAt
    }
  });
});

router.delete('/account', authMiddleware, (req, res) => {
  const username = req.user.username;
  
  if (store.deleteUser(username)) {
    res.json({ success: true, message: '账号已注销' });
  } else {
    res.status(500).json({ error: '注销失败，请稍后重试' });
  }
});

router.put('/password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '旧密码和新密码不能为空' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度不能少于6个字符' });
  }

  if (!bcrypt.compareSync(oldPassword, req.user.password)) {
    return res.status(401).json({ error: '旧密码错误' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  
  if (store.updateUser(req.user.username, { password: hashedPassword })) {
    res.json({ success: true, message: '密码修改成功' });
  } else {
    res.status(500).json({ error: '密码修改失败' });
  }
});

module.exports = router;
