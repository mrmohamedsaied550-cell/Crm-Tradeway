/**
 * WhatsApp domain — ported from the production CRM (apps/api/src/whatsapp):
 * accounts (isActive + connection test), templates (body-only, positional {{n}},
 * one CRM status: approved | paused | rejected), one open conversation per
 * (account × phone), the 24h customer-service window, message lifecycle
 * (queued → sent → delivered → read | failed; inbound = received), inbound routing
 * with the review queue (captain_active | duplicate_lead | unmatched_after_routing)
 * and its resolutions, manual assign / handover (full | summary | clean), close/reopen.
 */
import { uid, type State, type Agent, type Journey, type Command, type Stage, stages } from './model';

export const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000;
export const TEMPLATE_CATEGORIES = ['marketing', 'utility', 'authentication'] as const;
export const TEMPLATE_STATUSES = ['approved', 'paused', 'rejected'] as const;
export const MESSAGE_STATUSES = ['queued', 'sent', 'delivered', 'read', 'failed', 'received'] as const;
export const REVIEW_REASONS = ['captain_active', 'duplicate_lead', 'unmatched_after_routing'] as const;
export const REVIEW_RESOLUTIONS = ['linked_to_lead', 'linked_to_captain', 'new_lead', 'new_attempt', 'dismissed'] as const;
export const ASSIGNMENT_SOURCES = ['inbound_route', 'manual_handover', 'outbound_self', 'migrated', 'lead_propagation'] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];
export type TemplateStatus = typeof TEMPLATE_STATUSES[number];
export type MessageStatus = typeof MESSAGE_STATUSES[number];
export type ReviewReason = typeof REVIEW_REASONS[number];
export type ReviewResolution = typeof REVIEW_RESOLUTIONS[number];
export type AssignmentSource = typeof ASSIGNMENT_SOURCES[number];

export type WhatsAppAccount = { id: string; productId: string; displayName: string; phoneNumber: string; phoneNumberId: string; provider: 'meta_cloud'; isActive: boolean; hasAppSecret: boolean; lastTest?: { ok: boolean; message: string; at: number; verifiedName?: string }; createdAt: number };
export type WhatsAppTemplate = { id: string; accountId: string; name: string; language: string; category: TemplateCategory; bodyText: string; variableCount: number; status: TemplateStatus; createdAt: number; updatedAt: number };
export type Conversation = { id: string; accountId: string; phone: string; personId: string | null; journeyId: string | null; status: 'open' | 'closed'; lastMessageAt: number; lastMessageText: string; lastInboundAt: number | null; assignedToId: string | null; assignmentSource: AssignmentSource | null; assignedAt: number | null; createdAt: number; handoverMode?: 'full' | 'summary' | 'clean' };
export type WhatsAppReview = { id: string; conversationId: string; personId: string | null; reason: ReviewReason; candidateJourneyIds: string[]; candidateCaptainJourneyId?: string; contextSnapshot: { text: string; createdAt: number }[]; createdAt: number; resolvedAt?: number; resolvedById?: string; resolution?: ReviewResolution };

/* ---------- pure helpers (mirrors apps/web/lib/whatsapp.ts) ---------- */
export function windowState(c: { lastInboundAt: number | null } | undefined, now: number): 'open' | 'closing_soon' | 'closed' {
  if (!c || !c.lastInboundAt) return 'closed';
  const elapsed = now - c.lastInboundAt;
  if (elapsed >= WHATSAPP_WINDOW_MS) return 'closed';
  if (elapsed >= WHATSAPP_WINDOW_MS - 2 * 3600_000) return 'closing_soon';
  return 'open';
}
export function windowRemainingMs(c: { lastInboundAt: number | null } | undefined, now: number) { return c?.lastInboundAt ? c.lastInboundAt + WHATSAPP_WINDOW_MS - now : -1; }
export function formatRemaining(ms: number) { if (ms <= 0) return '0m'; const h = Math.floor(ms / 3600_000), m = Math.floor((ms % 3600_000) / 60_000); return h ? `${h}h ${m}m` : `${m}m`; }
/** production: variableCount = the MAX placeholder index, not the distinct count */
export function countTemplateVariables(body: string) { let max = 0; for (const m of body.matchAll(/\{\{\s*(\d+)\s*\}\}/gu)) max = Math.max(max, Number(m[1])); return max; }
export function renderTemplateBody(body: string, vars: string[]) { return body.replace(/\{\{\s*(\d+)\s*\}\}/gu, (_, n) => vars[Number(n) - 1] ?? ''); }
export const accountFor = (s: State, productId: string) => s.waAccounts.find(a => a.productId === productId);
export const conversationFor = (s: State, j: Journey) => s.conversations.find(c => c.journeyId === j.id && c.status === 'open') || s.conversations.filter(c => c.journeyId === j.id).sort((a, b) => b.lastMessageAt - a.lastMessageAt)[0];
export const isCaptain = (s: State, personId: string, productId?: string) => s.journeys.some(k => k.personId === personId && k.state === 'open' && (!productId || k.productId === productId) && stages.indexOf(k.stage) >= stages.indexOf(s.products.find(p => p.id === k.productId)!.captainStage));

