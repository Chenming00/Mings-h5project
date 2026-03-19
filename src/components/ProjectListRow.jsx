import React from 'react';
import { ExternalLink, Hash } from 'lucide-react';

export default function ProjectListRow({ project, onClick, onOpenNew }) {
  return (
    <div
      className="group flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => onClick(project)}
    >
      {/* Icon placeholder */}
      <div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 text-gray-300 dark:text-gray-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
        <span className="text-base font-bold text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors select-none">
          {project.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Name */}
      <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
        {project.name}
      </p>

      {/* Tags */}
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        {project.tags?.map((tag, i) => (
          <span
            key={i}
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
          >
            <Hash size={10} />
            {tag}
          </span>
        ))}
      </div>

      {/* Action */}
      <button
        onClick={e => { e.stopPropagation(); onOpenNew(project); }}
        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 transition-all shrink-0"
        title="在新标签页打开"
      >
        <ExternalLink size={14} />
      </button>
    </div>
  );
}
