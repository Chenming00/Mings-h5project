import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, LayoutGrid, Loader2, Maximize2, Minimize2, RefreshCw, X } from 'lucide-react';

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
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${project.name} 项目预览`}
        className={`animate-panel-enter fixed inset-0 z-50 flex flex-col overflow-hidden bg-white shadow-2xl dark:bg-[#202124] ${
          isFullscreen
            ? 'w-full'
            : 'sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[95vw] sm:border-l sm:border-[#5f6368] md:w-[66vw] lg:w-[60vw] xl:w-[54vw]'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[#dadce0] bg-white px-3 dark:border-[#5f6368] dark:bg-[#202124] sm:px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a73e8] text-white dark:bg-[#8ab4f8] dark:text-[#202124]">
            <LayoutGrid size={17} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-medium text-[#202124] dark:text-[#e8eaed]">{project.name}</h2>
              <span className="hidden items-center gap-1.5 rounded-full bg-[#e6f4ea] px-2 py-0.5 text-[10px] font-medium text-[#137333] sm:flex dark:bg-[#274e13] dark:text-[#81c995]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34a853]" />
                实时预览
              </span>
            </div>
            {project.tags?.length > 0 && (
              <p className="mt-0.5 truncate text-[10px] text-[#80868b] dark:text-[#9aa0a6]">
                {project.tags.map(tag => `#${tag}`).join('  ·  ')}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={reload}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4] dark:text-[#9aa0a6] dark:hover:bg-[#303134]"
              title="刷新预览"
              aria-label="刷新预览"
            >
              <RefreshCw size={17} />
            </button>
            <button
              type="button"
              onClick={() => onOpenNew(project)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4] dark:text-[#9aa0a6] dark:hover:bg-[#303134]"
              title="在新标签页打开"
              aria-label="在新标签页打开"
            >
              <ExternalLink size={17} />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden h-9 w-9 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4] sm:flex dark:text-[#9aa0a6] dark:hover:bg-[#303134]"
              title={isFullscreen ? '退出全屏' : '全屏查看'}
              aria-label={isFullscreen ? '退出全屏' : '全屏查看'}
            >
              {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
            <button
              type="button"
              onClick={closePanel}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#fce8e6] hover:text-[#c5221f] dark:text-[#9aa0a6] dark:hover:bg-[#5c2b29] dark:hover:text-[#f28b82]"
              title="关闭预览"
              aria-label="关闭预览"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-[#f1f3f4] p-2 dark:bg-[#292a2d] sm:p-3">
          <div className="relative h-full w-full overflow-hidden rounded-lg border border-[#dadce0] bg-white dark:border-[#5f6368] dark:bg-white">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#202124]">
                <Loader2 size={24} className="animate-spin text-[#1a73e8] dark:text-[#8ab4f8]" />
                <span className="text-xs text-[#80868b] dark:text-[#9aa0a6]">正在加载预览</span>
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
