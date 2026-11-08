export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

/** A local copy of the theme, so it applies before anything loads (the account is the source of truth). */
export const THEME_STORAGE_KEY = 'ib-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function isTheme(value: unknown): value is Theme {
  return (THEMES as readonly unknown[]).includes(value);
}

export function storedTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : 'system';
  } catch {
    return 'system'; // storage blocked (e.g. some private modes)
  }
}

export function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(DARK_QUERY).matches
  );
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;
}

/** Switches the page's colours (the `.dark` class) and remembers the choice locally. */
export function applyTheme(theme: Theme): void {
  const dark = resolveTheme(theme) === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage blocked: the theme still applies for this visit
  }
  window.dispatchEvent(new Event('ib-theme-change'));
}

/**
 * Runs before the first paint (inline in <head>), so a dark-theme user never
 * sees a white flash. It's a fixed string with no user data in it.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||((t!=='light')&&window.matchMedia('${DARK_QUERY}').matches);var e=document.documentElement;if(d)e.classList.add('dark');e.style.colorScheme=d?'dark':'light';}catch(_){}})();`;

export const DARK_MEDIA_QUERY = DARK_QUERY;
