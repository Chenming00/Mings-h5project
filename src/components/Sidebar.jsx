import React from 'react';
import { Layers, FolderKanban, Tag } from 'lucide-react';

export default function Sidebar({ tags, selectedTag, setSelectedTag }) {
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-gray-50/50 dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Layers size={18} />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
          H5 Hub
        </h1>
      </div>

      <div className="px-4 py-2 flex-col gap-1 hidden">
        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-white bg-gray-900 dark:bg-white/10 transition-colors w-full text-left">
          <FolderKanban size={18} /> All Projects
        </button>
      </div>

      <div className="px-6 mt-4">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Categories
        </h2>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => setSelectedTag(null)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedTag === null
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white'
            }`}
          >
            <FolderKanban size={16} /> All
          </button>
          
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                selectedTag === tag
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-white'
              }`}
            >
              <Tag size={16} /> <span className="capitalize">{tag}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
