import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, Minimize2, Maximize2, RotateCcw, Sparkles, X } from 'lucide-react';

export default function PreviewPane({ project, onClose, onOpenNew }) {
  const panelRef = useRef(null);
  const [loadedPath, setLoadedPath] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isLoading = Boolean(project && loadedPath !== project.path);

  useEffect(() => {
    if (!project) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [project]);

  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape' && !document.fullscreenElement) onClose();
    };

    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === panelRef.current);
    window.addEventListener('keydown', handleEscape);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onClose]);

  if (!project) return null;

  const reload = () => {
    const iframe = document.getElementById('preview-iframe');
    if (!iframe) return;
    setLoadedPath(null);
    iframe.src = 'about:blank';
    window.setTimeout(() => {
      iframe.src = project.path;
    }, 0);
  };

  const closePanel = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    onClose();
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else if (panelRef.current?.requestFullscreen) {
        await panelRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        setIsFullscreen(current => !current);
      }
    } catch {
      setIsFullscreen(current => !current);
    }
  };

  return (
    <>
      {!isFullscreen && (
        <div
          className="fixed inset-0 z-40 bg-gray-950/65 backdrop-blur-md"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${project.name} 项目预览`}
        className={`animate-panel-enter fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#f5f6fa] shadow-2xl dark:bg-[#080a10] ${
          isFullscreen
            ? 'w-full bg-white dark:bg-[#080a10]'
            : 'sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[95vw] sm:border-l sm:border-white/8 md:w-[66vw] lg:w-[60vw] xl:w-[54vw]'
        }`}
      >
        <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-gray-200/80 bg-white/90 px-3 backdrop-blur-xl sm:px-5 dark:border-white/8 dark:bg-[#0b0d14]/92">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-md shadow-indigo-500/20">
            <Sparkles size={16} className="text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-bold tracking-tight text-gray-950 dark:text-white">{project.name}</h2>
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 sm:flex dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                实时预览
              </span>
            </div>
            {project.tags?.length > 0 && (
              <p className="mt-0.5 truncate text-[10px] font-medium text-gray-400 dark:text-gray-600">
                {project.tags.map(tag => `#${tag}`).join('  ·  ')}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={reload}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-white/7 dark:hover:text-indigo-300"
              title="刷新预览"
              aria-label="刷新预览"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={() => onOpenNew(project)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-white/7 dark:hover:text-indigo-300"
              title="在新标签页打开"
              aria-label="在新标签页打开"
            >
              <ExternalLink size={16} />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600 sm:flex dark:hover:bg-white/7 dark:hover:text-indigo-300"
              title={isFullscreen ? '退出全屏' : '全屏查看'}
              aria-label={isFullscreen ? '退出全屏' : '全屏查看'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <div className="mx-1 hidden h-5 w-px bg-gray-200 dark:bg-white/10 sm:block" />
            <button
              type="button"
              onClick={closePanel}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              title="关闭预览"
              aria-label="关闭预览"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-gray-100 p-2 sm:p-3 dark:bg-[#05070b]">
          <div className="relative h-full w-full overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-xl shadow-gray-950/5 dark:border-white/8 dark:bg-white dark:shadow-black/30 sm:rounded-2xl">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#0b0d14]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                  <Loader2 size={22} className="animate-spin" />
                </div>
                <span className="text-[11px] font-semibold text-gray-400">正在启动项目预览…</span>
              </div>
            )}
            <iframe
              key={project.path}
              id="preview-iframe"
              src={project.path}
              title={project.name}
              className="h-full w-full"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
              onLoad={() => setLoadedPath(project.path)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
