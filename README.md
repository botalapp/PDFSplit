# PDFSplit - 免费在线 PDF 分割工具

一个现代化的客户端 PDF 分割工具，支持多种分割模式，完全在浏览器中处理，保护用户隐私。

## ✨ 主要特性

- 🔒 **客户端处理** - 所有操作在本地完成，保护隐私安全
- 📱 **响应式设计** - 完美适配移动端和桌面端
- 🎯 **多种分割模式**：
  - 按页数分割
  - 按页面范围分割  
  - 提取特定页面
- 🖱️ **拖拽上传** - 支持文件拖拽和点击上传
- 👀 **实时预览** - PDF 页面缩略图预览
- ⚡ **快速处理** - 高性能的 PDF 处理引擎
- 💾 **批量下载** - 支持单个或批量下载分割文件

## 🚀 技术栈

- **前端框架**: Vanilla JavaScript (ES6+ modules)
- **PDF 处理**: pdf-lib, PDF.js
- **样式**: 现代 CSS3 + CSS 变量
- **构建工具**: ESBuild, PostCSS
- **部署平台**: Netlify

## 📦 安装与运行

### 1. 克隆项目

```bash
git clone <repository-url>
cd PDFSplit
```

### 2. 安装依赖

```bash
npm install
```

### 3. 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

### 4. 构建生产版本

```bash
npm run build
```

### 5. 预览构建结果

```bash
npm run preview
```

## 🔧 开发命令

| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run build:css` | 构建 CSS 文件 |
| `npm run build:js` | 构建 JavaScript 文件 |
| `npm run preview` | 预览构建结果 |
| `npm run lint` | 代码检查 |
| `npm run format` | 代码格式化 |

## 🌐 部署到 Netlify

### 方法一：通过 Git 连接（推荐）

1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 登录 [Netlify](https://netlify.com)
3. 点击 "New site from Git"
4. 选择你的代码仓库
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `.`
   - **Node version**: 18
6. 点击 "Deploy site"

### 方法二：手动部署

1. 构建项目：
   ```bash
   npm run build
   ```

2. 将整个项目目录上传到 Netlify：
   - 可以直接拖拽文件夹到 Netlify 部署页面
   - 或使用 Netlify CLI：
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod
     ```

### 3. 环境变量（可选）

如果需要配置环境变量，在 Netlify 后台的 Site settings > Environment variables 中添加。

### 4. 自定义域名（可选）

在 Netlify 后台的 Domain settings 中可以配置自定义域名。

## 📁 项目结构

```
PDFSplit/
├── index.html              # 主页面
├── package.json            # 项目配置和依赖
├── netlify.toml           # Netlify 部署配置
├── _redirects             # Netlify 重定向规则
├── src/
│   ├── css/
│   │   └── main.css       # 主样式文件
│   ├── js/
│   │   ├── main.js        # 主应用逻辑
│   │   └── modules/       # 功能模块
│   │       ├── fileHandler.js     # 文件处理
│   │       ├── pdfProcessor.js    # PDF 处理
│   │       ├── uiController.js    # UI 控制
│   │       └── downloadManager.js # 下载管理
│   └── assets/
│       └── favicon.svg    # 网站图标
├── .eslintrc.json         # ESLint 配置
├── .prettierrc            # Prettier 配置
├── .gitignore             # Git 忽略文件
├── CLAUDE.md              # Claude Code 项目说明
└── README.md              # 项目说明文档
```

## 🔒 安全特性

- **客户端处理**: 文件不会上传到服务器
- **内容安全策略**: 严格的 CSP 头
- **HTTPS 强制**: 自动重定向到 HTTPS
- **安全头**: X-Frame-Options, X-Content-Type-Options 等

## 🎨 设计特性

- **现代设计**: 简洁直观的用户界面
- **动画效果**: 流畅的过渡动画
- **响应式布局**: 适配各种屏幕尺寸
- **深色模式**: 支持系统主题（可选）

## 📱 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🐛 问题反馈

如果您发现任何问题或有改进建议，请在 [Issues](../../issues) 页面提出。

## 🙏 致谢

- [pdf-lib](https://github.com/Hopding/pdf-lib) - PDF 操作库
- [PDF.js](https://github.com/mozilla/pdf.js) - PDF 渲染库
- [Netlify](https://netlify.com) - 部署平台