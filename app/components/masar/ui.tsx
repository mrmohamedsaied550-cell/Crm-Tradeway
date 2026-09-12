'use client';
import React from 'react';
import { Check, Inbox, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Empty as EmptyRoot, EmptyHeader, EmptyMedia, EmptyDescription } from '@/components/ui/empty';
import { type Journey, type Stage, stages, labels, english } from '@/lib/masar/model';
import { person, product, overdue, canEdit, clockParts } from '@/lib/masar/engine';
import { useMasar } from './context';
export { Button };
export function Pick({ value, options, onChange, label, disabled = false }: {
    value: string;
    options: {
        value: string;
        label: string;
    }[];
    onChange: (v: string) => void;
    label?: string;
    disabled?: boolean;
}) { const { lang } = useMasar(); return <Select value={value || undefined} onValueChange={onChange} dir={lang === 'ar' ? 'rtl' : 'ltr'} disabled={disabled}><SelectTrigger aria-label={label || 'اختيار'}><SelectValue placeholder={label || 'اختيار'}/></SelectTrigger><SelectContent position="popper">{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>; }
export function Avatar({ name, large = false }: {
    name: string;
    large?: boolean;
}) { return <span className={`avatar ${large ? 'large' : ''}`}>{name.split(' ').slice(0, 2).map(x => x[0]).join('')}</span>; }
export function Pill({ children, color = '' }: {
    children: React.ReactNode;
    color?: string;
}) { return <span className={`pill ${color}`}>{children}</span>; }
export function Panel({ title, action, children, body = true, className = '' }: {
    title?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    body?: boolean;
    className?: string;
}) { return <section className={`panel ${className}`}>{title && <div className="panel-head"><h2>{title}</h2>{action}</div>}<div className={body ? 'panel-body' : ''}>{children}</div></section>; }
export function Empty({ text = 'لا توجد بيانات في هذا العرض' }: {
    text?: string;
}) { return <EmptyRoot className="empty"><EmptyHeader><EmptyMedia><Inbox size={25}/></EmptyMedia><EmptyDescription>{text}</EmptyDescription></EmptyHeader></EmptyRoot>; }
export function StageMini({ stage }: {
    stage: Stage;
}) { const { t } = useMasar(); return <span className="stage-mini" style={{ '--stage': `var(--${stage})` } as React.CSSProperties}><span className="dots">{stages.map(st => <i className={stage === st ? 'on' : ''} key={st}/>)}</span>{t(labels[stage], english[stage])}</span>; }
export function DateText({ at, time = false }: {
    at: number;
    time?: boolean;
}) { const { lang, s, scope } = useMasar(); const tz = s.products.find(p => p.id === scope)?.timezone || 'Africa/Cairo'; return <span className="small muted" dir="auto">{new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', { timeZone: tz, day: 'numeric', month: 'short', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(at)}</span>; }
export function SLA({ j }: {
    j: Journey;
}) { const { s, t } = useMasar(); if (j.state !== 'open')
    return <Pill>{t('متوقف — الرحلة مغلقة', 'Closed journey')}</Pill>; if (overdue(s, j))
    return <Pill color="red">{t('متأخر', 'Overdue')}</Pill>; if (!j.firstAttemptAt)
    return <Pill color="gold">{Math.max(0, Math.ceil((j.dueAt - s.now) / 60000))} {t('دقيقة', 'min')}</Pill>; return <Pill color="green">{t('في الموعد', 'On track')}</Pill>; }
export function Head({ title, subtitle, actions }: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}) { return <div className="page-head"><div>{subtitle && <p className="eyebrow">{subtitle}</p>}<h1>{title}</h1></div>{actions && <div className="actions">{actions}</div>}</div>; }
export function PersonLink({ j }: {
    j: Journey;
}) { const { s, go } = useMasar(); const p = person(s, j); return <button className="person-cell" onClick={() => go(`leads/${j.id}`)}><Avatar name={p.name}/><span><strong>{p.name}</strong><small className="mono">{p.id}</small></span></button>; }
export function LeadTable({ rows, compact = false, selected = [], onSelect }: {
    rows: Journey[];
    compact?: boolean;
    selected?: string[];
    onSelect?: (ids: string[]) => void;
}) { const { s, a, t, go } = useMasar(); return rows.length ? <Table className="data-table"><TableHeader><TableRow>{onSelect && <TableHead><Checkbox aria-label="تحديد الكل" checked={rows.length > 0 && rows.every(j => selected.includes(j.id))} onCheckedChange={v => onSelect(v ? rows.map(j => j.id) : [])}/></TableHead>}<TableHead>{t('العميل', 'Lead')}</TableHead><TableHead className="optional">{t('الهاتف', 'Phone')}</TableHead><TableHead>{t('المرحلة', 'Stage')}</TableHead><TableHead className="optional">{t('الشركة', 'Company')}</TableHead><TableHead>SLA</TableHead>{!compact && <TableHead className="optional">{t('المسؤول', 'Owner')}</TableHead>}</TableRow></TableHeader><TableBody>{rows.map(j => <TableRow key={j.id} className={`clickable ${overdue(s, j) ? 'overdue' : ''}`}>{onSelect && <TableCell><Checkbox aria-label={`تحديد ${person(s, j).name}`} checked={selected.includes(j.id)} onCheckedChange={v => onSelect(v ? [...selected, j.id] : selected.filter(id => id !== j.id))}/></TableCell>}<TableCell><PersonLink j={j}/></TableCell><TableCell className="mono optional" onClick={() => go(`leads/${j.id}`)}>{person(s, j).phones[0]}</TableCell><TableCell onClick={() => go(`leads/${j.id}`)}><StageMini stage={j.stage}/>{j.state === 'rejected' && <div><Pill color="red">{t('مرفوض', 'Rejected')}</Pill></div>}{a.role === 'agent' && !canEdit(a, j) && <div><Pill>{t('عرض فقط', 'Read only')}</Pill></div>}</TableCell><TableCell className="optional">{product(s, j.productId).company}</TableCell><TableCell><SLA j={j}/></TableCell>{!compact && <TableCell className="optional">{s.agents.find(a => a.id === j.ownerId)?.name || <Pill>{t('غير مسند', 'Unassigned')}</Pill>}</TableCell>}</TableRow>)}</TableBody></Table> : <Empty />; }
export function Flow({ rows, active }: {
    rows: Journey[];
    active?: Stage;
}) { const { t } = useMasar(); return <div className="journey-track">{stages.map((st, i) => <div key={st} className={`journey-node ${active && i > stages.indexOf(active) ? 'future' : ''}`} style={{ '--stage': `var(--${st})` } as React.CSSProperties}><strong>{active ? (i + 1) : rows.filter(j => j.stage === st).length}</strong><i className="dot"/><span>{t(labels[st], english[st])}</span></div>)}</div>; }
export function Followups({ limit = 20 }: {
    limit?: number;
}) { const { s, t, go, action, busy } = useMasar(); const list = s.followups.filter(f => !f.done).sort((a, b) => a.at - b.at).slice(0, limit); return list.length ? <div>{list.map(f => { const j = s.journeys.find(j => j.id === f.journeyId); return j && <div className="followup" key={f.id}><Clock3 size={17} className="muted"/><div><button onClick={() => go(`leads/${j.id}`)} className="view-link">{person(s, j).name}</button><p className="small muted">{f.kind} · {f.note}</p></div><div className="when"><DateText at={f.at} time/>{f.at < s.now && <Pill color="red">{t('متأخر', 'Overdue')}</Pill>}</div><Button variant="ghost" size="icon" aria-label="إكمال المتابعة" disabled={busy} onClick={() => action({ type: 'complete_followup', id: f.id }).catch(() => { })}><Check size={17}/></Button></div>; })}</div> : <Empty text={t('كل المتابعات مكتملة', 'All follow-ups are complete')}/>; }
export function exportCSV(name: string, rows: Record<string, unknown>[]) { if (!rows.length)
    return; const keys = Object.keys(rows[0]); const quote = (v: unknown) => '"' + String(v ?? '').replace(/^[=+\-@]/, "'$&").replaceAll('"', '""') + '"'; download(name, '\ufeff' + [keys.map(quote).join(','), ...rows.map(r => keys.map(k => quote(r[k])).join(','))].join('\r\n'), 'text/csv;charset=utf-8'); }
export function download(name: string, text: string, type = 'application/json') { const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function monthNow(s: {
    now: number;
}) { return clockParts(s.now, 'Africa/Cairo').month; }
