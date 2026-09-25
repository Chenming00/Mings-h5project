import React, { useState } from 'react';
import { AppWindow, ArrowUpRight, Code2, ExternalLink } from 'lucide-react';

const PROJECT_THEMES = [
  { accent: '#6366f1', soft: '#eef2ff', border: '#c7d2fe', start: '#eef2ff', end: '#f5f3ff' },
  { accent: '#8b5cf6', soft: '#f3e8ff', border: '#e9d5ff', start: '#f5f3ff', end: '#fdf4ff' },
  { accent: '#0ea5e9', soft: '#e0f2fe', border: '#bae6fd', start: '#ecfeff', end: '#eff6ff' },
  { accent: '#14b8a6', soft: '#ccfbf1', border: '#99f6e4', start: '#ecfdf5', end: '#f0fdfa' },
  { accent: '#f97316', soft: '#ffedd5', border: '#fed7aa', start: '#fff7ed', end: '#fffbeb' },
  { accent: '#e11d48', soft: '#ffe4e6', border: '#fecdd3', start: '#fff1f2', end: '#fdf4ff' },
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
      className="animate-card-enter group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 shadow-[0_8px_30px_-20px_rgba(17,24,39,0.3)] backdrop-blur transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-[0_22px_50px_-24px_rgba(79,70,229,0.38)] focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-white/8 dark:bg-white/[0.045] dark:shadow-black/20 dark:hover:border-indigo-500/40"
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

      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {hasThumbnail ? (
          <>
            <img
              src={project.thumbnail}
              alt={`${project.name} 项目封面`}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/35 via-transparent to-transparent opacity-70" />
          </>
        ) : (
          <div
            className="relative h-full w-full overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${theme.start}, ${theme.end})` }}
          >
            <div className="surface-grid absolute inset-0 opacity-70" />
            <div
              className="absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-30 blur-2xl transition-transform duration-700 group-hover:scale-125"
              style={{ backgroundColor: theme.accent }}
            />
            <div
              className="absolute -bottom-16 -left-8 h-36 w-36 rounded-full border-[28px] opacity-[0.08]"
              style={{ borderColor: theme.accent }}
            />

            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] text-gray-500 shadow-sm backdrop-blur dark:border-white/10 dark:bg-gray-950/35 dark:text-gray-300">
              <Code2 size={11} style={{ color: theme.accent }} />
              H5 PROJECT
            </div>

            <div className="flex h-full items-center justify-center">
              <div
                className="relative flex h-20 w-20 items-center justify-center rounded-[26px] border shadow-xl transition-all duration-500 group-hover:-rotate-3 group-hover:scale-105"
                style={{
                  color: theme.accent,
                  backgroundColor: theme.soft,
                  borderColor: theme.border,
                  boxShadow: `0 20px 35px -18px ${theme.accent}80`,
                }}
              >
                <span className="text-4xl font-bold tracking-[-0.06em]">{initial}</span>
                <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl border-2 border-white bg-gray-950 text-white shadow-lg dark:border-gray-900">
                  <AppWindow size={14} />
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between bg-gradient-to-t from-gray-950/65 via-gray-950/15 to-transparent px-4 pb-3 pt-12 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <span className="text-[10px] font-semibold tracking-wide text-white/85">点击卡片快速预览</span>
          <button
            type="button"
            onClick={event => {
              event.stopPropagation();
              onOpenNew(project);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
            title="在新标签页打开"
            aria-label={`在新标签页打开 ${project.name}`}
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      <div className="pointer-events-none relative flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <h3 className="line-clamp-2 min-w-0 flex-1 text-[15px] font-bold leading-6 tracking-[-0.01em] text-gray-900 transition-colors group-hover:text-indigo-700 dark:text-gray-100 dark:group-hover:text-indigo-300">
            {project.name}
          </h3>
          <ArrowUpRight
            size={15}
            className="mt-1 shrink-0 text-gray-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-500 dark:text-gray-700"
          />
        </div>

        <div className="mt-auto flex min-h-7 items-end justify-between gap-3 pt-4">
          <div className="pointer-events-auto flex min-w-0 flex-wrap gap-1.5">
            {visibleTags.map(tag => (
              <button
                type="button"
                key={tag}
                onClick={event => {
                  event.stopPropagation();
                  onTagClick(tag);
                }}
                className="max-w-[120px] truncate rounded-full border px-2 py-1 text-[10px] font-bold transition-transform hover:-translate-y-0.5 focus:relative focus:z-20"
                style={{ color: theme.accent, backgroundColor: theme.soft, borderColor: theme.border }}
              >
                #{tag}
              </button>
            ))}
            {project.tags?.length > 3 && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-400 dark:bg-white/7 dark:text-gray-500">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
          <span className="shrink-0 text-[10px] font-semibold text-gray-300 dark:text-gray-600">PREVIEW</span>
        </div>
      </div>
    </article>
  );
}
