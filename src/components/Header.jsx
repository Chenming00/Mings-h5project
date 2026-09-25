import React, { useEffect, useRef } from 'react';
import { LayoutGrid, Menu, Moon, Search, Sun, X } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, isDark, toggleDark, onOpenSidebar }) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleShortcut = event => {
      const target = event.target;
      const isTyping = target instanceof HTMLElement &&
        (target.matches('input, textarea, select') || target.isContentEditable);
      const hasModal = document.querySelector('[role="dialog"]');

      if (event.key === '/' && !isTyping && !hasModal) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleSearchKeyDown = event => {
    if (event.key === 'Escape' && searchQuery) {
      event.preventDefault();
      setSearchQuery('');
      event.currentTarget.blur();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#dadce0] bg-white px-4 dark:border-[#5f6368] dark:bg-[#202124] sm:px-6 xl:px-8">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4] dark:text-[#9aa0a6] dark:hover:bg-[#303134] md:hidden"
        aria-label="打开导航菜单"
      >
        <Menu size={22} />
      </button>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a73e8] text-white dark:bg-[#8ab4f8] dark:text-[#202124] md:hidden">
        <LayoutGrid size={18} />
      </div>

      <div className="mx-auto flex min-w-0 flex-1 justify-center">
        <div className="w-full max-w-[600px]">
          <div className="relative">
            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="搜索项目或标签"
              autoComplete="off"
              spellCheck="false"
              aria-label="搜索项目或标签"
              className="h-10 w-full rounded-full border border-transparent bg-[#f1f3f4] pl-11 pr-11 text-sm text-[#202124] outline-none transition-colors placeholder:text-[#5f6368] hover:bg-[#e8eaed] focus:border-[#dadce0] focus:bg-white dark:bg-[#303134] dark:text-[#e8eaed] dark:placeholder:text-[#9aa0a6] dark:hover:bg-[#3c4043] dark:focus:border-[#5f6368] dark:focus:bg-[#292a2d]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#dadce0] dark:text-[#9aa0a6] dark:hover:bg-[#5f6368]"
                aria-label="清空搜索"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleDark}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4] dark:text-[#9aa0a6] dark:hover:bg-[#303134]"
        aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
        title={isDark ? '切换到浅色模式' : '切换到深色模式'}
      >
        {isDark ? (
          <Sun size={20} className="text-[#fbbc04]" />
        ) : (
          <Moon size={20} className="text-[#5f6368] dark:text-[#9aa0a6]" />
        )}
      </button>
    </header>
  );
}
