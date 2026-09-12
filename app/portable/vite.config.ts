import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('..', import.meta.url)) } },
  publicDir: fileURLToPath(new URL('../public', import.meta.url)),
  build: { outDir: '../portable-release/public', emptyOutDir: true },
  css: { postcss: fileURLToPath(new URL('..', import.meta.url)) },
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:4173' } },
});
