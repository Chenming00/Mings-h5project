import { useEffect, useRef } from 'react';
import {
  Asterisk,
  ChartNoAxesCombined,
  ChevronRight,
  Compass,
  Flower2,
  LayoutGrid,
  Play,
  Sparkles,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';

const icons = {
  chart: ChartNoAxesCombined,
  sparkles: Sparkles,
  play: Play,
  tool: Wrench,
  user: UserRound,
};

export default function Sidebar({
  projectCount,
  categories,
  tagCounts,
  selectedTag,
  setSelectedTag,
  isOpen,
  onClose,
  loading,
}) {
  const sidebarRef = useRef(null);
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKey = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key === 'Tab') {
        const items = [...(sidebarRef.current?.querySelectorAll('button, a[href]') || [])].filter(
          (item) => item.getClientRects().length,
        );
        if (!items.length) return;
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault();
          items[items.length - 1].focus();
        } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
          event.preventDefault();
          items[0].focus();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      previousFocus?.focus();
    };
  }, [isOpen]);

  const selectTag = (tag) => {
    setSelectedTag(tag);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <button className="sidebar-backdrop" onClick={onClose} aria-label="关闭导航菜单" tabIndex={-1} />
      )}
      <aside ref={sidebarRef} className={`sidebar ${isOpen ? 'is-open' : ''}`} aria-label="项目导航">
        <a className="brand" href="/" aria-label="奇点空间首页">
          <span className="brand-symbol">
            <Asterisk size={38} strokeWidth={2.6} />
          </span>
          <span>
            <strong>
              奇点空间<span className="brand-period">.</span>
            </strong>
            <small>SINGULARITY SPACE</small>
          </span>
        </a>
        <button ref={closeButtonRef} className="icon-button sidebar-close" onClick={onClose} aria-label="关闭菜单">
          <X size={20} />
        </button>

        <div className="sidebar-body">
          <p className="nav-caption">
            WORKSPACE <span>01</span>
          </p>
          {/* These are filters, not navigation: aria-pressed matches the toolbar
              buttons that do the same job. aria-current is for real links. */}
          <nav className="main-nav" aria-label="项目分类">
            <button
              className={`nav-item all-projects ${!selectedTag ? 'active' : ''}`}
              onClick={() => selectTag(null)}
              aria-pressed={!selectedTag}
            >
              <LayoutGrid size={18} />
              <span>全部作品</span>
              <span className="nav-count">{loading ? '—' : projectCount}</span>
            </button>
            <p className="nav-subtitle">探索方向</p>
            {categories.map((category) => {
              const Icon = icons[category.icon] || Compass;
              return (
                <button
                  key={category.id}
                  className={`nav-item ${selectedTag === category.id ? 'active' : ''}`}
                  onClick={() => selectTag(category.id)}
                  aria-pressed={selectedTag === category.id}
                >
                  <Icon size={18} />
                  <span>{category.label}</span>
                  <span className="nav-count">{tagCounts[category.id] || 0}</span>
                </button>
              );
            })}
          </nav>
          <div className="sidebar-note">
            <span className="note-star">
              <Flower2 size={29} strokeWidth={1.4} />
            </span>
            <p>
              保持好奇，
              <br />
              让有趣的事发生。
            </p>
            <span>Stay curious. Keep creating.</span>
            <div className="note-line" />
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="workspace-person">
            <span className="person-avatar">
              M<span />
            </span>
            <div>
              <strong>Ming’s Workspace</strong>
              <small>一个人的创意实验室</small>
            </div>
            <ChevronRight size={14} />
          </div>
          <p>
            <span className="status-dot" /> 灵感正在生长中 <span>✳</span>
          </p>
        </div>
      </aside>
    </>
  );
}
