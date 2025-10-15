#!/bin/bash

# EasyResult 手动部署脚本
# 用于手动部署到 GitHub Pages（备用方案）

echo "🚀 开始手动部署 EasyResult 到 GitHub Pages..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 构建项目
echo "📦 构建项目..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：dist 目录不存在"
    exit 1
fi

echo "✅ 项目构建成功"

# 进入 dist 目录
cd dist

# 初始化 Git 仓库（如果不存在）
if [ ! -d ".git" ]; then
    echo "🔧 初始化 Git 仓库..."
    git init
    git checkout -b gh-pages
    git add .
    git commit -m "Deploy to GitHub Pages"
else
    echo "🔄 更新现有部署..."
    git add .
    git commit -m "Update deployment" || true
fi

# 添加远程仓库（如果不存在）
if ! git remote | grep -q "origin"; then
    echo "请输入你的 GitHub 仓库 URL（例如：https://github.com/你的用户名/EasyResult.git）"
    read -r repo_url
    git remote add origin "$repo_url"
fi

# 推送到 gh-pages 分支
echo "📤 推送到 GitHub Pages..."
git push -f origin gh-pages

echo "🎉 部署完成！"
echo "🌐 你的网站将在几分钟后可通过以下地址访问："
echo "   https://你的用户名.github.io/EasyResult/"
echo ""
echo "💡 提示："
echo "   1. 进入 GitHub 仓库 Settings → Pages"
echo "   2. 确保 Source 设置为 'Deploy from a branch'"
echo "   3. Branch 选择 'gh-pages'，Folder 选择 '/ (root)'"
echo "   4. 保存设置并等待部署完成"