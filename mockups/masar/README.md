# Masar — Trade Way CRM (Prototype)

Interactive HTML prototype for the rebranded CRM. Open `index.html` in a browser (no build step) or `masar-standalone.html` (single file, everything inlined).

Screens (hash routes): `#login` · `#dashboard` · `#leads` · `#contact` · `#funnel` · `#approvals` · `#bulk` · `#sheets` · `#leaderboard` · `#settings`

Interactions that work: sidebar collapse, dark/light toggle (persists), ⌘K / Ctrl+K command palette, kanban drag-and-drop (dropping into «أكتف» raises an approval request), chart hover tooltips, new-lead drawer, notifications popover, filter chips, segmented controls, toasts on every action.

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

## Business model encoded in the prototype

- **Roles**: Sales Agent, Senior Agent, Team Leader, Account Manager, QA — see permission matrix in `#settings`.
- **Pipeline**: جديد → تم التواصل → مهتم → متابعة → مسجّل (Enrolled) → أكتف (Active). Moving to Active requires Team Leader approval.
- **Approvals queue**: discounts above the agent's limit (10% / 15% / 30%), stage moves to Active, refunds within the 7-day window, lead reassignment.
- **Lead sources**: Meta Lead Ads, TikTok forms, Google Ads, referrals, Google Sheets (media team), bulk CSV/XLSX.
- **Programs**: Funded Challenge, Forex Fundamentals, Crypto Pro, Gold Masterclass — a contact can hold several enrollments.
- **Leaderboard**: ranked by approved activations, with revenue and conversion; monthly team target with per-day pace.

## Files

```
mockups/masar/
├── index.html              # prototype (all screens, hash router)
├── masar-standalone.html   # same, single file for sharing
├── README.md
└── assets/
    ├── masar.css           # design tokens + components (light/dark)
    ├── masar.js            # router, charts (hand-drawn SVG), kanban DnD, palette
    └── logo.svg
```
