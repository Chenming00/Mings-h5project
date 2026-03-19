<div align="center">

# H5 Hub

一个基于 React + Vite 构建的静态 H5 项目聚合展示平台

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&labelColor=20232A)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&labelColor=1a1a2e)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white&labelColor=0f172a)](https://tailwindcss.com)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-deployed-F6821F?logo=cloudflare&logoColor=white&labelColor=1a1a1a)](https://pages.cloudflare.com)

</div>

---

## 核心功能

| 功能 | 说明 |
|------|------|
| 🤖 **自动发现** | 扫描 `public/projects/` 目录，自动识别项目并生成清单，无需手动配置 |
| 🔍 **搜索 & 过滤** | 实时按名称搜索，支持标签分类筛选 |
| 👁 **沉浸预览** | 点击卡片在右侧面板内直接运行 H5 子项目，无需跳转新页面 |
| 🌗 **深色模式** | 跟随系统或手动切换，偏好记忆持久化 |
| 📱 **全端适配** | iPhone / iPad / Mac / PC 完整响应式设计 |
| ⚡ **纯静态** | 无服务器依赖，直接部署至 Cloudflare Pages / Vercel |

---

## 添加新项目

只需把你的项目文件夹放入 `public/projects/`，无需改任何代码：

```
public/
└── projects/
    └── my-app/
        ├── index.html    ← 入口文件（<title> 会作为卡片标题）
        └── cover.png     ← 封面图（可选，16:9 最佳）
```

> **支持的入口文件：** `index.html` → `index.htm` → 任意 `.html`/`.htm`

执行 `npm run dev` 或 `npm run build` 时，系统自动扫描并更新项目列表。

---

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev
# → http://localhost:5173

# 构建生产包
npm run build
# → dist/
```

---

## 部署到 Cloudflare Pages

1. 在 [Cloudflare 控制台](https://dash.cloudflare.com/) → Workers & Pages → 创建应用 → Pages → 连接 Git
2. 选择仓库 `Chenming00/Mings-project`，填入构建配置：

   | 配置项 | 值 |
   |--------|-----|
   | 框架预设 | `Vite` |
   | 构建命令 | `npm run build` |
   | 输出目录 | `dist` |

3. 保存后每次 `git push` 自动触发重新构建并发布。

---

## 项目结构

```
├── public/
│   ├── projects/          # H5 子项目（静态资源，直接 URL 访问）
│   └── projects.json      # 自动生成的项目清单（勿手动修改）
├── scripts/
│   └── generate-projects.js  # 项目扫描脚本（predev/prebuild 自动执行）
└── src/
    ├── components/        # React 组件（Header / Sidebar / ProjectCard / PreviewPane）
    └── App.jsx            # 主页面
```

---

<div align="center">

Made by **Chenming00**

---

🤖 本项目由 [Google Antigravity](https://deepmind.google/technologies/gemini/) AI 编程助手自动完成开发

使用模型：`Gemini 3.1 Pro (High)` · `Claude Sonnet 4.6 (Thinking)`

</div>
