import React from 'react';
import { Code, ExternalLink } from 'lucide-react';

export default function ProjectCard({ project, onClick, onOpenNew }) {
  return (
    <article
      className="group flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200"
      onClick={() => onClick(project)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 gap-2">
            <Code size={32} strokeWidth={1.5} />
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">暂无预览图</span>
          </div>
        )}

        {/* Hover action */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
          <button
            onClick={e => { e.stopPropagation(); onOpenNew(project); }}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-xs font-semibold shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
            title="在新标签页打开"
          >
            <ExternalLink size={13} />
            新窗口打开
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
          {project.name}
        </h3>
        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {project.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
