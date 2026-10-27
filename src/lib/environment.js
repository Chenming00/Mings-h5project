// Storage and environment access with graceful degradation.
//
// Every read/write goes through here because `localStorage` is not always
// available: Safari's "Block All Cookies", enterprise policy, and some embedded
// webviews throw a SecurityError on *access*, not just on write. A single throw
// during a `useState` initialiser used to blank the whole app, so nothing in the
// component tree may touch `window.localStorage` directly.

export const safeStorage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
};

/** System colour-scheme preference, with a safe fallback for old engines. */
export function prefersDarkScheme() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

/**
 * Resolve the initial theme: an explicit stored choice wins, otherwise follow
 * the system preference. `index.html` applies the same logic inline before
 * first paint so there is no flash of the wrong theme.
 */
export function resolveInitialTheme() {
  const stored = safeStorage.get('theme');
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return prefersDarkScheme();
}

/** Resolve the initial list/grid preference. */
export function resolveInitialViewMode() {
  return safeStorage.get('viewMode') === 'list' ? 'list' : 'grid';
}
