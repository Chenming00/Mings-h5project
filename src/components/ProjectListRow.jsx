import React from 'react';
import { ArrowUpRight, Hash } from 'lucide-react';

const PROJECT_THEMES = [
  { accent: '#1a73e8', background: '#e8f0fe' },
  { accent: '#137333', background: '#e6f4ea' },
  { accent: '#b06000', background: '#fef7e0' },
  { accent: '#c5221f', background: '#fce8e6' },
  { accent: '#087ea4', background: '#e6f3f8' },
  { accent: '#8430ce', background: '#f3e8fd' },
];

function getProjectTheme(name) {
  const hash = Array.from(name || '').reduce((value, character) => value + character.codePointAt(0), 0);
  return PROJECT_THEMES[hash % PROJECT_THEMES.length];
}

export default function ProjectListRow({ project, index = 0, onClick, onOpenNew, onTagClick }) {
  const theme = getProjectTheme(project.name);
  const initial = project.name?.trim().charAt(0).toUpperCase() || 'H';
  const visibleTags = project.tags?.slice(0, 3) || [];

  return (
    <article
      className="animate-card-enter group relative flex items-center gap-3 overflow-hidden rounded-lg border border-[#dadce0] bg-white p-3 transition-colors hover:border-[#1a73e8] hover:bg-[#f8f9fa] focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-[#1a73e8]/20 sm:gap-4 sm:px-4 dark:border-[#5f6368] dark:bg-[#292a2d] dark:hover:border-[#8ab4f8] dark:hover:bg-[#303134]"
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
    >
      <button
        type="button"
        className="absolute inset-0 z-10 rounded-lg"
        onClick={() => onClick(project)}
        aria-label={`预览项目：${project.name}`}
      >
        <span className="sr-only">预览项目：${project.name}</span>
      </button>

      {project.thumbnail ? (
        <img
          src={project.thumbnail}
          alt=""
          className="h-11 w-11 shrink-0 rounded-md object-cover sm:h-12 sm:w-14"
          loading="lazy"
        />
      ) : (
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-base font-medium sm:h-12 sm:w-14"
          style={{ color: theme.accent, backgroundColor: theme.background }}
          aria-hidden="true"
        >
          {initial}
        </div>
      )}

      <div className="pointer-events-none min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium text-[#202124] group-hover:text-[#1967d2] dark:text-[#e8eaed] dark:group-hover:text-[#8ab4f8]">
            {project.name}
          </h3>
          <span className="hidden text-[10px] font-medium text-[#80868b] dark:text-[#9aa0a6] sm:inline">H5</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {visibleTags.map(tag => (
            <button
              type="button"
              key={tag}
              onClick={event => {
                event.stopPropagation();
                onTagClick(tag);
              }}
              className="pointer-events-auto relative z-20 flex items-center gap-0.5 rounded-md bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium text-[#5f6368] hover:bg-[#e8eaed] dark:bg-[#3c4043] dark:text-[#9aa0a6] dark:hover:bg-[#5f6368]"
            >
              <Hash size={9} />
              {tag}
            </button>
          ))}
        </div>
      </div>

      <span className="hidden text-xs text-[#80868b] dark:text-[#9aa0a6] md:inline">点击查看预览</span>

      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          onOpenNew(project);
        }}
        className="relative z-20 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#5f6368] opacity-100 hover:bg-[#f1f3f4] hover:text-[#1a73e8] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 dark:text-[#9aa0a6] dark:hover:bg-[#3c4043] dark:hover:text-[#8ab4f8]"
        title="在新标签页打开"
        aria-label={`在新标签页打开 ${project.name}`}
      >
        <ArrowUpRight size={17} />
      </button>
    </article>
  );
}
