'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';

/**
 * Last resort, when even the root layout fails. It replaces the whole page, so
 * it can't rely on our stylesheet: a few inline styles keep it readable, and
 * it follows the computer's light/dark setting.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
          margin: 0,
          colorScheme: 'light dark',
        }}
      >
        <title>Something went wrong · IdeaBloom</title>
        <main style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 20 }}>Something went wrong</h1>
          <p>IdeaBloom couldn&apos;t load. Your data is safe.</p>
          <button
            type="button"
            onClick={retry}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#6f55ae',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
