#!/bin/bash

echo "🚀 开始部署积分系统..."

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用 root 用户运行此脚本"
    exit 1
fi

# 更新系统
echo "📦 更新系统..."
apt update && apt upgrade -y

# 安装 Node.js
echo "📦 安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装 PM2
echo "📦 安装 PM2..."
npm install -g pm2

# 安装 Nginx
echo "📦 安装 Nginx..."
apt install -y nginx

# 创建项目目录
echo "📁 创建项目目录..."
mkdir -p /var/www/points-system

echo "✅ 环境安装完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 上传代码到 /var/www/points-system"
echo "2. 运行: cd /var/www/points-system && npm install"
echo "3. 运行: cd client && npm install && npm run build"
echo "4. 运行: pm2 start server/index.js --name points-system"
echo "5. 配置 Nginx（参考 DEPLOYMENT.md）"
echo ""
echo "🎉 部署脚本执行完毕！"
