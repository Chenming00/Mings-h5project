import React from 'react';
import { X, ExternalLink, RotateCcw, Maximize2, Sparkles, Code } from 'lucide-react';

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
        className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/50 to-indigo-900/30 backdrop-blur-md z-40 transition-all duration-300"
        onClick={onClose}
      />

      {/* Panel — full screen on mobile, side panel on md+ */}
      <div className="fixed z-50 inset-0 md:inset-y-0 md:right-0 md:left-auto md:w-[65vw] lg:w-[58vw] xl:w-[52vw] flex flex-col bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 md:border-l border-gray-200/80 dark:border-gray-800/80 shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-200/80 dark:border-gray-800/80 shrink-0 bg-gradient-to-r from-white/95 via-white/90 to-white/95 dark:from-gray-950/95 dark:via-gray-950/90 dark:to-gray-950/90 backdrop-blur-xl">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">
                {project.name}
              </p>
              {project.tags?.length > 0 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate font-medium">
                  {project.tags.map(t => `#${t}`).join('  ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={reload}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-all duration-200"
              title="刷新预览"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => onOpenNew(project)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-all duration-200"
              title="在新标签页打开"
            >
              <ExternalLink size={16} />
            </button>
            <button
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-all duration-200"
              title="全屏查看"
            >
              <Maximize2 size={16} />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 rounded-full" />
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
              title="关闭预览"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* iFrame content */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-950 p-3">
          <div className="w-full h-full rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
            <iframe
              id="preview-iframe"
              src={project.path}
              title={project.name}
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        </div>
      </div>
    </>
  );
}
