import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProjectCard from './components/ProjectCard';
import ProjectListRow from './components/ProjectListRow';
import PreviewPane from './components/PreviewPane';
import {
  AlertCircle,
  ArrowRight,
  FolderOpen,
  Inbox,
  LayoutGrid,
  List,
  Loader2,
  SearchX,
  Tag,
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
    const openedWindow = window.open(project.path, '_blank', 'noopener,noreply');
    if (openedWindow) openedWindow.opener = null;
  };

  return (
    <div className="app-shell min-h-svh bg-[#f8f9fa] text-[#202124] transition-colors duration-200 dark:bg-[#202124] dark:text-[#e8eaed]">
      <Sidebar
        projectCount={projects.length}
        tags={allTags}
        tagCounts={tagCounts}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="relative flex min-h-svh min-w-0 flex-col md:pl-[240px]">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDark={isDark}
          toggleDark={() => setIsDark(current => !current)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1520px] flex-1 px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
          <section className="animate-page-enter mb-6 flex flex-col gap-5 border-b border-[#dadce0] pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-[#5f6368]">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1a73e8] text-white dark:bg-[#8ab4f8] dark:text-[#202124]">
                <FolderOpen size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6]">工作区 / 项目</p>
                <h1 className="mt-0.5 text-2xl font-medium tracking-[-0.02em] text-[#202124] dark:text-[#e8eaed]">项目库</h1>
                <p className="mt-1 text-sm text-[#5f6368] dark:text-[#9aa0a6]">统一查看、筛选和预览所有 H5 项目</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2" aria-label="项目概览">
              <div className="flex h-10 items-center gap-2 rounded-lg border border-[#dadce0] bg-white px-3.5 text-sm text-[#3c4043] dark:border-[#5f6368] dark:bg-[#292a2d] dark:text-[#e8eaed]">
                <FolderOpen size={16} className="text-[#1a73e8] dark:text-[#8ab4f8]" />
                <span className="font-medium">{loading ? '—' : projects.length}</span>
                <span>个项目</span>
              </div>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-[#dadce0] bg-white px-3.5 text-sm text-[#3c4043] dark:border-[#5f6368] dark:bg-[#292a2d] dark:text-[#e8eaed]">
                <Tag size={16} className="text-[#34a853]" />
                <span className="font-medium">{allTags.length}</span>
                <span>个分类</span>
              </div>
            </div>
          </section>

          {error && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-[#fdd663] bg-[#fef7e0] px-4 py-3 text-sm text-[#3c4043] dark:border-[#7a5c00] dark:bg-[#3c2f00] dark:text-[#fdd663]">
              <span>{error}，当前显示备用项目。</span>
              <button
                onClick={() => window.location.reload()}
                className="shrink-0 font-medium text-[#1a73e8] hover:underline dark:text-[#8ab4f8]"
              >
                重新加载
              </button>
            </div>
          )}

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium text-[#202124] dark:text-[#e8eaed]">
                  {selectedTag ? `# ${selectedTag}` : '全部项目'}
                </h2>
                {!loading && (
                  <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-xs font-medium text-[#1967d2] dark:bg-[#29435f] dark:text-[#8ab4f8]">
                    {filteredProjects.length}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[#80868b] dark:text-[#9aa0a6]">
                {selectedTag
                  ? `正在浏览「${selectedTag}」分类`
                  : hasActiveFilter
                    ? '已根据当前条件筛选'
                    : '选择项目即可在当前页面预览'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[#1a73e8] transition-colors hover:bg-[#e8f0fe] dark:text-[#8ab4f8] dark:hover:bg-[#29435f]"
                >
                  <SearchX size={16} />
                  清除筛选
                </button>
              )}

              <div className="inline-flex h-10 items-center rounded-lg border border-[#dadce0] bg-white p-1 dark:border-[#5f6368] dark:bg-[#292a2d]">
                <button
                  onClick={() => setViewMode('grid')}
                  title="卡片视图"
                  aria-label="切换到卡片视图"
                  aria-pressed={viewMode === 'grid'}
                  className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors sm:px-3 ${
                    viewMode === 'grid'
                      ? 'bg-[#e8f0fe] text-[#1967d2] dark:bg-[#29435f] dark:text-[#8ab4f8]'
                      : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:bg-[#303134] dark:hover:text-[#e8eaed]'
                  }`}
                >
                  <LayoutGrid size={17} />
                  <span className="hidden sm:inline">卡片</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="列表视图"
                  aria-label="切换到列表视图"
                  aria-pressed={viewMode === 'list'}
                  className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors sm:px-3 ${
                    viewMode === 'list'
                      ? 'bg-[#e8f0fe] text-[#1967d2] dark:bg-[#29435f] dark:text-[#8ab4f8]'
                      : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:bg-[#303134] dark:hover:text-[#e8eaed]'
                  }`}
                >
                  <List size={17} />
                  <span className="hidden sm:inline">列表</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-[360px] flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1a73e8] text-white dark:bg-[#8ab4f8] dark:text-[#202124]">
                <Loader2 className="animate-spin" size={23} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#3c4043] dark:text-[#e8eaed]">正在加载项目</p>
                <p className="mt-1 text-xs text-[#80868b] dark:text-[#9aa0a6]">请稍候…</p>
              </div>
            </div>
          ) : error && projects.length === 0 ? (
            <div className="flex h-[360px] flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#fce8e6] text-[#d93025] dark:bg-[#5c2b29] dark:text-[#f28b82]">
                <AlertCircle size={23} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#d93025] dark:text-[#f28b82]">项目加载失败</p>
                <p className="mt-1 text-xs text-[#80868b] dark:text-[#9aa0a6]">请检查网络后刷新页面重试</p>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex h-[360px] flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#29435f] dark:text-[#8ab4f8]">
                <Inbox size={23} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#3c4043] dark:text-[#e8eaed]">没有匹配的项目</p>
                <p className="mt-1 text-xs text-[#80868b] dark:text-[#9aa0a6]">换个关键词，或清除当前筛选条件</p>
              </div>
              <button
                onClick={clearFilters}
                className="mt-1 flex h-9 items-center gap-2 rounded-lg bg-[#1a73e8] px-4 text-sm font-medium text-white hover:bg-[#1765cc] dark:bg-[#8ab4f8] dark:text-[#202124]"
              >
                查看全部项目
                <ArrowRight size={16} />
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.map((project, index) => (
                <ProjectCard
                  key={project.path || project.name}
                  project={project}
                  index={index}
                  onClick={setSelectedProject}
                  onOpenNew={handleOpenNew}
                  onTagClick={setSelectedTag}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredProjects.map((project, index) => (
                <ProjectListRow
                  key={project.path || project.name}
                  project={project}
                  index={index}
                  onClick={setSelectedProject}
                  onOpenNew={handleOpenNew}
                  onTagClick={setSelectedTag}
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
