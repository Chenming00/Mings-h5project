import React from 'react';
import { X, ExternalLink, RotateCcw } from 'lucide-react';

export default function PreviewPane({ project, onClose, onOpenNew }) {
  if (!project) return null;

  const reload = () => {
    const iframe = document.getElementById('preview-iframe');
    if (iframe) { const s = iframe.src; iframe.src = ''; iframe.src = s; }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      {/* Panel — full screen on mobile, side panel on md+ */}
      <div className="fixed z-50 inset-0 md:inset-y-0 md:right-0 md:left-auto md:w-[62vw] lg:w-[55vw] xl:w-[50vw] flex flex-col bg-white dark:bg-gray-950 md:border-l border-gray-200 dark:border-gray-800 shadow-2xl">
        
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-950">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
              {project.name}
            </p>
            {project.tags?.length > 0 && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                {project.tags.map(t => `#${t}`).join('  ')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={reload}
              className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="刷新"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={() => onOpenNew(project)}
              className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="在新标签页打开"
            >
              <ExternalLink size={15} />
            </button>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="关闭"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* iFrame content */}
        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 p-2">
          <iframe
            id="preview-iframe"
            src={project.path}
            title={project.name}
            className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </div>
    </>
  );
}
