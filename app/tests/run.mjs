import {build} from 'vite';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
await build({configFile:false,build:{ssr:'tests/flows.ts',target:'node22',outDir:'.test-build',emptyOutDir:true,rollupOptions:{output:{entryFileNames:'flows.mjs'}}}});
await import(pathToFileURL(resolve('.test-build/flows.mjs')).href);
