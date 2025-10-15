# EasyResult 手动部署脚本 (PowerShell版本)
# 用于手动部署到 GitHub Pages（备用方案）

Write-Host "🚀 开始手动部署 EasyResult 到 GitHub Pages..." -ForegroundColor Green

# 检查是否在正确的目录
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 错误：请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

# 构建项目
Write-Host "📦 构建项目..." -ForegroundColor Yellow
npm run build

# 检查构建是否成功
if (-not (Test-Path "dist")) {
    Write-Host "❌ 构建失败：dist 目录不存在" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 项目构建成功" -ForegroundColor Green

# 进入 dist 目录
Set-Location dist

# 初始化 Git 仓库（如果不存在）
if (-not (Test-Path ".git")) {
    Write-Host "🔧 初始化 Git 仓库..." -ForegroundColor Yellow
    git init
    git checkout -b gh-pages
    git add .
    git commit -m "Deploy to GitHub Pages"
} else {
    Write-Host "🔄 更新现有部署..." -ForegroundColor Yellow
    git add .
    git commit -m "Update deployment" 2>$null
}

# 检查远程仓库配置
$remoteExists = git remote | Select-String "origin"
if (-not $remoteExists) {
    Write-Host "🔗 配置远程仓库..." -ForegroundColor Yellow
    $repoUrl = Read-Host "请输入你的 GitHub 仓库 URL（例如：https://github.com/你的用户名/EasyResult.git）"
    git remote add origin $repoUrl
}

# 推送到 gh-pages 分支
Write-Host "📤 推送到 GitHub Pages..." -ForegroundColor Yellow
git push -f origin gh-pages

Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host "🌐 你的网站将在几分钟后可通过以下地址访问：" -ForegroundColor Cyan
Write-Host "   https://你的用户名.github.io/EasyResult/" -ForegroundColor White
Write-Host ""
Write-Host "💡 提示：" -ForegroundColor Yellow
Write-Host "   1. 进入 GitHub 仓库 Settings → Pages" -ForegroundColor Gray
Write-Host "   2. 确保 Source 设置为 'Deploy from a branch'" -ForegroundColor Gray
Write-Host "   3. Branch 选择 'gh-pages'，Folder 选择 '/ (root)'" -ForegroundColor Gray
Write-Host "   4. 保存设置并等待部署完成" -ForegroundColor Gray