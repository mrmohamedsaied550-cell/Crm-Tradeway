import { build } from 'vite';
await build({ configFile: 'portable/vite.config.ts' });
await build({ configFile: false, build: { ssr: 'portable/server.ts', target: 'node22', outDir: 'portable-release', emptyOutDir: false, rollupOptions: { output: { entryFileNames: 'start.mjs' } } } });
