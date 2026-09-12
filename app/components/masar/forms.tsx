'use client';
import React, { useEffect, useState, createContext, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Plus, Upload, Info, RefreshCw, Archive, GitMerge, ArrowLeft, FileCheck2, Clock3 } from 'lucide-react';
import { Button, Pick, Pill } from './ui';
import { useMasar, type DialogSpec } from './context';
import { stages, labels, roles, M, H, D, type Command, type Stage, type RoutingRule, type BonusPlan, type RotationRule } from '@/lib/masar/model';
import { canEdit, canManage, person, product, route } from '@/lib/masar/engine';
type Draft = Record<string, any>;
const DraftContext = createContext<{
    d: Draft;
    set: (k: string, v: unknown) => void;
}>(null!);
function F({ k, label, type: inputType = 'text', help, wide = false, options, required = true }: {
    k: string;
    label: string;
    type?: string;
    help?: string;
    wide?: boolean;
    options?: {
        value: string;
        label: string;
    }[];
    required?: boolean;
}) { const { d, set } = useContext(DraftContext); return <div className={`field ${wide ? 'wide' : ''}`}><label htmlFor={`f-${k}`}>{label}{required ? ' *' : ''}</label>{options ? <Pick label={label} value={String(d[k] || '')} options={options} onChange={v => set(k, v)}/> : inputType === 'textarea' ? <Textarea id={`f-${k}`} value={String(d[k] ?? '')} rows={3} onChange={e => set(k, e.target.value)} required={required}/> : <Input id={`f-${k}`} type={inputType} value={d[k] ?? ''} onChange={e => set(k, e.target.value)} required={required}/>} {help && <small>{help}</small>}</div>; }
const dateInput = (n: number) => new Date(n).toISOString().slice(0, 16);
const lines = (v: unknown) => String(v || '').split('\n').map(x => x.trim()).filter(Boolean);
export function parseCSV(input: string) { const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false; for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
        if (quoted && input[i + 1] === '"') {
            cell += '"';
            i++;
        }
        else
            quoted = !quoted;
    }
    else if (ch === ',' && !quoted) {
        row.push(cell);
        cell = '';
    }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
        if (ch === '\r' && input[i + 1] === '\n')
            i++;
        row.push(cell);
        if (row.some(x => x.trim()))
            rows.push(row);
        row = [];
        cell = '';
    }
    else
        cell += ch;
} if (quoted)
    throw Error('علامة اقتباس غير مغلقة في CSV'); row.push(cell); if (row.some(x => x.trim()))
    rows.push(row); if (!rows.length)
    throw Error('الملف فارغ'); rows[0][0] = rows[0][0].replace(/^\uFEFF/, ''); return rows; }
