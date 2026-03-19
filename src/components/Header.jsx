import React from 'react';
import { Search, Moon, Sun, Menu } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, isDark, toggleDark, onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 py-4 bg-white/70 dark:bg-gray-950/60 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
      <div className="flex-1 flex items-center pr-2">
        <button 
          onClick={onOpenSidebar}
          className="md:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:text-slate-400 dark:hover:bg-gray-800 dark:focus:ring-gray-700 transition-colors rounded-xl flex items-center hover:scale-105 active:scale-95"
        >
          <Menu size={24} />
        </button>
      </div>
      
      <div className="flex-1 max-w-xl mx-auto flex items-center">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-all duration-300 transform group-focus-within:scale-110">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="block w-full p-2.5 pl-11 text-sm text-slate-900 bg-slate-100/80 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:bg-gray-900/80 dark:border-gray-800 dark:placeholder-slate-500 dark:text-white dark:focus:bg-gray-900 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 ease-out"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 flex justify-end">
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
