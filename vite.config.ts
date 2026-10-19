import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Use './' relative base path by default or GITHUB_PAGES_BASE env var so that
// deployment to any GitHub Pages repository name or custom domain works out of the box.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || './',
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts-vendor': ['recharts'],
          'icons-vendor': ['lucide-react', 'idb'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
