const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const rewardRoutes = require('./routes/rewards');
const exportRoutes = require('./routes/export');
const { initDefaultData } = require('./database/init');

const app = express();

app.use(cors());
app.use(express.json());

const clientBuildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  console.log('✅ 静态文件目录已挂载');
} else {
  console.log('⚠️  静态文件目录不存在，仅运行 API 模式');
}

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/export', exportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../client/build/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: '前端文件未找到',
      message: '请确保已运行 npm run build',
      api: 'API 正常运行'
    });
  }
});

const PORT = process.env.PORT || 5000;

try {
  initDefaultData();
  console.log('✅ 数据库初始化完成');
} catch (error) {
  console.error('❌ 数据库初始化失败:', error.message);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📱 访问地址: http://localhost:${PORT}`);
  console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
});
