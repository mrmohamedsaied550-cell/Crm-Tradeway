import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';
// Single self-contained HTML (engine + UI + fonts inlined) for sharing / the Claude artifact.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  define: { 'import.meta.env.VITE_MASAR_MODE': JSON.stringify('browser') },
  resolve: { alias: { '@': fileURLToPath(new URL('..', import.meta.url)) } },
  publicDir: false,
  build: { outDir: '../dist-single', emptyOutDir: true, assetsInlineLimit: 100000000, cssCodeSplit: false },
  css: { postcss: fileURLToPath(new URL('..', import.meta.url)) },
});
