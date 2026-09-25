import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProjectCard from './components/ProjectCard';
import ProjectListRow from './components/ProjectListRow';
import PreviewPane from './components/PreviewPane';
import {
  AlertCircle,
  ArrowUpRight,
  FolderOpen,
  Inbox,
  LayoutGrid,
  List,
  Loader2,
  SearchX,
  Sparkles,
} from 'lucide-react';

const FALLBACK_PROJECTS = [
  { name: 'Interactive Particles', path: '/projects/project-a/index.html', tags: ['animation'] },
  { name: 'Canvas Game', path: '/projects/project-b/index.html', tags: ['game'] },
];

export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') || 'grid');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/projects.json');
        if (!response.ok) throw new Error('项目清单加载失败');
        setProjects(await response.json());
      } catch (fetchError) {
        setError(fetchError.message);
        setProjects(FALLBACK_PROJECTS);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const tagCounts = useMemo(() => {
    const counts = new Map();
    projects.forEach(project => {
      project.tags?.forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return Object.fromEntries(counts);
  }, [projects]);

  const allTags = useMemo(() => Object.keys(tagCounts).sort(), [tagCounts]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return projects.filter(project => {
      const matchesSearch = !query || [project.name, ...(project.tags || [])]
        .some(value => String(value).toLowerCase().includes(query));
      const matchesTag = selectedTag ? project.tags?.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [projects, searchQuery, selectedTag]);

  const hasActiveFilter = Boolean(searchQuery.trim() || selectedTag);
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
  };
  const handleOpenNew = project => {
    const openedWindow = window.open(project.path, '_blank', 'noopener,noreferrer');
    if (openedWindow) openedWindow.opener = null;
  };

  return (
    <div className="app-shell min-h-svh text-gray-950 transition-colors duration-300 dark:text-gray-100">
      <div className="surface-grid pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      <Sidebar
        projectCount={projects.length}
        tags={allTags}
        tagCounts={tagCounts}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="relative z-10 flex min-h-svh min-w-0 flex-col md:pl-[264px]">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDark={isDark}
          toggleDark={() => setIsDark(current => !current)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
          <section className="animate-page-enter relative isolate mb-6 overflow-hidden rounded-[26px] border border-white/80 bg-white/80 px-5 py-6 shadow-[0_20px_60px_-32px_rgba(79,70,229,0.35)] backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.045] sm:px-8 sm:py-7">
            <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20" />
            <div className="pointer-events-none absolute -bottom-32 right-1/4 h-64 w-64 rounded-full bg-fuchsia-400/10 blur-3xl dark:bg-purple-500/10" />

            <div className="relative z-10 flex items-center justify-between gap-8">
              <div className="max-w-3xl">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                  <Sparkles size={14} />
                  <span>CURATED H5 COLLECTION</span>
                </div>
                <h1 className="text-balance text-[clamp(1.7rem,4vw,3rem)] font-bold leading-[1.08] tracking-[-0.045em] text-gray-950 dark:text-white">
                  把灵感收进一个
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">会发光的数字空间</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400 sm:text-[15px]">
                  从灵感到成品，在一个轻盈、安静的界面里探索你的 H5 作品集。
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2.5" aria-label="项目概览">
                  <div className="flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                    <FolderOpen size={13} className="text-indigo-500" />
                    {loading ? '正在统计' : `${projects.length} 个项目`}
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                    <Sparkles size={13} className="text-violet-500" />
                    {allTags.length} 个分类
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                    <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-emerald-500" />
                    支持实时预览
                  </div>
                </div>
              </div>

              <div className="relative hidden h-40 w-40 shrink-0 lg:block" aria-hidden="true">
                <div className="absolute inset-2 rounded-[36px] rotate-6 border border-indigo-200/70 bg-white/45 shadow-xl shadow-indigo-200/30 dark:border-indigo-400/20 dark:bg-white/5 dark:shadow-indigo-950/40" />
                <div className="absolute inset-2 -rotate-3 rounded-[36px] border border-fuchsia-200/50 bg-gradient-to-br from-white/75 to-indigo-50/70 dark:border-fuchsia-400/15 dark:from-white/10 dark:to-violet-950/40">
                  <div className="flex h-full items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-xl shadow-indigo-500/30">
                      <Sparkles size={28} />
                    </div>
                  </div>
                </div>
                <div className="absolute -right-2 top-2 h-5 w-5 rounded-full border-4 border-white bg-fuchsia-500 dark:border-[#14151d]" />
                <div className="absolute -bottom-1 left-1 h-4 w-4 rounded-full border-4 border-white bg-indigo-500 dark:border-[#14151d]" />
              </div>
            </div>
          </section>

          {error && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <span>{error}，当前已展示备用项目。</span>
              <button onClick={() => window.location.reload()} className="shrink-0 font-bold underline underline-offset-4">
                重新加载
              </button>
            </div>
          )}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="truncate text-lg font-bold tracking-tight text-gray-950 dark:text-white sm:text-xl">
                  {selectedTag ? `# ${selectedTag}` : '全部项目'}
                </h2>
                {!loading && (
                  <span className="rounded-full bg-gray-200/70 px-2 py-0.5 text-[11px] font-bold text-gray-600 dark:bg-white/8 dark:text-gray-300">
                    {filteredProjects.length}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 sm:text-[13px]">
                {selectedTag
                  ? `正在浏览「${selectedTag}」分类`
                  : hasActiveFilter
                    ? '已根据你的搜索条件筛选'
                    : '选择一个项目，即可在当前页面快速预览'}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-gray-500 transition-colors hover:bg-white hover:text-indigo-600 hover:shadow-sm dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-indigo-300"
                >
                  <SearchX size={14} />
                  清除筛选
                </button>
              )}

              <div className="flex items-center gap-1 rounded-xl border border-gray-200/80 bg-white/80 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <button
                  onClick={() => setViewMode('grid')}
                  title="卡片视图"
                  aria-label="切换到卡片视图"
                  aria-pressed={viewMode === 'grid'}
                  className={`flex h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold transition-all sm:px-3 ${
                    viewMode === 'grid'
                      ? 'bg-gray-950 text-white shadow-md dark:bg-indigo-500'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/8 dark:hover:text-gray-200'
                  }`}
                >
                  <LayoutGrid size={15} />
                  <span className="hidden sm:inline">卡片</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="列表视图"
                  aria-label="切换到列表视图"
                  aria-pressed={viewMode === 'list'}
                  className={`flex h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold transition-all sm:px-3 ${
                    viewMode === 'list'
                      ? 'bg-gray-950 text-white shadow-md dark:bg-indigo-500'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/8 dark:hover:text-gray-200'
                  }`}
                >
                  <List size={15} />
                  <span className="hidden sm:inline">列表</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-[360px] flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-xl shadow-indigo-500/25">
                  <Loader2 className="animate-spin text-white" size={27} />
                </div>
                <div className="absolute inset-0 -z-10 animate-soft-pulse rounded-2xl bg-indigo-500/30 blur-xl" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">正在整理项目空间</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">马上就好，请稍候…</p>
              </div>
            </div>
          ) : error && projects.length === 0 ? (
            <div className="flex h-[360px] flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                <AlertCircle size={30} />
              </div>
              <div>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">项目加载失败</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">请检查网络后刷新页面重试</p>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex h-[360px] flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-300">
                <Inbox size={30} strokeWidth={1.6} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">没有找到匹配的项目</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">换个关键词，或清除当前筛选条件</p>
              </div>
              <button
                onClick={clearFilters}
                className="mt-1 flex items-center gap-1.5 rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-bold text-white transition-transform hover:-translate-y-0.5 dark:bg-indigo-500"
              >
                查看全部项目
                <ArrowUpRight size={14} />
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredProjects.map((project, index) => (
                <ProjectCard
                  key={project.path || project.name}
                  project={project}
                  index={index}
                  onClick={setSelectedProject}
                  onOpenNew={handleOpenNew}
                  onTagClick={tag => setSelectedTag(tag)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredProjects.map((project, index) => (
                <ProjectListRow
                  key={project.path || project.name}
                  project={project}
                  index={index}
                  onClick={setSelectedProject}
                  onOpenNew={handleOpenNew}
                  onTagClick={tag => setSelectedTag(tag)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <PreviewPane
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onOpenNew={handleOpenNew}
      />
    </div>
  );
}
