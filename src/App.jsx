import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProjectCard from './components/ProjectCard';
import ProjectListRow from './components/ProjectListRow';
import PreviewPane from './components/PreviewPane';
import { Loader2, AlertCircle, SearchX, LayoutGrid, List, Sparkles, Inbox } from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() =>
    localStorage.getItem('viewMode') || 'grid'
  );

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.theme === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) { root.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { root.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDark]);

  // Persist view mode
  useEffect(() => { localStorage.setItem('viewMode', viewMode); }, [viewMode]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await fetch('/projects.json');
        if (!res.ok) throw new Error('Failed to fetch');
        setProjects(await res.json());
      } catch (err) {
        setError(err.message);
        setProjects([
          { name: 'Interactive Particles', path: '/projects/project-a/index.html', tags: ['animation'] },
          { name: 'Canvas Game', path: '/projects/project-b/index.html', tags: ['game'] },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const allTags = useMemo(() => {
    const t = new Set();
    projects.forEach(p => p.tags?.forEach(tag => t.add(tag)));
    return Array.from(t).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTag = selectedTag ? p.tags?.includes(selectedTag) : true;
    return matchSearch && matchTag;
  }), [projects, searchQuery, selectedTag]);

  const handleOpenNew = project => window.open(project.path, '_blank');

  return (
    <div className="min-h-svh flex bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-950 dark:to-indigo-950/20 text-gray-900 dark:text-gray-100 transition-colors duration-150">
      <Sidebar
        tags={allTags}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

        <div className="flex-1 flex flex-col min-w-0 md:pl-72">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDark={isDark}
          toggleDark={() => setIsDark(d => !d)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-6 py-6">
          {/* Title bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  {selectedTag ? (
                    <>
                      <span className="text-indigo-500">#</span>
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{selectedTag}</span>
                    </>
                  ) : (
                    <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">全部项目</span>
                  )}
                </h1>
                {!loading && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                    发现 {filteredProjects.length} 个创意项目
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(searchQuery || selectedTag) && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
                  className="text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all mr-2 font-medium"
                >
                  <SearchX size={14} />
                  清除筛选
                </button>
              )}

              {/* View mode toggle */}
              <div className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 gap-1 border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  title="卡片视图"
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/25'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="列表视图"
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/25'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* States */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                  <Loader2 className="animate-spin text-white" size={28} />
                </div>
                <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-50 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">正在加载创意项目</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">请稍候...</p>
              </div>
            </div>
          ) : error && projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">加载失败</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">请刷新页面重试</p>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center">
                <Inbox size={32} className="text-indigo-400" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">没有找到匹配的项目</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">尝试其他关键词或清除筛选</p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProjects.map((project, i) => (
                <ProjectCard
                  key={i}
                  project={project}
                  onClick={setSelectedProject}
                  onOpenNew={handleOpenNew}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredProjects.map((project, i) => (
                <ProjectListRow
                  key={i}
                  project={project}
                  onClick={setSelectedProject}
                  onOpenNew={handleOpenNew}
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
