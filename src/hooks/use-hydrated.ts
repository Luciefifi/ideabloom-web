'use client';

import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * False on the server AND during the browser's first (hydration) render, true
 * right after. Use it when a component would otherwise render cached client
 * data on its first render while the server rendered a loading state: parts of
 * a page hydrate at different times, so another component may already have
 * fetched that data (a "hydration mismatch").
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
