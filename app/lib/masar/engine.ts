import { waSendText, waReceive, waInboundReview, waExecute } from './whatsapp';
import { type State, type Agent, type Journey, type Stage, type Command, type Exposure, type BonusPlan, type RoutingRule, type RotationRule, stages, labels, uid, seed, M, H, D } from './model';
const required = (v: unknown, name = 'القيمة') => { if (typeof v !== 'string' || !v.trim())
    throw Error(`${name} مطلوبة`); return v.trim().slice(0, 6000); };
const num = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) => { const n = Number(v); if (!Number.isFinite(n) || n < min || n > max)
    throw Error('قيمة رقمية غير صالحة'); return n; };
const find = <T extends {
    id: string;
}>(arr: T[], id: unknown) => { const x = arr.find(x => x.id === id); if (!x)
    throw Error('السجل غير متاح'); return x; };
export const actor = (s: State, id: string) => find(s.agents, id);
export const product = (s: State, id: string) => find(s.products, id);
export const person = (s: State, j: Journey) => find(s.people, j.personId);
export const canScope = (a: Agent, p: string) => ['admin', 'manager'].includes(a.role) || a.productId === p;
export const canManage = (a: Agent, p: string) => a.role !== 'agent' && canScope(a, p);
export const canEdit = (a: Agent, j: Journey) => canScope(a, j.productId) && (a.role !== 'agent' || j.ownerId === a.id);
export function canView(s: State, a: Agent, j: Journey) { return canScope(a, j.productId) && (a.role !== 'agent' || j.ownerId === a.id || j.history.some(h => h.agentId === a.id) || s.offers.some(o => o.journeyId === j.id && o.agentId === a.id && o.state === 'pending')); }
export function clockParts(t: number, tz: string) { const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' }).formatToParts(t); const get = (k: string) => p.find(p => p.type === k)?.value || ''; return { hour: +get('hour'), minute: +get('minute'), day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')), month: `${get('year')}-${get('month')}`, date: `${get('year')}-${get('month')}-${get('day')}` }; }
export function normalizePhone(v: string, country = 'مصر') { let n = v.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[\s()\-]/g, ''); if (n.startsWith('00'))
    n = '+' + n.slice(2); if (!n.startsWith('+'))
    n = (country === 'مصر' ? '+20' : '+966') + n.replace(/^0/, ''); if (!/^\+[1-9]\d{7,14}$/.test(n))
    throw Error('رقم الهاتف غير صحيح'); return n; }
export function slaFor(s: State, j: Journey) { return s.sla.find(x => x.productId === j.productId)!; }
export function stageHours(s: State, j: Journey) { const r = slaFor(s, j); return r.stageHoursByStage?.[j.stage] ?? r.stageHours; }
export function firstDue(s: State, j: Journey, t = s.now) { const r = slaFor(s, j), tz = product(s, j.productId).timezone, p = clockParts(t, tz); if ((r.workDays || [0, 1, 2, 3, 4, 5, 6]).includes(p.day) && !(r.holidays || []).includes(p.date) && p.hour >= r.dayStart && p.hour < r.dayEnd)
    return t + r.minutes * M; if (r.nightMode === 'elapsed')
    return t + r.nightMinutes * M; let next = t - (t % M); for (let k = 0; k < 15 * 24 * 60; k++, next += M) {
    const q = clockParts(next, tz);
    if ((r.workDays || [0, 1, 2, 3, 4, 5, 6]).includes(q.day) && !(r.holidays || []).includes(q.date) && q.hour === r.dayStart && q.minute === 0 && next >= t)
        return next + r.nightMinutes * M;
} return t + D; }
export function overdue(s: State, j: Journey) { return j.state === 'open' && ((!j.firstAttemptAt && s.now > j.dueAt) || s.now > j.stageDueAt || s.followups.some(f => f.journeyId === j.id && !f.done && f.at < s.now)); }
function log(s: State, a: string, kind: string, title: string, detail: string, j?: Journey) { s.activities.unshift({ id: uid('EV'), actorId: a, at: s.now, kind, title, detail, revision: s.revision + 1, journeyId: j?.id, personId: j?.personId, productId: j?.productId }); }
function auto(s: State, trigger: 'stage_changed' | 'lead_created' | 'sla_breached', j: Journey) { for (const r of s.automations.filter(r => r.enabled && r.productId === j.productId && r.trigger === trigger)) {
    if (r.action === 'followup' && j.ownerId)
        s.followups.push({ id: uid('FU'), journeyId: j.id, agentId: j.ownerId, at: s.now + r.minutes * M, kind: 'اتصال', note: r.name, done: false, createdAt: s.now });
    log(s, 'system', 'automation', r.name, `قاعدة آلية · الإصدار ${r.version} · ${r.action}`, j);
} }
export function route(s: State, j: Journey, exclude: string[] = [], claimant?: string) {
    const source = s.submissions.filter(x => x.journeyId === j.id).reverse().sort((a, b) => b.at - a.at)[0]?.source;
    const rule = s.routing.filter(r => r.enabled && r.productId === j.productId && (r.stage === 'all' || r.stage === j.stage) && (r.source === 'all' || r.source === source)).sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))[0];
    const candidates = (rule ? s.agents.filter(a => rule.agentIds.includes(a.id)) : []).map(a => { const reasons: string[] = []; const p = clockParts(s.now, product(s, j.productId).timezone), load = s.journeys.filter(x => x.ownerId === a.id && x.state === 'open').length + s.offers.filter(o => o.agentId === a.id && o.state === 'pending' && o.fromId !== a.id).length; if (!a.enabled)
        reasons.push('الحساب موقوف'); if (a.role !== 'agent' || a.productId !== j.productId || !a.stages.includes(j.stage))
        reasons.push('خارج نطاق المرحلة'); if (a.availability !== 'online')
        reasons.push(a.availability === 'break' ? 'استراحة' : 'غير متصلة'); if (!a.days.includes(p.day) || !(a.shiftStart < a.shiftEnd ? p.hour >= a.shiftStart && p.hour < a.shiftEnd : p.hour >= a.shiftStart || p.hour < a.shiftEnd))
        reasons.push('خارج الشيفت'); if (s.leaves.some(l => l.agentId === a.id && l.state === 'approved' && l.from <= s.now && l.to > s.now))
        reasons.push('إجازة معتمدة'); if (load >= a.capacity)
        reasons.push('السعة مكتملة'); if (exclude.includes(a.id))
        reasons.push('مستبعدة من هذه الدورة'); if (slaFor(s, j).blockOverdue && s.journeys.some(x => x.ownerId === a.id && overdue(s, x)))
        reasons.push('لديها تأخير في SLA'); return { agent: a, reasons, eligible: !reasons.length, load, score: rule?.strategy === 'weighted' ? s.exposures.filter(e => e.agentId === a.id).length / Math.max(1, a.weight) : rule?.strategy === 'capacity' ? load : a.lastAssignedAt }; });
    const chosen = candidates.filter(x => x.eligible && (!claimant || x.agent.id === claimant)).sort((a, b) => a.score - b.score || a.agent.id.localeCompare(b.agent.id))[0]?.agent;
    return { rule, candidates, chosen: rule?.strategy === 'claim' && !claimant ? undefined : chosen, why: !rule ? 'لا توجد قاعدة مطابقة' : rule.strategy === 'claim' && !claimant ? 'متاحة عبر اطلب ليد' : chosen ? `${rule.name} · الإصدار ${rule.version}` : 'لا توجد موظفة مؤهلة — تبقى في طابور مراقب' };
}
function offer(s: State, j: Journey, a: Agent, kind: Exposure['kind'], ruleId: string) { if (j.state !== 'open' || s.offers.some(o => o.journeyId === j.id && o.state === 'pending'))
    throw Error('هناك عرض قائم أو الرحلة مغلقة'); if (a.id === j.ownerId)
    throw Error('الموظفة تملك الليد بالفعل'); s.offers.push({ id: uid('OF'), journeyId: j.id, agentId: a.id, fromId: j.ownerId, kind, at: s.now, expires: s.now + slaFor(s, j).acceptMinutes * M, state: 'pending', ruleId }); log(s, 'system', 'offer', 'عرض إسناد جديد', `إلى ${a.name} · ${kind} · ${ruleId}`, j); }
