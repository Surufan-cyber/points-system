#!/bin/bash

echo "🌐 启动内网穿透..."

# 检查 ngrok 是否安装
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok 未安装"
    echo ""
    echo "安装方法："
    echo "macOS: brew install ngrok"
    echo "或访问: https://ngrok.com/download"
    echo ""
    echo "安装后需要："
    echo "1. 注册 ngrok 账号: https://ngrok.com/"
    echo "2. 获取 authtoken"
    echo "3. 运行: ngrok config add-authtoken your-token"
    exit 1
fi

# 检查后端服务是否运行
if ! lsof -i:5000 &> /dev/null; then
    echo "⚠️  后端服务未运行，正在启动..."
    osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && npm run server"'
    sleep 3
fi

# 检查前端服务是否运行
if ! lsof -i:3000 &> /dev/null; then
    echo "⚠️  前端服务未运行，正在启动..."
    osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'/client\" && npm start"'
    sleep 5
fi

echo "✅ 服务已启动"
echo "🌐 启动 ngrok..."
echo ""
echo "📝 注意："
echo "- ngrok 窗口会显示公网地址"
echo "- 地址格式：https://xxxx.ngrok.io"
echo "- 将此地址分享给孩子即可访问"
echo ""

ngrok http 3000
