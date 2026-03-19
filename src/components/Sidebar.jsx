import React from 'react';
import { Layers, FolderKanban, Tag, X } from 'lucide-react';

export default function Sidebar({ tags, selectedTag, setSelectedTag, isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-30 md:hidden transition-opacity animate-in fade-in duration-300" 
          onClick={onClose}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-gray-800/50 flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center gap-3 border-b border-transparent">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transform hover:rotate-12 transition-transform duration-300">
          <Layers size={22} className="opacity-90" />
        </div>
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tighter">
          H5 <span className="text-blue-600 dark:text-blue-400">Hub</span>
        </h1>
      </div>

      <div className="px-5 py-4 flex-col gap-1 hidden">
        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-white bg-gray-900 dark:bg-white/10 transition-colors w-full text-left">
          <FolderKanban size={18} /> All Projects
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 mt-2 pb-6">
        <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 pl-1">
          Categories
        </h2>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => {setSelectedTag(null); onClose();}}
            className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 group ${
              selectedTag === null
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 translate-x-1'
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-gray-800/50 dark:hover:text-white hover:translate-x-1'
            }`}
          >
            <FolderKanban size={18} className={selectedTag === null ? 'text-blue-100' : 'text-slate-400 group-hover:text-blue-500'} /> 
            All Projects
          </button>
          
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => {setSelectedTag(tag); onClose();}}
              className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 group ${
                selectedTag === tag
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 shadow-sm translate-x-1'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-gray-800/50 dark:hover:text-white hover:translate-x-1'
              }`}
            >
              <Tag size={16} className={selectedTag === tag ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'} /> 
              <span className="capitalize">{tag}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
    </>
  );
}