const required = (v: unknown, name = 'القيمة') => { if (typeof v !== 'string' || !v.trim()) throw Error(`${name} مطلوب`); return v.trim(); };
const find = <T extends { id: string }>(arr: T[], id: unknown) => { const x = arr.find(x => x.id === id); if (!x) throw Error('السجل غير متاح'); return x; };
function log(s: State, a: string, kind: string, title: string, detail: string, j?: Journey) { s.activities.unshift({ id: uid('EV'), actorId: a, at: s.now, kind, title, detail, revision: s.revision + 1, journeyId: j?.id, personId: j?.personId, productId: j?.productId }); }

/** one open conversation per (account × phone) — partial unique index in production */
export function ensureConversation(s: State, j: Journey): Conversation {
  const p = s.products.find(p => p.id === j.productId)!, acc = accountFor(s, p.id), phone = s.people.find(x => x.id === j.personId)!.phones[0];
  if (!acc) throw Error('لا يوجد حساب واتساب لهذا البرودكت');
  let c = s.conversations.find(c => c.accountId === acc.id && c.phone === phone && c.status === 'open');
  if (!c) { c = { id: uid('CONV'), accountId: acc.id, phone, personId: j.personId, journeyId: j.id, status: 'open', lastMessageAt: s.now, lastMessageText: '', lastInboundAt: null, assignedToId: null, assignmentSource: null, assignedAt: null, createdAt: s.now }; s.conversations.push(c); }
  if (!c.journeyId) { c.journeyId = j.id; c.personId = j.personId; }
  return c;
}
function touch(c: Conversation, s: State, text: string) { c.lastMessageAt = s.now; c.lastMessageText = text; }
/** production: assertWindowOpen — never filters by status, so a closed thread's timestamp still counts */
export function assertWindowOpen(s: State, c: Conversation) {
  if (!c.lastInboundAt) throw Error('لا يمكن إرسال رسالة حرة قبل أن يرد العميل. استخدم قالبًا معتمدًا.');
  const age = s.now - c.lastInboundAt;
  if (age > WHATSAPP_WINDOW_MS) throw Error(`نافذة خدمة العملاء (24 ساعة) انتهت منذ ${Math.round(age / 3600_000)} ساعة. أرسل قالبًا معتمدًا لإعادة فتح المحادثة.`);
}
function loadAccountForSend(s: State, c: Conversation) { const acc = find(s.waAccounts, c.accountId); if (!acc.isActive) throw Error('حساب واتساب غير متاح (موقوف)'); return acc; }
/** production: maybeAutoClaimOnOutbound — only when nobody owns the thread; never steals */
function autoClaim(c: Conversation, s: State, a: Agent) { if (c.assignmentSource === null) { c.assignedToId = a.id; c.assignmentSource = 'outbound_self'; c.assignedAt = s.now; } }

