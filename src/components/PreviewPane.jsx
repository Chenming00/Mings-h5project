import React from 'react';
import { X, ExternalLink, RefreshCw } from 'lucide-react';

export default function PreviewPane({ project, onClose, onOpenNew }) {
  if (!project) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-3/4 lg:w-2/3 xl:w-1/2 bg-white dark:bg-[#121214] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1 flex gap-2">
              {project.tags?.map(t => <span key={t}>#{t}</span>)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const iframe = document.getElementById('preview-iframe');
                if (iframe) iframe.src = iframe.src;
              }}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Reload preview"
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={() => onOpenNew(project)}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors ml-2"
              title="Close preview"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 w-full bg-gray-100 dark:bg-black p-4 lg:p-6 overflow-hidden">
          <div className="w-full h-full rounded-xl overflow-hidden shadow-inner bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 relative">
            <iframe 
              id="preview-iframe"
              src={project.path} 
              title={project.name}
              className="w-full h-full border-0 absolute inset-0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        </div>
      </div>
    </>
  );
}
