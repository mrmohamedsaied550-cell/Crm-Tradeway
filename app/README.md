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
pnpm test         # 19 acceptance scenarios against the engine
pnpm typecheck
```

Two runtime modes, same UI code:

| Mode | Entry | Storage | Use |
|---|---|---|---|
| Server | `portable/server.ts` | `portable/masar-data/workspace.json` + files on disk | Team demo on one machine |
| Browser | `portable/browser-store.ts` (fetch shim → `serve()`) | `localStorage` per viewer | Shareable single file, Claude artifact |

The browser mode turns on automatically for `file://`, for the Claude artifact host,
or when built with `VITE_MASAR_MODE=browser` (the `build:single` config does this).

## Where things live

```
app/
├── components/masar/   app shell, pages, admin screens, forms, shared ui
├── components/ui/      shadcn primitives actually used (19 of the original 61)
├── lib/masar/          model.ts (state + commands) · engine.ts (rules) · service.ts (HTTP contract)
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
