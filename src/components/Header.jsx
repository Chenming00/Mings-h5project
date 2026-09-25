import React, { useEffect, useRef } from 'react';
import { Menu, Moon, Search, Sparkles, Sun, X } from 'lucide-react';

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
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-gray-200/70 bg-white/80 px-4 backdrop-blur-2xl sm:px-6 xl:px-8 dark:border-white/7 dark:bg-[#090b11]/78">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/8 dark:hover:text-white md:hidden"
        aria-label="打开分类菜单"
      >
        <Menu size={20} />
      </button>

      <div className="flex shrink-0 items-center md:hidden" aria-label="奇点空间">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-md shadow-indigo-500/20">
          <Sparkles size={16} className="text-white" />
        </div>
      </div>

      <div className="mx-auto flex min-w-0 flex-1 justify-center">
        <div className="group relative w-full max-w-[520px]">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-indigo-500 dark:text-gray-600"
          />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="搜索项目或标签…"
            autoComplete="off"
            spellCheck="false"
            aria-label="搜索项目或标签"
            className="h-10 w-full rounded-xl border border-gray-200/80 bg-gray-100/70 pl-10 pr-20 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/8 dark:bg-white/[0.045] dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-indigo-500/60 dark:focus:bg-white/[0.07]"
          />

          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
              aria-label="清空搜索"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded border border-gray-200 bg-white px-1.5 text-[10px] font-semibold text-gray-400 shadow-sm sm:flex dark:border-white/10 dark:bg-white/5 dark:text-gray-500">
              /
            </kbd>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={toggleDark}
        className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/8 dark:hover:text-white"
        aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
        title={isDark ? '切换到浅色模式' : '切换到深色模式'}
      >
        {isDark ? (
          <Sun size={19} className="text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon size={19} className="text-indigo-500 transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </button>
    </header>
  );
}
