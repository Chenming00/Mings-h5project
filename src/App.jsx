import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProjectCard from './components/ProjectCard';
import PreviewPane from './components/PreviewPane';
import { Loader2, AlertCircle } from 'lucide-react';

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
      return localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true; // default dark for pro vibe
  });

  // Handle Dark mode toggle
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

  // Fetch projects from mock API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await fetch('/projects.json');
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        setError(err.message);
        // Fallback for purely static deployment without API
        console.warn("API failed, using fallback data");
        setProjects([
          { name: "Interactive Particles", path: "/projects/project-a/", tags: ["animation"] },
          { name: "Canvas Game", path: "/projects/project-b/", tags: ["game"] }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Derived state
  const allTags = useMemo(() => {
    const tags = new Set();
    projects.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? p.tags?.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [projects, searchQuery, selectedTag]);

  const handleOpenNew = (project) => {
    window.open(project.path, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200 overflow-x-hidden relative">
      <Sidebar tags={allTags} selectedTag={selectedTag} setSelectedTag={setSelectedTag} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 md:ml-64 flex flex-col relative w-full min-w-0 min-h-screen z-10">
        <Header 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          isDark={isDark} 
          toggleDark={() => setIsDark(!isDark)} 
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        
        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[40vh] animate-in fade-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mb-4 relative z-10" size={48} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Loading extraordinary experiences...</p>
            </div>
          ) : error && projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-red-500 animate-in fade-in zoom-in duration-300">
              <AlertCircle size={56} className="mb-4 opacity-90 drop-shadow-md" />
              <p className="font-semibold text-lg">Failed to load projects from API</p>
            </div>
          ) : (
            <>
              {filteredProjects.length === 0 ? (
                <div className="text-center py-20 animate-in fade-in duration-300">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="text-slate-400 opacity-50" size={40} />
                  </div>
                  <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">No projects found matching your criteria.</p>
                  <button 
                    onClick={() => {setSearchQuery(''); setSelectedTag(null)}}
                    className="mt-4 px-6 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors shadow-sm font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 relative z-10 w-full">
                  {filteredProjects.map((project, i) => (
                    <ProjectCard 
                      key={i} 
                      project={project} 
                      onClick={setSelectedProject} 
                      onOpenNew={handleOpenNew}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <PreviewPane 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
        onOpenNew={handleOpenNew}
      />
    </div>
  );
}
