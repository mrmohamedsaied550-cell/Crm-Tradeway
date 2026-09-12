import { seed, uid, type State, type Command } from './model';
import { actor, scoped, execute, canEdit } from './engine';
export interface Storage {
    load(key: string): Promise<State>;
    save(key: string, state: State, revision: number): Promise<boolean>;
    put(key: string, bytes: Uint8Array, type: string): Promise<void>;
    get(key: string): Promise<{
        bytes: ArrayBuffer | Uint8Array;
        type: string;
    } | null>;
    remove(key: string): Promise<void>;
}
export async function serve(req: Request, store: Storage, key: string) {
    const url = new URL(req.url);
    const json = (o: unknown, status = 200) => Response.json(o, { status, headers: { 'Cache-Control': 'no-store' } });
    try {
        const origin = req.headers.get('origin');
        if (req.method !== 'GET' && origin && origin !== url.origin)
            return json({ error: 'الطلب من مصدر غير مسموح' }, 403);
        const s = await store.load(key);
        const aid = url.searchParams.get('actor') || 'admin';
        const a = actor(s, aid);
        if (req.method === 'GET' && url.pathname === '/api/state')
            return json({ state: scoped(s, a), personas: s.agents.map(x => ({ id: x.id, name: x.name, role: x.role, productId: x.productId })), actor: a });
        if (req.method === 'GET' && url.pathname === '/api/file') {
            const fk = url.searchParams.get('key');
            const d = s.documents.find(x => x.key === fk);
            const j = s.journeys.find(j => j.id === d?.journeyId);
            if (!d || !j || !canEdit(a, j))
                return json({ error: 'المستند غير متاح' }, 404);
            const file = await store.get(d.key);
            if (!file)
                return json({ error: 'الملف غير موجود' }, 404);
            return new Response(file.bytes as BodyInit, { headers: { 'Content-Type': file.type, 'Content-Disposition': `attachment; filename="document-${d.id}.${d.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin'}"`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
        }
        if (req.method === 'POST' && url.pathname === '/api/upload') {
            const data = await req.formData();
            const file = data.get('file');
            if (!(file instanceof File) || file.size > 10 * 1024 * 1024 || file.size === 0)
                return json({ error: 'اختر صورة أو PDF حتى 10 ميجابايت' }, 400);
            if (!['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type))
                return json({ error: 'الصيغ المتاحة PDF وJPEG وPNG وWebP' }, 400);
            const j = s.journeys.find(j => j.id === data.get('journeyId'));
            if (!j || !canEdit(a, j))
                return json({ error: 'غير مصرح' }, 403);
            const revision = Number(data.get('revision'));
            if (revision !== s.revision)
                return json({ error: 'تغيرت البيانات، حدّث الصفحة ثم أعد المحاولة' }, 409);
            const fk = `${key}/${uid('file')}`;
            await store.put(fk, new Uint8Array(await file.arrayBuffer()), file.type);
            try {
                const updated = execute(s, aid, { type: 'document_add', id: j.id, name: file.name, docType: String(data.get('docType')), size: file.size, key: fk, expires: data.get('expires') ? Number(data.get('expires')) : undefined }, uid('REQ'));
                if (!await store.save(key, updated, revision))
                    throw Error('تغيرت البيانات أثناء الرفع، أعد المحاولة');
                return json({ state: scoped(updated, actor(updated, aid)) });
            }
            catch (e) {
                await store.remove(fk);
                throw e;
            }
        }
        if (req.method === 'POST' && url.pathname === '/api/action') {
            const data = await req.json() as {
                revision: number;
                requestId: string;
                command: Command;
            };
            if (!data.requestId || typeof data.requestId !== 'string' || !data.command || typeof data.command.type !== 'string')
                return json({ error: 'طلب غير صالح' }, 400);
            if (s.processed.includes(data.requestId))
                return json({ state: scoped(s, a) });
            if (data.revision !== s.revision)
                return json({ error: 'حدّث البيانات؛ هناك تعديل أحدث محفوظ' }, 409);
            if (data.command.type === 'document_add')
                return json({ error: 'استخدم رفع المستند' }, 400);
            const next = execute(s, aid, data.command, data.requestId);
            if (!await store.save(key, next, s.revision))
                return json({ error: 'تعديل متزامن، حدّث البيانات' }, 409);
            if (data.command.type === 'reset')
                await Promise.all(s.documents.map(d => store.remove(d.key).catch(() => { })));
            return json({ state: scoped(next, actor(next, aid)) });
        }
        return json({ error: 'المسار غير موجود' }, 404);
    }
    catch (e) {
        return json({ error: e instanceof Error ? e.message : 'تعذّر تنفيذ الإجراء. حاول مرة أخرى.' }, 400);
    }
}
export { seed };