export function Forms({ spec, close }: {
    spec: DialogSpec | null;
    close: () => void;
}) {
    const { s, a, t, scope, open, action, busy, refresh, actorId } = useMasar();
    const [d, setD] = useState<Draft>({}), [error, setError] = useState(''), [file, setFile] = useState<File | null>(null), [uploading, setUploading] = useState(false), [csv, setCsv] = useState<string[][]>([]);
    const set = (k: string, v: unknown) => setD(x => ({ ...x, [k]: v }));
    useEffect(() => {
        if (!spec)
            return;
        const type = spec.type, data = spec.data || {}, id = String(data.id || ''), p = s.products.find(p => p.id === scope) || s.products.find(p => p.id === a.productId) || s.products[0];
        const own = s.journeys.filter(j => canEdit(a, j));
        let init: Draft = { ...data, id: id || own.find(j => j.state === 'open' && j.ownerId)?.id || own[0]?.id, productId: p?.id, reason: '', name: '', phone: '', city: 'القاهرة', source: 'Meta', externalId: '', answers: 'هل لديك سيارة؟=نعم\nموديل السيارة=كيا سيراتو 2021' };
        switch (type) {
            case 'product_create':
                Object.assign(init, { timezone: 'Africa/Cairo', country: 'مصر', company: '', number: '' });
                break;
            case 'agent_create':
                Object.assign(init, { team: 'الاستقطاب', stages: ['fresh'] });
                break;
            case 'inbound':
                init.text = 'صباح الخير، محتاج أسجل معاكم';
                init.name = 'عميل واتساب جديد';
                break;
            case 'attempt':
                Object.assign(init, { outcome: 'لم يرد', duration: 25 });
                break;
            case 'receive_reply':
                init.text = 'تمام، هبعت الأوراق المطلوبة النهارده.';
                break;
            case 'advance_time':
                init.minutes = 60;
                break;
            case 'followup':
                Object.assign(init, { note: 'متابعة استكمال الأوراق', kind: 'اتصال', at: dateInput(s.now + H) });
                break;
            case 'transition':
                init.reason = 'تمت مراجعة طلب العميل، برجاء التحقق من إثبات الشركة.';
                break;
            case 'approval_decide':
            case 'snapshot_decide':
                Object.assign(init, { accept: 'yes', adjustment: 0 });
                break;
            case 'rotate': {
                const j = s.journeys.find(j => j.id === init.id);
                init.ruleId = s.rotation.find(r => r.productId === j?.productId)?.id;
                break;
            }
            case 'routing': {
                const existing = s.routing.find(r => r.id === id);
                init = existing ? structuredClone(existing) : { id: '', name: 'قاعدة توزيع جديدة', productId: p.id, stage: 'fresh', source: 'all', strategy: 'round_robin', priority: 1, enabled: true, agentIds: s.agents.filter(a => a.productId === p.id && a.role === 'agent' && a.stages.includes('fresh')).map(a => a.id), version: 1 };
                break;
            }
            case 'sla': {
                const r = s.sla.find(r => r.productId === id) || s.sla.find(r => r.productId === p.id)!;
                init = { ...structuredClone(r), holidayText: (r.holidays || []).join('\n'), workDays: (r.workDays || [0, 1, 2, 3, 4, 5, 6]).map(String), ...Object.fromEntries(stages.map(st => ['hours_' + st, r.stageHoursByStage?.[st] || r.stageHours])) };
                break;
            }
            case 'rotation':
                init = structuredClone(s.rotation.find(r => r.id === id) || { id: '', name: 'إعادة تنشيط الداتا', productId: p.id, stage: 'all', trigger: 'inactivity', afterMinutes: 60, max: 3, cooldownMinutes: 120, excludePrevious: true, allowRepeated: true, reasons: [], enabled: true, priority: 2, version: 1 });
                break;
            case 'product': {
                const pr = product(s, id || p.id);
                init = { ...structuredClone(pr), handoffStages: pr.handoffStages || ['signup', 'approved'], reasonList: pr.reasons.join('\n'), docList: pr.documents.join('\n'), ...Object.fromEntries(stages.map(st => [st, pr.statuses[st].join('\n')])) };
                break;
            }
            case 'agent': {
                const u = s.agents.find(u => u.id === id)!;
                init = { ...structuredClone(u) };
                break;
            }
            case 'leave':
                init = { ...init, agentId: a.role === 'agent' ? a.id : s.agents.find(u => u.role === 'agent')?.id, from: dateInput(s.now + D), to: dateInput(s.now + 2 * D) };
                break;
            case 'transfer':
                init = { ...init, mode: 'queue', team: 'فريق جديد', stages: ['fresh'] };
                break;
            case 'merge':
                init.targetId = s.people.find(p => p.id !== id)?.id;
                break;
            case 'document': {
                const j = s.journeys.find(j => j.id === init.id);
                init.docType = j ? product(s, j.productId).documents[0] : '';
                init.expires = '';
                break;
            }
            case 'partner_import':
                init = { ...init, phoneCol: 'phone', nameCol: 'name', signupCol: 'signup', approvedCol: 'approved', tripsCol: 'trips', asOf: dateInput(s.now) };
                break;
            case 'bonus_plan': {
                const b = s.bonusPlans.find(p => p.id === id);
                init = { ...(b ? structuredClone(b) : { id: '', name: 'خطة بونص جديدة', productId: p.id, stage: 'fresh', role: 'agent', mode: 'mixed', payout: 'per_result', fixedAmount: 1000, tripTarget: 10, tiers: [{ rate: 20, amount: 25 }, { rate: 30, amount: 30 }], version: 1 }) };
                break;
            }
            case 'competition': {
                const c = s.competitions.find(c => c.id === id);
                init = { ...(c ? structuredClone(c) : { id: '', name: 'مسابقة جديدة', productId: p.id, stage: 'fresh', mode: 'count', minimum: 1, prize: 1000, enabled: true }), start: dateInput(c?.start || s.now), end: dateInput(c?.end || s.now + 30 * D) };
                break;
            }
            case 'automation':
                init = structuredClone(s.automations.find(x => x.id === id) || { id: '', name: 'متابعة آلية', productId: p.id, trigger: 'stage_changed', action: 'followup', minutes: 60, enabled: true, version: 1 });
                break;
        }
        setD(init);
        setError('');
        setFile(null);
        setCsv([]);
    }, [spec]);
    if (!spec)
        return null;
    const type = spec.type;
    const j = s.journeys.find(j => j.id === d.id);
    const productOptions = s.products.map(p => ({ value: p.id, label: `${p.company} · ${p.country} · ${p.name}` }));
    const stageOptions = stages.map(st => ({ value: st, label: labels[st] }));
    const agentOptions = s.agents.filter(a => a.role === 'agent').map(a => ({ value: a.id, label: a.name }));
    const journeyOptions = s.journeys.filter(j => canEdit(a, j) && j.state !== 'archived').map(j => ({ value: j.id, label: `${person(s, j).name} · ${product(s, j.productId).company} · ${labels[j.stage]}` }));
    const Toggle = ({ k, label, help }: {
        k: string;
        label: string;
        help?: string;
    }) => <div className="toggle-row"><div><p>{label}</p>{help && <small className="muted">{help}</small>}</div><Switch aria-label={label} checked={!!d[k]} onCheckedChange={v => set(k, v)}/></div>;
    const Checks = ({ k, label, options }: {
        k: string;
        label: string;
        options: {
            value: string;
            label: string;
        }[];
    }) => <div className="field wide"><label>{label}</label><div className="checklist">{options.map(o => <label key={o.value}><Checkbox checked={(d[k] || []).includes(o.value)} onCheckedChange={v => set(k, v ? [...(d[k] || []), o.value] : (d[k] || []).filter((x: string) => x !== o.value))}/>{o.label}</label>)}</div></div>;
    const titles: Record<string, string> = { product_create: 'إضافة شركة / برودكت', agent_create: 'إضافة موظفة للتجربة', create_lead: 'عميل جديد / تسجيل إعلاني', inbound: 'محاكاة رسالة واتساب واردة', attempt: 'تسجيل محاولة اتصال', receive_reply: 'محاكاة رد العميل', advance_time: 'ساعة التجربة', followup: 'جدولة متابعة', transition: 'انتقال للمرحلة التالية', return_request: 'طلب رجوع للمرحلة السابقة', offer_reject: 'رفض عرض الإسناد', approval_decide: 'مراجعة طلب الموافقة', reject_lead: 'رفض العميل', rotate: 'تطبيق قاعدة التدوير', routing: 'إعداد قاعدة توزيع', sla: 'سياسة مواعيد الاستجابة', rotation: 'قاعدة تدوير الداتا', product: 'المراحل والحالات والمستندات', agent: 'الشيفت والسعة والوزن', leave: 'طلب إجازة', transfer: 'نقل الموظفة إلى فريق جديد', merge: 'دمج ملفي شخص', archive: 'أرشفة الرحلة', document: 'رفع مستند للمراجعة', partner_import: 'استيراد بيانات الشركة', sync_trips: 'مطابقة إجمالي الرحلات', bonus_plan: 'إعداد خطة البونص', snapshot_decide: 'اعتماد البونص أو رفضه وتسويته', competition: 'إعداد مسابقة', automation: 'إعداد الأتمتة', payload: 'تفاصيل رسالة الماركتنج', lead_actions: 'إجراءات الرحلة', reset: 'إعادة ضبط مساحة التجربة' };
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            let c: Command = { type, id: d.id };
            switch (type) {
                case 'product_create':
                case 'agent_create':
                    c = { ...d, type };
                    break;
                case 'create_lead':
                case 'inbound':
                    c = { ...d, type, answers: lines(d.answers).map(x => { const n = x.indexOf('='); return { question: n < 0 ? x : x.slice(0, n), answer: n < 0 ? '—' : x.slice(n + 1) }; }) };
                    break;
                case 'attempt':
                    c = { type, id: d.id, outcome: d.outcome, duration: Number(d.duration) };
                    break;
                case 'receive_reply':
                    c = { type, id: d.id, text: d.text };
                    break;
                case 'advance_time':
                    c = { type, minutes: Number(d.minutes) };
                    break;
                case 'followup':
                    c = { type, id: d.id, at: Date.parse(d.at + 'Z'), note: d.note, kind: d.kind };
                    break;
                case 'transition':
                case 'return_request':
                case 'reject_lead':
                case 'archive':
                case 'sync_trips':
                    c = { type, id: d.id, reason: d.reason };
                    break;
                case 'offer_reject':
                    c = { type: 'offer_decide', id: d.id, accept: false, reason: d.reason };
                    break;
                case 'approval_decide':
                    c = { type, id: d.id, accept: d.accept === 'yes', reason: d.reason };
                    break;
                case 'rotate':
                    c = { type, id: d.id, ruleId: d.ruleId };
                    break;
                case 'routing':
                    c = { type: 'routing_save', rule: d };
                    break;
                case 'sla':
                    c = { type: 'sla_save', productId: d.productId, rule: { ...d, stageHoursByStage: Object.fromEntries(stages.map(st => [st, Number(d['hours_' + st])])), workDays: d.workDays.map(Number), holidays: lines(d.holidayText) } };
                    break;
                case 'rotation':
                    c = { type: 'rotation_save', rule: d };
                    break;
                case 'product':
                    c = { type: 'product_save', id: d.id, product: { ...d, statuses: Object.fromEntries(stages.map(st => [st, lines(d[st])])), reasons: lines(d.reasonList), documents: lines(d.docList) } };
                    break;
                case 'agent':
                    c = { type: 'agent_update', ...d };
                    break;
                case 'leave':
                    c = { type, agentId: d.agentId, from: Date.parse(d.from + 'Z'), to: Date.parse(d.to + 'Z'), reason: d.reason };
                    break;
                case 'transfer':
                    c = { type: 'transfer_user', id: d.id, productId: d.productId, team: d.team, stages: d.stages, mode: d.mode };
                    break;
                case 'merge':
                    c = { type, id: d.id, targetId: d.targetId, reason: d.reason };
                    break;
                case 'document': {
                    if (!file)
                        throw Error('اختر الملف');
                    setUploading(true);
                    const form = new FormData();
                    form.set('file', file);
                    form.set('journeyId', d.id);
                    form.set('docType', d.docType);
                    form.set('revision', String(s.revision));
                    if (d.expires)
                        form.set('expires', String(Date.parse(d.expires + 'Z')));
                    const r = await fetch(`/api/upload?actor=${actorId}`, { method: 'POST', body: form });
                    const out = await r.json() as {
                        error?: string;
                    };
                    if (!r.ok)
                        throw Error(out.error);
                    await refresh();
                    close();
                    return;
                }
                case 'partner_import': {
                    if (csv.length < 2)
                        throw Error('اختر ملف CSV فيه بيانات');
                    const headers = csv[0];
                    const get = (r: string[], key: string) => { const idx = headers.indexOf(d[key]); if (idx < 0)
                        throw Error('راجع مطابقة الأعمدة'); return r[idx]?.trim() || ''; };
                    const bool = (v: string) => ['true', '1', 'yes', 'نعم', 'approved', 'signup'].includes(v.toLowerCase());
                    c = { type, productId: d.productId, rows: csv.slice(1).map(r => ({ phone: get(r, 'phoneCol'), name: get(r, 'nameCol'), signup: bool(get(r, 'signupCol')), approved: bool(get(r, 'approvedCol')), trips: Number(get(r, 'tripsCol') || 0), asOf: Date.parse(d.asOf + 'Z') })) };
                    break;
                }
                case 'bonus_plan':
                    c = { type: 'bonus_save', plan: d };
                    break;
                case 'snapshot_decide':
                    c = { type, id: d.id, accept: d.accept === 'yes', reason: d.reason, adjustment: Number(d.adjustment) };
                    break;
                case 'competition':
                    c = { type: 'competition_save', competition: { ...d, start: Date.parse(d.start + 'Z'), end: Date.parse(d.end + 'Z') } };
                    break;
                case 'automation':
                    c = { type: 'automation_save', automation: d };
                    break;
                default: throw Error('لم يتم تحديد الإجراء');
            }
            await action(c);
            close();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'تعذّر الحفظ');
        }
        finally {
            setUploading(false);
        }
    };
    if (type === 'reset')
        return <AlertDialog open onOpenChange={v => !v && close()}><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>إعادة ضبط التجربة؟</AlertDialogTitle><AlertDialogDescription>ستُستبدل بيانات ومسارات وملاحظات هذه التجربة بالبيانات الأولية. حمّل نسخة من بيانات التجربة من الدليل إذا كنت تريد الاحتفاظ بها. النظام الحقيقي لا يتأثر.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={async () => { try {
            await action({ type: 'reset' });
            close();
        }
        catch { } }}>إعادة الضبط</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
    return <Dialog open onOpenChange={v => !v && close()}><DialogContent className="form-dialog" dir="rtl"><DialogHeader><DialogTitle style={{ textAlign: 'start', fontSize: 21 }}>{titles[type] || type}</DialogTitle><DialogDescription style={{ textAlign: 'start' }}>{type === 'payload' ? 'رسالة محفوظة للتجربة بدون إرسال خارجي.' : type === 'lead_actions' ? 'اختر الإجراء المناسب للرحلة الحالية.' : 'التغييرات تخص بيانات التجربة وتُحفظ في سجل النشاط.'}</DialogDescription></DialogHeader>{type === 'payload' ? <pre className="code-box">{JSON.stringify(s.outbox.find(x => x.id === spec.data?.id), null, 2)}</pre> : type === 'lead_actions' ? <div className="stack">{j && <><Button variant="outline" onClick={() => open('reject_lead', { id: j.id })}>رفض العميل مع حفظ المرحلة</Button>{canManage(a, j.productId) && <><Button variant="outline" onClick={() => open('rotate', { id: j.id })}><RefreshCw size={16}/>تطبيق قاعدة تدوير</Button><Button variant="outline" onClick={() => open('archive', { id: j.id })}><Archive size={16}/>أرشفة الرحلة</Button></>}{['admin', 'manager'].includes(a.role) && <Button variant="outline" onClick={() => open('merge', { id: j.personId })}><GitMerge size={16}/>دمج ملف الشخص</Button>}</>}</div> : <form onSubmit={submit}><DraftContext.Provider value={{ d, set }}><div className="fields">
 {type === 'product_create' && <><F k="name" label="اسم البرودكت"/><F k="company" label="اسم الشركة"/><F k="country" label="الدولة"/><F k="timezone" label="المنطقة الزمنية" help="مثال Africa/Cairo أو Asia/Riyadh"/><F k="number" label="رقم واتساب الدولي المخصص" wide/></>}
 {type === 'agent_create' && <><F k="name" label="اسم الموظفة"/><F k="team" label="اسم الفريق"/><F k="productId" label="البرودكت" options={productOptions} wide/><Checks k="stages" label="مراحل العمل" options={stageOptions}/><div className="field wide small muted">شخصية تجريبية جديدة وليست حساب دخول إنتاجيًا. أضفها لاحقًا لقواعد التوزيع وغيّر توفرها للبدء.</div></>}
 {['create_lead', 'inbound'].includes(type) && <><F k="name" label="اسم العميل"/><F k="phone" label="رقم الهاتف" help="يُحفظ دوليًا ويُطابق داخل مساحة العمل"/><F k="productId" label="الشركة والبرودكت" options={productOptions}/><F k="city" label="المدينة"/>{type === 'create_lead' ? <><F k="source" label="المصدر" options={['Meta', 'TikTok', 'Manual', 'Import'].map(x => ({ value: x, label: x }))}/><F k="externalId" label="معرف التسجيل الخارجي" required={false} help="اتركه فارغًا لإنشاء ID تجريبي؛ إعادة نفس ID لا تكرر الليد"/><F k="answers" label="أسئلة النموذج وإجاباته" type="textarea" wide required={false} help="كل سطر: سؤال=إجابة"/></> : <F k="text" label="الرسالة الواردة" type="textarea" wide/>}</>}
 {['attempt', 'receive_reply', 'followup', 'rotate', 'document', 'sync_trips', 'transition'].includes(type) && <F k="id" label="الرحلة" options={journeyOptions} wide/>}
 {type === 'attempt' && <><div className="field wide"><div className="call-evidence">محاكاة إثبات من تطبيق الاتصال: نسجل وقت المحاولة، مدتها، نتيجتها ومرجعًا فريدًا. لا تتم مكالمة حقيقية ولا يُسجّل صوت من المتصفح.</div></div><F k="outcome" label="نتيجة الاتصال" options={['لم يرد', 'مشغول', 'مغلق', 'رد — تم التواصل'].map(x => ({ value: x, label: x }))}/><F k="duration" label="مدة المحاولة بالثواني" type="number"/></>}
 {type === 'receive_reply' && <F k="text" label="نص رد العميل" type="textarea" wide/>}
 {type === 'advance_time' && <><F k="minutes" label="عدد الدقائق" type="number"/><div className="field"><label>اختيارات سريعة</label><div className="actions">{[15, 60, 1440, 28800].map(n => <Button key={n} type="button" size="sm" variant="outline" onClick={() => set('minutes', n)}>{n === 28800 ? '20 يومًا' : n === 1440 ? 'يوم' : `${n} د`}</Button>)}</div></div><div className="field wide"><div className="insight"><Clock3 size={18}/><p>الساعة محاكية للتجربة. تقديمها يُنهي عروض الإسناد المنتهية، يسجل مخالفات SLA، ويتيح اختبار إقفال الشهر.</p></div></div></>}
 {type === 'followup' && <><F k="at" label="الموعد (UTC)" type="datetime-local" help="الموعد في الصفحة يُعرض بتوقيت الشركة"/><F k="kind" label="نوع المتابعة" options={['اتصال', 'واتساب', 'استكمال أوراق', 'زيارة'].map(x => ({ value: x, label: x }))}/><F k="note" label="المطلوب في المتابعة" type="textarea" wide/></>}
 {['return_request', 'offer_reject', 'archive', 'merge', 'sync_trips'].includes(type) && <F k="reason" label="السبب" type="textarea" wide/>}
 {type === 'transition' && <><F k="reason" label="ملاحظة للمراجعة عند غياب الإثبات" type="textarea" wide/>{j && <div className="field wide"><div className="insight"><Info size={18}/><p>الانتقال إلى {labels[stages[stages.indexOf(j.stage) + 1]] || 'نهاية المسار'}. يفحص النظام إثبات الشركة الحديث. عند غيابه يُنشأ طلب اعتماد، وعند النجاح تُحفظ النتيجة ويطبق توزيع المرحلة التالية.</p></div></div>}</>}
 {['approval_decide', 'snapshot_decide'].includes(type) && <><F k="accept" label="القرار" options={[{ value: 'yes', label: 'اعتماد' }, { value: 'no', label: 'رفض' }]}/>{type === 'snapshot_decide' && <F k="adjustment" label="تسوية على المبلغ (+ أو −)" type="number"/>}<F k="reason" label="سبب القرار" type="textarea" wide/></>}
 {type === 'reject_lead' && j && <F k="reason" label="سبب الرفض المعتمد" options={product(s, j.productId).reasons.map(x => ({ value: x, label: x }))} wide/>}
 {type === 'rotate' && <><F k="ruleId" label="قاعدة التدوير" options={s.rotation.filter(r => r.productId === j?.productId).map(r => ({ value: r.id, label: r.name }))} wide/><div className="field wide"><div className="insight"><Info size={18}/><p>يُفحص التأخير والسبب والتهدئة وعدد مرات التدوير والاستبعادات. لو لا يوجد مستلم مؤهل، لا تتغير الملكية الحالية. القبول النهائي عند الموظفة الجديدة.</p></div></div></>}
 {type === 'routing' && <><F k="name" label="اسم القاعدة" wide/><F k="productId" label="الشركة والبرودكت" options={productOptions}/><F k="stage" label="المرحلة" options={[{ value: 'all', label: 'كل المراحل' }, ...stageOptions]}/><F k="source" label="المصدر" options={['all', 'Meta', 'TikTok', 'WhatsApp', 'Manual', 'Import'].map(x => ({ value: x, label: x === 'all' ? 'كل المصادر' : x }))}/><F k="strategy" label="طريقة التوزيع" options={[{ value: 'round_robin', label: 'الدور بالتناوب' }, { value: 'weighted', label: 'الدور بالأوزان' }, { value: 'capacity', label: 'أقل حمل' }, { value: 'specific', label: 'موظفة محددة' }, { value: 'claim', label: 'اطلب ليد' }]}/><F k="priority" label="الأولوية (1 أولًا)" type="number"/><div className="field"><Toggle k="enabled" label="القاعدة فعالة"/></div><Checks k="agentIds" label="الموظفات المؤهلات داخل القاعدة" options={s.agents.filter(x => x.productId === d.productId && x.role === 'agent').map(x => ({ value: x.id, label: `${x.name} · ${x.stages.map(st => labels[st]).join('، ')}` }))}/></>}
 {type === 'sla' && <><F k="dayStart" label="بداية نافذة النهار (ساعة)" type="number"/><F k="dayEnd" label="نهاية نافذة النهار (ساعة)" type="number"/><F k="minutes" label="أول محاولة نهارًا (دقيقة)" type="number"/><F k="nightMinutes" label="أول محاولة ليلًا (دقيقة)" type="number"/><F k="nightMode" label="بداية حساب الليد الليلي" options={[{ value: 'next_shift', label: 'من بداية نافذة النهار التالية' }, { value: 'elapsed', label: 'من وقت الوصول مباشرة' }]} wide/><F k="stageHours" label="المهلة الافتراضية للمرحلة (ساعة)" type="number"/>{stages.map(st => <F key={st} k={'hours_' + st} label={`مهلة ${labels[st]} (ساعة)`} type="number"/>)}<Checks k="workDays" label="أيام عمل نافذة استقبال الليد" options={['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((label, i) => ({ value: String(i), label }))}/><F k="holidayText" label="إجازات نافذة الاستقبال" type="textarea" wide required={false} help="كل تاريخ في سطر بصيغة YYYY-MM-DD"/><F k="followupMinutes" label="المتابعة الافتراضية (دقيقة)" type="number"/><F k="acceptMinutes" label="مهلة قبول العرض (دقيقة)" type="number"/><div className="field wide"><Toggle k="blockOverdue" label="منع استقبال داتا جديدة لمن لديها تأخير" help="لا يؤثر على المحادثات والليد الحالي"/></div></>}
 {type === 'rotation' && <><F k="name" label="اسم القاعدة" wide/><F k="productId" label="البرودكت" options={productOptions}/><F k="stage" label="المرحلة" options={[{ value: 'all', label: 'كل المراحل' }, ...stageOptions]}/><F k="trigger" label="متى تعمل القاعدة؟" options={[{ value: 'sla', label: 'تجاوز SLA' }, { value: 'inactivity', label: 'بدون نشاط تواصل' }, { value: 'rejected', label: 'داتا مرفوضة' }]}/><F k="afterMinutes" label="المدة المطلوبة (دقيقة)" type="number"/><F k="max" label="أقصى مرات تدوير" type="number"/><F k="cooldownMinutes" label="فترة التهدئة (دقيقة)" type="number"/><div className="field wide"><Toggle k="excludePrevious" label="استبعاد كل المالكين السابقين"/><Toggle k="allowRepeated" label="تطبيق على ليد سبق تدويره"/><Toggle k="enabled" label="القاعدة فعالة"/></div><Checks k="reasons" label="أسباب رفض مسموح إعادة تدويرها" options={(s.products.find(p => p.id === d.productId)?.reasons || []).map(x => ({ value: x, label: x }))}/></>}
 {type === 'product' && <><F k="captainStage" label="علامة Captain تظهر عند" options={stageOptions} wide/>{stages.map(st => <F key={st} k={st} label={`حالات مرحلة ${labels[st]}`} type="textarea" help="حالة واحدة في كل سطر"/>)}<F k="reasonList" label="أسباب الرفض" type="textarea"/><F k="docList" label="المستندات المطلوبة" type="textarea"/><div className="field wide"><Toggle k="handoff" label="إعادة توزيع عند انتقال المرحلة"/><Checks k="handoffStages" label="الدخول لهذه المراحل يبدأ التسليم" options={stageOptions.filter(x => x.value !== 'fresh')}/><Toggle k="approval" label="كل انتقال يحتاج موافقة قائدة الفريق"/></div></>}
 {type === 'agent' && <><F k="capacity" label="السعة القصوى" type="number"/><F k="weight" label="الوزن" type="number"/><F k="shiftStart" label="بداية الشيفت" type="number"/><F k="shiftEnd" label="نهاية الشيفت" type="number"/><div className="field wide"><label>أيام العمل</label><div className="actions">{['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day, i) => <label key={day} className="actions small"><Checkbox checked={(d.days || []).includes(i)} onCheckedChange={v => set('days', v ? [...(d.days || []), i] : (d.days || []).filter((x: number) => x !== i))}/>{day}</label>)}</div><Toggle k="enabled" label="الحساب فعال" help="إيقافه يعيد العمل المفتوح للطابور ويحفظ التاريخ"/></div></>}
 {type === 'leave' && <><F k="agentId" label="الموظفة" options={a.role === 'agent' ? [{ value: a.id, label: a.name }] : agentOptions} wide/><F k="from" label="بداية الإجازة (UTC)" type="datetime-local"/><F k="to" label="نهاية الإجازة (UTC)" type="datetime-local"/><F k="reason" label="سبب الإجازة" type="textarea" wide/></>}
 {type === 'transfer' && <><F k="productId" label="البرودكت الجديد" options={productOptions}/><F k="team" label="اسم الفريق الجديد"/><F k="mode" label="التعامل مع الليد الحالي" options={[{ value: 'queue', label: 'إرجاع العمل لطابور الفريق القديم' }, { value: 'redistribute', label: 'توزيع وفق قواعد الفريق القديم' }]} wide/><Checks k="stages" label="مراحل الموظفة في الفريق الجديد" options={stageOptions}/><div className="insight field wide">نفس حساب الموظفة، مع حفظ الفرص والإنجازات القديمة. صلاحيات مشاهدة الشركة السابقة تُغلق بعد النقل.</div></>}
 {type === 'merge' && <F k="targetId" label="الملف النهائي الذي سنحتفظ به" options={s.people.filter(p => p.id !== d.id).map(p => ({ value: p.id, label: `${p.name} · ${p.phones[0]}` }))} wide/>}
 {type === 'document' && <><F k="docType" label="نوع المستند" options={(j ? product(s, j.productId).documents : []).map(x => ({ value: x, label: x }))}/><F k="expires" label="تاريخ انتهاء اختياري (UTC)" type="datetime-local" required={false}/><div className="field wide"><label htmlFor="doc-file">الملف (10MB كحد أقصى)</label><Input id="doc-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setFile(e.target.files?.[0] || null)} required/><small>الملف يُحفظ فعليًا في مساحة التجربة ويصبح قابلًا للتنزيل بعد رفعه.</small></div></>}
 {type === 'partner_import' && <><F k="productId" label="البرودكت" options={productOptions}/><F k="asOf" label="تاريخ بيانات الشركة (UTC)" type="datetime-local"/><div className="field wide"><label htmlFor="csv-file">ملف CSV</label><Input id="csv-file" type="file" accept=".csv,text/csv" onChange={async (e) => { const f = e.target.files?.[0]; if (!f)
            return; try {
            if (f.size > 2 * 1024 * 1024)
                throw Error('أقصى حجم 2MB');
            const parsed = parseCSV(await f.text());
            setCsv(parsed);
            setError('');
            const headers = parsed[0];
            const keys = ['phone', 'name', 'signup', 'approved', 'trips'];
            for (const k of keys) {
                const match = headers.find(h => h.toLowerCase() === k);
                if (match)
                    set(k + 'Col', match);
            }
        }
        catch (err) {
            setError(String(err));
        } }}/></div>{csv.length > 0 && <><div className="field wide"><Pill color="green">{csv.length - 1} صف · اختر مطابقة الأعمدة</Pill></div>{[['phoneCol', 'الهاتف'], ['nameCol', 'الاسم'], ['signupCol', 'تم التسجيل'], ['approvedCol', 'جاهز للعمل'], ['tripsCol', 'إجمالي الرحلات']].map(([k, label]) => <F key={k} k={k} label={label} options={csv[0].map(h => ({ value: h, label: h }))}/>)}<div className="field wide"><div className="insight"><Info size={18}/><p>قيم نعم: true / 1 / yes / نعم. إجمالي Trips تراكمي، وليس رحلات إضافية. يُقبل 500 صف كحد للتجربة.</p></div></div></>}</>}
 {type === 'bonus_plan' && <><F k="name" label="اسم الخطة" wide/><F k="productId" label="البرودكت" options={productOptions}/><F k="stage" label="مرحلة عمل الموظفة" options={stageOptions}/>{d.stage === 'trips' && <F k="tripTarget" label="هدف عدد الرحلات" type="number"/>}<F k="role" label="الدور الذي تنطبق عليه" options={Object.entries(roles).filter(([k]) => k !== 'admin').map(([value, label]) => ({ value, label }))}/><F k="mode" label="اختيار الداتا والنتائج" options={[{ value: 'mixed', label: 'نتائج الشهر ÷ فرص الشهر، من أي شهر قديم' }, { value: 'cohort', label: 'أشخاص الشهر الحالي ونتائجهم خلاله' }, { value: 'period', label: 'نتائج الشهر ÷ إجمالي فرصها حتى نهاية الشهر' }]} wide/><F k="payout" label="نوع الصرف" options={[{ value: 'per_result', label: 'مبلغ عن كل نتيجة' }, { value: 'fixed', label: 'مبلغ ثابت عند تحقيق الشريحة' }]}/>{d.payout === 'fixed' && <F k="fixedAmount" label="المبلغ الثابت" type="number"/>}<div className="field wide"><label>شرائح النسبة — أعلى شريحة تطبق على كل النتائج</label>{(d.tiers || []).map((tier: {
            rate: number;
            amount: number;
        }, i: number) => <div className="actions" key={i}><Input aria-label={`نسبة الشريحة ${i + 1}`} type="number" value={tier.rate} onChange={e => set('tiers', d.tiers.map((x: any, n: number) => n === i ? { ...x, rate: Number(e.target.value) } : x))} style={{ width: 120 }}/><span>%</span><Input aria-label={`قيمة الشريحة ${i + 1}`} type="number" value={tier.amount} onChange={e => set('tiers', d.tiers.map((x: any, n: number) => n === i ? { ...x, amount: Number(e.target.value) } : x))} style={{ width: 120 }}/><span>جنيه</span><Button type="button" variant="ghost" onClick={() => set('tiers', d.tiers.filter((_: any, n: number) => n !== i))}>حذف</Button></div>)}<Button type="button" variant="outline" onClick={() => set('tiers', [...(d.tiers || []), { rate: 40, amount: 35 }])}><Plus size={16}/>أضف شريحة</Button></div></>}
 {type === 'competition' && <><F k="name" label="اسم المسابقة" wide/><F k="productId" label="البرودكت" options={productOptions}/><F k="stage" label="المرحلة" options={stageOptions}/><F k="start" label="البداية (UTC)" type="datetime-local"/><F k="end" label="النهاية (UTC)" type="datetime-local"/><F k="mode" label="قياس الترتيب" options={[{ value: 'count', label: 'عدد النتائج' }, { value: 'ratio', label: 'نسبة التحويل' }]}/><F k="minimum" label="أقل عدد نتائج للمشاركة" type="number"/><F k="prize" label="قيمة الجائزة" type="number"/><div className="field"><Toggle k="enabled" label="المسابقة فعالة"/></div></>}
 {type === 'automation' && <><F k="name" label="اسم الأتمتة" wide/><F k="productId" label="البرودكت" options={productOptions}/><F k="trigger" label="الحدث" options={[{ value: 'stage_changed', label: 'انتقال مرحلة' }, { value: 'lead_created', label: 'وصول ليد جديد' }, { value: 'sla_breached', label: 'تجاوز SLA' }]}/><F k="action" label="الإجراء" options={[{ value: 'followup', label: 'إنشاء متابعة' }, { value: 'notify', label: 'تنبيه في سجل النشاط' }]}/><F k="minutes" label="موعد المتابعة بعد (دقيقة)" type="number"/><div className="field wide"><Toggle k="enabled" label="الأتمتة فعالة"/></div></>}
 </div>{error && <p role="alert" className="form-error">{error}</p>}<div className="form-footer"><Button type="button" variant="outline" onClick={close}>إلغاء</Button><Button type="submit" disabled={busy || uploading}>{busy || uploading ? 'جارٍ الحفظ…' : type === 'document' ? 'رفع للمراجعة' : type === 'attempt' ? 'سجّل المحاولة التجريبية' : type === 'transition' ? 'تحقق ونفّذ الانتقال' : 'حفظ وتطبيق'}</Button></div></DraftContext.Provider></form>}</DialogContent></Dialog>;
}
