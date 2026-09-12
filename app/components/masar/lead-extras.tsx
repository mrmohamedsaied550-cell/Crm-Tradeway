'use client';
/**
 * Lead-detail sections ported from production (apps/web/app/admin/leads/[id]):
 * NextActionCard, SlaCard with the threshold ladder, AttributionCard (Meta snapshot),
 * AttemptsHistoryCard, RotationHistoryCard, PendingTransitionRequestCard, LostReasonCard.
 */
import React from 'react';
import { Phone, MessageCircle, Users2, Calendar, Gauge, ArrowRightLeft, Megaphone, History, ShieldCheck, XCircle, Medal } from 'lucide-react';
import { Button, Panel, Pill, DateText } from './ui';
import { useMasar } from './context';
import { labels, type Journey, D, H, M } from '@/lib/masar/model';
import { canManage, overdue } from '@/lib/masar/engine';

/** production slaThreshold: ok <0.75 · t75 · t100 · t150 · t200 (elapsed ÷ budget, never walks back) */
export function slaThreshold(s: { now: number }, j: Journey) {
  if (j.state !== 'open') return { rung: 'paused', ratio: 0 };
  const start = j.assignedAt, end = j.firstAttemptAt ? j.stageDueAt : j.dueAt;
  const budget = Math.max(end - start, M), ratio = (s.now - start) / budget;
  const rung = ratio >= 2 ? 't200' : ratio >= 1.5 ? 't150' : ratio >= 1 ? 't100' : ratio >= 0.75 ? 't75' : 'ok';
  return { rung, ratio };
}
const RUNGS = ['ok', 't75', 't100', 't150', 't200'];
const RUNG_ACTION: Record<string, string> = { ok: 'داخل الميزانية', t75: 'تنبيه الموظفة', t100: 'تنبيه + وسم + إشعار القائدة', t150: 'تدوير أو مراجعة', t200: 'مراجعة مشرف' };

