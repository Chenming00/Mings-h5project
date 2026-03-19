import React from 'react';
import { Box, Code, ExternalLink } from 'lucide-react';

export default function ProjectCard({ project, onClick, onOpenNew }) {
  return (
    <div 
      className="group relative bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => onClick(project)}
    >
      <div className="aspect-video w-full bg-slate-100 dark:bg-gray-800 relative overflow-hidden">
        {project.thumbnail ? (
          <img 
            src={project.thumbnail} 
            alt={project.name} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-gray-800/50">
            <Code size={40} className="mb-2 opacity-50" />
            <span className="text-sm font-medium">No Thumbnail</span>
          </div>
        )}
        
        {/* Interactive Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button 
            onClick={(e) => { e.stopPropagation(); onOpenNew(project); }}
            className="p-2 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-sm transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={22} />
          </button>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {project.name}
        </h3>
        <div className="flex flex-wrap gap-2 mt-auto">
          {project.tags?.map((tag, idx) => (
            <span 
              key={idx} 
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
