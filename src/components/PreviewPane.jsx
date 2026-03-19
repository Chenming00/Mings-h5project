import React from 'react';
import { X, ExternalLink, RefreshCw } from 'lucide-react';

export default function PreviewPane({ project, onClose, onOpenNew }) {
  if (!project) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Slide-over panel */}
      <div className="fixed inset-y-4 right-4 z-50 w-[calc(100%-2rem)] md:w-3/4 lg:w-2/3 xl:w-1/2 bg-white dark:bg-[#0f1115] shadow-2xl flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-slate-200/60 dark:border-gray-800/60 overflow-hidden animate-in slide-in-from-right-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-gray-800/60 bg-slate-50/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {project.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex gap-2 truncate">
              {project.tags?.map(t => <span key={t} className="uppercase tracking-wide">#{t}</span>)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={() => {
                const iframe = document.getElementById('preview-iframe');
                if (iframe) iframe.src = iframe.src;
              }}
              className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all active:scale-95"
              title="Reload preview"
            >
              <RefreshCw size={18} />
            </button>
            <button 
              onClick={() => onOpenNew(project)}
              className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all active:scale-95"
              title="Open in new tab"
            >
              <ExternalLink size={18} />
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-gray-800 mx-1"></div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 ml-1"
              title="Close preview"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>
          </div>
        </div>

        <div className="flex-1 w-full bg-slate-100/50 dark:bg-gray-950 p-2 md:p-4 overflow-hidden">
          <div className="w-full h-full rounded-xl overflow-hidden shadow-inner bg-white dark:bg-black border border-slate-200 dark:border-gray-800 relative">
            <div className="absolute inset-0 flex items-center justify-center -z-10">
               <RefreshCw size={24} className="text-slate-300 dark:text-slate-700 animate-spin" />
            </div>
            <iframe 
              id="preview-iframe"
              src={project.path} 
              title={project.name}
              className="w-full h-full border-0 absolute inset-0 z-10 bg-white dark:bg-black"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        </div>
      </div>
    </>
  );
}
