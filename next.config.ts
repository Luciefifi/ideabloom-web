import type { NextConfig } from 'next';

/**
 * Where the NestJS API runs. Server-side only (no NEXT_PUBLIC_ prefix), so the
 * browser never needs to know it. Rewrites are calculated when the app is
 * built, so set API_URL before `npm run build` in production.
 */
const apiUrl = process.env.API_URL ?? 'http://localhost:4000';
const isDev = process.env.NODE_ENV === 'development';

// On Vercel (which sets VERCEL=1), stop the build instead of silently forwarding
// to localhost, and never send login cookies to the API over plain HTTP.
if (process.env.VERCEL && !apiUrl.startsWith('https://')) {
  throw new Error(
    "API_URL must be set to the API's https:// address in the Vercel project settings.",
  );
}

/**
 * Content-Security-Policy: the browser only loads scripts, styles, fonts and
 * images from this site, only talks to this site, can't be framed by other
 * sites, and can't post forms elsewhere.
 *
 * Inline scripts are still allowed ('unsafe-inline'): Next.js uses them, and the
 * stricter "nonce" approach would force every page to render per request
 * (incompatible with partial prerendering; see the Next.js CSP guide). Our
 * defence against injected HTML is that the app never renders HTML from data.
 * 'unsafe-eval' is only needed by the development server.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // No 'upgrade-insecure-requests': HTTPS is enforced by the host (HTTPS redirect +
  // HSTS, see docs/DEPLOYMENT.md); the rule breaks running the production build over plain HTTP.
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
];

const nextConfig: NextConfig = {
  // Next.js 16 rendering model; both become the default in the next major version.
  cacheComponents: true,
  partialPrefetching: true,

  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },

  /**
   * The browser calls /api/v1/... on THIS app; Next.js forwards it to the API.
   * One origin for the browser means httpOnly login cookies work without CORS.
   */
  // Don't advertise the framework in every response.
  poweredByHeader: false,

  async headers() {
    // Every page. API responses get their own headers from the API (helmet).
    return [{ source: '/((?!api/).*)', headers: securityHeaders }];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