export function LeadExtras({ j }: { j: Journey }) {
  const { s, a, t, open, action, busy, go } = useMasar();
  const fus = s.followups.filter(f => f.journeyId === j.id && !f.done).sort((x, y) => x.at - y.at);
  const next = fus[0];
  const tone = next ? (next.at < s.now ? 'overdue' : next.at - s.now < D ? 'soon' : 'later') : 'none';
  const Icon = next ? ({ 'اتصال': Phone, 'واتساب': MessageCircle, 'زيارة': Users2 } as Record<string, typeof Phone>)[next.kind] || Calendar : Calendar;
  const { rung, ratio } = slaThreshold(s, j);
  const sub = s.submissions.filter(x => x.journeyId === j.id).sort((x, y) => y.at - x.at)[0];
  const siblings = s.journeys.filter(k => k.personId === j.personId && k.productId === j.productId && k.id !== j.id);
  const rotations = j.history.filter(h => h.reason === 'rotation' || h.reason === 'handoff');
  const requests = s.approvals.filter(ap => ap.journeyId === j.id && (ap.type === 'stage' || ap.type === 'return')).sort((x, y) => y.at - x.at);
  const editable = a.role !== 'agent' || j.ownerId === a.id;
  return <>
    {/* next action */}
    <Panel title={t('المتابعة القادمة', 'Next follow-up')} action={next && <Pill color={tone === 'overdue' ? 'red' : tone === 'soon' ? 'gold' : ''}>{tone === 'overdue' ? `متأخر ${Math.ceil((s.now - next.at) / H)} س` : tone === 'soon' ? `خلال ${Math.max(1, Math.ceil((next.at - s.now) / H))} س` : 'لاحقًا'}</Pill>}>{next ? <div className="person-cell"><span className="avatar" style={{ background: tone === 'overdue' ? 'var(--critical-bg)' : 'var(--brand-100)', color: tone === 'overdue' ? 'var(--critical-fg)' : 'var(--brand-ink)' }}><Icon size={16} /></span><div><strong>{next.kind} · {next.note}</strong><small style={{ fontFamily: 'inherit' }}><DateText at={next.at} time /> · {s.agents.find(u => u.id === next.agentId)?.name}</small></div></div> : <p className="small muted">{t('لا توجد متابعة مجدولة.', 'Nothing scheduled.')}</p>}{editable && j.state === 'open' && <div className="actions mt">{next && <Button size="sm" disabled={busy} onClick={() => action({ type: 'complete_followup', id: next.id }).catch(() => { })}>{t('تمت', 'Complete')}</Button>}<Button size="sm" variant="outline" onClick={() => open('followup', { id: j.id })}>{t('جدولة متابعة', 'Schedule')}</Button><Button size="sm" variant="outline" onClick={() => open('attempt', { id: j.id })}><Phone size={14} />{t('اتصال', 'Call')}</Button></div>}</Panel>
    {/* SLA ladder */}
    <Panel title="SLA" action={<Pill color={rung === 'ok' ? 'green' : rung === 't75' ? 'gold' : rung === 'paused' ? '' : 'red'}><Gauge size={13} />{rung}{j.state === 'open' && ` · ${Math.round(ratio * 100)}%`}</Pill>}><div className="actions" style={{ gap: 3 }}>{RUNGS.map((r, i) => <span key={r} title={`${r} · ${RUNG_ACTION[r]}`} style={{ flex: 1, height: 6, borderRadius: 3, background: rung !== 'paused' && RUNGS.indexOf(rung) >= i ? (i >= 2 ? 'var(--critical)' : i === 1 ? 'var(--warn)' : 'var(--good)') : 'var(--surface-3)' }} />)}</div><dl className="info-list mt"><div className="info-row"><dt>{t('الحالة', 'Status')}</dt><dd>{j.state !== 'open' ? 'paused' : overdue(s, j) ? 'breached' : 'active'}</dd></div><div className="info-row"><dt>{j.firstAttemptAt ? t('موعد المرحلة', 'Stage due') : t('موعد أول محاولة', 'First-attempt due')}</dt><dd><DateText at={j.firstAttemptAt ? j.stageDueAt : j.dueAt} time /></dd></div><div className="info-row"><dt>{t('الإجراء عند هذه الدرجة', 'Rung action')}</dt><dd>{RUNG_ACTION[rung] || '—'}</dd></div>{j.lastRotatedAt && <div className="info-row"><dt>{t('آخر تدوير', 'Last rotation')}</dt><dd><DateText at={j.lastRotatedAt} time /></dd></div>}</dl><p className="small muted mt">{t('السلم نسبة من الميزانية ولا يرجع للخلف؛ أي إجراء بشري يعيد الساعة إلى ok.', 'Ladder is a ratio of the budget; only human actions reset it.')}</p></Panel>
    {/* attribution */}
    {sub && <Panel title={t('الإسناد الإعلاني', 'Attribution')} action={<Megaphone size={16} className="muted" />}><dl className="info-list"><div className="info-row"><dt>{t('المصدر', 'Source')}</dt><dd>{sub.source} <span className="mono muted">{sub.externalId}</span></dd></div>{sub.campaign?.campaignName && <div className="info-row"><dt>{t('الحملة', 'Campaign')}</dt><dd>{sub.campaign.campaignName}</dd></div>}{sub.campaign?.adsetName && <div className="info-row"><dt>Ad set</dt><dd>{sub.campaign.adsetName}</dd></div>}{sub.campaign?.adName && <div className="info-row"><dt>Ad</dt><dd>{sub.campaign.adName}</dd></div>}{sub.campaign?.formName && <div className="info-row"><dt>{t('النموذج', 'Form')}</dt><dd>{sub.campaign.formName}</dd></div>}<div className="info-row"><dt>{t('آخر إعلان قبل النتيجة', 'Last ad before outcome')}</dt><dd><DateText at={sub.at} time /></dd></div></dl></Panel>}
    {/* attempts chain */}
    {(j.attempt > 1 || siblings.length > 0) && <Panel title={t('دورات المتابعة', 'Attempts')} action={<Pill color="gold"><History size={13} />{t(`المحاولة ${j.attempt}`, `Attempt ${j.attempt}`)}</Pill>}><p className="small muted">{t('نفس الشخص في نفس السوق أكثر من مرة. كل دورة لها إسناد ونتائج مستقلة.', 'Same person, same market, more than once.')}</p>{siblings.map(k => <div className="followup" key={k.id}><History size={16} className="muted" /><div><button className="view-link" onClick={() => go(`leads/${k.id}`)}>{k.id}</button><p className="small muted">{labels[k.stage]} · {k.state === 'rejected' ? `مرفوض · ${k.rejectedReason || ''}` : k.state} · <DateText at={k.createdAt} /></p></div></div>)}</Panel>}
    {/* rotation history */}
    {rotations.length > 0 && <Panel title={t('سجل التدوير والتسليم', 'Rotation history')} action={<Pill>{rotations.length}</Pill>}>{a.role === 'agent' && !canManage(a, j.productId) ? <p className="small muted" style={{ fontStyle: 'italic' }}>{t(`${rotations.length} تدوير/تسليم · أسماء المالكين السابقين مخفية لدورك.`, 'Previous owners are redacted for your role.')}</p> : rotations.map((h, i) => <div className="followup" key={i}><ArrowRightLeft size={16} className="muted" /><div><strong className="small">{h.reason === 'rotation' ? t('تدوير', 'Rotation') : t('تسليم', 'Handoff')} → {s.agents.find(u => u.id === h.agentId)?.name}</strong><p className="small muted">{labels[h.stage]} · <DateText at={h.start} time />{h.end && <> — <DateText at={h.end} time /></>}</p></div></div>)}</Panel>}
    {/* transition requests */}
    {requests.length > 0 && <Panel title={t('طلبات الانتقال', 'Transition requests')} action={requests.some(r => r.state === 'pending') ? <Pill color="gold">{t('قيد الانتظار', 'Pending')}</Pill> : undefined}>{requests.slice(0, 4).map(r => <div className="followup" key={r.id}><ShieldCheck size={16} className="muted" /><div><strong className="small">{r.type === 'stage' ? t('انتقال إلى', 'Move to') : t('رجوع إلى', 'Return to')} {r.target ? labels[r.target] : ''}</strong><p className="small muted">{s.agents.find(u => u.id === r.requestedBy)?.name} · <DateText at={r.at} time />{r.decisionReason && <> · {t('القرار:', 'Decision:')} {r.decisionReason}</>}</p></div><span className="when"><Pill color={r.state === 'approved' ? 'green' : r.state === 'rejected' ? 'red' : 'gold'}>{r.state}</Pill></span></div>)}{requests.some(r => r.state === 'rejected') && editable && j.state === 'open' && <Button size="sm" variant="outline" className="mt" onClick={() => open('transition', { id: j.id })}>{t('أعد الطلب', 'Request again')}</Button>}</Panel>}
    {/* lost reason */}
    {j.state === 'rejected' && <Panel title={t('سبب الرفض', 'Lost reason')} action={<XCircle size={16} style={{ color: 'var(--critical-fg)' }} />}><p><strong>{j.rejectedReason || '—'}</strong></p><p className="small muted mt">{t('المرحلة والحالة محفوظتان عند الرفض · إعادة التشغيل بعد فترة التهدئة أو باستثناء إداري.', 'Stage kept on loss.')}</p></Panel>}
    {/* trips milestone */}
    {j.stage === 'trips' && <Panel title={t('هدف الرحلات', 'Trip milestone')} action={<Medal size={16} className="muted" />}>{(() => { const target = s.bonusPlans.find(p => p.productId === j.productId && p.stage === 'trips')?.tripTarget || 10; const pct = Math.min(100, Math.round(j.trips / target * 100)); return <><div className="row-between small"><span>{j.trips} / {target} {t('رحلة', 'trips')}</span><b>{pct}%</b></div><div className="progress-track mt" style={{ marginTop: 8 }}><div className="progress-fill" style={{ width: pct + '%', background: pct >= 100 ? 'var(--good)' : pct >= 50 ? 'var(--brand-500)' : 'var(--warn)' }} /></div><p className="small muted mt">{t('عدد الرحلات من ملف الشريك يغذّي التقدم فقط ولا يغيّر المرحلة.', 'Partner trip counts feed progress only.')}</p></>; })()}</Panel>}
  </>;
}
