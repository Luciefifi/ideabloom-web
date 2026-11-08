'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

/**
 * Collects changes and saves them `delay` ms after the last one.
 *
 * - Changes made while a save is running are kept and saved next (saves never overlap).
 * - If a save fails, its changes are kept and retried with the next change or `flush()`.
 * - Leaving the page (unmount) saves what's pending; closing the tab with
 *   unsaved changes asks the browser to warn you.
 */
export function useAutosave<T extends object>(
  save: (changes: Partial<T>) => Promise<unknown>,
  delay = 1000,
) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const pending = useRef<Partial<T>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const running = useRef<Promise<void>>(Promise.resolve());
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback((): Promise<void> => {
    clearTimeout(timer.current);
    running.current = running.current.then(async () => {
      const changes = pending.current;
      if (Object.keys(changes).length === 0) return;
      pending.current = {};
      setStatus('saving');
      try {
        await saveRef.current(changes);
        setStatus(Object.keys(pending.current).length ? 'unsaved' : 'saved');
      } catch {
        // Keep the failed changes, under any newer ones.
        pending.current = { ...changes, ...pending.current };
        setStatus('error');
      }
    });
    return running.current;
  }, []);

  const queue = useCallback(
    (changes: Partial<T>) => {
      pending.current = { ...pending.current, ...changes };
      setStatus('unsaved');
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), delay);
    },
    [delay, flush],
  );

  // Save what's left when the component goes away (e.g. navigating to another page).
  useEffect(() => () => void flush(), [flush]);

  // Warn before closing the tab while changes aren't saved yet.
  const dirty =
    status === 'unsaved' || status === 'saving' || status === 'error';
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return { status, queue, flush };
}