function closeHistory(s: State, j: Journey) { for (const h of j.history.filter(h => !h.end)) {
    h.end = s.now;
    h.endRevision = s.revision;
} }
function acceptOwner(s: State, j: Journey, a: Agent, kind: Exposure['kind']) { const old = j.ownerId; closeHistory(s, j); j.ownerId = a.id; j.assignedAt = s.now; for (const cv of s.conversations.filter(cv => cv.journeyId === j.id && cv.status === 'open')) { cv.assignedToId = a.id; cv.assignmentSource = 'lead_propagation'; cv.assignedAt = s.now; } j.firstAttemptAt = null; j.dueAt = firstDue(s, j); j.history.push({ agentId: a.id, stage: j.stage, start: s.now, reason: kind }); a.lastAssignedAt = s.now; if (!s.exposures.some(e => e.journeyId === j.id && e.agentId === a.id && e.stage === j.stage && clockParts(e.at, product(s, j.productId).timezone).month === clockParts(s.now, product(s, j.productId).timezone).month))
    s.exposures.push({ id: uid('EX'), journeyId: j.id, personId: j.personId, agentId: a.id, stage: j.stage, at: s.now, kind, excluded: false }); for (const f of s.followups.filter(f => f.journeyId === j.id && !f.done))
    f.agentId = a.id; if (kind === 'rotation') {
    j.rotations++;
    j.lastRotatedAt = s.now;
} log(s, a.id, 'assignment_accepted', 'تم استلام الليد', `${old ? actor(s, old).name : 'الطابور'} ← ${a.name} · انتقال المحادثة والمتابعات. إجمالي فرص الموظفة السابقة محفوظ.`, j); }
function routeOffer(s: State, j: Journey, kind: Exposure['kind'], exclude: string[] = []) { const d = route(s, j, exclude); if (d.chosen)
    offer(s, j, d.chosen, kind, d.rule!.id);
else
    log(s, 'system', 'queue', 'بانتظار الإسناد', d.why, j); return d; }
function milestone(s: State, j: Journey, to: Stage, a: Agent, evidence: string) {
    const from = j.stage;
    if (stages.indexOf(to) !== stages.indexOf(from) + 1)
        throw Error('الانتقال يكون للمرحلة التالية فقط');
    if (j.state !== 'open' || !j.ownerId)
        throw Error('يجب استلام الليد وفتح الرحلة أولًا');
    const credit = j.ownerId;
    const existing = s.outcomes.find(o => o.journeyId === j.id && o.from === from && o.to === to && o.valid);
    if (!existing) {
        const sub = s.submissions.filter(x => x.journeyId === j.id && ['Meta', 'TikTok'].includes(x.source) && x.at <= s.now).reverse().sort((a, b) => b.at - a.at)[0];
        const outcome = { id: uid('OUT'), journeyId: j.id, personId: j.personId, agentId: credit, from, to, at: s.now, receivedAt: j.assignedAt, evidence, submissionId: sub?.id, valid: true };
        s.outcomes.push(outcome);
        if (sub)
            s.outbox.push({ id: uid('CB'), outcomeId: outcome.id, externalId: sub.externalId, at: s.now, state: 'queued', tries: 0, payload: { eventId: outcome.id, externalLeadId: sub.externalId, personId: j.personId, journeyId: j.id, stage: to, occurredAt: new Date(s.now).toISOString() } });
    }
    j.stage = to;
    j.status = product(s, j.productId).statuses[to][0];
    j.stageAt = s.now;
    j.stageDueAt = s.now + stageHours(s, j) * H;
    log(s, a.id, 'stage_changed', `${labels[from]} ← ${labels[to]}`, `الإثبات: ${evidence} · الإنجاز محسوب لـ ${actor(s, credit).name}`, j);
    auto(s, 'stage_changed', j);
    if (product(s, j.productId).handoff && (product(s, j.productId).handoffStages || ['signup', 'approved']).includes(to)) {
        const d = route(s, j, [credit]);
        if (d.chosen)
            offer(s, j, d.chosen, 'handoff', d.rule!.id);
        else {
            closeHistory(s, j);
            j.ownerId = null;
            log(s, 'system', 'handoff_queue', 'اكتملت المرحلة — في طابور التسليم', d.why, j);
        }
    }
    else {
        closeHistory(s, j);
        j.history.push({ agentId: credit, stage: to, start: s.now, reason: 'استمرار الملكية' });
        j.assignedAt = s.now;
        j.firstAttemptAt = null;
        j.dueAt = firstDue(s, j);
        s.exposures.push({ id: uid('EX'), journeyId: j.id, personId: j.personId, agentId: credit, stage: to, at: s.now, kind: 'handoff', excluded: false });
    }
}
export function bonus(s: State, p: BonusPlan, agentId: string, month: string) { const tz = product(s, p.productId).timezone; const inMonth = (t: number) => clockParts(t, tz).month === month; const js = new Set(s.journeys.filter(j => j.productId === p.productId).map(j => j.id)); const eligibleAgents = p.role === 'agent' ? [agentId] : s.agents.filter(a => a.productId === p.productId && a.role === 'agent').map(a => a.id); const exposure = s.exposures.filter(e => eligibleAgents.includes(e.agentId) && e.stage === p.stage && js.has(e.journeyId) && !e.excluded && (p.mode === 'cohort' ? inMonth(find(s.journeys, e.journeyId).createdAt) && inMonth(e.at) : p.mode === 'period' ? clockParts(e.at, tz).month <= month : inMonth(e.at))); const unique = exposure.filter((e, i, a) => a.findIndex(x => x.journeyId === e.journeyId) === i); const ids = new Set(unique.map(e => e.journeyId)); const results = s.outcomes.filter(o => o.valid && eligibleAgents.includes(o.agentId) && o.from === p.stage && (p.stage !== 'trips' || o.trips === (p.tripTarget || 10)) && js.has(o.journeyId) && inMonth(o.at) && (p.mode !== 'cohort' || ids.has(o.journeyId))); const outcomes = results.filter((o, i, a) => a.findIndex(x => x.journeyId === o.journeyId && x.to === o.to) === i); const numerator = outcomes.length, denominator = unique.length, ratio = denominator ? numerator / denominator * 100 : 0; const tier = [...p.tiers].sort((a, b) => b.rate - a.rate).find(t => ratio >= t.rate); const rate = denominator && tier ? tier.amount : 0, amount = denominator && tier ? (p.payout === 'fixed' ? p.fixedAmount : numerator * rate) : 0; return { numerator, denominator, ratio, rate, amount, exposures: unique, outcomes, next: [...p.tiers].sort((a, b) => a.rate - b.rate).find(t => t.rate > ratio) }; }
export function scoped(s: State, a: Agent): State { const out = structuredClone(s); const visible = s.journeys.filter(j => canView(s, a, j)), jids = new Set(visible.map(j => j.id)), pids = new Set(visible.map(j => j.personId)); out.journeys = visible; out.people = s.people.filter(p => pids.has(p.id) && !p.mergedInto); out.products = s.products.filter(p => canScope(a, p.id)); out.agents = s.agents.filter(x => canScope(a, x.productId) || x.id === a.id); out.submissions = s.submissions.filter(x => jids.has(x.journeyId)); out.messages = s.messages.filter(m => jids.has(m.journeyId) && canEdit(a, find(s.journeys, m.journeyId))); out.documents = s.documents.filter(d => jids.has(d.journeyId) && canEdit(a, find(s.journeys, d.journeyId))); out.activities = s.activities.filter(e => e.journeyId ? jids.has(e.journeyId) && (canEdit(a, find(s.journeys, e.journeyId)) || ((e.revision || 0) <= Math.max(...find(s.journeys, e.journeyId).history.filter(h => h.agentId === a.id).map(h => h.endRevision || 0), 0) && e.at <= Math.max(...find(s.journeys, e.journeyId).history.filter(h => h.agentId === a.id).map(h => h.end || s.now), 0))) : a.role !== 'agent' && (!e.productId || canScope(a, e.productId))); out.exposures = s.exposures.filter(e => jids.has(e.journeyId) && (a.role !== 'agent' || e.agentId === a.id)); out.outcomes = s.outcomes.filter(e => jids.has(e.journeyId) && (a.role !== 'agent' || e.agentId === a.id)); out.offers = s.offers.filter(o => jids.has(o.journeyId) && (a.role !== 'agent' || o.agentId === a.id || o.fromId === a.id)); out.followups = s.followups.filter(f => jids.has(f.journeyId) && (a.role !== 'agent' || f.agentId === a.id)); out.approvals = s.approvals.filter(x => canScope(a, x.productId) && (a.role !== 'agent' || x.requestedBy === a.id)); out.partnerRows = a.role === 'agent' ? [] : s.partnerRows.filter(p => canScope(a, p.productId)); for (const k of ['routing', 'sla', 'rotation', 'bonusPlans', 'competitions', 'automations'] as const)
    (out[k] as unknown) = s[k].filter(x => canScope(a, x.productId)); out.snapshots = s.snapshots.filter(x => canScope(a, s.bonusPlans.find(p => p.id === x.planId)?.productId || 'none') && (a.role !== 'agent' || x.agentId === a.id)); out.leaves = s.leaves.filter(x => a.role !== 'agent' && canScope(a, actor(s, x.agentId).productId) || x.agentId === a.id); out.outbox = a.role === 'agent' ? [] : s.outbox.filter(x => jids.has(String(x.payload.journeyId))); const accs = s.waAccounts.filter(x => canScope(a, x.productId)); out.waAccounts = accs; const accIds = new Set(accs.map(x => x.id)); out.waTemplates = s.waTemplates.filter(t => accIds.has(t.accountId)); out.conversations = s.conversations.filter(cv => accIds.has(cv.accountId) && (a.role !== 'agent' || (cv.journeyId ? jids.has(cv.journeyId) && canEdit(a, find(s.journeys, cv.journeyId)) : cv.assignedToId === a.id || cv.assignedToId === null))); const cids = new Set(out.conversations.map(cv => cv.id)); out.messages = s.messages.filter(m => (m.conversationId ? cids.has(m.conversationId) : jids.has(m.journeyId)) && (a.role !== 'agent' || !m.conversationId || (() => { const cv = s.conversations.find(x => x.id === m.conversationId)!; return cv.handoverMode === 'full' || cv.handoverMode === undefined || !cv.assignedAt || m.at >= cv.assignedAt; })())); out.waReviews = a.role === 'agent' ? [] : s.waReviews.filter(r => cids.has(r.conversationId)); out.processed = []; return out; }
