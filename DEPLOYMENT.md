# GitHub Pages 部署指南

## 项目概述
这是一个基于 Vue 3 + TypeScript + Vite + Ant Design Vue 的实验数据可视化系统。

## 部署步骤

### 1. 准备 GitHub 仓库

1. **创建新仓库**
   - 访问 [GitHub](https://github.com)
   - 点击 "New repository"
   - 仓库名: `EasyResult`
   - 选择 Public（GitHub Pages 要求公开仓库）
   - 不勾选 "Add a README file"

2. **推送代码到 GitHub**
   ```bash
   # 初始化 Git 仓库
   git init
   git add .
   git commit -m "初始提交：Vue 3 实验数据可视化系统"
   
   # 添加远程仓库
   git remote add origin https://github.com/你的用户名/EasyResult.git
   
   # 推送代码
   git branch -M main
   git push -u origin main
   ```

### 2. 配置 GitHub Pages

1. **进入仓库设置**
   - 打开你的 GitHub 仓库
   - 点击 "Settings" 标签页
   - 左侧菜单选择 "Pages"

2. **配置 Pages 设置**
   - Source: 选择 "GitHub Actions"
   - 保存设置

### 3. 触发自动部署

1. **查看 Actions**
   - 点击仓库顶部的 "Actions" 标签
   - 你应该能看到 "Deploy to GitHub Pages" 工作流正在运行

2. **等待部署完成**
   - 构建过程大约需要 2-5 分钟
   - 当所有步骤显示绿色对勾时表示部署成功

### 4. 访问网站

部署成功后，你的网站将通过以下地址访问：
```
https://你的用户名.github.io/EasyResult/
```

## 自定义配置

### 修改仓库名称
如果你想使用不同的仓库名称，需要更新以下文件：

1. **修改 vite.config.ts**
   ```typescript
   base: process.env.NODE_ENV === 'production' ? '/新仓库名/' : '/',
   ```

2. **更新部署文档中的地址**

### 自定义域名（可选）
如需使用自定义域名：

1. **在仓库根目录创建 `CNAME` 文件**
   ```
   yourdomain.com
   ```

2. **在域名服务商处配置 CNAME 记录**
   ```
   yourdomain.com CNAME 你的用户名.github.io
   ```

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本兼容性
   - 查看 Actions 日志中的具体错误信息

2. **页面显示 404**
   - 确认 base 路径配置正确
   - 检查 dist 目录是否包含 index.html

3. **资源加载失败**
   - 检查控制台错误信息
   - 确认所有资源路径正确

### 手动触发部署
如需手动触发部署：
- 进入 Actions 页面
- 选择 "Deploy to GitHub Pages" 工作流
- 点击 "Run workflow"

## 技术架构

- **构建工具**: Vite
- **框架**: Vue 3 + TypeScript
- **UI 组件库**: Ant Design Vue
- **部署平台**: GitHub Pages
- **CI/CD**: GitHub Actions

## 联系方式
如有问题，请通过 GitHub Issues 提交反馈。