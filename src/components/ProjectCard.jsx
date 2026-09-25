import React, { useState } from 'react';
import { AppWindow, ArrowUpRight, Code2, ExternalLink } from 'lucide-react';

const PROJECT_THEMES = [
  { accent: '#1a73e8', background: '#e8f0fe', border: '#aecbfa' },
  { accent: '#137333', background: '#e6f4ea', border: '#a8dab5' },
  { accent: '#b06000', background: '#fef7e0', border: '#fdd663' },
  { accent: '#c5221f', background: '#fce8e6', border: '#f6aea9' },
  { accent: '#087ea4', background: '#e6f3f8', border: '#a1d5e5' },
  { accent: '#8430ce', background: '#f3e8fd', border: '#d7b8ef' },
];

function getProjectTheme(name) {
  const hash = Array.from(name || '').reduce((value, character) => value + character.codePointAt(0), 0);
  return PROJECT_THEMES[hash % PROJECT_THEMES.length];
}

export default function ProjectCard({ project, index = 0, onClick, onOpenNew, onTagClick }) {
  const [imageFailed, setImageFailed] = useState(false);
  const theme = getProjectTheme(project.name);
  const initial = project.name?.trim().charAt(0).toUpperCase() || 'H';
  const visibleTags = project.tags?.slice(0, 3) || [];
  const hasThumbnail = Boolean(project.thumbnail) && !imageFailed;

  return (
    <article
      className="animate-card-enter group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#dadce0] bg-white transition-[border-color,background-color] duration-150 hover:border-[#1a73e8] focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-[#1a73e8]/20 dark:border-[#5f6368] dark:bg-[#292a2d] dark:hover:border-[#8ab4f8]"
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
    >
      <button
        type="button"
        className="absolute inset-0 z-10 rounded-xl"
        onClick={() => onClick(project)}
        aria-label={`预览项目：${project.name}`}
      >
        <span className="sr-only">预览项目：{project.name}</span>
      </button>

      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#f1f3f4] dark:bg-[#202124]">
        <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: theme.accent }} />

        {hasThumbnail ? (
          <img
            src={project.thumbnail}
            alt={`${project.name} 项目封面`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className="relative flex h-full w-full items-center justify-center overflow-hidden"
            style={{ backgroundColor: theme.background }}
          >
            <div className="absolute left-5 top-1/2 h-12 w-12 -translate-y-1/2 rounded-md opacity-20" style={{ backgroundColor: theme.accent }} />
            <div className="absolute right-5 top-1/2 h-20 w-20 -translate-y-1/2 rounded-lg opacity-10" style={{ backgroundColor: theme.accent }} />

            <div
              className="relative flex h-[76px] w-[76px] items-center justify-center rounded-xl border bg-white text-3xl font-medium"
              style={{ color: theme.accent, borderColor: theme.border }}
            >
              {initial}
              <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-md bg-[#202124] text-white">
                <AppWindow size={13} />
              </span>
            </div>
          </div>
        )}

        <div className="absolute left-3 top-4 flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[10px] font-medium text-[#5f6368] dark:bg-[#303134] dark:text-[#9aa0a6]">
          <Code2 size={12} style={{ color: theme.accent }} />
          H5 项目
        </div>

        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onOpenNew(project);
          }}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#5f6368] opacity-100 transition-colors hover:bg-[#f1f3f4] hover:text-[#1a73e8] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 dark:bg-[#303134] dark:text-[#9aa0a6] dark:hover:bg-[#3c4043] dark:hover:text-[#8ab4f8]"
          title="在新标签页打开"
          aria-label={`在新标签页打开 ${project.name}`}
        >
          <ExternalLink size={15} />
        </button>
      </div>

      <div className="pointer-events-none flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-12 text-[15px] font-medium leading-6 text-[#202124] group-hover:text-[#1967d2] dark:text-[#e8eaed] dark:group-hover:text-[#8ab4f8]">
          {project.name}
        </h3>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="pointer-events-auto flex min-w-0 flex-wrap gap-1.5">
            {visibleTags.map(tag => (
              <button
                type="button"
                key={tag}
                onClick={event => {
                  event.stopPropagation();
                  onTagClick(tag);
                }}
                className="max-w-[112px] truncate rounded-md bg-[#f1f3f4] px-2 py-1 text-[10px] font-medium text-[#5f6368] hover:bg-[#e8eaed] focus:relative focus:z-20 dark:bg-[#3c4043] dark:text-[#9aa0a6] dark:hover:bg-[#5f6368]"
              >
                #{tag}
              </button>
            ))}
            {project.tags?.length > 3 && (
              <span className="rounded-md bg-[#f1f3f4] px-2 py-1 text-[10px] font-medium text-[#80868b] dark:bg-[#3c4043] dark:text-[#9aa0a6]">
                +{project.tags.length - 3}
              </span>
            )}
          </div>

          <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-[#1a73e8] dark:text-[#8ab4f8]">
            预览
            <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </article>
  );
}
