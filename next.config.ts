import type { NextConfig } from 'next';

/**
 * Where the NestJS API runs. Server-side only (no NEXT_PUBLIC_ prefix), so the
 * browser never needs to know it. Rewrites are calculated when the app is
 * built, so set API_URL before `npm run build` in production.
 */
const apiUrl = process.env.API_URL ?? 'http://localhost:4000';

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
