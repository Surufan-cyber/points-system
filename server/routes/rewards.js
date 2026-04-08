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
  try {
    const rewards = db.prepare(`
      SELECT r.*,
        COUNT(rr.id) as total_redemptions
      FROM rewards r
      LEFT JOIN reward_redemptions rr ON r.id = rr.reward_id
      WHERE r.is_active = 1
      GROUP BY r.id
      ORDER BY r.points_required ASC
    `).all();

    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: '获取奖励列表失败' });
  }
});

router.post('/', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

  const { title, description, points_required, category, icon, stock } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO rewards (title, description, points_required, category, icon, stock)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, description, points_required, category, icon, stock || -1);

    res.status(201).json({ message: '奖励创建成功', rewardId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: '创建奖励失败' });
  }
});

router.put('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

  const { id } = req.params;
  const { title, description, points_required, category, icon, stock, is_active } = req.body;

  try {
    db.prepare(`
      UPDATE rewards 
      SET title = ?, description = ?, points_required = ?, 
          category = ?, icon = ?, stock = ?, is_active = ?
      WHERE id = ?
    `).run(title, description, points_required, category, icon, stock, is_active, id);

    res.json({ message: '奖励更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新奖励失败' });
  }
});

router.delete('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

  const { id } = req.params;

  try {
    db.prepare('UPDATE rewards SET is_active = 0 WHERE id = ?').run(id);
    res.json({ message: '奖励已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除奖励失败' });
  }
});

router.post('/:id/redeem', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const reward = db.prepare('SELECT * FROM rewards WHERE id = ? AND is_active = 1').get(id);

    if (!reward) {
      return res.status(404).json({ error: '奖励不存在' });
    }

    if (reward.stock !== -1 && reward.stock <= 0) {
      return res.status(400).json({ error: '奖励库存不足' });
    }

    const user = db.prepare('SELECT total_points FROM users WHERE id = ?').get(userId);

    if (user.total_points < reward.points_required) {
      return res.status(400).json({ error: '积分不足' });
    }

    db.prepare('BEGIN TRANSACTION').run();

    db.prepare('UPDATE users SET total_points = total_points - ? WHERE id = ?').run(reward.points_required, userId);

    if (reward.stock !== -1) {
      db.prepare('UPDATE rewards SET stock = stock - 1 WHERE id = ?').run(id);
    }

    const result = db.prepare(`
      INSERT INTO reward_redemptions (user_id, reward_id, status, points_spent)
      VALUES (?, ?, 'pending', ?)
    `).run(userId, id, reward.points_required);

    db.prepare(`
      INSERT INTO point_history (user_id, points, type, description, related_id)
      VALUES (?, ?, 'spend', '兑换奖励: ' || ?, ?)
    `).run(userId, -reward.points_required, reward.title, result.lastInsertRowid);

    db.prepare('COMMIT').run();

    res.json({ 
      message: '兑换成功', 
      pointsSpent: reward.points_required,
      redemptionId: result.lastInsertRowid 
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: '兑换失败' });
  }
});

router.get('/my-redemptions', authenticate, (req, res) => {
  const userId = req.user.id;

  try {
    const redemptions = db.prepare(`
      SELECT rr.*, r.title, r.description, r.icon, r.category
      FROM reward_redemptions rr
      JOIN rewards r ON rr.reward_id = r.id
      WHERE rr.user_id = ?
      ORDER BY rr.redeemed_at DESC
    `).all(userId);

    res.json(redemptions);
  } catch (error) {
    res.status(500).json({ error: '获取兑换记录失败' });
  }
});

router.get('/redemptions', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

  try {
    const redemptions = db.prepare(`
      SELECT rr.*, r.title, r.icon, u.name as user_name, u.username
      FROM reward_redemptions rr
      JOIN rewards r ON rr.reward_id = r.id
      JOIN users u ON rr.user_id = u.id
      ORDER BY rr.redeemed_at DESC
    `).all();

    res.json(redemptions);
  } catch (error) {
    res.status(500).json({ error: '获取兑换记录失败' });
  }
});

router.post('/redemptions/:id/fulfill', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

  const { id } = req.params;
  const { notes } = req.body;

  try {
    db.prepare(`
      UPDATE reward_redemptions 
      SET status = 'fulfilled', fulfilled_at = datetime('now'), notes = ?
      WHERE id = ?
    `).run(notes, id);

    res.json({ message: '已标记为完成' });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

module.exports = router;
