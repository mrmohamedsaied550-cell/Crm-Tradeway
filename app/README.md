# Masar — the live app (React + engine)

This is the interactive Masar CRM: the real business engine from the v2 delivery
(`lib/masar/engine.ts`, `model.ts`, `service.ts`) with the Masar design system
(`portable/globals.css`). Every action goes through the same command pipeline the
production server would use: scope and permission checks, optimistic revisions,
request idempotency, audit rows.

## Run it

```sh
cd app
pnpm install
pnpm dev          # Vite dev server on :5173, API proxied to the local Node server
pnpm build        # portable-release/ (public/ + start.mjs) — the same package as v2
pnpm start        # node portable-release/start.mjs → http://localhost:4173
pnpm build:single # dist-single/index.html — one file, engine runs in the browser
pnpm test         # 24 acceptance scenarios against the engine (5 cover WhatsApp)
pnpm typecheck
```

Two runtime modes, same UI code:

| Mode | Entry | Storage | Use |
|---|---|---|---|
| Server | `portable/server.ts` | `portable/masar-data/workspace.json` + files on disk | Team demo on one machine |
| Browser | `portable/browser-store.ts` (fetch shim → `serve()`) | `localStorage` per viewer | Shareable single file, Claude artifact |

The browser mode turns on automatically for `file://`, for the Claude artifact host,
or when built with `VITE_MASAR_MODE=browser` (the `build:single` config does this).

## WhatsApp module (ported from production `apps/api/src/whatsapp`)

`lib/masar/whatsapp.ts` carries the production semantics verbatim: one open
conversation per (account × phone); the 24h customer-service window computed from
`lastInboundAt` (freeform text blocked before the first reply and after expiry,
templates always allowed); templates are body-only with positional `{{n}}`
variables, `variableCount = max index`, one CRM status (`approved | paused |
rejected`), immutable name/language/account; outbound message lifecycle
`queued → sent → delivered → read | failed`, inbound `received`; assignment
sources `inbound_route | manual_handover | outbound_self | migrated |
lead_propagation`; the review queue (`captain_active | duplicate_lead |
unmatched_after_routing`) with resolutions (`linked_to_lead | linked_to_captain |
new_lead | new_attempt | dismissed`) and their validation rules; handover modes
`full | summary | clean` with "stricter rule wins" message hiding; accounts with
`isActive`, app-secret guard and an unpersisted connection test.

Screens in `components/masar/whatsapp.tsx`: inbox (triage KPIs, queues, window pip,
thread with status ticks, composer that switches to the **template picker** when
the window is closed — the piece production still stubs), templates admin, review
queue, accounts panel (in Integrations), and the WhatsApp card on the lead page.
`components/masar/lead-extras.tsx` adds the production lead-detail cards: next
follow-up, SLA threshold ladder (`ok → t75 → t100 → t150 → t200`), Meta
attribution, attempts chain, rotation history, transition requests, lost reason,
trip milestone.

## Where things live

```
app/
├── components/masar/   app shell, pages, admin screens, forms, shared ui
├── components/ui/      shadcn primitives actually used (19 of the original 61)
├── lib/masar/          model.ts (state + commands) · engine.ts (rules) · whatsapp.ts (WhatsApp domain) · service.ts (HTTP contract)
├── portable/           globals.css (design system) · entry.tsx · server.ts · browser-store.ts · vite configs
├── tests/              flows.ts acceptance scenarios (node tests/run.mjs)
└── public/             favicon
```

## Design system

Tokens live at the top of `portable/globals.css` and are mapped onto the shadcn
variable names (`--primary`, `--sidebar`, …) so the primitives restyle themselves.
Semantic classes used by the pages (`.panel`, `.stat`, `.pill`, `.journey-node`,
`.kanban-*`, `.chat-*`, `.rule`, …) are styled below the tokens. Light and dark
(`.dark` on `<html>`) are both defined; stage colours are `--fresh`, `--signup`,
`--approved`, `--trips`.

## Rules to keep when extending

- Do not put business rules in components. Add a command to `model.ts`, implement
  it in `engine.ts` (`execute`), and cover it in `tests/flows.ts`.
- A new screen reads state through `useMasar()` and mutates only via `action()`.
- The persona switcher is a demo device. Production derives the actor from the
  session, as noted in the v2 handoff.
- Never merge partner data into CRM truth outside the controlled-merge command.
