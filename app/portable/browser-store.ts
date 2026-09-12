/**
 * Browser-only runtime: the same `serve()` request handler and engine that the
 * local Node server uses, backed by localStorage instead of a JSON file.
 * Installs a `fetch` shim so the UI code stays identical in both modes.
 */
import { serve, seed, type Storage } from '../lib/masar/service';
import type { State } from '../lib/masar/model';

const KEY = 'masar-workspace-v1';
const FILES = 'masar-files-v1';

function loadState(): State {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) as State; } catch { /* corrupted or blocked storage */ }
  return seed();
}
let current: State = loadState();

const fileMap = (): Record<string, { b64: string; type: string }> => { try { return JSON.parse(localStorage.getItem(FILES) || '{}'); } catch { return {}; } };
const toB64 = (bytes: Uint8Array) => { let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); }); return btoa(s); };
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

export const browserStorage: Storage = {
  async load() { return structuredClone(current); },
  async save(_key, s, revision) {
    if (current.revision !== revision) return false;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota: keep in memory */ }
    current = s; return true;
  },
  async put(key, bytes, type) { const m = fileMap(); m[key] = { b64: toB64(bytes), type }; try { localStorage.setItem(FILES, JSON.stringify(m)); } catch { throw Error('مساحة التخزين في المتصفح ممتلئة'); } },
  async get(key) { const f = fileMap()[key]; return f ? { bytes: fromB64(f.b64), type: f.type } : null; },
  async remove(key) { const m = fileMap(); delete m[key]; try { localStorage.setItem(FILES, JSON.stringify(m)); } catch { /* ignore */ } },
};

export function resetBrowserWorkspace() { try { localStorage.removeItem(KEY); localStorage.removeItem(FILES); } catch { /* ignore */ } current = seed(); }

/** Route every same-origin `/api/*` request through `serve()`; everything else goes to the real fetch. */
export function installBrowserApi() {
  const real = window.fetch.bind(window);
  let queue: Promise<unknown> = Promise.resolve();
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith('/api/')) return real(input, init);
    const base = location.origin && location.origin !== 'null' ? location.origin : 'http://masar.local';
    const abs = new URL(url, base);
    const req = new Request(abs, { ...init, headers: { ...(init?.headers as Record<string, string> | undefined), origin: base } });
    const job = () => serve(req, browserStorage, 'browser-workspace');
    const p = queue.then(job, job);
    queue = p.catch(() => { });
    return p;
  }) as typeof window.fetch;
}
