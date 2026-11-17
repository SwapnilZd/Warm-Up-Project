import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app makes no network calls at runtime (PRD FR-11), so no proxy is configured.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
    // The default worker pool fails to start on this machine (Node 26). vmForks works.
    pool: 'vmForks',
  },
});
