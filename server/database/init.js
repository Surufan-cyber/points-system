const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'points.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'child',
    name TEXT NOT NULL,
    avatar TEXT,
    total_points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    points INTEGER NOT NULL,
    time_limit INTEGER,
    extra_bonus INTEGER DEFAULT 0,
    icon TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    accepted_at DATETIME,
    completed_at DATETIME,
    points_earned INTEGER,
    bonus_earned INTEGER DEFAULT 0,
    proof TEXT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
  );

  CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    category TEXT NOT NULL,
    icon TEXT,
    stock INTEGER DEFAULT -1,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reward_redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reward_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    points_spent INTEGER NOT NULL,
    redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at DATETIME,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reward_id) REFERENCES rewards(id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points_bonus INTEGER DEFAULT 0,
    condition_type TEXT NOT NULL,
    condition_value INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_id INTEGER NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
  );

  CREATE TABLE IF NOT EXISTS point_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    related_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const initDefaultData = () => {
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, password, role, name, total_points)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, 'admin', '管理员', 0);

    const hashedPassword2 = bcrypt.hashSync('child123', 10);
    db.prepare(`
      INSERT INTO users (username, password, role, name, total_points)
      VALUES (?, ?, ?, ?, ?)
    `).run('child1', hashedPassword2, 'child', '小朋友', 0);
  }

  const tasksExist = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  
  if (tasksExist.count === 0) {
    const defaultTasks = [
      ['打扫卫生', '完成房间打扫，保持整洁', 'daily', 1, null, 0, '🧹'],
      ['学习30分钟', '专注学习30分钟', 'daily', 1, null, 0, '📚'],
      ['阅读30分钟', '阅读课外书籍30分钟', 'daily', 1, null, 0, '📖'],
      ['运动30分钟', '进行体育锻炼30分钟', 'daily', 1, null, 0, '🏃'],
      ['整理书包', '整理书包和学习用品', 'daily', 1, null, 0, '🎒'],
      ['早睡早起', '晚上9点前睡觉，早上7点前起床', 'daily', 2, null, 0, '😴'],
      ['背诵古诗', '背诵一首古诗', 'collection', 2, null, 1, '📝'],
      ['完成作业', '按时完成学校作业', 'daily', 2, null, 0, '✏️'],
      ['帮助家务', '主动帮助做家务', 'special', 2, null, 1, '🏠'],
      ['练习书法', '练习书法或写字30分钟', 'daily', 1, null, 0, '✍️'],
    ];

    const insertTask = db.prepare(`
      INSERT INTO tasks (title, description, type, points, time_limit, extra_bonus, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    defaultTasks.forEach(task => insertTask.run(...task));
  }

  const rewardsExist = db.prepare('SELECT COUNT(*) as count FROM rewards').get();
  
  if (rewardsExist.count === 0) {
    const defaultRewards = [
      ['零花钱10元', '获得10元零花钱', 50, 'money', '💰', -1],
      ['零花钱20元', '获得20元零花钱', 100, 'money', '💰', -1],
      ['一日游', '选择一个地方去游玩一天', 200, 'experience', '🎢', -1],
      ['电影票', '去看一场电影', 80, 'experience', '🎬', -1],
      ['冰淇淋', '获得一个冰淇淋', 30, 'food', '🍦', -1],
      ['冰箱贴', '获得一个精美冰箱贴', 100, 'item', '🧲', 10],
      ['玩具', '选择一个小玩具', 150, 'item', '🧸', 5],
      ['游戏时间1小时', '获得1小时游戏时间', 60, 'experience', '🎮', -1],
    ];

    const insertReward = db.prepare(`
      INSERT INTO rewards (title, description, points_required, category, icon, stock)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    defaultRewards.forEach(reward => insertReward.run(...reward));
  }

  const achievementsExist = db.prepare('SELECT COUNT(*) as count FROM achievements').get();
  
  if (achievementsExist.count === 0) {
    const defaultAchievements = [
      ['初学者', '完成第一个任务', '🎯', 5, 'tasks_completed', 1],
      ['勤奋者', '完成10个任务', '⭐', 20, 'tasks_completed', 10],
      ['小能手', '完成50个任务', '🌟', 50, 'tasks_completed', 50],
      ['古诗达人', '背诵10首古诗', '📜', 30, 'poems_memorized', 10],
      ['学习之星', '连续学习7天', '📚', 40, 'study_streak', 7],
      ['运动健将', '运动累计10小时', '🏃', 35, 'exercise_hours', 10],
      ['积分大师', '累计获得100积分', '💎', 25, 'total_points', 100],
      ['积分富豪', '累计获得500积分', '👑', 100, 'total_points', 500],
    ];

    const insertAchievement = db.prepare(`
      INSERT INTO achievements (title, description, icon, points_bonus, condition_type, condition_value)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    defaultAchievements.forEach(achievement => insertAchievement.run(...achievement));
  }

  console.log('✅ 数据库初始化完成');
  console.log('👤 默认管理员账号: admin / admin123');
  console.log('👶 默认孩子账号: child1 / child123');
};

module.exports = { db, initDefaultData };
