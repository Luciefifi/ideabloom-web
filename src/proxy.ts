import { NextResponse, type NextRequest } from 'next/server';
import { decideRoute, SESSION_COOKIE } from '@/lib/auth-routes';

/**
 * Runs before every page request (Next.js 16 "proxy", formerly "middleware").
 * Logged-out visitors are sent to /login; logged-in users skip the login page.
 * See lib/auth-routes.ts for the rules.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const decision = decideRoute(
    pathname,
    search,
    request.cookies.has(SESSION_COOKIE),
  );

  if (decision.type === 'redirect') {
    return NextResponse.redirect(new URL(decision.location, request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip API calls (the API checks its own tokens), Next.js internals and
  // files with an extension (icons, images), so they always load.
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
