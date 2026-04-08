# 🎯 快速部署指南

## 当前状态
✅ 项目已配置完成
✅ Git 已安装
✅ Railway 配置文件已创建

## 立即开始

### 方法一：使用自动化脚本（推荐）

```bash
cd /Users/WADDLE/Desktop/个人/积分系统
./upload-to-github.sh
```

### 方法二：手动操作

#### 1. 创建 GitHub 仓库
- 访问：https://github.com/new
- 仓库名：points-system
- 选择 Public
- **不要勾选**任何初始化选项
- 创建后复制仓库地址

#### 2. 上传代码

```bash
cd /Users/WADDLE/Desktop/个人/积分系统

# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "初始提交：智能积分系统"

# 添加远程仓库（替换为你的地址）
git remote add origin https://github.com/你的用户名/points-system.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 3. 部署到 Railway

1. 访问：https://railway.app/
2. 点击 "Start a New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择 `points-system` 仓库
5. 点击 "Deploy Now"

#### 4. 配置环境变量

在 Railway 项目中添加变量：
```
NODE_ENV=production
JWT_SECRET=your-secret-key-change-this
```

#### 5. 获取访问地址

- 在 Railway 项目页面
- Settings → Domains → Generate Domain
- 得到类似：`points-system-production.up.railway.app`

## 完成！

访问 Railway 提供的地址，你的积分系统就可以在互联网上使用了！

默认账号：
- 管理员：admin / admin123
- 孩子：child1 / child123
