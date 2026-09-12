'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeProvider } from 'next-themes';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { SidebarProvider, Sidebar, SidebarContent, SidebarFooter, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { LayoutTemplate, ShieldAlert, LayoutDashboard, Inbox, Users, CalendarDays, Medal, Flag, MessageSquare, Waypoints, Building2, BarChart3, ShieldCheck, Settings2, Bell, Search, Plus, Moon, Sun, BookOpen, GitBranch, Database, RefreshCw, LogOut, FileClock, ArrowLeftRight, LoaderCircle } from 'lucide-react';
import { Context, type DialogSpec } from './context';
import { Button, Pick, Avatar } from './ui';
import { type State, type Agent, type Command, roles, uid } from '@/lib/masar/model';
import { Pages } from './pages';
import { registerMasarTools } from './webmcp';
import { Forms } from './forms';
type Persona = Pick<Agent, 'id' | 'name' | 'role' | 'productId'>;
const nav = [{ group: ['التشغيل', 'Operations'], items: [['dashboard', 'لوحة التحكم', 'Dashboard', LayoutDashboard], ['workspace', 'مساحة عملي', 'My workspace', Inbox], ['leads', 'العملاء المحتملون', 'Leads', Users], ['inbox', 'صندوق الوارد', 'Inbox', MessageSquare], ['wa-templates', 'قوالب واتساب', 'Templates', LayoutTemplate], ['wa-reviews', 'مراجعات واتساب', 'WhatsApp reviews', ShieldAlert], ['calendar', 'المتابعات والتقويم', 'Follow-ups', CalendarDays], ['approvals', 'الموافقات', 'Approvals', ShieldCheck]] }, { group: ['الأداء', 'Performance'], items: [['bonuses', 'البونص', 'Bonuses', Medal], ['competitions', 'المسابقات', 'Competitions', Flag], ['reports', 'التقارير', 'Reports', BarChart3]] }, { group: ['الإدارة', 'Administration'], items: [['distribution', 'التوزيع والقواعد', 'Routing & rules', GitBranch], ['partners', 'بيانات الشركاء', 'Partner data', Database], ['organization', 'الفريق والإجازات', 'Team & leave', Building2], ['settings', 'الإعدادات', 'Settings', Settings2], ['integrations', 'التكاملات', 'Integrations', ArrowLeftRight], ['audit', 'سجل النشاط', 'Audit trail', FileClock], ['guide', 'دليل التجربة', 'Demo guide', BookOpen]] }] as const;
function Navigation({ view, go, lang, a, s }: {
    view: string;
    go: (v: string) => void;
    lang: 'ar' | 'en';
    a: Agent;
    s: State;
}) { const { setOpenMobile } = useSidebar(); return <><div className="nav-brand"><div className="brand-mark"><svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true"><path d="M10 34 L18 20 L25 29 L32 15 L38 22" fill="none" stroke="#7DD0AE" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="38" cy="22" r="4.5" fill="#34B384"/></svg></div><div><strong>{lang === 'ar' ? 'مسار' : 'Masar'}</strong><small>{lang === 'ar' ? 'استقطاب وتشغيل الكباتن' : 'Captain acquisition'}</small></div></div><SidebarContent style={{ padding: '0 10px' }}>{nav.map(g => <div key={g.group[1]}><p className="nav-group-label">{g.group[lang === 'ar' ? 0 : 1]}</p>{g.items.filter(i => a.role !== 'agent' || !['distribution', 'partners', 'audit', 'settings', 'integrations', 'wa-reviews'].includes(i[0])).map(([id, ar, en, Icon]) => <button key={id} title={lang === 'ar' ? ar : en} className={`nav-button ${view.split('/')[0] === id ? 'active' : ''}`} onClick={() => { go(id); setOpenMobile(false); }}><Icon /><span>{lang === 'ar' ? ar : en}</span>{id === 'leads' && <span className="count">{s.journeys.filter(j => j.state === 'open').length}</span>}{id === 'wa-reviews' && s.waReviews.some(r => !r.resolvedAt) && <span className="count">{s.waReviews.filter(r => !r.resolvedAt).length}</span>}{id === 'inbox' && s.conversations.some(c => c.status === 'open' && c.lastInboundAt && c.lastInboundAt >= c.lastMessageAt) && <span className="count">{s.conversations.filter(c => c.status === 'open' && c.lastInboundAt && c.lastInboundAt >= c.lastMessageAt).length}</span>}{id === 'approvals' && s.approvals.some(a => a.state === 'pending') && <span className="count">{s.approvals.filter(a => a.state === 'pending').length}</span>}</button>)}</div>)}</SidebarContent><SidebarFooter className="p-0"><div className="nav-bottom"><Avatar name={a.name}/><div><strong style={{ fontSize: 14 }}>{a.name}</strong><p className="small">{roles[a.role]} · {a.team}</p></div></div></SidebarFooter></>; }
function Application() {
    const [s, setS] = useState<State | null>(null), [a, setA] = useState<Agent | null>(null), [personas, setPersonas] = useState<Persona[]>([]), [actorId, setActorId] = useState('admin'), [lang, setLang] = useState<'ar' | 'en'>('ar'), [dark, setDark] = useState(false), [scope, setScope] = useState('all'), [view, setView] = useState('dashboard'), [search, setSearch] = useState(''), [dialog, setDialog] = useState<DialogSpec | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const stateRef = useRef<State | null>(null), actorRef = useRef(actorId);
    actorRef.current = actorId;
    const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const refresh = useCallback(async () => { const id = actorRef.current; try {
        const r = await fetch(`/api/state?actor=${encodeURIComponent(id)}`, { cache: 'no-store' }), d = await r.json() as {
            state: State;
            actor: Agent;
            personas: Persona[];
            error?: string;
        };
        if (!r.ok)
            throw Error(d.error || 'تعذّر تحميل البيانات');
        if (id !== actorRef.current)
            return;
        stateRef.current = d.state;
        setS(d.state);
        setA(d.actor);
        setPersonas(d.personas);
        setError('');
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'تعذّر التحميل');
    } }, []);
    useEffect(() => { refresh(); }, [actorId, refresh]);
    useEffect(() => { const fn = () => { const v = location.hash.slice(2); setView(v || 'dashboard'); }; fn(); window.addEventListener('hashchange', fn); const theme = localStorage.getItem('masar-theme'); setDark(theme === 'dark'); const l = localStorage.getItem('masar-lang'); if (l === 'en')
        setLang('en'); return () => window.removeEventListener('hashchange', fn); }, []);
    useEffect(() => { document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = lang; document.documentElement.classList.toggle('dark', dark); localStorage.setItem('masar-theme', dark ? 'dark' : 'light'); localStorage.setItem('masar-lang', lang); }, [lang, dark]);
    const go = (v: string) => { location.hash = '/' + v; setView(v); };
    useEffect(() => registerMasarTools(() => stateRef.current, v => { location.hash = '/' + v; setView(v); }), []);
    const action = async (command: Command) => { if (!stateRef.current)
        throw Error('البيانات غير جاهزة'); setBusy(true); try {
        const r = await fetch(`/api/action?actor=${actorRef.current}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: stateRef.current.revision, requestId: uid('REQ'), command }) });
        const d = await r.json() as {
            state: State;
            error?: string;
        };
        if (!r.ok) {
            if (r.status === 409)
                await refresh();
            throw Error(d.error || 'تعذّر الحفظ');
        }
        stateRef.current = d.state;
        setS(d.state);
        const newA = d.state.agents.find((u: Agent) => u.id === actorRef.current);
        if (newA)
            setA(newA);
        if (command.type === 'agent_create')
            await refresh();
        toast.success(t('تم حفظ التغيير', 'Change saved'));
        return d.state as State;
    }
    catch (e) {
        toast.error(e instanceof Error ? e.message : 'تعذّر تنفيذ الإجراء');
        throw e;
    }
    finally {
        setBusy(false);
    } };
    const open = (type: string, data?: Record<string, unknown>) => setDialog({ type, data });
    if (!s || !a)
        return <div className="loading-screen"><div className="brand-mark"><Waypoints /></div><h1 style={{ fontSize: 25, fontWeight: 700 }}>مسار</h1>{error ? <><p>{error}</p><Button onClick={refresh}>حاول مرة أخرى</Button></> : <><LoaderCircle className="animate-spin mx-auto"/><p>جارٍ فتح مساحة العمل…</p></>}</div>;
    return <Context.Provider value={{ s, a, lang, t, scope, setScope, view, go, open, action, busy, search, setSearch, refresh, actorId }}><SidebarProvider style={{ '--sidebar-width': '244px', '--sidebar-width-icon': '64px' } as React.CSSProperties}><Sidebar side={lang === 'ar' ? 'right' : 'left'} collapsible="icon"><Navigation view={view} go={go} lang={lang} a={a} s={s}/></Sidebar><div className="main-content"><header className="topbar"><SidebarTrigger aria-label={t('فتح وإغلاق القائمة', 'Toggle navigation')}/><div className="global-search"><Search /><Input aria-label="البحث عن عميل" placeholder={t('ابحث عن عميل أو رقم…', 'Find a lead or phone…')} value={search} onChange={e => { setSearch(e.target.value); if (!view.startsWith('leads'))
        go('leads'); }}/></div><div className="top-actions"><div className="persona-select"><Pick label={t('دور التجربة', 'Demo persona')} value={actorId} onChange={v => { setActorId(v); setScope('all'); setDialog(null); go('dashboard'); }} options={personas.map(p => ({ value: p.id, label: `${p.name} · ${roles[p.role]}` }))}/></div><Button variant="ghost" size="icon" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} aria-label="تغيير اللغة">{lang === 'ar' ? 'EN' : 'ع'}</Button><Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="تغيير المظهر">{dark ? <Sun size={18}/> : <Moon size={18}/>}</Button><Button className="desktop-only" variant="ghost" size="icon" onClick={() => go('approvals')} aria-label="الإشعارات"><Bell size={18}/></Button><Button onClick={() => open('create_lead')}><Plus size={17}/><span className="new-label">{t('عميل جديد', 'New lead')}</span></Button></div></header><div className="demo-banner"><span>{t('مساحة تجربة مستقلة · القنوات الخارجية محاكاة', 'Independent demo · external channels are simulated')}</span><div className="actions"><button className="link-button" onClick={() => go('guide')}>{t('سيناريوهات التجربة', 'Demo scenarios')}</button><span className="mono small">{new Date(s.now).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>{['admin', 'manager'].includes(a.role) && <Button variant="ghost" size="sm" onClick={() => open('advance_time')}><ClockIcon />{t('ساعة التجربة', 'Demo clock')}</Button>}<Button size="icon" variant="ghost" onClick={refresh} aria-label="تحديث"><RefreshCw size={15}/></Button></div></div><main className="content">{error && <div className="notifier">{error}</div>}<Pages /></main></div></SidebarProvider><Forms spec={dialog} close={() => setDialog(null)}/><Toaster position="bottom-center" richColors dir={lang === 'ar' ? 'rtl' : 'ltr'} theme={dark ? 'dark' : 'light'}/></Context.Provider>;
}
function ClockIcon() { return <FileClock size={15}/>; }
export default function MasarApp() { return <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}><Application /></ThemeProvider>; }