export function execute(input: State, aId: string, c: Command, requestId: string): State {
    if (input.processed.includes(requestId))
        return input;
    let s = structuredClone(input);
    const a = actor(s, aId);
    if (!a.enabled)
        throw Error('الحساب موقوف');
    const getJ = () => { const j = find(s.journeys, c.id); if (!canView(s, a, j))
        throw Error('غير مصرح بعرض هذا الليد'); return j; };
    const edit = () => { const j = getJ(); if (!canEdit(a, j))
        throw Error('هذا الليد للعرض فقط بعد التسليم'); return j; };
    const manager = (p: string) => { if (!canManage(a, p))
        throw Error('هذا الإجراء يحتاج صلاحية قائد الفريق'); };
    const admin = () => { if (!['admin', 'manager'].includes(a.role))
        throw Error('يلزم اعتماد الإدارة'); };
    switch (c.type) {
        case 'product_create': {
            admin();
            const base = structuredClone(s.products[0]), id = uid('PRODUCT');
            const timezone = required(c.timezone);
            try {
                clockParts(s.now, timezone);
            }
            catch {
                throw Error('منطقة زمنية غير صحيحة');
            }
            const number = normalizePhone(required(c.number));
            if (s.products.some(p => p.number === number))
                throw Error('رقم القناة مستخدم لشركة أخرى');
            const p = { ...base, id, name: required(c.name), company: required(c.company), country: required(c.country), timezone, number };
            s.products.push(p);
            s.sla.push({ ...structuredClone(s.sla[0]), productId: id, version: 1 });
            s.rotation.push({ ...structuredClone(s.rotation[0]), id: uid('ROT'), productId: id, enabled: false, version: 1 });
            log(s, a.id, 'product_created', 'إضافة شركة / برودكت', `${p.company} · ${p.name} · يحتاج فريقًا وقاعدة توزيع`);
            break;
        }
        case 'agent_create': {
            admin();
            const p = product(s, required(c.productId));
            const selected = Array.isArray(c.stages) ? c.stages.filter(x => stages.includes(x as Stage)) as Stage[] : [];
            if (!selected.length)
                throw Error('اختر مرحلة واحدة على الأقل');
            const u: Agent = { id: uid('USER'), name: required(c.name), role: 'agent', productId: p.id, team: required(c.team), stages: selected, enabled: true, availability: 'offline', shiftStart: 10, shiftEnd: 22, days: [0, 1, 2, 3, 4, 5, 6], weight: 1, capacity: 12, lastAssignedAt: 0 };
            s.agents.push(u);
            log(s, a.id, 'agent_created', 'إضافة موظفة للتجربة', `${u.name} · ${p.company}`);
            break;
        }
        case 'reset':
            admin();
            s = seed();
            s.revision = input.revision;
            break;
        case 'advance_time': {
            admin();
            s.now += num(c.minutes, 1, 60 * 24 * 40) * M;
            for (const o of s.offers.filter(o => o.state === 'pending' && o.expires <= s.now)) {
                o.state = 'expired';
                log(s, 'system', 'offer_expired', 'انتهت مهلة قبول الإسناد', 'أُلغيت السعة المحجوزة؛ الملكية السابقة لم تتغير.', find(s.journeys, o.journeyId));
            }
            for (const j of s.journeys.filter(j => overdue(s, j))) {
                const key = `${j.stage}-${j.assignedAt}`;
                if (!j.breachKeys.includes(key)) {
                    j.breachKeys.push(key);
                    log(s, 'system', 'sla_breached', 'تجاوز SLA', 'التأخير محفوظ حتى لو أصبحت الموظفة غير متصلة.', j);
                    auto(s, 'sla_breached', j);
                }
            }
            for (const j of [...s.journeys].filter(j => j.state !== 'archived' && !s.offers.some(o => o.journeyId === j.id && o.state === 'pending'))) {
                const r = s.rotation.filter(r => r.enabled && r.productId === j.productId && (r.stage === 'all' || r.stage === j.stage)).sort((a, b) => a.priority - b.priority)[0];
                if (!r)
                    continue;
                try {
                    s = execute(s, 'admin', { type: 'rotate', id: j.id, ruleId: r.id }, uid('JOB'));
                }
                catch { }
            }
            log(s, a.id, 'clock', 'تقديم ساعة التجربة', `${c.minutes} دقيقة · تمت مراجعة قواعد التدوير الفعالة`);
            break;
        }
        case 'create_lead':
        case 'inbound': {
            const p = product(s, required(c.productId, 'البرودكت'));
            if (!canScope(a, p.id))
                throw Error('خارج نطاق الشركة');
            const phone = normalizePhone(required(c.phone, 'الهاتف'), p.country);
            const source = c.type === 'inbound' ? 'WhatsApp' : required(c.source, 'المصدر');
            const externalId = typeof c.externalId === 'string' && c.externalId.trim() ? c.externalId.trim() : uid(source === 'Meta' ? 'META' : 'EXT');
            if (s.submissions.some(x => x.externalId === externalId && x.source === source && s.journeys.some(j => j.id === x.journeyId && j.productId === p.id))) {
                log(s, a.id, 'duplicate', 'استُقبل تسجيل مكرر', 'لم يُنشأ ليد أو فرصة إضافية.');
                break;
            }
            let pe = s.people.find(x => !x.mergedInto && x.phones.includes(phone));
            if (!pe) {
                pe = { id: uid('P'), name: required(c.name, 'الاسم'), phones: [phone], city: String(c.city || 'القاهرة'), createdAt: s.now };
                s.people.push(pe);
            }
            let j = s.journeys.find(j => j.personId === pe!.id && j.productId === p.id && j.state !== 'archived');
            let created = false;
            if (!j) {
                j = { id: uid('J'), personId: pe.id, productId: p.id, stage: 'fresh', status: p.statuses.fresh[0], state: 'open', ownerId: null, createdAt: s.now, stageAt: s.now, assignedAt: s.now, dueAt: 0, stageDueAt: s.now + s.sla.find(x => x.productId === p.id)!.stageHours * H, firstAttemptAt: null, successfulAt: null, rotations: 0, attempt: 1, trips: 0, history: [], breachKeys: [] };
                j.dueAt = firstDue(s, j);
                j.stageDueAt = s.now + stageHours(s, j) * H;
                s.journeys.push(j);
                created = true;
            }
            s.submissions.push({ id: uid('SUB'), personId: pe.id, journeyId: j.id, source, externalId, at: s.now, answers: Array.isArray(c.answers) ? c.answers.map((q) => ({ question: required(q.question), answer: required(q.answer) })) : [] });
            log(s, a.id, 'lead_created', created ? 'وصول ليد جديد' : 'وصول تسجيل إضافي', `${source} · ${externalId} · ملف شخص واحد`, j);
            let conv = null as ReturnType<typeof waReceive> | null;
            if (c.type === 'inbound') {
                conv = waReceive(s, j, required(c.text, 'الرسالة'));
                if (j.firstAttemptAt)
                    j.successfulAt = s.now;
            }
            if (created) {
                routeOffer(s, j, 'fresh');
                auto(s, 'lead_created', j);
            }
            if (conv)
                waInboundReview(s, j, conv, String(c.text));
            break;
        }
        case 'note': {
            const j = edit();
            log(s, a.id, 'note', 'ملاحظة', required(c.text, 'الملاحظة'), j);
            break;
        }
        case 'status': {
            const j = edit(), status = required(c.status);
            if (j.state !== 'open' || !product(s, j.productId).statuses[j.stage].includes(status))
                throw Error('الحالة غير متاحة في هذه المرحلة');
            j.status = status;
            log(s, a.id, 'status_changed', 'تغيير الحالة', status + ' · لا يُعتبر هذا وحده محاولة اتصال.', j);
            break;
        }
        case 'attempt':
        case 'send_message': {
            const j = edit();
            if (j.state !== 'open' || !j.ownerId)
                throw Error('يلزم ليد مفتوح ومستلم');
            if (c.type === 'attempt') {
                const outcome = required(c.outcome, 'نتيجة المكالمة');
                const duration = num(c.duration, 1, 3600);
                log(s, a.id, 'call_attempt', `محاولة اتصال · ${outcome}`, `${duration} ثانية · مرجع ${uid('DEMO-CALL')} · إثبات مكالمة محاكى، بلا تسجيل صوتي حقيقي.`, j);
                if (outcome === 'رد — تم التواصل')
                    j.successfulAt = s.now;
                const status = outcome === 'لم يرد' ? 'لم يرد' : 'تم التواصل';
                if (product(s, j.productId).statuses[j.stage].includes(status))
                    j.status = status;
            }
            else
                waSendText(s, a, j, required(c.text, 'الرسالة'));
            if (!j.firstAttemptAt)
                j.firstAttemptAt = s.now;
            break;
        }
        case 'receive_reply': {
            const j = edit();
            waReceive(s, j, required(c.text));
            if (j.firstAttemptAt)
                j.successfulAt = s.now;
            log(s, a.id, 'inbound_message', 'وصل رد العميل', 'تم تسجيل الرد وربطه بالمحادثة الحالية.', j);
            break;
        }
        case 'followup': {
            const j = edit();
            s.followups.push({ id: uid('FU'), journeyId: j.id, agentId: j.ownerId || a.id, at: num(c.at, s.now + M, s.now + 365 * D), kind: required(c.kind), note: required(c.note), done: false, createdAt: s.now });
            log(s, a.id, 'followup_created', 'موعد متابعة جديد', String(c.note), j);
            break;
        }
        case 'complete_followup': {
            const f = find(s.followups, c.id), j = find(s.journeys, f.journeyId);
            if (!canEdit(a, j))
                throw Error('غير مصرح');
            f.done = true;
            log(s, a.id, 'followup_completed', 'اكتملت المتابعة', f.note, j);
            break;
        }
        case 'route': {
            const j = edit();
            manager(j.productId);
            routeOffer(s, j, j.ownerId ? 'rotation' : 'fresh', j.ownerId ? [j.ownerId] : []);
            break;
        }
        case 'claim': {
            if (a.role !== 'agent')
                throw Error('اختر دور موظفة لتجربة اطلب ليد');
            const queue = s.journeys.filter(j => j.productId === a.productId && !j.ownerId && j.state === 'open' && a.stages.includes(j.stage) && !s.offers.some(o => o.journeyId === j.id && o.state === 'pending')).sort((a, b) => a.dueAt - b.dueAt);
            const j = queue.find(j => route(s, j, [], a.id).candidates.some(x => x.agent.id === a.id && x.eligible));
            if (!j)
                throw Error('لا توجد فرصة مؤهلة الآن؛ راجع التأخير والسعة والشيفت');
            const d = route(s, j, [], a.id);
            offer(s, j, a, 'fresh', d.rule!.id);
            break;
        }
        case 'offer_decide': {
            const o = find(s.offers, c.id), j = find(s.journeys, o.journeyId);
            if (a.id !== o.agentId)
                throw Error('قبول أو رفض العرض لصاحبته فقط؛ بدّل الدور لتجربته');
            if (o.state !== 'pending' || o.expires <= s.now)
                throw Error('العرض لم يعد متاحًا');
            if (c.accept === true) {
                const d = route(s, j, [], a.id), candidate = d.candidates.find(x => x.agent.id === a.id);
                const reasons = (candidate?.reasons || ['لم تعد الموظفة ضمن القاعدة']).filter(x => x !== 'السعة مكتملة');
                const actualLoad = s.journeys.filter(x => x.ownerId === a.id && x.state === 'open').length + s.offers.filter(x => x.agentId === a.id && x.state === 'pending' && x.id !== o.id).length;
                if (actualLoad >= a.capacity)
                    reasons.push('السعة مكتملة');
                if (reasons.length)
                    throw Error(reasons.join(' · '));
                acceptOwner(s, j, a, o.kind);
                o.state = 'accepted';
            }
            else {
                o.reason = required(c.reason, 'سبب رفض الإسناد');
                o.state = 'rejected';
                log(s, a.id, 'offer_rejected', 'رفض عرض الإسناد', o.reason + ' · ليس رفضًا للعميل.', j);
            }
            break;
        }
        case 'transition': {
            const j = edit();
            if (s.offers.some(o => o.journeyId === j.id && o.state === 'pending'))
                throw Error('أكمل الإسناد الحالي أولًا');
            const target = stages[stages.indexOf(j.stage) + 1];
            if (!target)
                throw Error('الرحلات هي المرحلة الأخيرة');
            const p = product(s, j.productId);
            const row = s.partnerRows.filter(r => r.productId === p.id && r.journeyId === j.id && r.asOf <= s.now).sort((a, b) => b.asOf - a.asOf)[0];
            const verified = row && s.now - row.asOf <= 7 * D && (target === 'signup' ? row.signup : target === 'approved' ? row.approved : row.trips > 0);
            if (!verified || p.approval) {
                if (s.approvals.some(x => x.journeyId === j.id && x.type === 'stage' && x.state === 'pending'))
                    throw Error('طلب الموافقة موجود بالفعل');
                s.approvals.push({ id: uid('AP'), journeyId: j.id, productId: p.id, type: 'stage', requestedBy: a.id, at: s.now, state: 'pending', target, reason: required(c.reason || 'الإثبات يحتاج مراجعة قائد الفريق') });
                j.status = p.statuses[j.stage].includes('تحت المراجعة') ? 'تحت المراجعة' : j.status;
                log(s, a.id, 'approval_requested', 'طلب اعتماد انتقال المرحلة', verified ? 'المطابقة موجودة والقاعدة تتطلب اعتمادًا' : 'لا يوجد إثبات شريك حديث كافٍ — بانتظار قائد الفريق.', j);
            }
            else {
                if (target === 'trips')
                    j.trips = row.trips;
                milestone(s, j, target, a, `ملف الشركة ${row.batchId} · ${row.id}`);
            }
            break;
        }
        case 'return_request': {
            const j = edit();
            if (j.stage === 'fresh')
                throw Error('هذه أول مرحلة');
            if (s.approvals.some(x => x.journeyId === j.id && x.type === 'return' && x.state === 'pending'))
                throw Error('يوجد طلب رجوع قائم');
            s.approvals.push({ id: uid('AP'), journeyId: j.id, productId: j.productId, type: 'return', requestedBy: a.id, at: s.now, state: 'pending', target: stages[stages.indexOf(j.stage) - 1], reason: required(c.reason, 'سبب الرجوع') });
            log(s, a.id, 'return_requested', 'طلب إرجاع للمرحلة السابقة', String(c.reason), j);
            break;
        }
        case 'approval_decide': {
            const ap = find(s.approvals, c.id);
            manager(ap.productId);
            if (ap.state !== 'pending')
                throw Error('الطلب حُسم بالفعل');
            const reason = required(c.reason, 'سبب القرار');
            ap.state = c.accept === true ? 'approved' : 'rejected';
            ap.decidedBy = a.id;
            ap.decidedAt = s.now;
            ap.decisionReason = reason;
            const j = ap.journeyId ? find(s.journeys, ap.journeyId) : undefined;
            if (ap.state === 'approved') {
                if (ap.type === 'stage' && j) {
                    if (ap.target === 'trips')
                        j.trips = Math.max(1, j.trips);
                    milestone(s, j, ap.target!, a, `اعتماد ${a.name}: ${reason}`);
                }
                if (ap.type === 'return' && j) {
                    for (const o of s.offers.filter(o => o.journeyId === j.id && o.state === 'pending')) {
                        o.state = 'expired';
                        o.reason = 'رجوع معتمد';
                    }
                    closeHistory(s, j);
                    j.stage = ap.target!;
                    j.status = product(s, j.productId).statuses[j.stage][0];
                    j.stageAt = s.now;
                    j.stageDueAt = s.now + stageHours(s, j) * H;
                    j.ownerId = null;
                    routeOffer(s, j, 'return');
                    log(s, a.id, 'return_approved', 'اعتماد الرجوع', reason + ' · الإنجازات السابقة محفوظة؛ إلغاء الإنجاز يحتاج تسوية مستقلة.', j);
                }
                if (ap.type === 'document') {
                    const doc = find(s.documents, ap.data?.documentId);
                    doc.state = 'approved';
                    doc.reason = reason;
                }
                if (ap.type === 'leave') {
                    const l = find(s.leaves, ap.data?.leaveId);
                    l.state = 'approved';
                }
            }
            else {
                if (ap.type === 'document') {
                    find(s.documents, ap.data?.documentId).state = 'rejected';
                }
                if (ap.type === 'leave')
                    find(s.leaves, ap.data?.leaveId).state = 'rejected';
            }
            log(s, a.id, 'approval_decided', ap.state === 'approved' ? 'تم اعتماد الطلب' : 'تم رفض الطلب', reason, j);
            break;
        }
        case 'reject_lead': {
            const j = edit(), reason = required(c.reason);
            if (!product(s, j.productId).reasons.includes(reason))
                throw Error('سبب الرفض غير معتمد');
            j.state = 'rejected';
            j.rejectedReason = reason;
            for (const o of s.offers.filter(o => o.journeyId === j.id && o.state === 'pending'))
                o.state = 'expired';
            log(s, a.id, 'lead_rejected', 'رفض العميل مع حفظ المرحلة', reason, j);
            break;
        }
        case 'rotate': {
            const j = edit();
            manager(j.productId);
            const r = c.ruleId ? find(s.rotation, c.ruleId) : s.rotation.filter(r => r.enabled && r.productId === j.productId && (r.stage === 'all' || r.stage === j.stage)).sort((a, b) => a.priority - b.priority)[0];
            if (!r || !r.enabled || r.productId !== j.productId || (r.stage !== 'all' && r.stage !== j.stage))
                throw Error('لا توجد قاعدة تدوير مطابقة');
            if (j.rotations >= r.max)
                throw Error('وصل للحد الأقصى — يلزم تدخل إداري');
            if (j.rotations && !r.allowRepeated)
                throw Error('القاعدة تستبعد الليد الذي دُوّر سابقًا');
            if (j.lastRotatedAt && s.now - j.lastRotatedAt < r.cooldownMinutes * M)
                throw Error('فترة التهدئة لم تنتهِ');
            if (j.state === 'rejected' && !r.reasons.includes(j.rejectedReason || ''))
                throw Error('سبب الرفض غير مسموح بإعادة تدويره');
            if (r.trigger === 'sla' && (!overdue(s, j) || s.now - j.dueAt < r.afterMinutes * M))
                throw Error('لم يتحقق تأخير قاعدة التدوير');
            if (r.trigger === 'rejected' && j.state !== 'rejected')
                throw Error('القاعدة مخصصة للداتا المرفوضة');
            if (r.trigger === 'inactivity') {
                const last = Math.max(j.assignedAt, ...s.activities.filter(e => e.journeyId === j.id && ['call_attempt', 'whatsapp_attempt', 'inbound_message'].includes(e.kind)).map(e => e.at));
                if (s.now - last < r.afterMinutes * M)
                    throw Error('مدة عدم النشاط لم تكتمل');
            }
            const wasRejected = j.state === 'rejected';
            j.state = 'open';
            const excluded = r.excludePrevious ? [...new Set(j.history.map(h => h.agentId))] : j.ownerId ? [j.ownerId] : [];
            const decision = route(s, j, excluded);
            if (!decision.chosen)
                throw Error(decision.why);
            if (wasRejected) {
                j.attempt++;
                log(s, a.id, 'attempt_reopened', 'إعادة فتح محاولة جديدة', `المحاولة ${j.attempt} · المرحلة محفوظة`, j);
            }
            offer(s, j, decision.chosen, 'rotation', r.id);
            log(s, a.id, 'rotation_proposed', 'تم تطبيق قاعدة التدوير', `${r.name} v${r.version} · المقام السابق محفوظ`, j);
            break;
        }
        case 'availability': {
            const target = find(s.agents, c.id || a.id);
            if (target.id !== a.id)
                manager(target.productId);
            if (!['online', 'offline', 'break'].includes(String(c.value)))
                throw Error('حالة غير صحيحة');
            target.availability = c.value as Agent['availability'];
            log(s, a.id, 'availability', 'تغيير حالة التوفر', `${target.name}: ${target.availability} · الساعة لا تتوقف.`);
            break;
        }
        case 'leave': {
            const target = find(s.agents, c.agentId || a.id);
            if (target.id !== a.id)
                manager(target.productId);
            const from = num(c.from, 0), to = num(c.to, from + M);
            const l = { id: uid('LV'), agentId: target.id, from, to, reason: required(c.reason), state: 'pending' as const };
            s.leaves.push(l);
            s.approvals.push({ id: uid('AP'), productId: target.productId, type: 'leave', requestedBy: a.id, at: s.now, state: 'pending', reason: l.reason, data: { leaveId: l.id } });
            log(s, a.id, 'leave_requested', 'طلب إجازة', target.name);
            break;
        }
        case 'agent_update': {
            const u = find(s.agents, c.id);
            manager(u.productId);
            u.capacity = num(c.capacity, 1, 100);
            u.weight = num(c.weight, 1, 100);
            u.shiftStart = num(c.shiftStart, 0, 23);
            u.shiftEnd = num(c.shiftEnd, 0, 24);
            u.enabled = c.enabled === true;
            u.days = Array.isArray(c.days) ? c.days.map(x => num(x, 0, 6)) : u.days;
            if (!u.enabled) {
                for (const j of s.journeys.filter(j => j.ownerId === u.id && j.state === 'open')) {
                    closeHistory(s, j);
                    j.ownerId = null;
                    log(s, a.id, 'disabled_queue', 'انتقل الليد للطابور بسبب إيقاف الحساب', u.name, j);
                }
                for (const o of s.offers.filter(o => o.agentId === u.id && o.state === 'pending'))
                    o.state = 'expired';
            }
            log(s, a.id, 'user_updated', 'تعديل السعة والشيفت', u.name);
            break;
        }
        case 'transfer_user': {
            admin();
            const u = find(s.agents, c.id), p = product(s, required(c.productId));
            if (u.role !== 'agent')
                throw Error('النقل التشغيلي خاص بالموظفات');
            const mode = required(c.mode);
            if (!['queue', 'redistribute'].includes(mode))
                throw Error('اختر طريقة نقل الداتا');
            const work = s.journeys.filter(j => j.ownerId === u.id && j.state === 'open');
            for (const j of work) {
                closeHistory(s, j);
                j.ownerId = null;
                log(s, a.id, 'team_transfer', 'نقل الموظفة لفريق آخر', `${u.name} · التاريخ والإنجاز محفوظان.`, j);
                if (mode === 'redistribute')
                    routeOffer(s, j, 'rotation', [u.id]);
            }
            for (const o of s.offers.filter(o => o.agentId === u.id && o.state === 'pending'))
                o.state = 'expired';
            u.productId = p.id;
            u.team = required(c.team);
            u.stages = Array.isArray(c.stages) ? c.stages.filter(x => stages.includes(x as Stage)) as Stage[] : ['fresh'];
            log(s, a.id, 'user_transferred', 'تم نقل الموظفة', `${u.name} · ${p.company} · ${work.length} فرصة`);
            break;
        }
        case 'merge': {
            admin();
            const p1 = find(s.people, c.id), p2 = find(s.people, c.targetId);
            if (p1.id === p2.id || p1.mergedInto || p2.mergedInto)
                throw Error('اختر ملفين مختلفين');
            required(c.reason);
            const duplicates = s.journeys.filter(j => j.personId === p1.id && j.state !== 'archived').some(j => s.journeys.some(k => k.personId === p2.id && k.productId === j.productId && k.state !== 'archived'));
            if (duplicates)
                throw Error('يوجد مساران لنفس البرودكت. أرشف المسار غير الصحيح أولًا بعد مراجعته؛ لا يمكن دمج ملكيتين تلقائيًا.');
            p2.phones = [...new Set([...p2.phones, ...p1.phones])];
            p1.mergedInto = p2.id;
            for (const j of s.journeys.filter(j => j.personId === p1.id))
                j.personId = p2.id;
            for (const arr of [s.submissions, s.exposures, s.outcomes, s.activities])
                for (const x of arr)
                    if (x.personId === p1.id)
                        x.personId = p2.id;
            log(s, a.id, 'merged', 'دمج ملفي شخص', `${p1.id} → ${p2.id} · ${c.reason} · محفوظ كل سجل سابق.`);
            break;
        }
        case 'archive': {
            const j = edit();
            manager(j.productId);
            required(c.reason);
            j.state = 'archived';
            closeHistory(s, j);
            j.ownerId = null;
            for (const o of s.offers.filter(o => o.journeyId === j.id && o.state === 'pending'))
                o.state = 'expired';
            log(s, a.id, 'archived', 'أرشفة الرحلة', String(c.reason), j);
            break;
        }
        case 'partner_import': {
            const p = product(s, required(c.productId));
            manager(p.id);
            if (!Array.isArray(c.rows) || c.rows.length > 500)
                throw Error('أقصى حد 500 صف للتجربة');
            const batch = uid('BATCH');
            for (const item of c.rows) {
                const phone = normalizePhone(required(item.phone), p.country);
                const pe = s.people.find(x => !x.mergedInto && x.phones.includes(phone)), j = s.journeys.find(j => j.personId === pe?.id && j.productId === p.id && j.state !== 'archived');
                s.partnerRows.push({ id: uid('PR'), productId: p.id, phone, name: String(item.name || pe?.name || ''), signup: item.signup === true, approved: item.approved === true, trips: num(item.trips || 0, 0, 100000), asOf: num(item.asOf || s.now, 0, s.now), journeyId: j?.id, batchId: batch });
            }
            log(s, a.id, 'partner_import', 'استيراد ملف الشركة', `${batch} · ${c.rows.length} صف · المطابقة بالهاتف والبرودكت`);
            break;
        }
        case 'sync_trips': {
            const j = edit();
            manager(j.productId);
            const row = s.partnerRows.filter(r => r.journeyId === j.id).sort((a, b) => b.asOf - a.asOf)[0];
            if (!row)
                throw Error('لم توجد مطابقة');
            if (row.trips < j.trips)
                required(c.reason, 'سبب تصحيح عدد الرحلات');
            const old = j.trips;
            j.trips = row.trips;
            for (const o of s.outcomes.filter(o => o.journeyId === j.id && o.from === 'trips' && o.valid && (o.trips || 0) > j.trips)) {
                o.valid = false;
                log(s, a.id, 'trip_outcome_corrected', 'تصحيح نتيجة رحلات', o.id, j);
            }
            if (j.stage === 'trips' && j.ownerId) {
                for (const goal of [...new Set(s.bonusPlans.filter(p => p.productId === j.productId && p.stage === 'trips').map(p => p.tripTarget || 10))]) {
                    if (j.trips >= goal && !s.outcomes.some(o => o.journeyId === j.id && o.from === 'trips' && o.trips === goal && o.valid)) {
                        const sub = s.submissions.filter(x => x.journeyId === j.id && ['Meta', 'TikTok'].includes(x.source) && x.at <= s.now).reverse().sort((a, b) => b.at - a.at)[0];
                        const oid = uid('OUT');
                        s.outcomes.push({ id: oid, journeyId: j.id, personId: j.personId, agentId: j.ownerId, from: 'trips', to: 'trips', at: s.now, receivedAt: j.assignedAt, evidence: `ملف ${row.batchId} · هدف ${goal}`, submissionId: sub?.id, valid: true, trips: goal });
                        if (sub)
                            s.outbox.push({ id: uid('CB'), outcomeId: oid, externalId: sub.externalId, at: s.now, state: 'queued', tries: 0, payload: { eventId: oid, externalLeadId: sub.externalId, journeyId: j.id, personId: j.personId, stage: 'trips', tripGoal: goal, occurredAt: new Date(s.now).toISOString() } });
                        log(s, a.id, 'trip_goal', 'تحقق هدف الرحلات', String(goal), j);
                    }
                }
            }
            log(s, a.id, 'trips_synced', 'تحديث إجمالي الرحلات', `${old} → ${j.trips} · ${c.reason || row.batchId} · لا جمع للقطات التراكمية.`, j);
            break;
        }
        case 'document_add': {
            const j = edit();
            const d = { id: uid('DOC'), journeyId: j.id, name: required(c.name), type: required(c.docType), size: num(c.size, 1, 10 * 1024 * 1024), key: required(c.key), at: s.now, state: 'pending' as const, expires: c.expires ? num(c.expires, s.now) : undefined };
            if (!product(s, j.productId).documents.includes(d.type))
                throw Error('نوع المستند غير مطلوب لهذا البرودكت');
            s.documents.push(d);
            s.approvals.push({ id: uid('AP'), journeyId: j.id, productId: j.productId, type: 'document', requestedBy: a.id, at: s.now, state: 'pending', reason: `مراجعة ${d.type}`, data: { documentId: d.id } });
            log(s, a.id, 'document_added', 'رفع مستند للمراجعة', d.type, j);
            break;
        }
        case 'routing_save': {
            const d = c.rule as RoutingRule;
            manager(d.productId);
            product(s, d.productId);
            if (!['round_robin', 'weighted', 'capacity', 'specific', 'claim'].includes(d.strategy) || !['all', ...stages].includes(d.stage))
                throw Error('قاعدة غير صالحة');
            d.name = required(d.name);
            d.priority = num(d.priority, 1, 1000);
            if (d.strategy === 'specific' && d.agentIds.length !== 1)
                throw Error('الموظفة المحددة تحتاج مستلمة واحدة فقط');
            d.agentIds = d.agentIds.filter(id => s.agents.some(a => a.id === id && a.productId === d.productId && a.role === 'agent'));
            if (!d.agentIds.length)
                throw Error('اختر موظفة واحدة على الأقل');
            const old = s.routing.find(x => x.id === d.id);
            if (old) {
                manager(old.productId);
                Object.assign(old, d, { version: old.version + 1 });
            }
            else
                s.routing.push({ ...d, id: uid('RULE'), version: 1 });
            log(s, a.id, 'rule_saved', 'حفظ قاعدة التوزيع', d.name);
            break;
        }
        case 'routing_order': {
            const r = find(s.routing, c.id);
            manager(r.productId);
            const list = s.routing.filter(x => x.productId === r.productId).sort((a, b) => a.priority - b.priority), i = list.indexOf(r), n = i + (c.direction === 'up' ? -1 : 1);
            if (n < 0 || n >= list.length)
                break;
            [list[i], list[n]] = [list[n], list[i]];
            list.forEach((x, i) => { x.priority = i + 1; x.version++; });
            log(s, a.id, 'rules_reordered', 'تغيير ترتيب القواعد', r.name);
            break;
        }
        case 'sla_save': {
            const r = find(s.products, c.productId);
            manager(r.id);
            const d = c.rule as State['sla'][number], old = s.sla.find(x => x.productId === r.id)!;
            Object.assign(old, { dayStart: num(d.dayStart, 0, 23), dayEnd: num(d.dayEnd, 1, 24), minutes: num(d.minutes, 1, 1440), nightMinutes: num(d.nightMinutes, 1, 1440), nightMode: d.nightMode === 'elapsed' ? 'elapsed' : 'next_shift', followupMinutes: num(d.followupMinutes, 1, 43200), stageHours: num(d.stageHours, 1, 8760), acceptMinutes: num(d.acceptMinutes, 1, 1440), blockOverdue: !!d.blockOverdue, version: old.version + 1 });
            if (old.dayStart >= old.dayEnd)
                throw Error('نهاية نافذة النهار يجب أن تكون بعد بدايتها');
            old.stageHoursByStage = Object.fromEntries(stages.map(st => [st, num(d.stageHoursByStage?.[st] || old.stageHours, 1, 8760)]));
            old.workDays = (d.workDays || [0, 1, 2, 3, 4, 5, 6]).map(n => num(n, 0, 6));
            if (!old.workDays.length)
                throw Error('يلزم يوم عمل واحد على الأقل');
            old.holidays = (d.holidays || []).map(x => required(x));
            log(s, a.id, 'sla_saved', 'حفظ سياسة SLA', `${r.name} · يسري على الساعات الجديدة، ولا يمسح التأخير السابق.`);
            break;
        }
        case 'rotation_save': {
            const d = c.rule as RotationRule;
            manager(d.productId);
            const old = s.rotation.find(x => x.id === d.id);
            if (old)
                manager(old.productId);
            d.name = required(d.name);
            d.afterMinutes = num(d.afterMinutes, 0, 525600);
            d.max = num(d.max, 1, 100);
            d.cooldownMinutes = num(d.cooldownMinutes, 0, 525600);
            if (!['sla', 'inactivity', 'rejected'].includes(d.trigger) || !['all', ...stages].includes(d.stage))
                throw Error('قاعدة غير صالحة');
            d.reasons = d.reasons.filter(x => product(s, d.productId).reasons.includes(x));
            if (old)
                Object.assign(old, d, { version: old.version + 1 });
            else
                s.rotation.push({ ...d, id: uid('ROT'), version: 1 });
            log(s, a.id, 'rotation_saved', 'حفظ قاعدة التدوير', d.name);
            break;
        }
        case 'product_save': {
            admin();
            const p = find(s.products, c.id);
            const d = c.product as typeof p;
            p.captainStage = stages.includes(d.captainStage) ? d.captainStage : p.captainStage;
            p.handoff = !!d.handoff;
            p.handoffStages = (d.handoffStages || ['signup', 'approved']).filter(st => stages.includes(st));
            p.approval = !!d.approval;
            for (const st of stages) {
                if (!Array.isArray(d.statuses[st]) || !d.statuses[st].length)
                    throw Error('يلزم حالة واحدة لكل مرحلة');
                p.statuses[st] = [...new Set(d.statuses[st].map(v => required(v)))];
            }
            p.documents = d.documents.map(v => required(v));
            p.reasons = d.reasons.map(v => required(v));
            log(s, a.id, 'product_saved', 'حفظ إعدادات البرودكت', p.name);
            break;
        }
        case 'bonus_save': {
            admin();
            const p = c.plan as BonusPlan;
            product(s, p.productId);
            p.name = required(p.name);
            p.fixedAmount = num(p.fixedAmount, 0, 1000000);
            if (p.stage === 'trips')
                p.tripTarget = num(p.tripTarget || 10, 1, 10000);
            p.tiers = p.tiers.map(t => ({ rate: num(t.rate, 0, 1000), amount: num(t.amount, 0, 100000) })).sort((a, b) => a.rate - b.rate);
            if (!p.tiers.length || new Set(p.tiers.map(t => t.rate)).size !== p.tiers.length)
                throw Error('الشرائح مطلوبة ويجب ألا تتكرر');
            if (!['mixed', 'cohort', 'period'].includes(p.mode) || !stages.includes(p.stage))
                throw Error('خطة غير صالحة');
            const old = s.bonusPlans.find(x => x.id === p.id);
            if (old)
                Object.assign(old, p, { version: old.version + 1 });
            else
                s.bonusPlans.push({ ...p, id: uid('BON'), version: 1 });
            log(s, a.id, 'bonus_saved', 'حفظ خطة البونص', p.name + ' · أعلى شريحة على كل النتائج المحتسبة.');
            break;
        }
        case 'bonus_snapshot': {
            admin();
            const p = find(s.bonusPlans, c.planId), month = required(c.month);
            if (!/^\d{4}-\d{2}$/.test(month))
                throw Error('شهر غير صالح');
            if (clockParts(s.now, product(s, p.productId).timezone).month <= month)
                throw Error('الشهر لم ينتهِ بعد؛ قدّم ساعة التجربة للشهر التالي');
            for (const u of s.agents.filter(a => canScope(a, p.productId) && a.role === p.role)) {
                if (s.snapshots.some(x => x.planId === p.id && x.month === month && x.agentId === u.id))
                    continue;
                const b = bonus(s, p, u.id, month);
                s.snapshots.push({ id: uid('SNAP'), planId: p.id, planName: p.name, month, agentId: u.id, numerator: b.numerator, denominator: b.denominator, ratio: b.ratio, rate: b.rate, amount: b.amount, at: s.now, state: 'pending', paid: false, adjustment: 0, reason: 'لقطة نهاية الشهر', exposureIds: b.exposures.map(e => e.id), outcomeIds: b.outcomes.map(o => o.id) });
            }
            log(s, a.id, 'bonus_snapshot', 'إقفال حساب الشهر', `${p.name} · ${month} · بانتظار اعتماد الصرف.`);
            break;
        }
        case 'snapshot_decide': {
            admin();
            const x = find(s.snapshots, c.id);
            if (x.paid)
                throw Error('تم صرف هذا السجل؛ لا يمكن تعديله');
            x.reason = required(c.reason);
            x.adjustment = num(c.adjustment || 0, -100000, 100000);
            if (x.amount + x.adjustment < 0)
                throw Error('المبلغ بعد التسوية لا يمكن أن يكون سالبًا');
            x.state = c.accept === true ? 'approved' : 'rejected';
            x.decidedBy = a.id;
            log(s, a.id, 'bonus_decided', 'قرار اعتماد البونص', `${x.id} · ${x.state} · تسوية ${x.adjustment} · ${x.reason}`);
            break;
        }
        case 'snapshot_paid': {
            admin();
            const x = find(s.snapshots, c.id);
            if (x.state !== 'approved' || x.paid)
                throw Error('السجل غير مؤهل للصرف');
            x.paid = true;
            log(s, a.id, 'bonus_paid', 'تسجيل الصرف', `${x.id} · ${x.amount + x.adjustment} · محاكاة بدون ترحيل رواتب`);
            break;
        }
        case 'exposure_exclude': {
            admin();
            const e = find(s.exposures, c.id);
            e.excluded = c.excluded === true;
            e.reason = required(c.reason);
            log(s, a.id, 'exposure_adjustment', 'تسوية فرصة في المقام', `${e.id} · ${e.reason} · اللقطات المقفلة لا تتغير`);
            break;
        }
        case 'invalidate_outcome': {
            admin();
            const o = find(s.outcomes, c.id);
            o.valid = false;
            log(s, a.id, 'outcome_corrected', 'إلغاء نتيجة غير صحيحة', `${o.id} · ${required(c.reason)} · لا مساس باللقطات المقفلة`, find(s.journeys, o.journeyId));
            break;
        }
        case 'competition_save': {
            admin();
            const x = c.competition as State['competitions'][number];
            x.name = required(x.name);
            x.start = num(x.start, 0);
            x.end = num(x.end, x.start + M);
            x.prize = num(x.prize, 0);
            x.minimum = num(x.minimum, 0);
            product(s, x.productId);
            const old = s.competitions.find(y => y.id === x.id);
            if (old)
                Object.assign(old, x);
            else
                s.competitions.push({ ...x, id: uid('COMP') });
            log(s, a.id, 'competition_saved', 'حفظ المسابقة', x.name);
            break;
        }
        case 'automation_save': {
            const x = c.automation as State['automations'][number];
            manager(x.productId);
            x.name = required(x.name);
            x.minutes = num(x.minutes, 1, 43200);
            if (!['followup', 'notify'].includes(x.action) || !['stage_changed', 'sla_breached', 'lead_created'].includes(x.trigger))
                throw Error('أتمتة غير صالحة');
            const old = s.automations.find(y => y.id === x.id);
            if (old) {
                manager(old.productId);
                Object.assign(old, x, { version: old.version + 1 });
            }
            else
                s.automations.push({ ...x, id: uid('AUTO'), version: 1 });
            log(s, a.id, 'automation_saved', 'حفظ الأتمتة', x.name);
            break;
        }
        case 'outbox_retry': {
            admin();
            const x = find(s.outbox, c.id);
            if (x.state === 'delivered')
                throw Error('سبق التسليم');
            x.tries++;
            x.state = c.fail === true ? 'failed' : 'delivered';
            log(s, a.id, 'marketing_callback', 'محاكاة رد الماركتنج', `${x.externalId} · ${x.state} · لا إرسال خارجي`);
            break;
        }
        default: if (!waExecute(s, a, c, { manager, admin, edit, getJ }))
            throw Error('الإجراء غير معروف');
    }
    s.revision = input.revision + 1;
    s.processed = [...s.processed, requestId].slice(-1000);
    return s;
}
