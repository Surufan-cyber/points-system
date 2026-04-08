const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');
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

router.get('/excel', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }

  try {
    const users = db.prepare('SELECT id, username, name, role, total_points, created_at FROM users').all();
    
    const tasks = db.prepare(`
      SELECT ut.*, u.name as user_name, t.title, t.type
      FROM user_tasks ut
      JOIN users u ON ut.user_id = u.id
      JOIN tasks t ON ut.task_id = t.id
      ORDER BY ut.accepted_at DESC
    `).all();

    const rewards = db.prepare(`
      SELECT rr.*, u.name as user_name, r.title as reward_title
      FROM reward_redemptions rr
      JOIN users u ON rr.user_id = u.id
      JOIN rewards r ON rr.reward_id = r.id
      ORDER BY rr.redeemed_at DESC
    `).all();

    const workbook = XLSX.utils.book_new();

    const usersSheet = XLSX.utils.json_to_sheet(users.map(u => ({
      '用户名': u.username,
      '姓名': u.name,
      '角色': u.role === 'admin' ? '管理员' : '孩子',
      '总积分': u.total_points,
      '创建时间': u.created_at
    })));
    XLSX.utils.book_append_sheet(workbook, usersSheet, '用户列表');

    const tasksSheet = XLSX.utils.json_to_sheet(tasks.map(t => ({
      '用户': t.user_name,
      '任务': t.title,
      '类型': t.type,
      '状态': t.status === 'completed' ? '已完成' : t.status === 'in_progress' ? '进行中' : '待完成',
      '获得积分': t.points_earned || 0,
      '额外奖励': t.bonus_earned || 0,
      '接取时间': t.accepted_at,
      '完成时间': t.completed_at
    })));
    XLSX.utils.book_append_sheet(workbook, tasksSheet, '任务记录');

    const rewardsSheet = XLSX.utils.json_to_sheet(rewards.map(r => ({
      '用户': r.user_name,
      '奖励': r.reward_title,
      '消耗积分': r.points_spent,
      '状态': r.status === 'fulfilled' ? '已兑现' : '待处理',
      '兑换时间': r.redeemed_at,
      '兑现时间': r.fulfilled_at
    })));
    XLSX.utils.book_append_sheet(workbook, rewardsSheet, '兑换记录');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="points_system_data.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: '导出失败' });
  }
});

router.get('/notion', authenticate, async (req, res) => {
  res.json({ 
    message: 'Notion集成功能',
    instructions: [
      '1. 在 Notion 创建一个数据库',
      '2. 获取数据库 ID 和 API Key',
      '3. 在 .env 文件中配置 NOTION_API_KEY 和 NOTION_DATABASE_ID',
      '4. 重启服务器后即可同步数据'
    ]
  });
});

module.exports = router;
