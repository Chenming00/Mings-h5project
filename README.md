# H5 项目集合平台 (Pro Version) 🚀

这是一个基于 **React 18 + Vite + Tailwind CSS** 构建的专业级前端 H5 迷你项目托管聚合平台。它被设计为一个“前端项目画廊”或“工具导航站”，允许您在一个精美的主界面中集中展示、分类和预览各种独立的静态 H5 小应用。

## ✨ 核心特性

- **🚀 极致性能**：采用 Vite 构建，原生 ES 模块化开发，提供闪电般的启动和热更新速度。
- **📱 响应式现代 UI**：使用了 Tailwind CSS 进行高度定制，并融入了玻璃态（Glassmorphism）和精美的微交互动画。
- **🌗 暗黑模式 (Dark Mode)**：提供系统级/手动切换深色模式支持，默认遵循 Pro 设计语言（深色优先）。
- **🔍 动态搜索与标签过滤**：能够根据项目名称进行实时搜索，并支持按类别（Tags）快速筛选。
- **💻 沉浸式 Iframe 预览**：点击项目卡片，即可在右侧顺滑滑出的面板中，直接运行并预览子项目，无需额外打开新标签页。
- **⚡ 纯静态架构**：完全兼容静态托管（如 Cloudflare Pages、Vercel 等），子项目保持完全独立，不受 React 路由机制干扰。

---

## 📂 项目目录结构

项目的核心是将独立的 HTML/JS 项目放置在 `public/projects/` 目录下。这些项目作为纯静态资源可以直接通过 URL 访问。

```text
/public
  /projects
    /project-a/        # 独立的 H5 子项目 A
      index.html
      cover.png        # (可选) 自动识别的项目封面
    /project-b/        # 独立的 H5 子项目 B
      index.html

/src
  /components          # React 核心组件库
    Header.jsx         # 顶部导航（搜索、暗黑模式切换）
    Sidebar.jsx        # 左侧边栏（标签分类过滤）
    ProjectCard.jsx    # 项目展示卡片
    PreviewPane.jsx    # Iframe 预览面板
  App.jsx              # 主页面与状态管理
```

---

## 🛠️ 数据源设计 (Mock API)

项目规定**不依赖静态的 `projects.json`**，而是通过向 `/api/projects` 发起 GET 请求动态获取项目列表。
在开发环境中，我们在 `vite.config.js` 中使用了 `configureServer` 中间件来拦截该请求，并返回 Mock 数据：

```json
[
  {
    "name": "项目名称",
    "path": "/projects/project-X/",
    "tags": ["游戏", "工具"],
    "thumbnail": "/projects/project-X/cover.png"
  }
]
```
> **提示**：未来部署时，您可以将该 API 替换为 Cloudflare Workers 或任何 Serverless 后端提供的真实接口。同时 React 代码中包含了备用的 Fallback 数据，以便在完全静态的环境下依然可以运行 Demo。

---

## 🚀 快速开始

### 1. 安装依赖

确保您的环境中已安装 [Node.js](https://nodejs.org/)。

```bash
npm install
```

### 2. 运行本地开发服务器

```bash
npm run dev
```
运行后，访问 `http://localhost:5173` 即可看到精美的 Pro 版导航主页。

### 3. 构建发布版本

```bash
npm run build
```
执行完毕后，项目会被打包到 `dist` 目录。您可以直接将 `dist` 目录上传至服务器或静态页面托管平台。

---

## 🖌 配置说明

- **样式与主题**：项目使用了完整的 Tailwind CSS v4 标准，样式配置入口为 `src/index.css`。如果您需要修改主题颜色变量，请在该文件中调整 `--background` 和 `--foreground` 的原生 CSS 变量。
- **更新子项目**：如果您想添加新的 H5 项目，只需将其完整文件夹（例如 `my-new-app/`）放到 `public/projects/` 下，然后确保可以通过 `/api/projects` API 返回对应的元数据即可（或在 `App.jsx` 的 Mock Fallback 数组中手动追加）。

---

## ☁️ 部署到 Cloudflare Pages (详细教程)

本项目天然支持作为**纯静态站点**部署至 Cloudflare Pages。无需任何服务器费用，同时享有全球 CDN 加速。

### 步骤 1：准备工作
1. 确保您的项目已经推送到了 GitHub 仓库（例如 `Chenming00/Mings-project`）。
2. 使用您的 GitHub 账号注册并登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。

### 步骤 2：创建 Pages 应用
1. 在 Cloudflare 面板左侧边栏，点击 **"Workers 和 Pages" (Workers & Pages)**。
2. 点击蓝色的 **"创建应用" (Create application)** 按钮。
3. 选择 **"Pages"** 选项卡。
4. 点击 **"连接到 Git" (Connect to Git)**。
5. 选择您的 GitHub 账户，并在弹出的授权窗口中选择本项目对应的仓库 (`Chenming00/Mings-project`)。
6. 点击 **"开始设置" (Begin setup)**。

### 步骤 3：配置构建逻辑
在配置页面中，请填写以下**关键部署参数**：
- **项目名称 (Project name)**: 默认即可（例如 mings-project）。
- **生产分支 (Production branch)**: `main` 或 `master`。
- **框架预设 (Framework preset)**: 可以在下拉菜单中选择 `Vite` 或者是 `None`。
- **构建命令 (Build command)**: 填写 `npm run build`。
- **构建输出目录 (Build output directory)**: 填写 `dist`。（**非常重要！**）

### 步骤 4：保存并部署
- 确认上述构建信息无误后，点击 **"保存并部署" (Save and Deploy)**。
- Cloudflare 会自动拉取您的源码、安装依赖、并执行构建。在控制台输出中看到绿色的成功提示后，您的项目就已经上线了！ 🎉
- 以后您每次往 GitHub `main` 分支 `push` 新代码或添加新的 H5 项目文件夹，Cloudflare 都会自动为您重新构建并发布。

---

## 🧑‍💻 开发者信息

**Auther**: Chenming00
**Project**: Mings-project
