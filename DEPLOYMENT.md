# 🚀 PDFSplit 部署指南

## 选择部署方式

### 方式一：自动部署（推荐）

如果你有 GitHub CLI，只需要运行：

```bash
chmod +x deploy.sh && ./deploy.sh
```

### 方式二：半自动部署

如果没有 GitHub CLI：

```bash
chmod +x deploy-manual.sh && ./deploy-manual.sh
```

然后按照脚本输出的指示操作。

### 方式三：完全手动部署

#### 1. 初始化 Git 并提交代码

```bash
# 初始化 Git 仓库
git init

# 配置用户信息
git config user.name "botalapp"
git config user.email "你的邮箱地址"

# 添加所有文件
git add .

# 提交代码
git commit -m "🎉 Initial commit: Complete PDFSplit application

✨ Features:
- Client-side PDF splitting with privacy protection
- Responsive design for mobile and desktop
- Drag-and-drop file upload
- Real-time PDF preview with thumbnails
- Multiple split modes (by pages, ranges, specific pages)
- Progress indicators and batch download
- Modern UI with smooth animations

🛠 Tech Stack:
- Vanilla JavaScript (ES6+ modules)
- pdf-lib & PDF.js for PDF processing
- Modern CSS3 with animations
- ESBuild & PostCSS for optimization
- Netlify-ready deployment configuration

🚀 Ready for deployment to Netlify"
```

#### 2. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. Repository name: `PDFSplit`
3. Description: `🔧 免费在线 PDF 分割工具 - 客户端处理，保护隐私安全`
4. 选择 Public
5. **不要勾选** "Add a README file"（我们已经有了）
6. 点击 "Create repository"

#### 3. 推送代码到 GitHub

```bash
# 添加远程仓库
git remote add origin https://github.com/botalapp/PDFSplit.git

# 推送代码
git branch -M main
git push -u origin main
```

## 🌐 Netlify 部署

### 自动部署（推荐）

1. 访问 [Netlify](https://netlify.com)
2. 点击 "New site from Git"
3. 选择 GitHub 并授权
4. 选择 `botalapp/PDFSplit` 仓库
5. 构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `.` 
   - **Node version**: `18`
6. 点击 "Deploy site"

### 手动部署

1. 在项目目录运行：
   ```bash
   npm install
   npm run build
   ```
2. 将整个项目文件夹拖拽到 Netlify 部署页面

## ✅ 部署完成后

- GitHub 仓库：https://github.com/botalapp/PDFSplit
- Netlify 会提供一个自动生成的 URL
- 可以在 Netlify 设置中配置自定义域名

## 🎯 推荐流程

**最省事的方法：**

1. 确保你在 `/Users/liushijie/Documents/PDFSplit` 目录下
2. 运行：`chmod +x deploy.sh && ./deploy.sh`
3. 如果没有 GitHub CLI，按提示安装并登录
4. 脚本会自动完成所有 Git 和 GitHub 操作

**然后去 Netlify 部署即可！**