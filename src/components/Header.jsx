import { useEffect, useRef } from 'react';
import { ChevronRight, Menu, Moon, Search, Sun, X } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, isDark, toggleDark, onOpenSidebar }) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleShortcut = (event) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.matches('input, textarea, select') || target.isContentEditable);
      if (event.key === '/' && !isTyping && !document.querySelector('[role="dialog"]')) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" onClick={onOpenSidebar} aria-label="打开导航菜单">
        <Menu size={22} />
      </button>

      <div className="breadcrumb">
        <span>工作空间</span>
        <ChevronRight size={13} />
        <strong>项目探索</strong>
      </div>

      <div className="header-actions">
        <div className="search-box">
          <Search size={17} />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="搜索项目、灵感、关键词…"
            value={searchQuery}
            aria-label="搜索项目或标签"
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setSearchQuery('');
                event.currentTarget.blur();
              }
            }}
          />
          {searchQuery ? (
            <button
              className="search-clear"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label="清空搜索"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd>/</kbd>
          )}
        </div>
        <span className="header-divider" />
        <button
          className="icon-button theme-toggle"
          onClick={toggleDark}
          aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
          title={isDark ? '切换到浅色模式' : '切换到深色模式'}
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        {/* role="img" is required: aria-label on a bare span has no accessible
            name, so screen readers only announced the letter "M". */}
        <span className="header-avatar" role="img" aria-label="Ming 的工作空间">
          M
        </span>
      </div>
    </header>
  );
}
