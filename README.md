# H5 项目集合平台 (Pro Version) 🚀

这是一个基于 **React 19 + Vite + Tailwind CSS v4** 构建的专业级前端 H5 迷你项目托管聚合平台。它被设计为一个“前端项目画廊”或“工具导航站”，允许您在一个精美的主界面中集中展示、分类和预览各种独立的静态 H5 小应用。

## ✨ 核心特性

- **🚀 极致性能**：采用 Vite 构建，原生 ES 模块化开发，提供闪电般的启动和热更新速度。
- **🤖 自动化项目识别 [NEW]**：采用智能化脚本，只需将项目文件夹扔进 `public/projects/`，依靠 `npm run dev` 或 `build`，系统会自动扫描并将其提取并展示，彻底告别手动配置！
- **📱 响应式现代 UI**：使用了 Tailwind CSS 进行高度定制，完美适配各种尺寸屏幕（PC、平板、手机自动切换抽屉式侧边栏）。
- **🌗 暗黑模式 (Dark Mode)**：提供系统级/手动切换深色模式支持，默认遵循 Pro 设计语言（深色优先）。
- **🔍 动态搜索与标签过滤**：能够根据项目名称进行实时搜索，并支持按类别（Tags）快速筛选。
- **💻 沉浸式 Iframe 预览**：点击项目卡片，即可在右侧（或全屏）顺滑滑出的面板中，直接运行并预览子项目，无需额外打开新标签页。
- **⚡ 纯静态架构**：完全兼容静态托管（如 Cloudflare Pages、Vercel 等），子项目保持完全独立，不受 React 路由机制干扰。

---

## 📂 项目目录结构

项目的核心是将独立的 HTML/JS 项目放置在 `public/projects/` 目录下。这些项目作为纯静态资源可以直接通过 URL 访问。

```text
/public
  /projects
    /project-a/        # 独立的 H5 子项目 A
      index.html       # (必填) 入口文件，可使用 <title> 设置项目显示名称
      cover.png        # (可选) 自动识别的项目封面图片
    /project-b/        

/scripts
  generate-projects.js # 自动化项目扫描核心脚本，在 dev 和 build 之前自动运行

/src
  /components          # React 核心组件库
  App.jsx              # 主页面与状态管理
```

---

## 📦 如何添加独立的新项目 (超级简单)

得益于全新的自动化更新机制，添加一个新的静态 H5 项目仅仅需要一步：

### 步骤 1：放入项目文件
将您的整个项目文件夹（假设叫 `my-awesome-app`）拷贝到 `public/projects/` 目录下。确保项目内包含名为 `index.html` 的入口文件。
**此时您的路径应为**: `/public/projects/my-awesome-app/index.html`

> **专业配置（推荐）**：
> 1. **定制名称**：系统会自动抓取 `index.html` 中的 `<title>这是您的项目名称</title>` 作为卡片标题展示。如果没写，将退化使用您的所在文件夹名 (`my-awesome-app`)。
> 2. **定制封面**：在该文件夹内存放一张名为 `cover.png` 的缩略图，平台会自动提取并展示。如果是游戏或炫酷动画效果，推荐截一张好看的封面！

### 步骤 2：启动/构建
当您执行 `npm run dev` 启动本地测试，或者 `npm run build` 进行打包时，系统自带的 `predev` / `prebuild` 钩子会自动运行扫描代码，生成最新的 `projects.json` 目录。一切都在不知不觉中完成。

### 步骤 3：提交上线
- 完成添加后，在终端执行 Git 提交命令：
  ```bash
  git add .
  git commit -m "feat: 新增我的超酷应用"
  git push
  ```
- **完成！** 等待 Cloudflare/Vercel 的自动化 CI/CD 流程构建结束即可！

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
执行完毕后，项目会被打包到 `dist` 目录。您可以直接将 `dist` 目录上传至服务器或静态页面托管平台。构建过程中会自动为您更新最新的子项目列表。

---

## ☁️ 部署到 Cloudflare Pages (推荐)

本项目天然支持作为**纯静态站点**部署至 Cloudflare Pages。无需任何服务器费用，同时享有全球 CDN 加速。

1. **创建 Pages 应用**: 在 [Cloudflare 控制面板](https://dash.cloudflare.com/)的 **"Workers 和 Pages"** 中，选择 **"创建应用"** -> **"Pages"** -> **"连接到 Git"**，选择本项目对应的 GitHub 仓库 (`Chenming00/Mings-project`) 进行授权。
2. **配置构建参数**:
   - **框架预设 (Framework preset)**: `Vite`
   - **构建命令 (Build command)**: `npm run build`
   - **构建输出目录 (Build output directory)**: `dist`
3. **保存并部署**: 点击部署后，每次向 GitHub 推送新代码，Cloudflare 都会自动为您重新构建并发布。

---

## 🧑‍💻 开发者信息

**Author**: Chenming00  
**Project**: Mings-project
