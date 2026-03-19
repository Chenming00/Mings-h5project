import React from 'react';
import { Box, Code, ExternalLink } from 'lucide-react';

export default function ProjectCard({ project, onClick, onOpenNew, index = 0 }) {
  return (
    <div 
      className="group relative bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg border border-slate-200/60 dark:border-gray-800/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-500 ease-out transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer animate-in fade-in zoom-in fill-mode-both"
      style={{ animationDelay: `${index * 100}ms`, animationDuration: '600ms' }}
      onClick={() => onClick(project)}
    >
      <div className="aspect-video w-full bg-slate-100 dark:bg-gray-800 relative overflow-hidden">
        {project.thumbnail ? (
          <>
            <img 
              src={project.thumbnail} 
              alt={project.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
            />
            {/* Subtle inner gradient overlay to fix contrast issues */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 group-hover:scale-110 transition-transform duration-700 ease-in-out bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-900">
            <Code size={48} className="mb-3 opacity-40 transition-transform duration-500 group-hover:rotate-12" />
            <span className="text-sm font-semibold tracking-wide uppercase opacity-80">No Thumbnail</span>
          </div>
        )}
        
        {/* Interactive Overlay Overlay */}
        <div className="absolute inset-0 bg-blue-900/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center">
          <button 
            onClick={(e) => { e.stopPropagation(); onOpenNew(project); }}
            className="p-3 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-full shadow-xl transform translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
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
