import React from 'react';
import { Layers, Hash, LayoutGrid, X, Sparkles } from 'lucide-react';

export default function Sidebar({ tags, selectedTag, setSelectedTag, isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-72 flex flex-col',
          'bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900',
          'border-r border-gray-200/80 dark:border-gray-800/80',
          'transform transition-transform duration-300 ease-out',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200/80 dark:border-gray-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight block">奇点空间</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Singularity Space</span>
            </div>
          </div>
          {/* Close btn — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-4">
          <p className="px-3 mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <Layers size={14} />
            项目分类
          </p>

          <button
            onClick={() => { setSelectedTag(null); onClose(); }}
            className={[
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              selectedTag === null
                ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-100',
            ].join(' ')}
          >
            <LayoutGrid size={16} className={`shrink-0 ${selectedTag === null ? 'text-indigo-500' : 'opacity-60'}`} />
            <span>全部项目</span>
            {selectedTag === null && (
              <span className="ml-auto text-xs font-bold text-indigo-500">●</span>
            )}
          </button>

          <div className="mt-4 space-y-1">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => { setSelectedTag(tag); onClose(); }}
                className={[
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 capitalize',
                  selectedTag === tag
                    ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-100',
                ].join(' ')}
              >
                <Hash size={14} className={`shrink-0 ${selectedTag === tag ? 'text-indigo-500' : 'opacity-50'}`} />
                <span>{tag}</span>
                {selectedTag === tag && (
                  <span className="ml-auto text-xs font-bold text-indigo-500">●</span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200/80 dark:border-gray-800/80 shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>自动扫描项目目录</span>
          </div>
        </div>
      </aside>
    </>
  );
}