export function waSendText(s: State, a: Agent, j: Journey, text: string) {
  const c = ensureConversation(s, j); loadAccountForSend(s, c); assertWindowOpen(s, c);
  s.messages.push({ id: uid('MSG'), journeyId: j.id, conversationId: c.id, at: s.now, direction: 'out', text, actorId: a.id, state: 'sent', kind: 'human', messageType: 'text', providerMessageId: uid('wamid') });
  touch(c, s, text); autoClaim(c, s, a);
  log(s, a.id, 'whatsapp_attempt', 'محاولة تواصل عبر واتساب', 'رسالة حرة داخل نافذة 24 ساعة · حالة الإرسال: sent.', j);
  return c;
}
export function waSendTemplate(s: State, a: Agent, j: Journey, templateId: unknown, variables: unknown) {
  const c = ensureConversation(s, j); const acc = loadAccountForSend(s, c);
  const tpl = s.waTemplates.find(t => t.id === templateId && t.accountId === acc.id && t.status === 'approved');
  if (!tpl) throw Error('القالب المعتمد غير موجود لهذا الحساب (whatsapp.template_not_found)');
  const vars = Array.isArray(variables) ? variables.map(v => String(v ?? '').trim()) : [];
  if (vars.length !== tpl.variableCount) throw Error(`القالب يتوقع ${tpl.variableCount} متغير، وصل ${vars.length} (whatsapp.template_variable_mismatch)`);
  if (vars.some(v => !v)) throw Error('كل متغيرات القالب مطلوبة');
  const text = renderTemplateBody(tpl.bodyText, vars);
  s.messages.push({ id: uid('MSG'), journeyId: j.id, conversationId: c.id, at: s.now, direction: 'out', text, actorId: a.id, state: 'sent', kind: 'human', messageType: 'template', templateName: tpl.name, templateLanguage: tpl.language, variables: vars, providerMessageId: uid('wamid') });
  touch(c, s, text); autoClaim(c, s, a);
  log(s, a.id, 'whatsapp_attempt', `قالب واتساب · ${tpl.name}`, `${tpl.category} · ${tpl.language} · مسموح خارج نافذة 24 ساعة.`, j);
  return c;
}
export function waReceive(s: State, j: Journey, text: string) {
  const c = ensureConversation(s, j);
  s.messages.push({ id: uid('MSG'), journeyId: j.id, conversationId: c.id, at: s.now, direction: 'in', text, state: 'received', kind: 'human', messageType: 'text', providerMessageId: uid('wamid') });
  c.lastInboundAt = s.now; touch(c, s, text);
  if (j.ownerId && c.assignmentSource === null) { c.assignedToId = j.ownerId; c.assignmentSource = 'lead_propagation'; c.assignedAt = s.now; }
  return c;
}
/** production orchestrateAfterPersist: captain → review; ≥2 open → review; 1 → link; 0 → route (starvation → review) */
export function waInboundReview(s: State, j: Journey, c: Conversation, text: string) {
  const snapshot = s.messages.filter(m => m.conversationId === c.id && m.direction === 'in').slice(-2).map(m => ({ text: m.text, createdAt: m.at }));
  const queue = (reason: ReviewReason, extra: Partial<WhatsAppReview> = {}) => {
    const existing = s.waReviews.find(r => r.conversationId === c.id);
    if (existing) { if (!existing.resolvedAt) Object.assign(existing, { candidateJourneyIds: extra.candidateJourneyIds || existing.candidateJourneyIds, contextSnapshot: snapshot }); return; }
    s.waReviews.push({ id: uid('RV'), conversationId: c.id, personId: j.personId, reason, candidateJourneyIds: [], contextSnapshot: snapshot, createdAt: s.now, ...extra });
    log(s, 'system', 'whatsapp_review', 'مراجعة واتساب مطلوبة', ({ captain_active: 'الرقم يخص كابتن نشط', duplicate_lead: 'أكثر من رحلة مفتوحة لنفس الرقم', unmatched_after_routing: 'لم تُوجد موظفة مؤهلة عند التوجيه' })[reason], j);
  };
  const open = s.journeys.filter(k => k.personId === j.personId && k.state === 'open' && k.productId === j.productId);
  if (isCaptain(s, j.personId, j.productId)) { queue('captain_active', { candidateCaptainJourneyId: open.find(k => stages.indexOf(k.stage) >= 2)?.id }); return; }
  if (open.length >= 2) { queue('duplicate_lead', { candidateJourneyIds: open.map(k => k.id) }); return; }
  if (!j.ownerId && !s.offers.some(o => o.journeyId === j.id && o.state === 'pending')) queue('unmatched_after_routing', { candidateJourneyIds: [j.id] });
  void text;
}

