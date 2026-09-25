import React from 'react';
import { ArrowUpRight, Hash } from 'lucide-react';

const ACCENTS = [
  ['#6366f1', '#eef2ff'],
  ['#8b5cf6', '#f3e8ff'],
  ['#0ea5e9', '#e0f2fe'],
  ['#14b8a6', '#ccfbf1'],
  ['#f97316', '#ffedd5'],
  ['#e11d48', '#ffe4e6'],
];

function getAccent(name) {
  const hash = Array.from(name || '').reduce((value, character) => value + character.codePointAt(0), 0);
  return ACCENTS[hash % ACCENTS.length];
}

export default function ProjectListRow({ project, index = 0, onClick, onOpenNew, onTagClick }) {
  const [accent, soft] = getAccent(project.name);
  const initial = project.name?.trim().charAt(0).toUpperCase() || 'H';
  const visibleTags = project.tags?.slice(0, 2) || [];

  return (
    <article
      className="animate-card-enter group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/85 p-3 shadow-[0_6px_24px_-18px_rgba(17,24,39,0.28)] transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/20 sm:gap-4 sm:px-4 sm:py-3.5 dark:border-white/8 dark:bg-white/[0.04] dark:shadow-black/20 dark:hover:border-indigo-500/40"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <button
        type="button"
        className="absolute inset-0 z-10 rounded-2xl"
        onClick={() => onClick(project)}
        aria-label={`预览项目：${project.name}`}
      >
        <span className="sr-only">预览项目：{project.name}</span>
      </button>

      {project.thumbnail ? (
        <img
          src={project.thumbnail}
          alt=""
          className="h-12 w-12 shrink-0 rounded-xl object-cover sm:h-12 sm:w-14"
          loading="lazy"
        />
      ) : (
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/60 text-lg font-bold shadow-sm sm:h-12 sm:w-14"
          style={{ color: accent, backgroundColor: soft }}
          aria-hidden="true"
        >
          {initial}
        </div>
      )}

      <div className="pointer-events-none min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-bold tracking-[-0.01em] text-gray-900 transition-colors group-hover:text-indigo-700 dark:text-gray-100 dark:group-hover:text-indigo-300">
            {project.name}
          </h3>
          <span className="hidden shrink-0 text-[9px] font-bold tracking-[0.12em] text-gray-300 dark:text-gray-700 sm:inline">
            H5 PROJECT
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 sm:hidden">
          {visibleTags.map(tag => (
            <button
              type="button"
              key={tag}
              onClick={event => {
                event.stopPropagation();
                onTagClick(tag);
              }}
              className="pointer-events-auto relative z-20 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-white/7 dark:text-gray-400"
            >
              #{tag}
            </button>
          ))}
        </div>

        <div className="mt-1.5 hidden items-center gap-1.5 sm:flex">
          {visibleTags.map(tag => (
            <button
              type="button"
              key={tag}
              onClick={event => {
                event.stopPropagation();
                onTagClick(tag);
              }}
              className="pointer-events-auto relative z-20 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300"
            >
              <Hash size={9} />
              {tag}
            </button>
          ))}
        </div>
      </div>

      <span className="hidden shrink-0 text-[10px] font-semibold text-gray-300 dark:text-gray-700 md:block">
        点击查看预览
      </span>

      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          onOpenNew(project);
        }}
        className="relative z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 opacity-100 transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
        title="在新标签页打开"
        aria-label={`在新标签页打开 ${project.name}`}
      >
        <ArrowUpRight size={16} />
      </button>
    </article>
  );
}
