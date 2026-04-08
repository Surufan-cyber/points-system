# 🚀 部署指南

## 方案一：云服务器部署（推荐，稳定可靠）

### 1. 购买云服务器

推荐选择：
- **阿里云 ECS**：https://www.aliyun.com/product/ecs
- **腾讯云 CVM**：https://cloud.tencent.com/product/cvm
- **华为云 ECS**：https://www.huaweicloud.com/product/ecs.html

配置建议：
- CPU：1核
- 内存：2GB
- 带宽：1Mbps
- 系统：Ubuntu 20.04 或 CentOS 7+
- 费用：约 50-100元/月

### 2. 连接服务器并安装环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2（进程管理器）
sudo npm install -g pm2

# 安装 Nginx（反向代理）
sudo apt install -y nginx
```

### 3. 上传代码到服务器

```bash
# 在本地电脑打包项目
cd /Users/WADDLE/Desktop/个人/积分系统
tar -czf points-system.tar.gz .

# 上传到服务器（替换 your-server-ip）
scp points-system.tar.gz root@your-server-ip:/root/

# SSH 连接到服务器
ssh root@your-server-ip

# 解压
cd /root
mkdir points-system
tar -xzf points-system.tar.gz -C points-system
cd points-system
```

### 4. 安装依赖并构建

```bash
# 安装后端依赖
npm install

# 安装前端依赖并构建
cd client
npm install
npm run build
cd ..
```

### 5. 使用 PM2 启动服务

```bash
# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'points-system',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
EOF

# 启动服务
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 6. 配置 Nginx 反向代理

```bash
# 创建 Nginx 配置
sudo cat > /etc/nginx/sites-available/points-system << EOF
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# 启用配置
sudo ln -s /etc/nginx/sites-available/points-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 7. 配置域名（可选）

如果有域名，可以配置 HTTPS：

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 8. 访问系统

- **HTTP**：http://your-server-ip 或 http://your-domain.com
- **HTTPS**：https://your-domain.com

---

## 方案二：内网穿透（快速简单，适合测试）

### 使用 ngrok（推荐）

```bash
# 1. 注册 ngrok 账号
# 访问 https://ngrok.com/ 注册并获取 authtoken

# 2. 下载并安装 ngrok
# macOS
brew install ngrok

# 或直接下载
# https://ngrok.com/download

# 3. 配置 authtoken
ngrok config add-authtoken your-auth-token

# 4. 启动后端服务（在一个终端）
cd /Users/WADDLE/Desktop/个人/积分系统
npm run server

# 5. 启动前端服务（在另一个终端）
cd /Users/WADDLE/Desktop/个人/积分系统/client
npm start

# 6. 启动 ngrok（在第三个终端）
ngrok http 3000

# 7. 获取公网地址
# ngrok 会显示类似：https://abc123.ngrok.io
# 这个地址可以分享给孩子访问
```

### 使用 frp（免费开源）

```bash
# 1. 下载 frp
# https://github.com/fatedier/frp/releases

# 2. 使用公共 frp 服务器
# 或自己搭建 frp 服务器

# 3. 配置 frpc.ini
[common]
server_addr = frp服务器地址
server_port = 7000

[web]
type = http
local_port = 3000
custom_domains = your-subdomain

# 4. 启动 frp
./frpc -c frpc.ini
```

### 使用 Cloudflare Tunnel（免费）

```bash
# 1. 安装 cloudflared
brew install cloudflare/cloudflare/cloudflared

# 2. 登录
cloudflared tunnel login

# 3. 创建隧道
cloudflared tunnel create points-system

# 4. 配置路由
cloudflared tunnel route dns points-system your-subdomain.your-domain.com

# 5. 运行隧道
cloudflared tunnel run --url http://localhost:3000 points-system
```

---

## 方案三：云平台部署（免费或低成本）

### 使用 Railway（推荐）

```bash
# 1. 访问 https://railway.app/
# 2. 使用 GitHub 登录
# 3. 创建新项目
# 4. 连接 GitHub 仓库
# 5. 自动部署

# 需要先上传代码到 GitHub
```

### 使用 Vercel + 外部数据库

```bash
# 1. 修改项目结构适配 Vercel
# 2. 使用 Vercel Postgres 或其他云数据库
# 3. 部署前端到 Vercel
```

### 使用 Render

```bash
# 1. 访问 https://render.com/
# 2. 创建 Web Service
# 3. 连接 GitHub 仓库
# 4. 配置构建命令和启动命令
```

---

## 方案四：微信公众号集成

### 1. 创建微信小程序（推荐）

```bash
# 优势：
# - 无需下载安装
# - 用户体验好
# - 可以发送模板消息提醒

# 步骤：
# 1. 注册微信小程序账号
#    https://mp.weixin.qq.com/

# 2. 下载微信开发者工具
#    https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

# 3. 开发小程序前端
#    使用 Taro 或 uni-app 将 React 项目转换为小程序

# 4. 后端使用云服务器部署
#    小程序调用后端 API
```

### 2. 使用微信公众号网页

```bash
# 1. 注册微信公众号（服务号）
#    https://mp.weixin.qq.com/

# 2. 配置 JS 接口安全域名
#    公众号后台 -> 设置 -> 公众号设置 -> 功能设置

# 3. 开发网页版
#    使用微信 JS-SDK
#    https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html

# 4. 配置网页授权域名
#    实现微信登录功能
```

---

## 推荐方案对比

| 方案 | 成本 | 难度 | 稳定性 | 适用场景 |
|------|------|------|--------|----------|
| 云服务器 | 50-100元/月 | 中等 | ⭐⭐⭐⭐⭐ | 长期使用，需要稳定服务 |
| 内网穿透 | 免费-30元/月 | 简单 | ⭐⭐⭐ | 临时测试，快速分享 |
| 云平台 | 免费-20元/月 | 简单 | ⭐⭐⭐⭐ | 小规模使用 |
| 微信小程序 | 认证费300元/年 | 较难 | ⭐⭐⭐⭐⭐ | 需要微信生态 |

---

## 快速开始推荐

### 如果想快速测试（今天就能用）：
**使用 ngrok 内网穿透**
- 优点：5分钟搞定，免费
- 缺点：地址会变，不稳定

### 如果想长期使用（稳定可靠）：
**购买云服务器 + 域名**
- 优点：稳定、专业、可扩展
- 缺点：需要一定成本和技术

### 如果想给孩子最好的体验：
**开发微信小程序**
- 优点：无需下载，体验好，可推送消息
- 缺点：需要学习小程序开发

---

## 安全建议

1. **修改默认密码**：部署后立即修改 admin 和 child1 的密码
2. **配置防火墙**：只开放必要端口（80, 443）
3. **启用 HTTPS**：使用 SSL 证书加密传输
4. **定期备份**：备份 SQLite 数据库文件
5. **设置访问限制**：可以添加 IP 白名单

---

## 需要帮助？

如果遇到问题，可以：
1. 查看服务器日志：`pm2 logs points-system`
2. 查看 Nginx 日志：`sudo tail -f /var/log/nginx/error.log`
3. 检查端口占用：`sudo netstat -tlnp | grep 5000`
4. 重启服务：`pm2 restart points-system`

---

## 下一步

1. 选择适合你的部署方案
2. 按照步骤操作
3. 测试访问
4. 分享给孩子使用

祝部署顺利！🎉
