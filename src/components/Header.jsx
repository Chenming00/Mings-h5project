import React from 'react';
import { Search, Moon, Sun, Menu, Sparkles } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, isDark, toggleDark, onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 h-16 bg-gradient-to-r from-white/95 via-white/90 to-white/95 dark:from-gray-950/95 dark:via-gray-950/90 dark:to-gray-950/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800/80 shadow-sm">
      {/* Mobile hamburger */}
      <button
        onClick={onOpenSidebar}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:bg-gray-800 transition-all duration-200 shrink-0"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Logo — visible on mobile only (sidebar hidden) */}
      <div className="md:hidden flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Sparkles size={16} className="text-white" />
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-xs sm:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none transition-colors group-focus-within:text-indigo-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索创意项目..."
            className="w-full h-11 pl-11 pr-4 text-sm bg-gray-100/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-gray-900 transition-all duration-200"
          />
        </div>
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        className="group flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 dark:hover:bg-gray-800 transition-all duration-200 shrink-0"
        aria-label="Toggle dark mode"
      >
        <span className="relative">
          {isDark ? (
            <>
              <Sun size={20} className="text-amber-500 transition-transform group-hover:rotate-45 duration-300" />
            </>
          ) : (
            <>
              <Moon size={20} className="text-indigo-500 transition-transform group-hover:-rotate-12 duration-300" />
            </>
          )}
        </span>
      </button>
    </header>
  );
}
