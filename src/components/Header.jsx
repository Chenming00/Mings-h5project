import React from 'react';
import { Search, Moon, Sun, Menu } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, isDark, toggleDark, onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-4 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800/50">
      <div className="flex-1 flex items-center pr-2">
        <button 
          onClick={onOpenSidebar}
          className="md:hidden p-2 -ml-2 mr-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 dark:focus:ring-gray-700 transition-colors rounded-xl flex items-center"
        >
          <Menu size={24} />
        </button>
      </div>
      
      <div className="flex-1 max-w-xl mx-auto flex items-center">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="block w-full p-2.5 pl-10 text-sm text-gray-900 bg-gray-100/50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:bg-[#121214] dark:border-gray-800 dark:placeholder-gray-500 dark:text-white dark:focus:bg-[#1a1a1c] transition-all"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 flex justify-end">
        <button
          onClick={toggleDark}
          className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 dark:focus:ring-gray-700 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
