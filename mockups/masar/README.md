# Masar — Trade Way CRM (Prototype)

Interactive HTML prototype for the rebranded CRM. Open `index.html` in a browser (no build step) or `masar-standalone.html` (single file, everything inlined).

**v3 (current)** — content rebuilt on the real Masar business from the `Masar_Interactive_Prototype_v2` package (Reference-specifications v2.0, 2026-09-07): Trade Way / Captain Masr recruits and activates drivers ("captains") for ride-hailing partners (Uber, inDrive, Careem, Yango) across markets (company × country).

Screens (hash routes): `#login` · `#dashboard` · `#workspace` · `#leads` (table + board) · `#person` · `#inbox` · `#followups` · `#approvals` · `#bonus` · `#competitions` · `#reports` · `#distribution` · `#partners` · `#team` · `#settings` · `#integrations` · `#audit`

Interactions that work: sidebar collapse, dark/light toggle (persists), ⌘K / Ctrl+K command palette, table/board toggle, kanban drag-and-drop (dropping into a gated stage raises an approval request instead of moving), chart hover tooltips, new-lead drawer with duplicate detection, notifications popover, filter chips, tabs, toasts on every action.

## Reference analysis → what Masar took from each

| Reference | Borrowed | Masar version |
|---|---|---|
| **Apex (shadcn / Next.js)** | Hairline 1px cards with no shadow, 12–16px radius, compact 64px header with breadcrumb + ⌘K search + theme toggle, collapsible icon-rail sidebar, dense data tables with checkbox/sort/pagination, status badges | The whole surface language: `.card`, `.header`, `.tbl`, `.pill`, `.app.rail` |
| **TailAdmin CRM** | 272px white sidebar with uppercase section labels, KPI tiles with an icon box + big number + delta pill, "Monthly Target" card, stacked bar "by source", donut with side legend, recent-orders table under the charts | Dashboard grid: `.kpis`, `.gauge-card`, source bars, program donut, «آخر الليدز» |
| **Quantum (Bootstrap)** | Brand gradient on one hero widget, glassy quote card, podium / gamified leaderboard, animated pulse dot | Monthly-target gauge card, login side panel, «لوحة الأبطال» podium, sync pulse |

Everything else (data model, copy, flows, roles, approvals, Google Sheets sync, bulk upload) is Trade Way business, not template content.

## Design tokens

- **Brand**: `#0B3D2E` (950) → `#12664A` (700) → `#1B9A6C` (500, charts) → `#34B384` (400). Primary button `#167F5B`.
- **Neutrals** are green-biased greys: bg `#F4F7F5`, border `#E2E8E4`, text `#12201A`, muted `#75847C`. Dark: bg `#0D1412`, surface `#141C19`.
- **Semantic** (reserved, never used for chart series): good `#16A34A`, warn `#D97706`, critical `#DC2626`, info `#2563EB`.
- **Categorical chart palette** (validated colour-blind safe, fixed order): `#1B9A6C`, `#4F63D2`, `#B8730A`, `#8E44AD` (dark: `#28A874`, `#7A8CE8`, `#BE8226`, `#A06BC8`).
- **Type**: IBM Plex Sans Arabic (UI + display), IBM Plex Mono (IDs, phone numbers, keyboard hints). Tabular numerals everywhere.
- **Shape**: radius 8 / 12 / 16, pills 999. Shadows only on popovers and dragged cards.

## Business model encoded in the prototype (from the v2 specs)

- **One person file, one journey per company × product**: the same phone is one Person (P-xxxxx); Uber and inDrive journeys are independent, each with its own stage, owner and SLA.
- **Four stages**: جديد (Fresh) → التسجيل (Signup) → جاهز للعمل (Approved / Ready to drive) → الرحلات (Trips, D5/D10). Statuses per stage are configurable; «مرفوض» is the display name of a lost outcome with a mandatory reason and a cool-off before reactivation.
- **Roles**: موظفة (sales / registration / operations), قائدة فريق, Account Manager, مدير النظام. Permission matrix in `#settings`; forbidden field writes are silently stripped and audited by field name.
- **Distribution**: ordered rules per market and stage (Round Robin, Least Loaded, Weighted, specific person, Queue Claim), an 8-step eligibility filter with a recorded reason, assignment offers with expiry and accept/reject, «اطلب ليد» through the same engine, starvation goes to a watched queue.
- **SLA and escalation**: per-stage budget on the market calendar (60 min for Fresh), ladder ok → t75 → t100 → t150 → t200, rotation that keeps the previous owner's credit, no double rotation within 24 h (supervisor review instead).
- **Approvals**: transitions into gated stages (partner evidence or a tagged manual override), lost with reason, supervisor reviews, WhatsApp reviews; a rejection creates a 24 h corrective task.
- **WhatsApp inbox**: one number per company, conversation follows the journey owner, 24 h reply window, approved templates outside it, correlation ids, 24-month retention.
- **Partner Data Hub**: partner sheets/CSV as append-only snapshots, reconciliation categories, controlled field-by-field merge (approved_at, DFT) with evidence, derived D5/D10 commission risk. Partner data never moves a stage or creates a captain.
- **Bonus**: mixed ratio N ÷ D, highest earned tier applied to all P results, month snapshot → Account Manager review → approved → paid with reference; adjustments are explicit, the original is never rewritten.
- **Competitions**: time-boxed, per stage and team, credit follows the stage owner at outcome time, ties need a management decision.
- **Team & leaves**: shifts, availability, approved leave with a coverage plan, capacity, night/weekend coverage policy.

## Files

```
mockups/masar/
├── index.html              # prototype (16 screens + login, hash router)
├── masar-standalone.html   # same, single file for sharing
├── README.md
└── assets/
    ├── masar.css           # design tokens + components (light/dark)
    ├── masar.js            # router, charts (hand-drawn SVG), kanban DnD, palette
    └── logo.svg
```
