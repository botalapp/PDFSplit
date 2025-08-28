#!/bin/bash

# PDFSplit GitHub 部署脚本
# 使用方法: chmod +x deploy.sh && ./deploy.sh

set -e  # 遇到错误时退出

echo "🚀 开始部署 PDFSplit 到 GitHub..."

# 检查是否安装了 GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI 未安装"
    echo "请先安装 GitHub CLI："
    echo "  macOS: brew install gh"
    echo "  或访问: https://cli.github.com/"
    exit 1
fi

# 检查是否已登录 GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "🔑 请先登录 GitHub CLI:"
    echo "运行: gh auth login"
    echo "然后重新运行此脚本"
    exit 1
fi

echo "✅ GitHub CLI 已准备就绪"

# 初始化 Git 仓库
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
else
    echo "✅ Git 仓库已存在"
fi

# 设置 Git 用户信息（如果未设置）
if ! git config user.name &> /dev/null; then
    echo "👤 设置 Git 用户信息..."
    git config user.name "botalapp"
fi

if ! git config user.email &> /dev/null; then
    echo "📧 请输入你的邮箱地址:"
    read -p "Email: " email
    git config user.email "$email"
fi

# 添加所有文件
echo "📝 添加文件到 Git..."
git add .

# 提交更改
echo "💾 提交更改..."
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

# 检查仓库是否已存在
REPO_EXISTS=$(gh repo view botalapp/PDFSplit 2>/dev/null && echo "true" || echo "false")

if [ "$REPO_EXISTS" = "false" ]; then
    echo "🏗️ 创建 GitHub 仓库..."
    gh repo create PDFSplit --public --description "🔧 免费在线 PDF 分割工具 - 客户端处理，保护隐私安全。支持多种分割模式，拖拽上传，实时预览。" --clone=false
    echo "✅ GitHub 仓库创建成功"
else
    echo "✅ GitHub 仓库已存在"
fi

# 添加远程仓库
if ! git remote get-url origin &> /dev/null; then
    echo "🔗 添加远程仓库..."
    git remote add origin https://github.com/botalapp/PDFSplit.git
else
    echo "✅ 远程仓库已配置"
fi

# 推送到 GitHub
echo "⬆️ 推送代码到 GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "🎉 部署成功！"
echo ""
echo "📍 GitHub 仓库: https://github.com/botalapp/PDFSplit"
echo ""
echo "🌐 Netlify 部署步骤:"
echo "1. 访问 https://netlify.com"
echo "2. 点击 'New site from Git'"
echo "3. 选择 GitHub 并授权"
echo "4. 选择 botalapp/PDFSplit 仓库"
echo "5. 构建设置："
echo "   - Build command: npm run build"
echo "   - Publish directory: ."
echo "   - Node version: 18"
echo "6. 点击 'Deploy site'"
echo ""
echo "✨ 你的 PDFSplit 应用即将上线！"