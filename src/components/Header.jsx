import React from 'react';
import { Search, Moon, Sun, Menu } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, isDark, toggleDark, onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 h-14 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      {/* Mobile hamburger */}
      <button
        onClick={onOpenSidebar}
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Logo — visible on mobile only (sidebar hidden) */}
      <span className="md:hidden font-bold text-gray-900 dark:text-white text-base tracking-tight shrink-0">
        H5 Hub
      </span>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索项目..."
            className="w-full h-9 pl-9 pr-3 text-sm bg-gray-100 dark:bg-gray-800/80 border border-transparent rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-colors"
          />
        </div>
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
        aria-label="Toggle dark mode"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}
