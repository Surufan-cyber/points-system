const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isValid = bcrypt.compareSync(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        total_points: user.total_points
      }
    });
  } catch (error) {
    res.status(500).json({ error: '登录失败' });
  }
});

router.post('/register', (req, res) => {
  const { username, password, name, role = 'child' } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: '用户名至少需要3个字符' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少需要6个字符' });
  }

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users (username, password, name, role)
      VALUES (?, ?, ?, ?)
    `).run(username, hashedPassword, name, role);

    res.status(201).json({ 
      message: '注册成功', 
      userId: result.lastInsertRowid,
      user: {
        id: result.lastInsertRowid,
        username,
        name,
        role
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败: ' + error.message });
  }
});

router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, name, role, avatar, total_points FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

module.exports = router;
