import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Lets tests use the same "@/..." import paths as the app (from tsconfig.json).
  resolve: { tsconfigPaths: true },
  test: {
    // jsdom simulates a browser (DOM, window, document) inside Node.
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
