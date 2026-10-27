import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, SearchX, Sparkles, X } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProjectCard from './components/ProjectCard';
import ProjectListRow from './components/ProjectListRow';
import HeroArtwork from './components/HeroArtwork';
import SpaceOverview from './components/SpaceOverview';
import CollectionToolbar from './components/CollectionToolbar';
import { useProjectUrlState } from './hooks/useProjectUrlState';
import { categories, enrichProject, tagLabels } from './data/projectPresentation';
import { resolveInitialTheme, resolveInitialViewMode, safeStorage } from './lib/environment';

// The preview pane is only needed once someone opens a project, so it is kept
// out of the first-load bundle.
const PreviewPane = lazy(() => import('./components/PreviewPane'));

export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState(resolveInitialViewMode);
  const [isDark, setIsDark] = useState(resolveInitialTheme);
  const {
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    clearFilters,
    selectedProject,
    openProject,
    closeProject,
  } = useProjectUrlState(projects);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    safeStorage.set('theme', isDark ? 'dark' : 'light');
    // Keep mobile browser chrome in step with the in-app toggle; the media
    // query in index.html only covers the first paint.
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', isDark ? '#191e1b' : '#fafaf7');
  }, [isDark]);

  useEffect(() => {
    safeStorage.set('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProjects() {
      try {
        const response = await fetch('/projects.json', { signal: controller.signal });
        if (!response.ok) throw new Error('暂时无法加载项目，请稍后重试。');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('项目清单格式有误，请重新生成。');
        setProjects(data.map(enrichProject).sort((a, b) => a.displayOrder - b.displayOrder));
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') setError(fetchError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchProjects();
    return () => controller.abort();
  }, []);

  const tagCounts = useMemo(() => {
    const counts = {};
    projects.forEach((project) => {
      project.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [projects]);

  const visibleCategories = categories.filter((category) => tagCounts[category.id]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return projects.filter((project) => {
      const searchable = [
        project.name,
        project.displayTitle,
        project.description,
        ...project.tags,
        ...project.tags.map((tag) => tagLabels[tag] || tag),
      ];
      return (
        (!query || searchable.some((value) => String(value).toLowerCase().includes(query))) &&
        (!selectedTag || project.tags.includes(selectedTag))
      );
    });
  }, [projects, searchQuery, selectedTag]);

  const hasActiveFilter = Boolean(searchQuery.trim() || selectedTag);
  // Data-driven: any project may claim the discovery slot through presentation
  // metadata instead of a slug hardcoded here.
  const featured = projects.find((project) => project.featured);
  const handleOpenNew = (project) => window.open(project.path, '_blank', 'noopener,noreferrer');

  const explore = () => {
    clearFilters();
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#projects">
        跳转到项目
      </a>
      <Sidebar
        projectCount={projects.length}
        categories={visibleCategories}
        tagCounts={tagCounts}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        loading={loading}
      />
      <div className="workspace">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDark={isDark}
          toggleDark={() => setIsDark((current) => !current)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        <main className="main-content">
          <section className="hero-section animate-page-enter" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow">
                <span /> MING’S CREATIVE PLAYGROUND
              </p>
              <h1 id="hero-title">
                小想法，
                <br />
                也有
                <span className="hero-emphasis">
                  大世界
                  <svg viewBox="0 0 250 15" aria-hidden="true">
                    <path d="M3 10 Q120 -3 245 8 M10 14 Q120 4 228 12" />
                  </svg>
                </span>
                。
              </h1>
              <p className="hero-description">
                把好奇心写成代码，把灵感变成可以体验的作品。
                <br className="desktop-break" />
                这里收藏着我的探索、实验，以及一些有趣的小东西。
              </p>
              <button className="primary-button" onClick={explore}>
                探索全部作品 <ArrowDown size={16} />
              </button>
              <div className="hero-footnote">
                <span className="status-dot" /> 持续探索，持续生长{' '}
                <span className="small-divider" /> Built with curiosity
              </div>
            </div>
            <HeroArtwork />
            <div className="hero-index" aria-hidden="true">
              IDEAS INTO REALITY ↗
            </div>
          </section>

          <SpaceOverview
            projectCount={projects.length}
            categoryCount={visibleCategories.length}
            loading={loading}
          />

          <section id="projects" className="projects-section" aria-labelledby="projects-heading">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">THE COLLECTION</p>
                <h2 id="projects-heading">
                  {selectedTag ? tagLabels[selectedTag] || selectedTag : '所有作品'}
                  <span>{loading ? '…' : String(filteredProjects.length).padStart(2, '0')}</span>
                </h2>
              </div>
              <p className="section-hint">
                每一次尝试，都值得被看见。
                <ArrowDown size={14} />
              </p>
            </div>

            <CollectionToolbar
              categories={visibleCategories}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              projectCount={projects.length}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />

            {hasActiveFilter && (
              <div className="filter-summary" role="status">
                找到 {filteredProjects.length} 个作品
                {searchQuery.trim() && <span> · “{searchQuery.trim()}”</span>}
                <button onClick={clearFilters}>
                  清除筛选 <X size={13} />
                </button>
              </div>
            )}

            {loading ? (
              <div className="project-grid" aria-label="正在加载项目" aria-busy="true">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="card-skeleton">
                    <div />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="empty-state" role="alert">
                <SearchX size={32} />
                <h3>项目暂时走丢了</h3>
                <p>{error}</p>
                <button className="primary-button" onClick={() => window.location.reload()}>
                  重新加载 <ArrowRight size={15} />
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="empty-state">
                <SearchX size={32} />
                <h3>还没有找到这个灵感</h3>
                <p>试试其他关键词，或回到全部作品看看。</p>
                <button className="primary-button" onClick={clearFilters}>
                  查看全部作品 <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'project-grid' : 'project-list'}>
                {filteredProjects.map((project, index) =>
                  viewMode === 'grid' ? (
                    <ProjectCard
                      key={project.slug}
                      project={project}
                      index={index}
                      onClick={openProject}
                      onOpenNew={handleOpenNew}
                      onTagClick={setSelectedTag}
                    />
                  ) : (
                    <ProjectListRow
                      key={project.slug}
                      project={project}
                      index={index}
                      onClick={openProject}
                      onOpenNew={handleOpenNew}
                      onTagClick={setSelectedTag}
                    />
                  ),
                )}
              </div>
            )}
          </section>

          {featured && !hasActiveFilter && (
            <section className="discovery-banner">
              <div className="discovery-mark">
                <Sparkles size={25} />
              </div>
              <div>
                <p>给灵感一点动起来的空间</p>
                <span>30 秒，看看代码与动态设计会碰撞出什么。</span>
              </div>
              <button onClick={() => openProject(featured)}>
                播放 Motion Reel <ArrowUpRight size={17} />
              </button>
            </section>
          )}

          <footer className="site-footer">
            <span>
              <span className="footer-asterisk">✳</span> 奇点空间{' '}
              <span className="footer-note">· 好奇心永不设限</span>
            </span>
            <span>
              Designed &amp; built by Ming <Check size={13} />
            </span>
          </footer>
        </main>
      </div>

      <Suspense fallback={null}>
        <PreviewPane
          key={selectedProject?.slug || 'closed'}
          project={selectedProject}
          onClose={closeProject}
          onOpenNew={handleOpenNew}
        />
      </Suspense>
    </div>
  );
}
