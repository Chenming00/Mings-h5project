import React from 'react';
import { Code, ExternalLink, ArrowUpRight } from 'lucide-react';

export default function ProjectCard({ project, onClick, onOpenNew }) {
  return (
    <article
      className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 overflow-hidden cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1"
      onClick={() => onClick(project)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 gap-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Code size={28} strokeWidth={1.5} className="text-indigo-400" />
            </div>
            <span className="relative text-xs font-medium text-gray-400 dark:text-gray-500">预览加载中</span>
          </div>
        )}

        {/* Hover action */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
          <button
            onClick={e => { e.stopPropagation(); onOpenNew(project); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-gray-900 dark:text-white rounded-xl text-xs font-semibold shadow-lg shadow-black/20 transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-white dark:hover:bg-gray-900"
            title="在新标签页打开"
          >
            <ExternalLink size={14} />
            新窗口打开
            <ArrowUpRight size={12} className="opacity-70" />
          </button>
        </div>

        {/* Top gradient indicator */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <ArrowUpRight size={16} className="text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {project.name}
        </h3>
        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {project.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
