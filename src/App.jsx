import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProjectCard from './components/ProjectCard';
import PreviewPane from './components/PreviewPane';
import { Loader2, AlertCircle, SearchX } from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.theme === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await fetch('/projects.json');
        if (!res.ok) throw new Error('Failed to fetch projects');
        setProjects(await res.json());
      } catch (err) {
        setError(err.message);
        setProjects([
          { name: 'Interactive Particles', path: '/projects/project-a/', tags: ['animation'] },
          { name: 'Canvas Game', path: '/projects/project-b/', tags: ['game'] },
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
    <div className={`min-h-svh flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-150`}>
      <Sidebar
        tags={allTags}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content — offset by sidebar width on md+ */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-60">
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
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {selectedTag ? <><span className="text-gray-400 font-normal"># </span>{selectedTag}</> : '所有项目'}
              </h1>
              {!loading && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                  共 {filteredProjects.length} 个项目
                </p>
              )}
            </div>
            {(searchQuery || selectedTag) && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
                className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
              >
                <SearchX size={14} />
                清除筛选
              </button>
            )}
          </div>

          {/* States */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="animate-spin text-blue-500" size={28} />
              <p className="text-sm text-gray-400">加载中...</p>
            </div>
          ) : error && projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
              <AlertCircle size={32} />
              <p className="text-sm font-medium">加载失败，请刷新重试</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
              <SearchX size={32} strokeWidth={1.5} />
              <p className="text-sm">没有找到匹配的项目</p>
            </div>
          ) : (
            /* Responsive grid */
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
