import { useEffect, useState } from 'react';

/**
 * Returns `value`, but only after it has stopped changing for `delayMs`.
 * Used for search: we wait until the person pauses typing instead of calling
 * the API on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
