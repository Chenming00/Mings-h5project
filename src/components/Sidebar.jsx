import React from 'react';
import { Layers, FolderKanban, Tag, X } from 'lucide-react';

export default function Sidebar({ tags, selectedTag, setSelectedTag, isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity" 
          onClick={onClose}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-950 border-r border-slate-200 dark:border-gray-800 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-gray-800/50">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
          <Layers size={18} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          H5 Hub
        </h1>
      </div>

      <div className="px-5 py-4 flex-col gap-1 hidden">
        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-white bg-gray-900 dark:bg-white/10 transition-colors w-full text-left">
          <FolderKanban size={18} /> All Projects
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 mt-4 pb-6">
        <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">
          Categories
        </h2>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {setSelectedTag(null); onClose();}}
            className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTag === null
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-gray-800/50 dark:hover:text-white'
            }`}
          >
            <FolderKanban size={16} /> 
            All Projects
          </button>
          
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => {setSelectedTag(tag); onClose();}}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedTag === tag
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-gray-800/50 dark:hover:text-white'
              }`}
            >
              <Tag size={16} /> 
              <span className="capitalize">{tag}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
    </>
  );
}
