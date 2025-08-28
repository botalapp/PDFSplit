#!/bin/bash

# PDFSplit 手动部署脚本 (不需要 GitHub CLI)
# 使用方法: chmod +x deploy-manual.sh && ./deploy-manual.sh

set -e  # 遇到错误时退出

echo "🚀 准备 PDFSplit 项目进行手动 GitHub 部署..."

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

echo ""
echo "✅ 本地 Git 准备完成！"
echo ""
echo "🔄 接下来请按照以下步骤操作："
echo ""
echo "1️⃣ 创建 GitHub 仓库:"
echo "   - 访问 https://github.com/new"
echo "   - Repository name: PDFSplit"
echo "   - Description: 🔧 免费在线 PDF 分割工具 - 客户端处理，保护隐私安全"
echo "   - 选择 Public"
echo "   - 不要勾选 'Add a README file'（我们已经有了）"
echo "   - 点击 'Create repository'"
echo ""
echo "2️⃣ 推送代码到 GitHub:"
echo "   复制粘贴以下命令："
echo ""
echo "   git remote add origin https://github.com/botalapp/PDFSplit.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3️⃣ Netlify 部署:"
echo "   - 访问 https://netlify.com"
echo "   - 点击 'New site from Git'"
echo "   - 选择 GitHub 并授权"
echo "   - 选择 botalapp/PDFSplit 仓库"
echo "   - 构建设置："
echo "     Build command: npm run build"
echo "     Publish directory: ."
echo "     Node version: 18"
echo "   - 点击 'Deploy site'"
echo ""
echo "🎯 或者，如果你有 GitHub CLI，直接运行: ./deploy.sh"