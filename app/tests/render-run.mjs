import {build} from 'vite';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
await build({configFile:false,resolve:{alias:{'@':resolve('.')}},esbuild:{jsx:'automatic'},build:{ssr:'tests/render.tsx',target:'node22',outDir:'.render-build',emptyOutDir:true,rollupOptions:{output:{entryFileNames:'render.mjs'}}}});
await import(pathToFileURL(resolve('.render-build/render.mjs')).href);
