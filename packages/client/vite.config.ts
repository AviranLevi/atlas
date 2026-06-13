import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // The remaining chunks above this size (mermaid, the syntax-highlighter
    // theme) are intentionally lazy-loaded and off the initial critical path,
    // so their size doesn't affect first paint. The split below keeps the main
    // entry chunk comfortably under it.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Split stable vendor libs out of the main entry chunk so app-code
        // changes don't bust their browser cache, and the entry stays small.
        // Safe because pnpm resolves a single React copy — cross-chunk imports
        // are wired by Rollup; only duplicate React instances cause problems.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Keep react core + react-dom + react-router in ONE chunk so the
          // entry imports it one-directionally (no circular chunk reference).
          // /\/react@/ matches only react core, not react-dom@/react-router@.
          if (id.includes('react-router') || id.includes('react-dom') || /\/react@/.test(id)) {
            return 'react-vendor';
          }
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('@tanstack')) return 'tanstack';
          if (id.includes('@xyflow')) return 'xyflow';
          if (id.includes('@dnd-kit')) return 'dnd-kit';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
});
