import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

/**
 * Project Pages live at https://<user>.github.io/<repo>/
 * CI sets GITHUB_PAGES_BASE so asset paths match the repo name (avoids 404 → white screen).
 */
function productionBase(): string {
  const fromEnv = process.env.GITHUB_PAGES_BASE?.trim();
  if (fromEnv) {
    return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`;
  }
  return '/True-to-hue/';
}

export default defineConfig(({mode}) => ({
  base: mode === 'production' ? productionBase() : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // Supports optional HMR disable via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
}));
