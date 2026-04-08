# 🚀 GitHub + Railway 部署指南

## 第一步：安装和配置 Git

### 1. 检查 Git 是否已安装

```bash
git --version
```

如果显示版本号，说明已安装。如果没有，请安装：

```bash
# macOS
brew install git
```

### 2. 配置 Git 用户信息

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@example.com"
```

---

## 第二步：创建 GitHub 仓库

### 1. 登录 GitHub

访问 https://github.com/ 并登录

### 2. 创建新仓库

1. 点击右上角的 "+" → "New repository"
2. 填写仓库信息：
   - Repository name: `points-system`
   - Description: `智能积分系统`
   - 选择 Public（公开，Railway需要）
   - **不要**勾选 "Add a README file"
   - **不要**勾选 "Add .gitignore"
   - **不要**选择 License
3. 点击 "Create repository"

### 3. 记录仓库地址

创建后会显示仓库地址，类似：
```
https://github.com/你的用户名/points-system.git
```

---

## 第三步：上传代码到 GitHub

### 1. 初始化本地仓库

```bash
cd /Users/WADDLE/Desktop/个人/积分系统

# 初始化 Git 仓库
git init

# 添加所有文件到暂存区
git add .

# 提交更改
git commit -m "初始提交：智能积分系统"
```

### 2. 连接远程仓库

```bash
# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/points-system.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 3. 如果需要登录 GitHub

如果提示输入用户名和密码：
- 用户名：你的 GitHub 用户名
- 密码：需要使用 Personal Access Token（不是登录密码）

**创建 Token：**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. 勾选 `repo` 权限
4. 生成并复制 token
5. 在命令行输入密码时粘贴 token

---

## 第四步：部署到 Railway

### 1. 注册 Railway 账号

访问 https://railway.app/
- 点击 "Start a New Project"
- 选择 "Login with GitHub"
- 授权 Railway 访问你的 GitHub

### 2. 创建新项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你刚才创建的 `points-system` 仓库
4. 点击 "Deploy Now"

### 3. 配置环境变量

Railway 会自动检测到 Node.js 项目，但需要配置环境变量：

1. 在项目页面点击 "Variables"
2. 添加以下变量：
   ```
   NODE_ENV=production
   JWT_SECRET=your-secret-key-change-this
   PORT=5000
   ```
3. 点击 "Add"

### 4. 修改项目配置

Railway 需要特定的配置才能正确部署。我们需要修改几个文件：

#### 修改 package.json

```json
{
  "name": "points-system",
  "version": "1.0.0",
  "description": "智能积分系统",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "server": "node server/index.js",
    "client": "cd client && npm start",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "build": "cd client && npm install && npm run build",
    "install-all": "npm install && cd client && npm install",
    "init-db": "node server/database/init.js",
    "postinstall": "npm run build"
  },
  "engines": {
    "node": "18.x"
  }
}
```

#### 创建 railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 创建 nixpacks.toml

```toml
[phases.setup]
nixPkgs = ['nodejs_18']

[phases.install]
cmds = ['npm install', 'cd client && npm install']

[phases.build]
cmds = ['cd client && npm run build']

[start]
cmd = 'npm start'
```

### 5. 提交更改并重新部署

```bash
# 添加修改的文件
git add .

# 提交
git commit -m "配置 Railway 部署"

# 推送到 GitHub
git push
```

Railway 会自动检测到更改并重新部署。

### 6. 获取访问地址

部署成功后：
1. 在 Railway 项目页面点击 "Settings"
2. 找到 "Domains"
3. 点击 "Generate Domain"
4. 会得到一个类似 `points-system-production.up.railway.app` 的地址

---

## 第五步：验证部署

访问 Railway 提供的地址，应该能看到积分系统登录页面。

默认账号：
- 管理员：admin / admin123
- 孩子：child1 / child123

---

## 常见问题

### Q1: 推送时提示权限错误

**解决方案：** 使用 SSH 或配置 Personal Access Token

```bash
# 使用 SSH（推荐）
git remote set-url origin git@github.com:你的用户名/points-system.git

# 或使用 Token
# 在推送时输入用户名和 token（作为密码）
```

### Q2: Railway 部署失败

**检查步骤：**
1. 查看 Railway 的 "Deployments" 日志
2. 确认 package.json 中的 scripts 正确
3. 确认环境变量已设置
4. 检查 Node.js 版本兼容性

### Q3: 前端无法访问后端 API

**解决方案：** 修改前端 API 地址

在 `client/src/api.js` 中：

```javascript
// 修改为动态获取 API 地址
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin + '/api'  // 生产环境使用相对路径
  : 'http://localhost:5000/api';     // 开发环境使用本地地址
```

### Q4: 数据库文件丢失

Railway 每次部署会重置文件系统。解决方案：

**方案一：使用 Railway Volume（推荐）**
1. 在 Railway 项目中添加 Volume
2. 挂载到 `/app/data`
3. 修改数据库路径

**方案二：使用外部数据库**
- PostgreSQL（Railway 提供）
- MongoDB Atlas
- PlanetScale

---

## 进阶：使用 PostgreSQL 数据库

Railway 提供 PostgreSQL 数据库，比 SQLite 更稳定：

### 1. 添加 PostgreSQL

1. 在 Railway 项目中点击 "+"
2. 选择 "Database" → "PostgreSQL"
3. 自动创建数据库

### 2. 修改后端代码

安装 pg：
```bash
npm install pg
```

修改 `server/database/init.js`：
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 使用 pool.query() 代替 db.prepare()
```

### 3. 提交并部署

```bash
git add .
git commit -m "切换到 PostgreSQL"
git push
```

---

## 总结

完整流程：
1. ✅ 安装和配置 Git
2. ✅ 创建 GitHub 仓库
3. ✅ 使用 Git 上传代码
4. ✅ 连接 Railway
5. ✅ 配置环境变量
6. ✅ 自动部署
7. ✅ 获取访问地址

现在你的积分系统已经部署到云端，孩子可以通过互联网访问了！🎉
