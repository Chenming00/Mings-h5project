import React from 'react';
import { FolderOpen, Hash, LayoutGrid, X } from 'lucide-react';

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
          className="fixed inset-0 z-40 cursor-default bg-black/40 md:hidden"
          onClick={onClose}
          aria-label="关闭导航菜单"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-[#dadce0] bg-white transition-transform duration-200 ease-out dark:border-[#5f6368] dark:bg-[#202124] md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="项目导航"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#dadce0] px-4 dark:border-[#5f6368]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a73e8] text-white dark:bg-[#8ab4f8] dark:text-[#202124]">
              <LayoutGrid size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#202124] dark:text-[#e8eaed]">奇点空间</p>
              <p className="truncate text-[10px] text-[#80868b] dark:text-[#9aa0a6]">项目工作区</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4] dark:text-[#9aa0a6] dark:hover:bg-[#303134] md:hidden"
            aria-label="关闭菜单"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="项目分类">
          <p className="mb-2 px-3 text-xs font-medium text-[#80868b] dark:text-[#9aa0a6]">项目</p>

          <button
            type="button"
            onClick={() => selectTag(null)}
            className={`mb-1 flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors ${
              selectedTag === null
                ? 'bg-[#e8f0fe] font-medium text-[#1967d2] dark:bg-[#29435f] dark:text-[#8ab4f8]'
                : 'text-[#3c4043] hover:bg-[#f1f3f4] dark:text-[#e8eaed] dark:hover:bg-[#303134]'
            }`}
            aria-current={selectedTag === null ? 'page' : undefined}
          >
            <FolderOpen size={19} />
            <span>全部项目</span>
            <span className="ml-auto text-xs text-[#80868b] dark:text-[#9aa0a6]">{projectCount}</span>
          </button>

          {tags.map(tag => {
            const isSelected = selectedTag === tag;
            return (
              <button
                type="button"
                key={tag}
                onClick={() => selectTag(tag)}
                className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-[#e8f0fe] font-medium text-[#1967d2] dark:bg-[#29435f] dark:text-[#8ab4f8]'
                    : 'text-[#3c4043] hover:bg-[#f1f3f4] dark:text-[#e8eaed] dark:hover:bg-[#303134]'
                }`}
                aria-current={isSelected ? 'page' : undefined}
              >
                <Hash size={18} />
                <span className="truncate capitalize">{tag}</span>
                <span className="ml-auto text-xs text-[#80868b] dark:text-[#9aa0a6]">{tagCounts[tag] || 0}</span>
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-[#dadce0] p-4 dark:border-[#5f6368]">
          <div className="flex items-center gap-2 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            <span className="h-2 w-2 rounded-full bg-[#34a853]" />
            <span>项目目录已同步</span>
          </div>
        </div>
      </aside>
    </>
  );
}
