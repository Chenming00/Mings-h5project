# 奇点空间 | Singularity Space

<div align="center">

**一个现代化的 H5 创意项目展示平台**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&labelColor=20232A)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&labelColor=1a1a2e)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white&labelColor=0f172a)](https://tailwindcss.com)

![Singularity Space Banner](https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop)

</div>

---

## 🌟 简介

**奇点空间** 是一个精心设计的 H5 项目聚合展示平台，采用现代设计语言和流畅的交互动画，为你的创意项目提供完美的展示舞台。

> 🎨 **设计理念**: 简约而不简单，每一处细节都经过精心打磨

---

## ✨ 核心特性

| 特性 | 描述 |
|------|------|
| 🎨 **现代 UI 设计** | 渐变色彩、毛玻璃效果、流畅动画，打造沉浸式视觉体验 |
| 🌗 **深色模式** | 精心调校的深色主题，护眼且富有科技感 |
| 📱 **完全响应式** | 从手机到桌面，所有设备完美适配 |
| 🔍 **智能搜索** | 实时搜索过滤，快速定位目标项目 |
| 🏷️ **标签分类** | 支持多维度标签筛选，项目管理更高效 |
| 👁 **沉浸预览** | 侧边面板直接运行项目，无需跳转新页面 |
| 📊 **双视图模式** | 卡片网格 / 紧凑列表，一键切换 |
| ⚡ **极速加载** | Vite 构建，秒级启动 |
| 💾 **偏好记忆** | 视图模式、深色主题自动保存 |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm / yarn / pnpm

### 安装

```bash
# 克隆项目
git clone https://github.com/Chenming00/Mings-project.git
cd Mings-project

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 即可预览

### 构建生产版本

```bash
npm run build
npm run preview
```

---

## 📁 添加新项目

只需将项目放入 `public/projects/` 目录，系统会自动扫描并生成展示：

```
public/
└── projects/
    └── my-awesome-project/
        ├── index.html    ← 入口文件（标题将作为卡片名称）
        └── cover.png     ← 封面图（可选，推荐 16:9 比例）
```

### 项目元数据

系统会自动读取 HTML 文件的 `<title>` 作为项目名称，你也可以在 HTML 中添加自定义标签：

```html
<!-- 在 HTML 中添加 data-tags 属性 -->
<html data-tags="animation,game,interactive">
```

---

## 🎨 设计亮点

### 色彩系统

采用现代渐变色彩方案：

```
Indigo (#6366f1) → Purple (#a855f7) → Pink (#ec4899)
```

### 动画效果

- **悬停反馈**: 卡片上浮、缩放、阴影变化
- **页面过渡**: 淡入淡出、滑入滑出
- **加载状态**: 脉冲光晕、旋转动画
- **按钮交互**: 渐变背景、图标旋转

### 深色模式

精心调校的深色配色方案，在保持视觉舒适的同时展现科技感：

```css
背景：#030712 → #0e1024
强调色：#6366f1 → #a855f7
```

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | UI 框架 |
| Vite | 8.x | 构建工具 |
| Tailwind CSS | 4.x | 样式框架 |
| Lucide React | latest | 图标库 |
| clsx | latest | 条件类名工具 |

---

## 📂 项目结构

```
h5-agg/
├── public/
│   ├── favicon.svg          # 网站图标
│   ├── projects/            # H5 子项目目录
│   └── projects.json        # 自动生成的项目清单
├── scripts/
│   └── generate-projects.js # 项目扫描脚本
├── src/
│   ├── components/
│   │   ├── Header.jsx       # 顶部导航栏
│   │   ├── Sidebar.jsx      # 侧边分类栏
│   │   ├── ProjectCard.jsx  # 项目卡片组件
│   │   ├── ProjectListRow.jsx # 项目列表行组件
│   │   └── PreviewPane.jsx  # 预览面板组件
│   ├── App.jsx              # 主应用组件
│   ├── main.jsx             # 入口文件
│   └── index.css            # 全局样式
├── index.html               # HTML 模板
├── package.json             # 项目配置
└── vite.config.js           # Vite 配置
```

---

## 🌐 部署

### Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages → 创建应用 → Pages
3. 连接 GitHub 仓库 `Chenming00/Mings-project`
4. 配置构建设置：
   - **框架预设**: Vite
   - **构建命令**: `npm run build`
   - **输出目录**: `dist`
5. 保存后自动部署

### Vercel

1. 登录 [Vercel](https://vercel.com/)
2. Import GitHub Repository
3. 自动检测 Vite 框架，一键部署

### Netlify

1. 登录 [Netlify](https://netlify.com/)
2. 连接 GitHub 仓库
3. 配置构建命令和输出目录

---

## 📝 开发脚本

| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动开发服务器（自动扫描项目） |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 代码检查 |

---

## 🎯 浏览器支持

| 浏览器 | 最低版本 |
|--------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## 📄 许可证

MIT License © 2024 Chenming00

---

<div align="center">

### 奇点空间 | Singularity Space

*探索创意无限的数字宇宙*

---

👨‍💻 Created by **Chenming00**

🤖 **AI Powered by Qwen 3.5 Plus**

本项目由阿里巴巴通义千问 **Qwen 3.5 Plus** 模型生成代码

⭐ 如果这个项目对你有帮助，请给一个 Star

</div>