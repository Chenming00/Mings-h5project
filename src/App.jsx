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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 flex transition-colors duration-300 overflow-x-hidden">
      <Sidebar tags={allTags} selectedTag={selectedTag} setSelectedTag={setSelectedTag} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 md:ml-64 flex flex-col relative w-full min-w-0">
        <Header 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          isDark={isDark} 
          toggleDark={() => setIsDark(!isDark)} 
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        
        <div className="p-6 md:p-8 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
              <p className="text-gray-500 dark:text-gray-400">Loading projects...</p>
            </div>
          ) : error && projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-red-500">
              <AlertCircle size={48} className="mb-4 opacity-80" />
              <p className="font-medium">Failed to load projects from API</p>
            </div>
          ) : (
            <>
              {filteredProjects.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl text-gray-400">No projects found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
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
