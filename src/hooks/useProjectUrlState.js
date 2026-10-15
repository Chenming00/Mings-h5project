import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PARAM_PREVIEW = 'p';
const PARAM_QUERY = 'q';
const PARAM_TAG = 'tag';

const SEARCH_DEBOUNCE_MS = 300;

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  return {
    preview: params.get(PARAM_PREVIEW) || '',
    query: params.get(PARAM_QUERY) || '',
    tag: params.get(PARAM_TAG) || '',
  };
}

// Keeps the project list, the open preview and the active filters shareable/bookmarkable
// via ?p=<slug>&q=<query>&tag=<tag>.
export function useProjectUrlState(projects) {
  const [state, setState] = useState(readUrlState);
  const stateRef = useRef(state);
  const timerRef = useRef(null);

  const writeUrl = useCallback((next, method) => {
    const params = new URLSearchParams();
    if (next.preview) params.set(PARAM_PREVIEW, next.preview);
    if (next.query) params.set(PARAM_QUERY, next.query);
    if (next.tag) params.set(PARAM_TAG, next.tag);

    const search = params.toString();
    const url = `${window.location.pathname}${search ? `?${search}` : ''}`;
    if (url === `${window.location.pathname}${window.location.search}`) return;

    window.history[method](null, '', url);
  }, []);

  const apply = useCallback((patch, method, debounceMs = 0) => {
    const next = { ...stateRef.current, ...patch };
    stateRef.current = next;
    setState(next);

    window.clearTimeout(timerRef.current);
    if (debounceMs) {
      timerRef.current = window.setTimeout(() => writeUrl(next, 'replaceState'), debounceMs);
    } else {
      writeUrl(next, method);
    }
  }, [writeUrl]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  // Browser back/forward is the source of truth here.
  useEffect(() => {
    const handlePopState = () => {
      window.clearTimeout(timerRef.current);
      const next = readUrlState();
      stateRef.current = next;
      setState(next);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const selectedProject = useMemo(
    () => projects.find(project => project.slug === state.preview) || null,
    [projects, state.preview]
  );

  // A deep link may outlive the project it points at, so drop the stale slug.
  useEffect(() => {
    if (!state.preview) return;
    if (projects.length && !selectedProject) apply({ preview: '' }, 'replaceState');
  }, [apply, projects.length, selectedProject, state.preview]);

  const setSearchQuery = useCallback(
    query => apply({ query }, 'replaceState', SEARCH_DEBOUNCE_MS),
    [apply]
  );

  const setSelectedTag = useCallback(tag => apply({ tag: tag || '' }, 'replaceState'), [apply]);

  const clearFilters = useCallback(() => apply({ query: '', tag: '' }, 'replaceState'), [apply]);

  const openProject = useCallback(project => apply({ preview: project.slug }, 'pushState'), [apply]);

  const closeProject = useCallback(() => apply({ preview: '' }, 'pushState'), [apply]);

  return {
    searchQuery: state.query,
    setSearchQuery,
    selectedTag: state.tag || null,
    setSelectedTag,
    clearFilters,
    selectedProject,
    openProject,
    closeProject,
  };
}