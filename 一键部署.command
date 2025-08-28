#!/bin/bash

# Allow script to be executed by double-click
cd "$(dirname "$0")"

echo "🎉 Welcome to PDFSplit One-Click Deployment Tool!"
echo ""
echo "📋 This script will:"
echo "   1. Check and install necessary tools"
echo "   2. Initialize Git repository"
echo "   3. Commit code"
echo "   4. Push to GitHub"
echo "   5. Provide Netlify deployment link"
echo ""

# Request user confirmation
read -p "🤔 Continue? (Press Enter to continue, or type n to exit): " confirm
if [[ $confirm == [nN] ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 开始部署..."

# 检查是否是 macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ 此脚本仅支持 macOS"
    read -p "按回车键退出..."
    exit 1
fi

# 检查 Homebrew
if ! command -v brew &> /dev/null; then
    echo "📦 Homebrew 未安装，正在安装..."
    echo "🔑 可能需要输入密码..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# 检查并安装 GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "📦 正在安装 GitHub CLI..."
    brew install gh
fi

# 检查 GitHub CLI 登录状态
if ! gh auth status &> /dev/null; then
    echo ""
    echo "🔑 需要登录 GitHub:"
    echo "   1. 浏览器会自动打开"
    echo "   2. 点击 'Authorize github'"
    echo "   3. 输入你的 GitHub 密码"
    echo "   4. 回到终端按回车键"
    echo ""
    read -p "🤔 准备好了吗？(按回车键开始登录): "
    
    gh auth login
    
    if ! gh auth status &> /dev/null; then
        echo "❌ GitHub 登录失败"
        read -p "按回车键退出..."
        exit 1
    fi
fi

echo "✅ GitHub CLI 已准备就绪"

# 获取邮箱地址
echo ""
echo "📧 设置 Git 用户信息..."
if ! git config user.email &> /dev/null; then
    read -p "请输入你的邮箱地址: " email
    git config --global user.email "$email"
fi

if ! git config user.name &> /dev/null; then
    git config --global user.name "botalapp"
fi

# 初始化 Git 仓库
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
fi

# 添加文件并提交
echo "📝 准备提交代码..."
git add .

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

# 检查仓库是否存在
echo "🔍 检查 GitHub 仓库..."
REPO_EXISTS=$(gh repo view botalapp/PDFSplit 2>/dev/null && echo "true" || echo "false")

if [ "$REPO_EXISTS" = "false" ]; then
    echo "🏗️ 正在创建 GitHub 仓库..."
    gh repo create PDFSplit --public --description "🔧 免费在线 PDF 分割工具 - 客户端处理，保护隐私安全。支持多种分割模式，拖拽上传，实时预览。" --clone=false
    echo "✅ GitHub 仓库创建成功"
fi

# 添加远程仓库并推送
if ! git remote get-url origin &> /dev/null; then
    git remote add origin https://github.com/botalapp/PDFSplit.git
fi

echo "⬆️ 正在推送代码到 GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "🎉🎉🎉 部署成功！🎉🎉🎉"
echo ""
echo "✅ GitHub 仓库: https://github.com/botalapp/PDFSplit"
echo ""
echo "🌐 下一步 - Netlify 自动部署:"
echo "   1. 点击这个链接: https://app.netlify.com/start"
echo "   2. 点击 'GitHub'"
echo "   3. 搜索并选择 'PDFSplit'"
echo "   4. 点击 'Deploy site'"
echo ""
echo "✨ 就这么简单！"
echo ""
echo "🔗 GitHub 仓库链接已复制到剪贴板"
echo "   (如果没有，请手动复制: https://github.com/botalapp/PDFSplit)"

# 复制链接到剪贴板
echo "https://github.com/botalapp/PDFSplit" | pbcopy

# 自动打开 Netlify 部署页面
echo ""
read -p "🚀 是否自动打开 Netlify 部署页面？(按回车键打开，或输入 n 跳过): " open_netlify
if [[ $open_netlify != [nN] ]]; then
    open "https://app.netlify.com/start"
fi

echo ""
echo "🎊 恭喜！你的 PDFSplit 应用即将上线！"
echo ""
read -p "按回车键完成..."