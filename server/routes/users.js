const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
};

router.get('/', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

  try {
    const users = db.prepare(`
      SELECT id, username, name, role, avatar, total_points, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.user.role === 'admin' ? id : req.user.id;

  try {
    const user = db.prepare(`
      SELECT id, username, name, role, avatar, total_points, created_at
      FROM users
      WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { name, avatar } = req.body;

  if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
    return res.status(403).json({ error: '无权限' });
  }

  try {
    db.prepare('UPDATE users SET name = ?, avatar = ? WHERE id = ?').run(name, avatar, id);
    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

router.delete('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

  const { id } = req.params;

  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ message: '用户已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除用户失败' });
  }
});

router.get('/:id/point-history', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.user.role === 'admin' ? id : req.user.id;
  const { limit = 50, offset = 0 } = req.query;

  try {
    const history = db.prepare(`
      SELECT * FROM point_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(limit), parseInt(offset));

    const total = db.prepare('SELECT COUNT(*) as count FROM point_history WHERE user_id = ?').get(userId);

    res.json({ history, total: total.count });
  } catch (error) {
    res.status(500).json({ error: '获取积分历史失败' });
  }
});

router.get('/:id/achievements', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.user.role === 'admin' ? id : req.user.id;

  try {
    const unlocked = db.prepare(`
      SELECT a.*, ua.unlocked_at
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC
    `).all(userId);

    const all = db.prepare('SELECT * FROM achievements ORDER BY created_at').all();

    res.json({ unlocked, all });
  } catch (error) {
    res.status(500).json({ error: '获取成就失败' });
  }
});

router.post('/:id/adjust-points', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

  const { id } = req.params;
  const { points, description } = req.body;

  try {
    db.prepare('BEGIN TRANSACTION').run();

    db.prepare('UPDATE users SET total_points = total_points + ? WHERE id = ?').run(points, id);

    db.prepare(`
      INSERT INTO point_history (user_id, points, type, description)
      VALUES (?, ?, 'adjust', ?)
    `).run(id, points, description || '管理员调整积分');

    db.prepare('COMMIT').run();

    res.json({ message: '积分调整成功' });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: '积分调整失败' });
  }
});

module.exports = router;
