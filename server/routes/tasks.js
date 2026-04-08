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
    const tasks = db.prepare(`
      SELECT t.*, 
        COUNT(ut.id) as total_accepted,
        SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) as total_completed
      FROM tasks t
      LEFT JOIN user_tasks ut ON t.id = ut.task_id
      WHERE t.is_active = 1
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `).all();

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: '获取任务列表失败' });
  }
});

router.post('/', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

  const { title, description, type, points, time_limit, extra_bonus, icon } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO tasks (title, description, type, points, time_limit, extra_bonus, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, type, points, time_limit, extra_bonus || 0, icon);

    res.status(201).json({ message: '任务创建成功', taskId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: '创建任务失败' });
  }
});

router.put('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

  const { id } = req.params;
  const { title, description, type, points, time_limit, extra_bonus, icon, is_active } = req.body;

  try {
    db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, type = ?, points = ?, 
          time_limit = ?, extra_bonus = ?, icon = ?, is_active = ?
      WHERE id = ?
    `).run(title, description, type, points, time_limit, extra_bonus, icon, is_active, id);

    res.json({ message: '任务更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新任务失败' });
  }
});

router.delete('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

  const { id } = req.params;

  try {
    db.prepare('UPDATE tasks SET is_active = 0 WHERE id = ?').run(id);
    res.json({ message: '任务已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除任务失败' });
  }
});

router.post('/:id/accept', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND is_active = 1').get(id);

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const existingTask = db.prepare(`
      SELECT * FROM user_tasks 
      WHERE user_id = ? AND task_id = ? AND status IN ('pending', 'in_progress')
    `).get(userId);

    if (existingTask) {
      return res.status(400).json({ error: '已经接取了此任务' });
    }

    const result = db.prepare(`
      INSERT INTO user_tasks (user_id, task_id, status, accepted_at)
      VALUES (?, ?, 'pending', datetime('now'))
    `).run(userId, id);

    res.status(201).json({ message: '任务接取成功', userTaskId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: '接取任务失败' });
  }
});

router.post('/user-tasks/:id/complete', authenticate, (req, res) => {
  const { id } = req.params;
  const { proof, notes } = req.body;
  const userId = req.user.id;

  try {
    const userTask = db.prepare(`
      SELECT ut.*, t.points, t.extra_bonus
      FROM user_tasks ut
      JOIN tasks t ON ut.task_id = t.id
      WHERE ut.id = ? AND ut.user_id = ? AND ut.status IN ('pending', 'in_progress')
    `).get(id, userId);

    if (!userTask) {
      return res.status(404).json({ error: '任务不存在或已完成' });
    }

    const totalPoints = userTask.points + (userTask.extra_bonus || 0);

    db.prepare('BEGIN TRANSACTION').run();

    db.prepare(`
      UPDATE user_tasks 
      SET status = 'completed', completed_at = datetime('now'), 
          points_earned = ?, bonus_earned = ?, proof = ?, notes = ?
      WHERE id = ?
    `).run(userTask.points, userTask.extra_bonus, proof, notes, id);

    db.prepare(`
      UPDATE users SET total_points = total_points + ? WHERE id = ?
    `).run(totalPoints, userId);

    db.prepare(`
      INSERT INTO point_history (user_id, points, type, description, related_id)
      VALUES (?, ?, 'earn', '完成任务: ' || (SELECT title FROM tasks WHERE id = ?), ?)
    `).run(userId, totalPoints, userTask.task_id, id);

    db.prepare('COMMIT').run();

    res.json({ 
      message: '任务完成', 
      pointsEarned: totalPoints,
      bonus: userTask.extra_bonus 
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: '完成任务失败' });
  }
});

router.get('/my-tasks', authenticate, (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  try {
    let query = `
      SELECT ut.*, t.title, t.description, t.type, t.icon, t.time_limit
      FROM user_tasks ut
      JOIN tasks t ON ut.task_id = t.id
      WHERE ut.user_id = ?
    `;

    const params = [userId];

    if (status) {
      query += ' AND ut.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ut.accepted_at DESC';

    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: '获取我的任务失败' });
  }
});

router.get('/statistics', authenticate, (req, res) => {
  const userId = req.user.id;

  try {
    const totalCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM user_tasks 
      WHERE user_id = ? AND status = 'completed'
    `).get(userId);

    const todayCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM user_tasks 
      WHERE user_id = ? AND status = 'completed' 
      AND date(completed_at) = date('now')
    `).get(userId);

    const weeklyStats = db.prepare(`
      SELECT 
        date(completed_at) as date,
        COUNT(*) as count,
        SUM(points_earned + bonus_earned) as points
      FROM user_tasks
      WHERE user_id = ? AND status = 'completed'
      AND completed_at >= date('now', '-7 days')
      GROUP BY date(completed_at)
      ORDER BY date DESC
    `).all(userId);

    const taskTypeStats = db.prepare(`
      SELECT t.type, COUNT(*) as count, SUM(ut.points_earned + ut.bonus_earned) as points
      FROM user_tasks ut
      JOIN tasks t ON ut.task_id = t.id
      WHERE ut.user_id = ? AND ut.status = 'completed'
      GROUP BY t.type
    `).all(userId);

    res.json({
      totalCompleted: totalCompleted.count,
      todayCompleted: todayCompleted.count,
      weeklyStats,
      taskTypeStats
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计失败' });
  }
});

module.exports = router;
