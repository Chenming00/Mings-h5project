import React from 'react';
import { ExternalLink, Hash, ArrowUpRight, Sparkles } from 'lucide-react';

export default function ProjectListRow({ project, onClick, onOpenNew }) {
  return (
    <div
      className="group flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
      onClick={() => onClick(project)}
    >
      {/* Icon placeholder */}
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center shrink-0 group-hover:from-indigo-500/20 group-hover:via-purple-500/20 group-hover:to-pink-500/20 transition-all duration-300">
        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-500 select-none">
          {project.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {project.name}
        </p>
      </div>

      {/* Tags */}
      <div className="hidden sm:flex items-center gap-2 shrink-0 max-w-[120px] overflow-hidden">
        {project.tags?.map((tag, i) => (
          <span
            key={i}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50 truncate"
          >
            <Hash size={10} className="text-indigo-400" />
            {tag}
          </span>
        ))}
      </div>

      {/* Action */}
      <button
        onClick={e => { e.stopPropagation(); onOpenNew(project); }}
        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-all shrink-0 group-hover:translate-x-0 -translate-x-2"
        title="在新标签页打开"
      >
        <ArrowUpRight size={16} />
      </button>
    </div>
  );
}
