export const stages = ['fresh', 'signup', 'approved', 'trips'] as const;
export type Stage = typeof stages[number];
export type Role = 'admin' | 'manager' | 'leader' | 'agent';
export type Product = {
    id: string;
    name: string;
    company: string;
    country: string;
    timezone: string;
    number: string;
    captainStage: Stage;
    statuses: Record<Stage, string[]>;
    reasons: string[];
    documents: string[];
    handoff: boolean;
    handoffStages?: Stage[];
    approval: boolean;
};
export type Agent = {
    id: string;
    name: string;
    role: Role;
    productId: string;
    team: string;
    stages: Stage[];
    enabled: boolean;
    availability: 'online' | 'offline' | 'break';
    shiftStart: number;
    shiftEnd: number;
    days: number[];
    weight: number;
    capacity: number;
    lastAssignedAt: number;
};
export type Person = {
    id: string;
    name: string;
    phones: string[];
    city: string;
    createdAt: number;
    mergedInto?: string;
};
export type Submission = {
    id: string;
    personId: string;
    journeyId: string;
    externalId: string;
    source: string;
    at: number;
    answers: {
        question: string;
        answer: string;
    }[];
};
export type Exposure = {
    id: string;
    journeyId: string;
    personId: string;
    agentId: string;
    stage: Stage;
    at: number;
    kind: 'fresh' | 'handoff' | 'rotation' | 'return';
    excluded: boolean;
    reason?: string;
};
export type Outcome = {
    id: string;
    journeyId: string;
    personId: string;
    agentId: string;
    from: Stage;
    to: Stage;
    at: number;
    receivedAt: number;
    evidence: string;
    submissionId?: string;
    valid: boolean;
    trips?: number;
};
export type Assignment = {
    agentId: string;
    stage: Stage;
    start: number;
    end?: number;
    endRevision?: number;
    reason: string;
};
export type Journey = {
    id: string;
    personId: string;
    productId: string;
    stage: Stage;
    status: string;
    state: 'open' | 'rejected' | 'archived';
    ownerId: string | null;
    createdAt: number;
    stageAt: number;
    assignedAt: number;
    dueAt: number;
    stageDueAt: number;
    firstAttemptAt: number | null;
    successfulAt: number | null;
    rotations: number;
    attempt: number;
    trips: number;
    history: Assignment[];
    breachKeys: string[];
    rejectedReason?: string;
    lastRotatedAt?: number;
};
export type Offer = {
    id: string;
    journeyId: string;
    agentId: string;
    fromId: string | null;
    kind: Exposure['kind'];
    at: number;
    expires: number;
    state: 'pending' | 'accepted' | 'rejected' | 'expired';
    reason?: string;
    ruleId: string;
};
export type Activity = {
    id: string;
    journeyId?: string;
    personId?: string;
    actorId: string;
    at: number;
    kind: string;
    title: string;
    detail: string;
    revision?: number;
    productId?: string;
};
export type Message = {
    id: string;
    journeyId: string;
    at: number;
    direction: 'in' | 'out';
    text: string;
    actorId?: string;
    state: 'received' | 'sent';
    kind: 'human' | 'automation';
};
export type Followup = {
    id: string;
    journeyId: string;
    agentId: string;
    at: number;
    kind: string;
    note: string;
    done: boolean;
    createdAt: number;
};
export type Approval = {
    id: string;
    journeyId?: string;
    productId: string;
    type: 'stage' | 'return' | 'document' | 'leave';
    requestedBy: string;
    at: number;
    state: 'pending' | 'approved' | 'rejected';
    target?: Stage;
    reason: string;
    decidedBy?: string;
    decidedAt?: number;
    decisionReason?: string;
    data?: Record<string, unknown>;
};
export type Doc = {
    id: string;
    journeyId: string;
    name: string;
    type: string;
    size: number;
    key: string;
    at: number;
    state: 'pending' | 'approved' | 'rejected';
    expires?: number;
    reason?: string;
};
export type PartnerRow = {
    id: string;
    productId: string;
    phone: string;
    name: string;
    signup: boolean;
    approved: boolean;
    trips: number;
    asOf: number;
    journeyId?: string;
    batchId: string;
};
export type RoutingRule = {
    id: string;
    name: string;
    productId: string;
    stage: Stage | 'all';
    source: string;
    strategy: 'round_robin' | 'weighted' | 'capacity' | 'specific' | 'claim';
    agentIds: string[];
    enabled: boolean;
    priority: number;
    version: number;
};
export type SlaRule = {
    productId: string;
    dayStart: number;
    dayEnd: number;
    minutes: number;
    nightMinutes: number;
    nightMode: 'elapsed' | 'next_shift';
    followupMinutes: number;
    stageHours: number;
    acceptMinutes: number;
    blockOverdue: boolean;
    stageHoursByStage?: Partial<Record<Stage, number>>;
    workDays?: number[];
    holidays?: string[];
    version: number;
};
export type RotationRule = {
    id: string;
    name: string;
    productId: string;
    stage: Stage | 'all';
    trigger: 'sla' | 'inactivity' | 'rejected';
    afterMinutes: number;
    max: number;
    cooldownMinutes: number;
    excludePrevious: boolean;
    allowRepeated: boolean;
    reasons: string[];
    enabled: boolean;
    priority: number;
    version: number;
};
export type BonusPlan = {
    id: string;
    name: string;
    productId: string;
    stage: Stage;
    mode: 'mixed' | 'cohort' | 'period';
    payout: 'per_result' | 'fixed';
    fixedAmount: number;
    tiers: {
        rate: number;
        amount: number;
    }[];
    role: Role;
    tripTarget?: number;
    version: number;
};
export type Snapshot = {
    id: string;
    planId: string;
    planName: string;
    month: string;
    agentId: string;
    denominator: number;
    numerator: number;
    ratio: number;
    rate: number;
    amount: number;
    at: number;
    state: 'pending' | 'approved' | 'rejected';
    paid: boolean;
    adjustment: number;
    reason: string;
    exposureIds: string[];
    outcomeIds: string[];
    decidedBy?: string;
};
export type Competition = {
    id: string;
    name: string;
    productId: string;
    stage: Stage;
    start: number;
    end: number;
    mode: 'count' | 'ratio';
    prize: number;
    minimum: number;
    enabled: boolean;
};
export type Leave = {
    id: string;
    agentId: string;
    from: number;
    to: number;
    reason: string;
    state: 'pending' | 'approved' | 'rejected';
};
export type Outbox = {
    id: string;
    outcomeId: string;
    externalId: string;
    at: number;
    state: 'queued' | 'delivered' | 'failed';
    tries: number;
    payload: Record<string, unknown>;
};
export type Automation = {
    id: string;
    name: string;
    productId: string;
    trigger: 'stage_changed' | 'lead_created' | 'sla_breached';
    action: 'followup' | 'notify';
    minutes: number;
    enabled: boolean;
    version: number;
};
export type State = {
    schema: number;
    revision: number;
    now: number;
    products: Product[];
    agents: Agent[];
    people: Person[];
    journeys: Journey[];
    submissions: Submission[];
    exposures: Exposure[];
    outcomes: Outcome[];
    offers: Offer[];
    activities: Activity[];
    messages: Message[];
    followups: Followup[];
    approvals: Approval[];
    documents: Doc[];
    partnerRows: PartnerRow[];
    routing: RoutingRule[];
    sla: SlaRule[];
    rotation: RotationRule[];
    bonusPlans: BonusPlan[];
    snapshots: Snapshot[];
    competitions: Competition[];
    leaves: Leave[];
    outbox: Outbox[];
    automations: Automation[];
    processed: string[];
};
export type Command = {
    type: string;
    id?: string;
    [key: string]: unknown;
};
export const labels: Record<Stage, string> = { fresh: 'جديد', signup: 'التسجيل', approved: 'جاهز للعمل', trips: 'الرحلات' };
export const english: Record<Stage, string> = { fresh: 'Fresh', signup: 'Signup', approved: 'Approved', trips: 'Trips' };
export const roles: Record<Role, string> = { admin: 'مدير النظام', manager: 'مدير الحسابات', leader: 'قائدة الفريق', agent: 'موظفة' };
export const M = 60000, H = 3600000, D = 86400000;
export const uid = (prefix = 'ID') => `${prefix}-${crypto.randomUUID().slice(0, 10)}`;
export function seed(): State {
    const now = Date.parse('2026-09-12T08:30:00Z');
    const statuses = { fresh: ['جديد', 'لم يرد', 'تم التواصل', 'مهتم', 'متابعة لاحقة'], signup: ['مسجل — استكمال الأوراق', 'مستندات ناقصة', 'تحت المراجعة'], approved: ['جاهز للعمل', 'منتظر أول رحلة', 'متابعة تشغيل'], trips: ['أول رحلة', 'أقل من 10 رحلات', '10 رحلات', '30 رحلة', 'اكتمل الهدف'] };
    const products: Product[] = [{ id: 'uber-eg', company: 'Uber', country: 'مصر', name: 'Uber X · القاهرة', timezone: 'Africa/Cairo', number: '+201000000001', captainStage: 'approved', statuses: structuredClone(statuses), reasons: ['غير مهتم', 'غير مؤهل', 'رقم غير صحيح', 'يرغب بالمتابعة لاحقًا'], documents: ['بطاقة الهوية', 'رخصة القيادة', 'رخصة السيارة'], handoff: true, approval: false }, { id: 'indrive-eg', company: 'inDrive', country: 'مصر', name: 'Cars · القاهرة', timezone: 'Africa/Cairo', number: '+201000000002', captainStage: 'approved', statuses: structuredClone(statuses), reasons: ['غير مهتم', 'غير مؤهل', 'يرغب بالمتابعة لاحقًا'], documents: ['بطاقة الهوية', 'رخصة القيادة'], handoff: true, approval: true }, { id: 'uber-sa', company: 'Uber', country: 'السعودية', name: 'Uber X · الرياض', timezone: 'Asia/Riyadh', number: '+966500000001', captainStage: 'approved', statuses: structuredClone(statuses), reasons: ['غير مؤهل', 'غير مهتم'], documents: ['الهوية', 'رخصة القيادة'], handoff: true, approval: true }];
    const agent = (id: string, name: string, role: Role, productId: string, team: string, stages: Stage[], availability: Agent['availability'] = 'online'): Agent => ({ id, name, role, productId, team, stages, enabled: true, availability, shiftStart: 10, shiftEnd: 22, days: [0, 1, 2, 3, 4, 5, 6], weight: 1, capacity: 12, lastAssignedAt: now - D });
    const agents = [agent('admin', 'محمد سعيد', 'admin', 'all', 'الإدارة', []), agent('manager', 'أحمد منصور', 'manager', 'all', 'إدارة الحسابات', []), agent('tl', 'سارة محمود', 'leader', 'uber-eg', 'Uber · القاهرة', []), agent('a1', 'منة عادل', 'agent', 'uber-eg', 'الاستقطاب', ['fresh']), agent('a2', 'نور أحمد', 'agent', 'uber-eg', 'الاستقطاب', ['fresh']), agent('a3', 'مريم حسن', 'agent', 'uber-eg', 'التسجيل والتفعيل', ['signup']), agent('a4', 'آية خالد', 'agent', 'uber-eg', 'التسجيل والتفعيل', ['signup'], 'offline'), agent('a5', 'إسراء محمد', 'agent', 'uber-eg', 'التشغيل والرحلات', ['approved', 'trips']), agent('i1', 'هدير علي', 'agent', 'indrive-eg', 'inDrive · القاهرة', ['fresh', 'signup', 'approved', 'trips']), agent('s1', 'نورة إبراهيم', 'agent', 'uber-sa', 'Uber · الرياض', ['fresh', 'signup', 'approved', 'trips'])];
    const names = ['أحمد صلاح', 'محمد حسن', 'محمود عادل', 'يوسف إبراهيم', 'خالد مصطفى', 'حسام فريد', 'إسلام جمال', 'عمر سعيد', 'طارق نبيل', 'سامح فتحي', 'مصطفى رضا', 'كريم فؤاد', 'علي محمود', 'أحمد نبيل', 'محمود سعيد', 'عبدالله حسن', 'محمد علي', 'ياسر خالد', 'عمرو إبراهيم', 'زياد أحمد', 'عمر محمد', 'عماد سعيد', 'حسن مصطفى', 'أحمد صلاح — رقم آخر'];
    const people = names.map((name, i) => ({ id: `P-${24817 - i}`, name, phones: [i === 16 ? '+966501234567' : `+2010${String(12345678 + i).padStart(8, '0')}`], city: i === 16 ? 'الرياض' : 'القاهرة', createdAt: now - (i % 4 === 0 ? 35 : 8) * D }));
    const ss: Stage[] = ['fresh', 'signup', 'fresh', 'fresh', 'trips', 'fresh', 'approved', 'signup', 'approved', 'fresh', 'trips', 'signup', 'fresh', 'fresh', 'signup', 'fresh', 'fresh', 'fresh', 'signup', 'fresh', 'fresh', 'fresh', 'signup', 'fresh'];
    const journeys: Journey[] = people.map((p, i) => { const stage = ss[i], owner = i === 16 ? 's1' : i === 11 ? 'i1' : [5, 9, 19].includes(i) ? null : stage === 'fresh' ? (i % 2 ? 'a2' : 'a1') : stage === 'signup' ? 'a3' : 'a5'; const created = now - ([4, 8].includes(i) ? 35 * D : i === 0 ? 40 * M : i === 2 ? 2 * H : i === 5 ? 8 * M : (i % 6 + 1) * D); return { id: `J-${1001 + i}`, personId: p.id, productId: i === 16 ? 'uber-sa' : i === 11 ? 'indrive-eg' : 'uber-eg', stage, status: statuses[stage][i % statuses[stage].length], state: i === 13 || i === 20 ? 'rejected' : 'open', ownerId: owner, createdAt: created, stageAt: stage === 'fresh' ? created : now - (i % 3 + 1) * D, assignedAt: created, dueAt: now + ([0, 2].includes(i) ? -25 : 15 + i * 4) * M, stageDueAt: now + (i % 5 === 0 ? -4 : 24) * H, firstAttemptAt: [0, 2, 5, 9, 19].includes(i) ? null : created + 10 * M, successfulAt: stage === 'fresh' ? null : created + 30 * M, rotations: i === 2 ? 1 : 0, attempt: 1, trips: stage === 'trips' ? (i === 4 ? 12 : 32) : 0, history: owner ? [...(stage !== 'fresh' ? [{ agentId: 'a1', stage: 'fresh' as Stage, start: created, end: created + H, reason: 'إنجاز التسجيل' }] : []), { agentId: owner, stage, start: created + (stage !== 'fresh' ? H : 0), reason: 'توزيع' }] : [], breachKeys: [], rejectedReason: i === 13 || i === 20 ? 'يرغب بالمتابعة لاحقًا' : undefined }; });
    journeys.push({ ...structuredClone(journeys[6]), id: 'J-2001', personId: people[0].id, productId: 'indrive-eg', stage: 'approved', status: 'منتظر أول رحلة', ownerId: 'i1', history: [{ agentId: 'i1', stage: 'approved', start: now - D, reason: 'تسجيل في الشركة' }] });
    const s: State = { schema: 2, revision: 0, now, products, agents, people, journeys, submissions: [], exposures: [], outcomes: [], offers: [], activities: [], messages: [], followups: [], approvals: [], documents: [], partnerRows: [], routing: [], sla: [], rotation: [], bonusPlans: [], snapshots: [], competitions: [], leaves: [], outbox: [], automations: [], processed: [] };
    for (const [i, j] of journeys.entries()) {
        s.submissions.push({ id: `SUB-${i}`, personId: j.personId, journeyId: j.id, externalId: `${i % 3 === 0 ? 'TT' : 'META'}-${870001 + i}`, source: i % 3 === 0 ? 'TikTok' : 'Meta', at: j.createdAt, answers: [{ question: 'هل لديك سيارة؟', answer: 'نعم' }, { question: 'موديل السيارة', answer: i % 2 ? 'نيسان صني 2022' : 'كيا سيراتو 2021' }, { question: 'المنطقة المفضلة', answer: 'القاهرة الجديدة' }] });
        s.activities.push({ id: `EV-${i}`, actorId: 'system', journeyId: j.id, personId: j.personId, productId: j.productId, at: j.createdAt, kind: 'lead_created', title: 'وصول تسجيل جديد', detail: 'تم حفظ بيانات النموذج وربطها بملف الشخص والشركة.' });
        if (j.ownerId)
            s.exposures.push({ id: `EX-${i}`, journeyId: j.id, personId: j.personId, agentId: j.ownerId, stage: j.stage, at: j.assignedAt, kind: j.rotations ? 'rotation' : 'fresh', excluded: false });
        if (j.stage !== 'fresh') {
            s.exposures.push({ id: `EX-old-${i}`, journeyId: j.id, personId: j.personId, agentId: j.productId === 'uber-eg' ? 'a1' : j.ownerId!, stage: 'fresh', at: j.createdAt, kind: 'fresh', excluded: false });
            s.outcomes.push({ id: `OUT-${i}`, journeyId: j.id, personId: j.personId, agentId: j.productId === 'uber-eg' ? 'a1' : j.ownerId!, from: 'fresh', to: 'signup', at: [4, 8].includes(i) ? now - 2 * D : j.createdAt + H, receivedAt: j.createdAt, evidence: 'مطابقة ملف الشركة · بيانات مثال', submissionId: `SUB-${i}`, valid: true });
        }
        if (i < 8)
            s.messages.push({ id: `MSG-${i}`, journeyId: j.id, at: j.createdAt + M, direction: 'in', text: i === 0 ? 'صباح الخير، كنت مقدم معاكم لأوبر. ممكن أعرف المطلوب؟' : 'أهلًا، محتاج أعرف الخطوة الجاية للتسجيل.', state: 'received', kind: 'human' });
        if (i < 6 && j.ownerId)
            s.followups.push({ id: `FU-${i}`, journeyId: j.id, agentId: j.ownerId, at: now + (i === 0 ? -30 : i * 35) * M, kind: i % 2 ? 'واتساب' : 'اتصال', note: i % 2 ? 'متابعة استكمال المستندات' : 'الاتصال بالكابتن', done: false, createdAt: now - D });
    }
    for (const p of products) {
        s.sla.push({ productId: p.id, dayStart: 10, dayEnd: 22, minutes: 15, nightMinutes: 30, nightMode: 'next_shift', followupMinutes: 60, stageHours: 48, acceptMinutes: 5, blockOverdue: true, version: 1 });
        for (const [n, stage] of stages.entries())
            s.routing.push({ id: `RULE-${p.id}-${stage}`, name: `توزيع ${labels[stage]} · ${p.company}`, productId: p.id, stage, source: 'all', strategy: 'round_robin', agentIds: agents.filter(a => a.productId === p.id && a.role === 'agent' && a.stages.includes(stage)).map(a => a.id), enabled: true, priority: n + 1, version: 1 });
        s.rotation.push({ id: `ROT-${p.id}`, name: 'إنقاذ الليد المتأخر', productId: p.id, stage: 'all', trigger: 'sla', afterMinutes: 60, max: 3, cooldownMinutes: 120, excludePrevious: true, allowRepeated: true, reasons: ['يرغب بالمتابعة لاحقًا'], enabled: true, priority: 1, version: 1 });
        s.bonusPlans.push({ id: `BON-${p.id}`, name: `بونص التسجيل · ${p.company}`, productId: p.id, stage: 'fresh', mode: 'mixed', payout: 'per_result', fixedAmount: 1000, tiers: [{ rate: 20, amount: 25 }, { rate: 30, amount: 30 }], role: 'agent', version: 1 });
    }
    s.bonusPlans.push({ id: 'BON-TRIPS', name: 'بونص هدف 10 رحلات · Uber', productId: 'uber-eg', stage: 'trips', mode: 'mixed', payout: 'per_result', fixedAmount: 1000, tiers: [{ rate: 20, amount: 25 }, { rate: 30, amount: 30 }], role: 'agent', tripTarget: 10, version: 1 });
    s.competitions.push({ id: 'COMP-1', name: 'تحدي التسجيل · سبتمبر', productId: 'uber-eg', stage: 'fresh', start: Date.parse('2026-09-01T00:00:00+03:00'), end: Date.parse('2026-10-01T00:00:00+03:00'), mode: 'count', prize: 1000, minimum: 1, enabled: true });
    s.partnerRows.push({ id: 'PR-1', productId: 'uber-eg', phone: people[0].phones[0], name: people[0].name, signup: true, approved: false, trips: 0, asOf: now - H, journeyId: 'J-1001', batchId: 'مثال سبتمبر' }, { id: 'PR-2', productId: 'uber-eg', phone: people[1].phones[0], name: people[1].name, signup: true, approved: true, trips: 0, asOf: now - H, journeyId: 'J-1002', batchId: 'مثال سبتمبر' });
    s.automations.push({ id: 'AUTO-1', name: 'متابعة بعد انتقال المرحلة', productId: 'uber-eg', trigger: 'stage_changed', action: 'followup', minutes: 60, enabled: true, version: 1 });
    return s;
}
