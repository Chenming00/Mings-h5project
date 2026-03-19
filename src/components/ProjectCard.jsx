import React from 'react';
import { Box, Code, ExternalLink } from 'lucide-react';

export default function ProjectCard({ project, onClick, onOpenNew }) {
  return (
    <div 
      className="group relative bg-white dark:bg-[#121214] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ease-out transform hover:-translate-y-1 cursor-pointer"
      onClick={() => onClick(project)}
    >
      <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        {project.thumbnail ? (
          <img 
            src={project.thumbnail} 
            alt={project.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 group-hover:scale-105 transition-transform duration-500">
            <Code size={40} className="mb-2 opacity-50" />
            <span className="text-sm font-medium">No Thumbnail</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button 
            onClick={(e) => { e.stopPropagation(); onOpenNew(project); }}
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={20} />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate">
          {project.name}
        </h3>
        <div className="flex flex-wrap gap-2 mt-auto">
          {project.tags?.map((tag, idx) => (
            <span 
              key={idx} 
              className="text-xs font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
