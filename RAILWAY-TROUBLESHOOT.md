# 🔧 Railway 访问问题排查指南

## 问题：地址生成了但无法访问

访问地址：`https://points-system-production.up.railway.app`

---

## 快速诊断步骤

### 步骤 1：检查部署状态

在 Railway 项目页面：

1. 点击 **"Deployments"** 标签
2. 查看最新部署的状态：
   - ✅ **SUCCESS**（成功）→ 继续步骤 2
   - ⏳ **BUILDING**（构建中）→ 等待完成
   - ⏳ **DEPLOYING**（部署中）→ 等待完成
   - ❌ **FAILED**（失败）→ 查看错误日志

### 步骤 2：查看部署日志

1. 点击最新的部署
2. 查看 **"Build Logs"**（构建日志）
3. 查看 **"Deploy Logs"**（部署日志）

**正常情况应该看到：**
```
✅ 数据库初始化完成
👤 默认管理员账号: admin / admin123
👶 默认孩子账号: child1 / child123
🚀 服务器运行在端口 5000
📱 访问地址: http://localhost:5000
```

**如果看到错误，记录错误信息**

### 步骤 3：检查环境变量

在 **"Variables"** 标签，确保有：
```
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key
```

**如果没有 PORT 变量：**
1. 点击 "New Variable"
2. 添加 `PORT=5000`
3. Railway 会自动重新部署

---

## 常见问题及解决方案

### 问题 1：显示 "Application failed to respond"

**原因：** 端口配置错误或服务未启动

**解决方案：**
```bash
# 在 Railway Variables 中添加：
PORT=5000

# 确保后端 server/index.js 中使用：
const PORT = process.env.PORT || 5000;
```

### 问题 2：显示 404 Not Found

**原因：** 前端构建失败或静态文件路径错误

**检查步骤：**
1. 查看 Build Logs，确认 `npm run build` 成功
2. 确认 `client/build` 目录已创建

**解决方案：**
检查 `server/index.js` 中的静态文件配置：
```javascript
app.use(express.static(path.join(__dirname, '../client/build')));
```

### 问题 3：显示 502 Bad Gateway

**原因：** 服务启动失败或端口未监听

**解决方案：**
1. 查看 Deploy Logs
2. 确认服务正在监听正确的端口
3. 检查是否有启动错误

### 问题 4：页面加载但空白

**原因：** 前端 API 地址配置错误

**解决方案：**
确认 `client/src/api.js` 中：
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin + '/api'
  : 'http://localhost:5000/api';
```

---

## 立即尝试的解决方案

### 方案一：重新部署

1. 在 Railway 项目页面
2. 点击 **"Deployments"**
3. 点击最新部署右侧的 **"..."** 菜单
4. 选择 **"Redeploy"**
5. 等待重新部署完成

### 方案二：检查并修复配置

1. 确认 Variables 中有 `PORT=5000`
2. 确认 `package.json` 中有 `"start": "node server/index.js"`
3. 确认 `server/index.js` 使用 `process.env.PORT`

### 方案三：查看实时日志

1. 在项目页面点击 **"View Logs"**
2. 尝试访问网站
3. 观察日志输出
4. 看是否有请求到达服务器

---

## 需要检查的关键文件

### 1. package.json

确保有：
```json
{
  "scripts": {
    "start": "node server/index.js",
    "build": "cd client && npm install && npm run build",
    "postinstall": "npm run build"
  }
}
```

### 2. server/index.js

确保：
```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
});
```

### 3. railway.json

确保：
```json
{
  "deploy": {
    "startCommand": "npm start"
  }
}
```

---

## 如何获取详细错误信息

### 方法一：查看 Railway 日志

1. 项目页面 → **"View Logs"**
2. 查看最近的错误
3. 复制错误信息

### 方法二：使用 Railway CLI

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 查看日志
railway logs

# 进入项目
railway link
```

### 方法三：检查网络请求

1. 打开浏览器开发者工具（F12）
2. 切换到 **"Network"** 标签
3. 访问网站
4. 查看请求状态和响应

---

## 下一步

请告诉我：

1. **部署状态是什么？**（SUCCESS / FAILED）
2. **访问时显示什么错误？**
   - Application failed to respond
   - 404 Not Found
   - 502 Bad Gateway
   - 页面空白
   - 其他错误
3. **Build Logs 和 Deploy Logs 显示什么？**

根据具体错误，我会给你精确的解决方案！
