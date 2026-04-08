# 🌟 智能积分系统

一个功能完整的家庭积分管理系统，支持任务管理、积分兑换、成就系统，并可导出数据到Excel或同步到Notion。

## ✨ 功能特性

### 👨‍💼 管理员端（家长）

- **任务管理**：创建、编辑、删除任务，支持日常任务、特殊任务、限时任务、采集任务
- **用户管理**：管理家庭成员账号，调整积分
- **奖励管理**：设置可兑换的奖励项目
- **数据统计**：查看积分排行榜、任务完成情况
- **数据导出**：导出Excel报表，支持Notion同步

### 👶 客户端（孩子）

- **任务大厅**：浏览和接取任务
- **我的任务**：查看进行中和已完成的任务
- **积分商城**：用积分兑换奖励
- **个人中心**：查看成就、积分历史

### 🎯 核心功能

- ✅ 任务类型：日常、特殊、限时、采集任务
- ✅ 积分系统：获取、消耗、历史记录
- ✅ 奖励兑换：金钱、体验、食物、物品
- ✅ 成就系统：解锁成就获得额外奖励
- ✅ 数据可视化：统计图表、排行榜
- ✅ 外部集成：导出Excel、Notion同步

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 2. 配置环境变量

编辑 `.env` 文件：

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
NOTION_API_KEY=your-notion-api-key
NOTION_DATABASE_ID=your-database-id
```

### 3. 启动项目

```bash
# 开发模式（同时启动前后端）
npm run dev

# 或分别启动
npm run server  # 启动后端
npm run client  # 启动前端
```

### 4. 访问系统

- 前端地址：<http://localhost:3000>
- 后端API：<http://localhost:5000>

## 📱 默认账号

系统初始化后会创建以下默认账号：

| 角色  | 用户名    | 密码       |
| --- | ------ | -------- |
| 管理员 | admin  | admin123 |
| 孩子  | child1 | child123 |

## 🎨 使用指南

### 管理员操作流程

1. **登录系统**
   - 使用管理员账号登录
   - 进入管理后台
2. **创建任务**
   - 点击"任务管理" → "新建任务"
   - 填写任务信息（名称、描述、积分、类型等）
   - 设置额外奖励和图标
3. **管理奖励**
   - 点击"奖励管理" → "新建奖励"
   - 设置奖励名称、所需积分、库存等
   - 支持金钱、体验、食物、物品等类别
4. **查看统计**
   - 查看用户积分排行
   - 查看任务完成情况
   - 导出Excel报表

### 孩子操作流程

1. **登录系统**
   - 使用孩子账号登录
   - 进入客户端界面
2. **接取任务**
   - 浏览"任务大厅"
   - 点击任务查看详情
   - 点击"接取任务"
3. **完成任务**
   - 在"我的任务"中查看进行中的任务
   - 完成后点击"完成任务"
   - 可填写完成证明
4. **兑换奖励**
   - 进入"积分商城"
   - 选择想要的奖励
   - 确认兑换

## 📊 数据结构

### 任务类型

- **日常任务**：每天可重复完成的任务
- **特殊任务**：一次性特殊任务
- **限时任务**：有时间限制的任务
- **采集任务**：如背古诗、达成成就等

### 奖励类别

- **金钱**：零花钱等
- **体验**：一日游、看电影等
- **食物**：冰淇淋、零食等
- **物品**：玩具、冰箱贴等

## 🔧 技术栈

### 后端

- Node.js + Express
- SQLite（better-sqlite3）
- JWT认证
- bcryptjs密码加密

### 前端

- React 18
- Ant Design 5
- React Router 6
- Axios
- Recharts（图表）

### 集成

- Excel导出（xlsx）
- Notion API（可选）

## 📝 API文档

### 认证接口

- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/me` - 获取当前用户信息

### 任务接口

- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务（管理员）
- `PUT /api/tasks/:id` - 更新任务（管理员）
- `DELETE /api/tasks/:id` - 删除任务（管理员）
- `POST /api/tasks/:id/accept` - 接取任务
- `POST /api/tasks/user-tasks/:id/complete` - 完成任务
- `GET /api/tasks/my-tasks` - 获取我的任务
- `GET /api/tasks/statistics` - 获取统计数据

### 用户接口

- `GET /api/users` - 获取用户列表（管理员）
- `GET /api/users/:id` - 获取用户信息
- `PUT /api/users/:id` - 更新用户信息
- `GET /api/users/:id/point-history` - 获取积分历史
- `GET /api/users/:id/achievements` - 获取成就
- `POST /api/users/:id/adjust-points` - 调整积分（管理员）

### 奖励接口

- `GET /api/rewards` - 获取奖励列表
- `POST /api/rewards` - 创建奖励（管理员）
- `PUT /api/rewards/:id` - 更新奖励（管理员）
- `DELETE /api/rewards/:id` - 删除奖励（管理员）
- `POST /api/rewards/:id/redeem` - 兑换奖励
- `GET /api/rewards/my-redemptions` - 获取我的兑换记录
- `GET /api/rewards/redemptions` - 获取所有兑换记录（管理员）

### 导出接口

- `GET /api/export/excel` - 导出Excel（管理员）
- `GET /api/export/notion` - Notion集成说明

## 🎯 未来扩展

- [ ] 微信小程序版本
- [ ] 消息推送提醒
- [ ] 任务模板库
- [ ] 家庭成员互动
- [ ] 学习报告生成
- [ ] AI智能推荐任务

## 📄 许可证

MIT License

## 👨‍💻 作者

智能积分系统 - 让家庭管理更有趣！
