/**
 * Which pages need a login, and where to send people. Pure functions with no
 * Next.js imports, so they're easy to unit test and reuse in proxy.ts.
 *
 * Important: this is for convenience (no flash of an empty dashboard before a
 * redirect). The real protection is the API refusing requests without a
 * valid token.
 */

/** Set by the API next to the real (httpOnly) tokens. It only means "a session probably exists". */
export const SESSION_COOKIE = 'ib_session';

export const DEFAULT_AFTER_LOGIN = '/dashboard';
export const LOGIN_PATH = '/login';

/** Pages for logged-out visitors; logged-in users are sent to the dashboard. */
export const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

/** Pages anyone may open, logged in or not. */
export const PUBLIC_PAGES = [...AUTH_PAGES, '/reset-password'];

function matches(pathname: string, pages: string[]): boolean {
  return pages.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );
}

export function isAuthPage(pathname: string): boolean {
  return matches(pathname, AUTH_PAGES);
}

export type RouteDecision =
  { type: 'allow' } | { type: 'redirect'; location: string };

export function decideRoute(
  pathname: string,
  search: string,
  hasSession: boolean,
): RouteDecision {
  if (!hasSession && !matches(pathname, PUBLIC_PAGES)) {
    // Remember where they were going, so login can bring them back.
    const location =
      pathname === '/'
        ? LOGIN_PATH
        : `${LOGIN_PATH}?next=${encodeURIComponent(pathname + search)}`;
    return { type: 'redirect', location };
  }

  if (hasSession && isAuthPage(pathname)) {
    return { type: 'redirect', location: DEFAULT_AFTER_LOGIN };
  }

  return { type: 'allow' };
}

/**
 * Only follow `?next=` if it's a path on THIS site. Otherwise an attacker
 * could send a link like /login?next=https://evil.example that forwards you
 * to a fake site right after you log in (an "open redirect").
 */
export function getSafeRedirect(
  next: string | null | undefined,
  fallback = DEFAULT_AFTER_LOGIN,
): string {
  if (
    !next ||
    !next.startsWith('/') ||
    next.startsWith('//') ||
    next.startsWith('/\\') ||
    isAuthPage(next.split('?')[0])
  ) {
    return fallback;
  }
  return next;
}
