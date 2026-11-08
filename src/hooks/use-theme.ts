'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  applyTheme,
  DARK_MEDIA_QUERY,
  resolveTheme,
  storedTheme,
  type Theme,
} from '@/lib/theme';

function subscribe(onChange: () => void) {
  window.addEventListener('ib-theme-change', onChange);
  window.addEventListener('storage', onChange); // another tab changed it
  const media = window.matchMedia?.(DARK_MEDIA_QUERY);
  media?.addEventListener('change', onChange); // the computer switched light/dark
  return () => {
    window.removeEventListener('ib-theme-change', onChange);
    window.removeEventListener('storage', onChange);
    media?.removeEventListener('change', onChange);
  };
}

/**
 * The chosen theme ("system" follows the computer) and the one actually shown.
 * On the server (pre-rendering) it reports "system"/"light".
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, storedTheme, () => 'system');
  const resolved = useSyncExternalStore(
    subscribe,
    () => resolveTheme(storedTheme()),
    () => 'light' as const,
  );

  // "System": when the computer switches between light and dark, follow it.
  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia?.(DARK_MEDIA_QUERY);
    const follow = () => applyTheme('system');
    media?.addEventListener('change', follow);
    return () => media?.removeEventListener('change', follow);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => applyTheme(next), []);
  return { theme: theme as Theme, resolved, setTheme };
}
