#!/bin/bash

echo "🚀 开始上传代码到 GitHub..."

# 检查 Git 是否安装
if ! command -v git &> /dev/null; then
    echo "❌ Git 未安装"
    echo "请先安装 Git: brew install git"
    exit 1
fi

# 检查是否已经初始化 Git
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    echo "✅ Git 仓库初始化完成"
fi

# 检查是否有远程仓库
if ! git remote | grep -q "origin"; then
    echo ""
    echo "⚠️  未检测到远程仓库"
    echo ""
    echo "请按以下步骤操作："
    echo "1. 访问 https://github.com/new 创建新仓库"
    echo "2. 仓库名称: points-system"
    echo "3. 选择 Public（公开）"
    echo "4. 不要勾选任何初始化选项"
    echo "5. 创建后复制仓库地址"
    echo ""
    read -p "请输入 GitHub 仓库地址（例如：https://github.com/用户名/points-system.git）: " repo_url
    
    if [ -z "$repo_url" ]; then
        echo "❌ 未输入仓库地址"
        exit 1
    fi
    
    git remote add origin "$repo_url"
    echo "✅ 远程仓库已添加"
fi

# 添加所有文件
echo "📦 添加文件到暂存区..."
git add .

# 检查是否有更改
if git diff --staged --quiet; then
    echo "ℹ️  没有需要提交的更改"
else
    # 提交更改
    echo "💾 提交更改..."
    git commit -m "更新：配置 Railway 部署"
    echo "✅ 更改已提交"
fi

# 推送到 GitHub
echo "🚀 推送到 GitHub..."
echo ""
echo "⚠️  注意："
echo "如果提示输入用户名和密码："
echo "- 用户名：你的 GitHub 用户名"
echo "- 密码：使用 Personal Access Token（不是登录密码）"
echo ""
echo "创建 Token 方法："
echo "1. GitHub → Settings → Developer settings"
echo "2. Personal access tokens → Tokens (classic)"
echo "3. Generate new token (classic)"
echo "4. 勾选 repo 权限并生成"
echo ""

# 设置分支并推送
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 代码已成功上传到 GitHub！"
    echo ""
    echo "📋 下一步："
    echo "1. 访问 https://railway.app/"
    echo "2. 点击 'Start a New Project'"
    echo "3. 选择 'Deploy from GitHub repo'"
    echo "4. 选择 points-system 仓库"
    echo "5. 点击 'Deploy Now'"
    echo ""
    echo "🎉 部署完成后，孩子就可以通过互联网访问积分系统了！"
else
    echo ""
    echo "❌ 推送失败，请检查："
    echo "1. GitHub 用户名和 Token 是否正确"
    echo "2. 仓库地址是否正确"
    echo "3. 网络连接是否正常"
fi
