import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, type Storage, seed } from '../lib/masar/service';
import type { State } from '../lib/masar/model';
const base = fileURLToPath(new URL('.', import.meta.url)), dataDir = join(base, 'masar-data');
await mkdir(join(dataDir, 'files'), { recursive: true });
let current: State;
try {
    current = JSON.parse(await readFile(join(dataDir, 'workspace.json'), 'utf8'));
}
catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT')
        throw e;
    current = seed();
    await writeFile(join(dataDir, 'workspace.json'), JSON.stringify(current));
}
const pathFor = (key: string) => join(dataDir, 'files', key.split('/').pop()!.replace(/[^a-zA-Z0-9-]/g, ''));
const storage: Storage = { async load() { return structuredClone(current); }, async save(_key, s, revision) { if (current.revision !== revision)
        return false; await writeFile(join(dataDir, 'workspace.tmp'), JSON.stringify(s)); await rename(join(dataDir, 'workspace.tmp'), join(dataDir, 'workspace.json')); current = s; return true; }, async put(key, bytes, type) { await writeFile(pathFor(key), bytes); await writeFile(pathFor(key) + '.type', type); }, async get(key) { try {
        return { bytes: new Uint8Array(await readFile(pathFor(key))), type: await readFile(pathFor(key) + '.type', 'utf8') };
    }
    catch {
        return null;
    } }, async remove(key) { await unlink(pathFor(key)).catch(() => { }); await unlink(pathFor(key) + '.type').catch(() => { }); } };
let queue = Promise.resolve();
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer((req, res) => { const job = async () => { try {
    const host = req.headers.host || '';
    if (!/^(localhost|127\.0\.0\.1|terminal\.local)(:\d+)?$/.test(host)) {
        res.writeHead(403);
        res.end('Invalid host');
        return;
    }
    const url = new URL(req.url || '/', `http://${host}`);
    if (url.pathname.startsWith('/api/')) {
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of req) {
            size += chunk.length;
            if (size > 11 * 1024 * 1024) {
                res.writeHead(413);
                res.end('Too large');
                return;
            }
            chunks.push(chunk);
        }
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers))
            if (typeof v === 'string')
                headers.set(k, v);
        const request = new Request(url, { method: req.method, headers, body: req.method === 'GET' ? undefined : Buffer.concat(chunks) });
        const response = await serve(request, storage, 'local-workspace');
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
        return;
    }
    let pathname = decodeURIComponent(url.pathname);
    if (!extname(pathname))
        pathname = '/index.html';
    const target = resolve(base, 'public', '.' + pathname);
    const publicRoot = resolve(base, 'public');
    if (!target.startsWith(publicRoot + '/')) {
        res.writeHead(403);
        res.end();
        return;
    }
    const bytes = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(bytes);
}
catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('تعذّر تحميل الصفحة أو الملف.');
} }; queue = queue.then(job, job); });
const port = Number(process.env.MASAR_PORT || 4173);
server.listen(port, '127.0.0.1', () => { console.log(`\nMasar is ready: http://localhost:${port}\nKeep this window open. Data is saved in masar-data.\n`); });
