import React from 'react';
import { FolderOpen, Hash, Layers3, Sparkles, X } from 'lucide-react';

export default function Sidebar({
  projectCount,
  tags,
  tagCounts,
  selectedTag,
  setSelectedTag,
  isOpen,
  onClose,
}) {
  const selectTag = tag => {
    setSelectedTag(tag);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-gray-950/55 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-label="关闭分类菜单"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col overflow-hidden border-r border-gray-200/80 bg-white/92 shadow-2xl shadow-gray-950/10 backdrop-blur-xl transition-transform duration-300 ease-out dark:border-white/8 dark:bg-[#0b0d14]/94 dark:shadow-black/40 md:translate-x-0 md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="项目分类侧边栏"
      >
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

        <div className="relative flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200/70 px-5 dark:border-white/7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/25">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-gray-950 dark:text-white">奇点空间</span>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                Singularity Space
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/8 dark:hover:text-gray-200 md:hidden"
            aria-label="关闭菜单"
          >
            <X size={17} />
          </button>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-4 py-6" aria-label="项目分类">
          <p className="mb-3 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-600">
            <Layers3 size={13} />
            项目分类
          </p>

          <button
            type="button"
            onClick={() => selectTag(null)}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
              selectedTag === null
                ? 'bg-gray-950 text-white shadow-lg shadow-gray-950/10 dark:bg-indigo-500 dark:shadow-indigo-950/30'
                : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
            }`}
            aria-current={selectedTag === null ? 'page' : undefined}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              selectedTag === null
                ? 'bg-white/12 text-white'
                : 'bg-gray-100 text-gray-500 group-hover:text-indigo-500 dark:bg-white/5 dark:text-gray-400'
            }`}>
              <FolderOpen size={16} />
            </span>
            <span>全部项目</span>
            <span className={`ml-auto text-[11px] font-bold ${
              selectedTag === null ? 'text-white/65' : 'text-gray-400 dark:text-gray-600'
            }`}>
              {projectCount}
            </span>
          </button>

          <div className="mt-2 space-y-1">
            {tags.map(tag => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => selectTag(tag)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/12 dark:text-indigo-300'
                      : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                  aria-current={isSelected ? 'page' : undefined}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-gray-100 text-gray-400 group-hover:text-indigo-500 dark:bg-white/5 dark:text-gray-500'
                  }`}>
                    <Hash size={14} />
                  </span>
                  <span className="truncate capitalize">{tag}</span>
                  <span className={`ml-auto text-[11px] font-bold ${
                    isSelected ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {tagCounts[tag] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="relative shrink-0 border-t border-gray-200/70 p-4 dark:border-white/7">
          <div className="rounded-2xl border border-gray-200/70 bg-gray-50/80 p-3.5 dark:border-white/7 dark:bg-white/[0.035]">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" />
              项目目录已同步
            </div>
            <p className="mt-1.5 text-[10px] leading-4 text-gray-400 dark:text-gray-600">
              添加 HTML 入口文件后，项目会自动出现在这里
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
