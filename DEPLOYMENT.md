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

### 2. 配置 GitHub Pages（重要步骤）

1. **进入仓库设置**
   - 打开你的 GitHub 仓库
   - 点击 "Settings" 标签页
   - 左侧菜单选择 "Pages"

2. **配置 Pages 设置**
   - **Source**: 选择 "GitHub Actions"（不是 "Deploy from a branch"）
   - **Branch**: 保持默认（gh-pages分支会自动创建）
   - **Folder**: 保持默认（/root）
   - 点击 "Save" 保存设置

3. **验证配置**
   - 等待1-2分钟，刷新页面
   - 应该能看到 "Your site is live at https://你的用户名.github.io/EasyResult/"

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

### 常见问题及解决方案

1. **"Get Pages site failed" 错误**
   - **原因**: GitHub Pages 未正确启用或配置
   - **解决方案**:
     - 进入仓库 Settings → Pages
     - 确保 Source 选择的是 "GitHub Actions"（不是 "Deploy from a branch"）
     - 如果看不到 Pages 设置，可能需要等待几分钟或重新创建仓库
     - 确保仓库是 Public（公开）状态

2. **构建失败**
   - **原因**: Node.js 版本不兼容或依赖问题
   - **解决方案**:
     - 检查 Actions 日志中的具体错误信息
     - 确保 package.json 中的依赖版本兼容
     - 尝试删除 node_modules 和 package-lock.json，重新运行 `npm install`

3. **页面显示 404**
   - **原因**: base 路径配置错误或文件路径问题
   - **解决方案**:
     - 确认 vite.config.ts 中的 base 路径正确
     - 检查 dist 目录是否包含 index.html
     - 验证资源文件路径是否正确

4. **资源加载失败**
   - **原因**: CSS/JS 文件路径错误或缓存问题
   - **解决方案**:
     - 检查浏览器控制台错误信息
     - 清除浏览器缓存
     - 确认所有静态资源文件存在

5. **Actions 工作流不触发**
   - **原因**: 工作流文件路径或语法错误
   - **解决方案**:
     - 检查 .github/workflows/deploy.yml 文件路径和语法
     - 确保文件在 main 分支上
     - 手动触发工作流测试

### 手动部署方案（备用方案）

如果 GitHub Actions 自动部署失败，可以使用手动部署脚本：

#### 方法一：使用脚本部署（推荐）

**Linux/Mac 用户：**
```bash
# 给脚本执行权限
chmod +x deploy-manual.sh
# 运行部署脚本
./deploy-manual.sh
```

**Windows 用户：**
```powershell
# 以管理员身份运行 PowerShell，执行部署脚本
.\deploy-manual.ps1
```

#### 方法二：手动命令部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **部署到 gh-pages 分支**
   ```bash
   cd dist
   git init
   git add .
   git commit -m "Deploy to GitHub Pages"
   git branch -M gh-pages
   git remote add origin https://github.com/你的用户名/EasyResult.git
   git push -f origin gh-pages
   ```

3. **配置 GitHub Pages**
   - Settings → Pages → Source 选择 "Deploy from a branch"
   - Branch 选择 "gh-pages"，Folder 选择 "/ (root)"
   - 保存设置

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