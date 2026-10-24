import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Circle, ExternalLink, Loader2, Maximize2, Minimize2, RefreshCw, X } from 'lucide-react';
import { tagLabels } from '../data/projectPresentation';

export default function PreviewPane({ project, onClose, onOpenNew }) {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [loadedKey, setLoadedKey] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isLoading = Boolean(project && loadedKey !== reloadKey);
  useEffect(() => {
    if (!project) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, [project]);
  useEffect(() => {
    if (!project) return;
    const handleKeys = event => {
      if (event.key === 'Escape' && !document.fullscreenElement) onClose();
      if (event.key === 'Tab') {
        const items = [...(panelRef.current?.querySelectorAll('button, iframe') || [])].filter(item => item.getClientRects().length);
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1]?.focus(); }
        else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0]?.focus(); }
      }
    };
    const handleFullscreen = () => setIsFullscreen(document.fullscreenElement === panelRef.current);
    window.addEventListener('keydown', handleKeys);
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => { window.removeEventListener('keydown', handleKeys); document.removeEventListener('fullscreenchange', handleFullscreen); };
  }, [project, onClose]);
  if (!project) return null;
  const closePanel = async () => {
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* Closing remains available if the browser has already exited. */ } }
    onClose();
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (panelRef.current?.requestFullscreen) await panelRef.current.requestFullscreen();
      else setIsFullscreen(current => !current);
    } catch { setIsFullscreen(current => !current); }
  };
  return <>
    {!isFullscreen && <button className="preview-backdrop" onClick={closePanel} aria-label="关闭项目预览" tabIndex={-1} />}
    <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="preview-title" className={`preview-panel animate-panel-enter ${isFullscreen ? 'is-fullscreen' : ''}`}>
      <header className="preview-toolbar"><span className="preview-symbol"><ArrowUpRight size={19} /></span><div className="preview-title"><h2 id="preview-title">{project.displayTitle}</h2><p>{project.tags.filter(tag => tag !== 'project').slice(0, 3).map(tag => tagLabels[tag] || tag).join(' / ')}</p></div><span className="preview-live"><Circle size={6} fill="currentColor" /> 实时预览</span><div className="preview-actions"><button className="icon-button" onClick={() => setReloadKey(current => current + 1)} title="刷新预览" aria-label="刷新预览"><RefreshCw size={16} /></button><button className="icon-button" onClick={() => onOpenNew(project)} title="在新标签页打开" aria-label="在新标签页打开"><ExternalLink size={16} /></button><button className="icon-button fullscreen-button" onClick={toggleFullscreen} title={isFullscreen ? '退出全屏' : '全屏查看'} aria-label={isFullscreen ? '退出全屏' : '全屏查看'}>{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button><button ref={closeButtonRef} className="icon-button preview-close" onClick={closePanel} title="关闭预览" aria-label="关闭预览"><X size={20} /></button></div></header>
      <div className="preview-frame-container">{isLoading && <div className="preview-loading" role="status"><Loader2 size={24} className="animate-spin" /><span>正在打开这个小世界…</span></div>}<iframe key={`${project.path}-${reloadKey}`} id="preview-iframe" src={project.path} title={project.name} sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads" onLoad={() => setLoadedKey(reloadKey)} /></div>
    </div>
  </>;
}
