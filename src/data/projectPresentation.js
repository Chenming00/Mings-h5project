export const categories = [
  { id: 'data', label: '数据可视化', icon: 'chart' },
  { id: 'interactive', label: '创意交互', icon: 'sparkles' },
  { id: 'motion', label: '动态设计', icon: 'play' },
  { id: 'tools', label: '实用工具', icon: 'tool' },
  { id: 'personal', label: '个人页面', icon: 'user' },
];
export const tagLabels = { data: '数据可视化', map: '地图', interactive: '创意交互', game: '小游戏', motion: '动态设计', tools: '实用工具', calculator: '计算器', finance: '金融', personal: '个人页面', portfolio: '作品集', resume: '简历', quiz: '趣味测试', animation: '动画', project: '项目' };
const presentations = {
  'coca-cola-cn': { displayTitle: '可口可乐 · 中国供应版图', description: '一张地图，看见中国装瓶网络的全貌。', tags: ['data', 'map'], artwork: 'china', displayOrder: 0, label: 'BOTTLER ATLAS / CHINA' },
  'motion-reel': { displayTitle: 'MOTION REEL · 动态设计实验', description: '用 30 秒，把想象力变成流动的视觉语言。', tags: ['motion', 'animation'], artwork: 'motion', displayOrder: 1, label: 'MOTION & CREATIVE CODING' },
  'neon-pulse': { displayTitle: 'NEON PULSE · 反应竞技场', description: '跟随霓虹的节奏，挑战你的反应极限。', tags: ['interactive', 'game'], artwork: 'neon', displayOrder: 2, label: 'PLAY / REACT / REPEAT' },
  'pet-load-planner': { displayTitle: 'PET 装柜计算器', description: '让每一寸空间，都有更高效的装载方案。', tags: ['tools', 'calculator'], artwork: 'load', displayOrder: 3, label: 'SMART TOOLS / LOGISTICS' },
  'pet-spread-calculator': { displayTitle: 'PET 三腿价差计算器', description: '聚合关键价格，直观分析聚酯产业链价差。', tags: ['tools', 'finance', 'calculator'], artwork: 'finance', displayOrder: 4, label: 'SMART TOOLS / FINANCE' },
  'coca-cola-us': { displayTitle: '可口可乐 · 美国供应版图', description: '探索美国装瓶体系，连接数据与地理。', tags: ['data', 'map'], artwork: 'usa', displayOrder: 5, label: 'BOTTLER ATLAS / UNITED STATES' },
  portfolio: { displayTitle: 'Ming Chen · 个人主页', description: '关于市场研究、产品构建，以及更多可能。', tags: ['personal', 'portfolio'], artwork: 'portfolio', displayOrder: 6, label: 'RESEARCH / DESIGN / BUILD' },
  resume: { displayTitle: '俞可宁 · 在线简历', description: '以简洁的方式，呈现经历与专业能力。', tags: ['personal', 'resume'], artwork: 'resume', displayOrder: 7, label: 'EXPERIENCE / PROFILE' },
  sbti: { displayTitle: 'SBTI · 赛博人格测试', description: '一次不太正经、但也许很懂你的性格探索。', tags: ['interactive', 'quiz'], artwork: 'sbti', displayOrder: 8, label: 'A LITTLE WEIRD / A LOT OF YOU' },
};
export function enrichProject(project) {
  const presentation = presentations[project.slug];
  return { ...project, displayTitle: project.name, description: '一个关于代码与灵感的小小实验。', displayOrder: 100, artwork: 'default', label: 'EXPERIMENT / H5', ...presentation, tags: [...new Set([...(presentation?.tags || []), ...(project.tags || [])])] };
}
