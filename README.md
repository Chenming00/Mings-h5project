# 奇点空间 | Singularity Space

<div align="center">

**一个 H5 创意项目的聚合展厅**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&labelColor=20232A)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&labelColor=1a1a2e)](https://vitejs.dev)
[![CI](https://img.shields.io/badge/CI-lint%20%C2%B7%20verify%20%C2%B7%20build-3d6b4a?labelColor=20232A)](.github/workflows/ci.yml)

</div>

---

## 🌟 简介

主站是一个 React 应用，负责把 `public/projects/` 下的独立 H5 作品聚合成一个可搜索、可筛选、可内嵌预览的展厅。每个子项目都是**完全自治的单文件应用**——自己的样式、自己的脚本、自己的交互，主站只负责发现它们、展示它们、把它们装进预览面板。

> 一个项目 = 一个目录 + 一个 `index.html`。没有构建步骤，没有共享运行时，互不干扰。

---

## ✨ 功能

| 能力 | 说明 |
|------|------|
| 🔍 实时搜索 | 匹配标题、描述、标签（含中文标签名），300ms 防抖 |
| 🏷️ 分类筛选 | 标签来自每个项目自己的 `data-tags`，侧边栏计数实时统计 |
| 👁 内嵌预览 | 右侧面板直接运行作品，支持刷新、全屏、新标签页打开 |
| 📊 双视图 | 卡片网格 / 紧凑列表，偏好写入 localStorage |
| 🌗 深色模式 | 跟随系统偏好，可手动切换，且不闪白 |
| 🔗 深链分享 | `?p=` / `?q=` / `?tag=` 同步到地址栏，可收藏可分享 |
| ♿ 键盘可用 | 焦点陷阱、Esc 关闭、`/` 聚焦搜索、跳转链接 |

---

## 🚀 开始

```bash
npm install
npm run dev      # http://localhost:5173
```

生产构建：

```bash
npm run build    # 输出到 dist/
npm run preview
```

要求 Node.js **≥ 20.19**（Vite 8 的要求）。

---

## 📁 添加新项目

把目录放进 `public/projects/` 即可，`predev` / `prebuild` 会自动扫描：

```
public/projects/my-awesome-project/
├── index.html      ← 入口，必须存在（index.htm 也行）
├── cover.webp      ← 封面（可选，推荐 16:9）
└── image/          ← 其他资源（可选）
```

### 两件必须做的事

**1. 打标签**（否则作品只会出现在「全部作品」里，进不了任何分类）：

```html
<html lang="zh-CN" data-tags="data,map">
```

可用的标签 id：`data` `map` `interactive` `game` `motion` `animation` `tools` `calculator` `finance` `personal` `portfolio` `resume` `quiz` `audio` `generative`。

> 构建时若发现项目没有标签，会在终端给出明确告警并列出目录名。

**2. 加视觉描述**（可选但强烈建议）——在 `src/data/projectPresentation.js` 的 `presentations` 里按 slug 注册：

```js
'my-awesome-project': {
  displayTitle: '我的作品 · 副标题',
  description: '一句话说清它解决什么问题。',
  artwork: 'neon',      // 无封面时的占位插画风格，见 ProjectArtwork.jsx
  displayOrder: 9,      // 数字越小越靠前
  label: 'CATEGORY / TAGLINE',
  featured: false,      // 设为 true 会占用首页的发现位
},
```

> **标签只有一个来源**：HTML 的 `data-tags`。以前这里也抄了一份，导致新增项目忘了改 JS 就会静默丢失分类，所以已经移除。

### URL 规则

作品以 `/projects/<目录名>/` 的目录形式对外暴露，不带 `index.html`。本地由 `vite.config.js` 的中间件补齐，生产由静态托管原生处理，两边行为一致。

**目录名就是 slug**，请用小写短横线。要改 slug 就在 `project.json` 里写 `slug` 字段，但**目录名不会跟着变**，因此必须手动在 `public/_redirects` 加一条映射：

```
/projects/新slug/*   /projects/原目录名/:splat   200
```

### 可选的 project.json

```json
{
  "title": "展示名称",
  "slug": "url-slug",
  "tags": ["game", "interactive"],
  "cover": "cover.jpg",
  "order": 10
}
```

| 字段 | 说明 |
|------|------|
| `title` | 覆盖 `<title>` |
| `slug` | 覆盖 URL slug（需自行补 `_redirects`，见上） |
| `tags` | 覆盖 `data-tags`；两者都不写则回退到 `["project"]` |
| `cover` | 指定封面文件名；不写则按 webp → avif → png → jpg 自动探测 |
| `order` | 数字越小越靠前，未设置的排在后面并按 slug 排序 |

`<meta name="project-tags" content="game,quiz">` 也可以代替 `data-tags`。

### 旧地址兼容

`public/_redirects` 是**纯手写文件**，脚本不再改写它。已内置历史占位目录名（`project-a` 等）到新 slug 的 301 规则，**请勿删除**。

---

## 🔗 分享与深链

| 参数 | 作用 | 示例 |
|------|------|------|
| `p` | 直接打开指定项目的预览 | `/?p=neon-pulse` |
| `q` | 预填搜索关键词 | `/?q=可口可乐` |
| `tag` | 预选分类 | `/?tag=game` |

打开预览会 push 一条历史记录，关闭用 `history.back()` 回退——所以浏览器返回键永远只需按一次。搜索与标签切换走 `replaceState`，不污染后退栈。`p` 指向已下线项目时参数会被自动清除。

根页面已声明 `canonical`，查询参数不会被搜索引擎当成重复页面。

---

## 🎨 设计系统

配色是大地色系，**不是**渐变霓虹——所有颜色收敛在 `src/index.css` 顶部的 CSS 变量里，改一处全站生效：

| 变量 | 浅色 | 深色 | 用途 |
|------|------|------|------|
| `--bg` | `#fafaf7` | `#191e1b` | 页面底色（纸张感） |
| `--surface` | `#fff` | `#222823` | 卡片 |
| `--ink` | `#30362f` | `#e4e8dd` | 正文 |
| `--muted` | `#858a80` | `#a0a99b` | 次要文字 |
| `--accent` | `#cc6844` | `#edac87` | 强调（陶土橙） |
| `--green` | `#5d755a` | `#adc49e` | 状态点 |

动效全部尊重 `prefers-reduced-motion`。

---

## 🛠 技术栈（真实情况）

| 技术 | 版本 | 实际用途 |
|------|------|----------|
| React | 19.x | UI，函数组件 + Hooks |
| Vite | 8.x | 构建、开发服务器、`public/` 直出 |
| **手写 CSS** | — | **`src/index.css` 全部样式**，BEM 风格类名 |
| Tailwind CSS | 4.x | **仅提供 preflight 重置与 `dark` variant**，组件里没有工具类 |
| Lucide React | 0.577 | 图标 |
| ESLint | 9.x | 含 `eslint-plugin-react` 的 `jsx-uses-vars` |

> Tailwind 在这套代码里只承担 reset 的角色。保留它是因为 preflight 已经和手写样式长期共存、去掉会改变排版基线；如果你想彻底移除，需要先为 `h1`–`h6`、`p`、`ul`、`img` 补上等价重置。

---

## 📂 项目结构

```
.
├── .github/workflows/ci.yml  # lint → verify → build
├── docs/                     # 子项目说明文档（不参与构建）
├── public/
│   ├── _headers              # Cloudflare Pages 安全头与缓存策略
│   ├── _redirects            # 手写 301 规则
│   ├── og-cover.jpg          # 1200×630 分享图
│   ├── projects.json         # 构建产物，已 gitignore
│   └── projects/             # 14 个独立 H5 作品
├── scripts/
│   └── generate-projects.js  # 扫描目录 → projects.json
├── src/
│   ├── components/           # Header / Sidebar / Card / PreviewPane …
│   ├── data/                 # 分类、标签名、展示元数据
│   ├── hooks/                # useProjectUrlState
│   ├── lib/environment.js    # localStorage 与主题的安全封装
│   ├── App.jsx
│   └── index.css
├── tools/                    # 无头回归与资源脚本（不参与构建）
│   ├── motion-reel/          # check-reel / check-audio / check-boot / make-cover
│   ├── sbti/                 # check-timers
│   ├── optimize-images.py    # 位图 → WebP
│   └── ...
└── vite.config.js
```

---

## 🧪 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器（自动扫描项目） |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建产物 |
| `npm run lint` | ESLint |
| `npm run verify` | 无头回归：motion-reel 渲染/音频、sbti 计时器 |
| `npm run check` | `lint` + `verify`，提交前跑这个 |
| `npm run assets` | 位图转 WebP（需 `pip install pillow`） |

四个回归脚本都跑在 Node `vm` 里，用 Canvas2D / WebAudio / DOM stub 无头驱动真实模块，不需要浏览器。它们原先放在 `public/` 下，会被一起发布到线上，现在已移到 `tools/`。

---

## ⚠️ 维护须知：预览面板的信任边界

预览 iframe 使用 `sandbox="allow-scripts allow-same-origin …"`。当被嵌入内容与主站**同源**时，这两个权限组合不再提供隔离——子页面可以访问父页面 DOM，也能读写主站 localStorage。

这是有意为之的取舍：`pet-spread-calculator` 依赖同源存储保存成交记录，去掉 `allow-same-origin` 会让它无法保存数据。

**因此：`public/projects/` 下只能放你自己写的代码。** 如果要托管第三方作品，请把它部署到独立子域（如 `projects.example.com`），并从 `PreviewPane.jsx` 的 sandbox 列表里去掉 `allow-same-origin`。

---

## 🌐 部署

### Cloudflare Pages（当前配置）

| 设置 | 值 |
|------|-----|
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |

`public/_headers` 会随构建进入 `dist/`，为全站加上 `nosniff`、`Referrer-Policy`、`Permissions-Policy`、`X-Frame-Options` 与 CSP，并给 `/assets/*` 打上一年期 `immutable` 缓存。

CSP 目前允许 `'unsafe-inline'`，因为每个作品都内联了自己的 `<style>`/`<script>`；同时为 `cdn.jsdelivr.net`（中国版地图字体）与 `fonts.googleapis.com`（motion-reel 字体）开了白名单。收紧 CSP 需要先把内联块改成带 nonce 的构建产物。

### 其他平台

Vercel / Netlify 可直接用 Vite 预设；注意 `_headers` 与 `_redirects` 是 Cloudflare 专有格式，换平台需改写为 `vercel.json` 或 `netlify.toml`。

---

## 🎯 浏览器支持

Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+。WebP、`:has()` 之外的特性均按此基线选型；`100svh`、`dialog`、`color-mix()` 在基线内可用。

---

## 📄 许可证

MIT License © 2024 Chenming00
