export const categories = [
  { id: 'data', label: '数据可视化', icon: 'chart' },
  { id: 'interactive', label: '创意交互', icon: 'sparkles' },
  { id: 'motion', label: '动态设计', icon: 'play' },
  { id: 'tools', label: '实用工具', icon: 'tool' },
  { id: 'personal', label: '个人页面', icon: 'user' },
];

export const tagLabels = {
  data: '数据可视化',
  map: '地图',
  interactive: '创意交互',
  game: '小游戏',
  motion: '动态设计',
  tools: '实用工具',
  calculator: '计算器',
  finance: '金融',
  personal: '个人页面',
  portfolio: '作品集',
  resume: '简历',
  quiz: '趣味测试',
  animation: '动画',
  audio: '音频',
  generative: '生成艺术',
  project: '项目',
};

/**
 * Presentation-only metadata, keyed by slug.
 *
 * Tags are deliberately NOT declared here: each project owns its tags through
 * `<html data-tags="…">`, which scripts/generate-projects.js scrapes into
 * projects.json. Duplicating them in this file meant a newly added project
 * appeared untagged and outside every category until someone remembered to edit
 * a hardcoded map — the exact bug this split removes.
 *
 * @type {Record<string, {
 *   displayTitle?: string,
 *   description?: string,
 *   artwork?: string,
 *   label?: string,
 *   displayOrder?: number,
 *   featured?: boolean,
 * }>}
 */
const presentations = {
  'coca-cola-cn': {
    displayTitle: '可口可乐 · 中国供应版图',
    description: '一张地图，看见中国装瓶网络的全貌。',
    artwork: 'china',
    displayOrder: 0,
    label: 'BOTTLER ATLAS / CHINA',
  },
  'motion-reel': {
    displayTitle: 'MOTION REEL · 动态设计实验',
    description: '用 30 秒，把想象力变成流动的视觉语言。',
    artwork: 'motion',
    displayOrder: 1,
    label: 'MOTION & CREATIVE CODING',
    featured: true,
  },
  'neon-pulse': {
    displayTitle: 'NEON PULSE · 反应竞技场',
    description: '跟随霓虹的节奏，挑战你的反应极限。',
    artwork: 'neon',
    displayOrder: 2,
    label: 'PLAY / REACT / REPEAT',
  },
  'pet-load-planner': {
    displayTitle: 'PET 装柜计算器',
    description: '让每一寸空间，都有更高效的装载方案。',
    artwork: 'load',
    displayOrder: 3,
    label: 'SMART TOOLS / LOGISTICS',
  },
  'pet-spread-calculator': {
    displayTitle: 'PET 三腿价差计算器',
    description: '聚合关键价格，直观分析聚酯产业链价差。',
    artwork: 'finance',
    displayOrder: 4,
    label: 'SMART TOOLS / FINANCE',
  },
  'coca-cola-us': {
    displayTitle: '可口可乐 · 美国供应版图',
    description: '探索美国装瓶体系，连接数据与地理。',
    artwork: 'usa',
    displayOrder: 5,
    label: 'BOTTLER ATLAS / UNITED STATES',
  },
  portfolio: {
    displayTitle: 'Ming Chen · 个人主页',
    description: '关于市场研究、产品构建，以及更多可能。',
    artwork: 'portfolio',
    displayOrder: 6,
    label: 'RESEARCH / DESIGN / BUILD',
  },
  resume: {
    displayTitle: '俞可宁 · 在线简历',
    description: '以简洁的方式，呈现经历与专业能力。',
    artwork: 'resume',
    displayOrder: 7,
    label: 'EXPERIENCE / PROFILE',
  },
  sbti: {
    displayTitle: 'SBTI · 赛博人格测试',
    description: '一次不太正经、但也许很懂你的性格探索。',
    artwork: 'sbti',
    displayOrder: 8,
    label: 'A LITTLE WEIRD / A LOT OF YOU',
  },
  'gravity-well': {
    displayTitle: 'GRAVITY WELL · 引力沙盒',
    description: '用手指搅动一片星云：引力、排斥、漩涡三种力场。',
    artwork: 'gravity',
    displayOrder: 9,
    label: 'PARTICLE PHYSICS / PLAY',
  },
  'beat-forge': {
    displayTitle: 'BEAT FORGE · 十六步鼓机',
    description: '在浏览器里合成一整套鼓组，编一段属于你的节奏。',
    artwork: 'beat',
    displayOrder: 10,
    label: 'RHYTHM / WEB AUDIO',
  },
  'maze-weave': {
    displayTitle: 'MAZE WEAVE · 迷宫编织',
    description: '递归回溯实时开凿，广度优先把解法走给你看。',
    artwork: 'maze',
    displayOrder: 11,
    label: 'GENERATIVE / ALGORITHM',
  },
  'type-clock': {
    displayTitle: 'TYPE CLOCK · 排版时钟',
    description: '只有时间本身：巨大的数字，和一条走完当天的细线。',
    artwork: 'clock',
    displayOrder: 12,
    label: 'MINIMAL / TIME',
  },
  'poster-lab': {
    displayTitle: 'POSTER LAB · 海报实验室',
    description: '写一句话，自动排成一张瑞士风海报，可导出 PNG。',
    artwork: 'poster',
    displayOrder: 13,
    label: 'TYPOGRAPHY / GENERATOR',
  },
};

/**
 * @typedef {Object} ProjectRecord
 * @property {string} name
 * @property {string} slug
 * @property {string} path
 * @property {string[]} tags
 * @property {string} [thumbnail]
 * @property {number} [order]
 *
 * @typedef {ProjectRecord & {
 *   displayTitle: string,
 *   description: string,
 *   displayOrder: number,
 *   artwork: string,
 *   label: string,
 *   featured: boolean,
 * }} PresentedProject
 */

/**
 * Merge a raw projects.json record with its presentation metadata.
 *
 * @param {ProjectRecord} project
 * @returns {PresentedProject}
 */
export function enrichProject(project) {
  const presentation = presentations[project.slug] || {};
  return {
    ...project,
    displayTitle: project.name || project.slug,
    description: '一个关于代码与灵感的小小实验。',
    displayOrder: 100,
    artwork: 'default',
    label: 'EXPERIMENT / H5',
    featured: false,
    ...presentation,
    tags: Array.isArray(project.tags) ? project.tags : [],
  };
}