/** commands prefixed wa_* — called from engine.execute */
export function waExecute(s: State, a: Agent, c: Command, h: { manager: (p: string) => void; admin: () => void; edit: () => Journey; getJ: () => Journey }): boolean {
  switch (c.type) {
    case 'wa_template_save': {
      const acc = find(s.waAccounts, c.accountId); h.manager(acc.productId);
      const bodyText = required(c.bodyText, 'نص القالب'); if (bodyText.length > 2048) throw Error('نص القالب حتى 2048 حرفًا');
      const category = String(c.category) as TemplateCategory; if (!TEMPLATE_CATEGORIES.includes(category)) throw Error('فئة القالب غير صحيحة');
      const status = String(c.status || 'approved') as TemplateStatus; if (!TEMPLATE_STATUSES.includes(status)) throw Error('حالة القالب غير صحيحة');
      const existing = c.id ? find(s.waTemplates, c.id) : null;
      if (existing) { /* name / language / account are immutable in production */
        Object.assign(existing, { bodyText, category, status, variableCount: countTemplateVariables(bodyText), updatedAt: s.now });
        log(s, a.id, 'whatsapp_template', 'تحديث قالب واتساب', `${existing.name} · ${existing.language} · ${status}`);
      } else {
        const name = required(c.name, 'اسم القالب').toLowerCase(); if (!/^[a-z][a-z0-9_]*$/u.test(name) || name.length > 100) throw Error('اسم القالب يجب أن يكون snake_case بحروف صغيرة');
        const language = required(c.language, 'اللغة'); if (!/^[a-z]{2,3}(?:_[A-Z]{2})?$/u.test(language)) throw Error('اللغة يجب أن تكون كود BCP-47 مثل ar أو en_US');
        if (s.waTemplates.some(t => t.accountId === acc.id && t.name === name && t.language === language)) throw Error(`يوجد قالب بالاسم "${name}" (${language}) لهذا الحساب بالفعل`);
        s.waTemplates.push({ id: uid('TPL'), accountId: acc.id, name, language, category, bodyText, variableCount: countTemplateVariables(bodyText), status, createdAt: s.now, updatedAt: s.now });
        log(s, a.id, 'whatsapp_template', 'تسجيل قالب واتساب', `${name} · ${language} · ${countTemplateVariables(bodyText)} متغير · الاعتماد يتم في Meta WABA ويُسجَّل هنا`);
      }
      return true;
    }
    case 'wa_template_delete': { const t = find(s.waTemplates, c.id); h.manager(find(s.waAccounts, t.accountId).productId); s.waTemplates = s.waTemplates.filter(x => x.id !== t.id); log(s, a.id, 'whatsapp_template', 'حذف قالب واتساب', `${t.name} · ${t.language}`); return true; }
    case 'wa_send_template': { const j = h.edit(); if (j.state !== 'open' || !j.ownerId) throw Error('يلزم ليد مفتوح ومستلم'); waSendTemplate(s, a, j, c.templateId, c.variables); if (!j.firstAttemptAt) j.firstAttemptAt = s.now; return true; }
    case 'wa_message_status': { /* demo device for provider status webhooks (production ingests none yet) */
      const m = find(s.messages, c.id); const j = s.journeys.find(x => x.id === m.journeyId);
      if (m.direction !== 'out') throw Error('حالة التسليم للرسائل الصادرة فقط');
      const next = String(c.status) as MessageStatus; const order = ['queued', 'sent', 'delivered', 'read'];
      if (!['delivered', 'read', 'failed'].includes(next)) throw Error('الحالة غير مسموحة');
      if (next !== 'failed' && order.indexOf(next) <= order.indexOf(m.state)) throw Error('الحالة لا ترجع للخلف');
      m.state = next; log(s, 'system', 'whatsapp_status', `حالة الرسالة: ${next}`, `providerMessageId ${m.providerMessageId} · محاكاة webhook`, j); return true;
    }
    case 'wa_review_resolve': {
      const r = find(s.waReviews, c.id); const conv = find(s.conversations, r.conversationId); const acc = find(s.waAccounts, conv.accountId); h.manager(acc.productId);
      if (r.resolvedAt) throw Error('تمت مراجعة هذا العنصر بالفعل (whatsapp.review.already_resolved)');
      const res = String(c.resolution) as ReviewResolution; if (!REVIEW_RESOLUTIONS.includes(res)) throw Error('قرار غير صحيح');
      if (res === 'linked_to_captain' && r.reason !== 'captain_active') throw Error('ربط بكابتن متاح فقط لسبب captain_active (whatsapp.review.invalid_resolution)');
      if (res === 'linked_to_lead') { const j = find(s.journeys, c.journeyId ?? ''); if (!r.candidateJourneyIds.includes(j.id) && j.personId !== r.personId) throw Error('اختر رحلة من المرشحين (whatsapp.review.lead_required)'); conv.journeyId = j.id; conv.personId = j.personId; if (j.ownerId) { conv.assignedToId = j.ownerId; conv.assignmentSource = 'inbound_route'; conv.assignedAt = s.now; } }
      if (res === 'new_lead' || res === 'new_attempt') { const j = conv.journeyId ? find(s.journeys, conv.journeyId) : null; if (j && !j.ownerId) { j.ownerId = a.id; j.assignedAt = s.now; j.history.push({ agentId: a.id, stage: j.stage, start: s.now, reason: 'fresh' }); } conv.assignedToId = a.id; conv.assignmentSource = 'inbound_route'; conv.assignedAt = s.now; }
      Object.assign(r, { resolvedAt: s.now, resolvedById: a.id, resolution: res });
      log(s, a.id, 'whatsapp_review', 'حسم مراجعة واتساب', `${r.reason} → ${res}`, conv.journeyId ? s.journeys.find(x => x.id === conv.journeyId) : undefined);
      return true;
    }
    case 'wa_conversation': {
      const conv = find(s.conversations, c.id); const acc = find(s.waAccounts, conv.accountId); const j = conv.journeyId ? s.journeys.find(x => x.id === conv.journeyId) : undefined;
      const op = String(c.op);
      if (op === 'close') { conv.status = 'closed'; log(s, a.id, 'whatsapp_conversation', 'إغلاق المحادثة', 'أرشفة ناعمة؛ الرسالة الواردة التالية تفتح محادثة جديدة. الملكية لم تتغير.', j); return true; }
      if (op === 'reopen') { if (s.conversations.some(x => x.id !== conv.id && x.accountId === conv.accountId && x.phone === conv.phone && x.status === 'open')) throw Error('توجد محادثة مفتوحة أخرى لنفس الرقم. أغلقها أولًا (whatsapp.conversation.reopen_conflict)'); conv.status = 'open'; log(s, a.id, 'whatsapp_conversation', 'إعادة فتح المحادثة', '', j); return true; }
      if (op === 'assign' || op === 'handover') {
        h.manager(acc.productId); const target = find(s.agents, c.agentId); if (!target.enabled) throw Error('الموظفة غير نشطة (whatsapp.assignee_not_found)'); if (target.productId !== acc.productId && target.role === 'agent') throw Error('الموظفة خارج نطاق الحساب (whatsapp.assign.target_lacks_capability)');
        const mode = op === 'handover' ? (String(c.mode || 'full') as 'full' | 'summary' | 'clean') : undefined;
        if (mode === 'summary' && !required(c.summary, 'ملخص التسليم')) throw Error('ملخص التسليم مطلوب');
        if (op === 'handover' && !j) throw Error('المحادثة غير مرتبطة برحلة (whatsapp.conversation_not_linked)');
        conv.assignedToId = target.id; conv.assignmentSource = 'manual_handover'; conv.assignedAt = s.now; conv.handoverMode = mode;
        if (mode === 'clean') conv.status = 'closed';
        if (j && op === 'handover') { for (const hh of j.history.filter(x => !x.end)) { hh.end = s.now; hh.endRevision = s.revision + 1; } j.ownerId = target.id; j.assignedAt = s.now; j.history.push({ agentId: target.id, stage: j.stage, start: s.now, reason: 'handoff' }); if (mode === 'summary') log(s, a.id, 'note', 'ملخص تسليم واتساب', String(c.summary), j); }
        log(s, a.id, 'whatsapp_conversation', op === 'handover' ? `تسليم المحادثة (${mode})` : 'إسناد المحادثة', `إلى ${target.name} · assignmentSource: manual_handover`, j);
        return true;
      }
      throw Error('عملية غير معروفة');
    }
    case 'wa_account': {
      const acc = find(s.waAccounts, c.id); h.manager(acc.productId); const op = String(c.op);
      if (op === 'test') { acc.lastTest = { ok: acc.isActive, at: s.now, message: acc.isActive ? 'Connection healthy' : 'Meta rejected the request (HTTP 401)', verifiedName: acc.isActive ? `Trade Way · ${s.products.find(p => p.id === acc.productId)?.company}` : undefined }; log(s, a.id, 'whatsapp_account', 'اختبار اتصال واتساب', `${acc.displayName} · ${acc.lastTest.message}`); return true; }
      if (op === 'enable') { if (!acc.hasAppSecret) throw Error('لا يمكن التفعيل بدون App Secret (whatsapp.app_secret_required_in_production)'); acc.isActive = true; }
      else if (op === 'disable') acc.isActive = false; else throw Error('عملية غير معروفة');
      log(s, a.id, 'whatsapp_account', acc.isActive ? 'تفعيل حساب واتساب' : 'إيقاف حساب واتساب', `${acc.displayName} · ${acc.phoneNumber}`); return true;
    }
  }
  return false;
}
