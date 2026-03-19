import React from 'react';
import { Layers, Hash, LayoutGrid, X } from 'lucide-react';

export default function Sidebar({ tags, selectedTag, setSelectedTag, isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-60 flex flex-col',
          'bg-white dark:bg-gray-950',
          'border-r border-gray-200 dark:border-gray-800',
          'transform transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <Layers size={15} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">H5 Hub</span>
          </div>
          {/* Close btn — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            分类
          </p>

          <button
            onClick={() => { setSelectedTag(null); onClose(); }}
            className={[
              'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
              selectedTag === null
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
            ].join(' ')}
          >
            <LayoutGrid size={15} className="shrink-0 opacity-80" />
            全部项目
          </button>

          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => { setSelectedTag(tag); onClose(); }}
              className={[
                'flex items-center gap-2.5 w-full px-2.5 py-2 mt-0.5 rounded-md text-sm font-medium transition-colors capitalize',
                selectedTag === tag
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
              ].join(' ')}
            >
              <Hash size={14} className="shrink-0 opacity-70" />
              {tag}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <p className="text-[11px] text-gray-400 dark:text-gray-600">自动扫描项目目录</p>
        </div>
      </aside>
    </>
  );
}
