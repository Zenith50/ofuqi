# OC CV Maker

OC CV Maker is a bilingual CV workspace built with Next.js and Convex. The current product centers on the logged-in experience: a dashboard-style CV library, a two-pane editing workspace, real PDF/DOCX export, and first-class English/Arabic behavior across the interface and preview.

The original JSON-driven CLI generator still ships in the same repo for scripted document generation and sample-data testing.

## Current Product State

- Landing page, sign-in, dashboard, templates, readiness, settings, and `/chat/new` workspace are all live.
- The workspace now keeps interface language separate from draft language.
- PDF and DOCX export run through the web app via `/api/export`.
- UI fonts are self-hosted, so builds no longer depend on Google Fonts fetches.
- The deterministic editing flow remains in place while the bilingual project model and persistence work move into the next phase.

## Core Scripts

```bash
npm run dev          # Next.js + Convex dev together
npm run dev:web      # Next.js only
npm run dev:backend  # Convex backend only
npm run lint         # ESLint (Next 16-compatible)
npm run typecheck    # Next typegen + TypeScript check
npm run test:unit    # Vitest deterministic unit tests
npm run test:e2e     # Playwright smoke suite
npm run build        # Production build
npm run start        # Start the built app
```

`npm run test:e2e` builds and starts the app automatically before running the smoke suite.

## Running The Web App

1. Install dependencies:

```bash
npm install
```

2. Start the app and backend together:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000).

If you only need the frontend or backend, run `npm run dev:web` and `npm run dev:backend` separately.

Note: protected routes and auth flows require the Convex backend to be running.

## Verification Baseline

Phase 1 hardening added a real engineering baseline:

- `npm run lint`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run build`

The Playwright smoke coverage verifies the public landing flow and unauthenticated redirect behavior. The unit tests cover deterministic workspace/export logic.

## Web Routes

- `/` — landing page
- `/sign-in` — email/password auth
- `/dashboard` — CV library
- `/dashboard/templates` — template direction overview
- `/dashboard/performance` — readiness summary
- `/dashboard/settings` — interface/export context
- `/chat/new` — live editing workspace

## CLI Generator

The CLI remains available for direct JSON-to-document generation:

```bash
npm run cli
npm run cli:test:all
```

Sample scripts:

```bash
npm run cli:test:en
npm run cli:test:ar
npm run cli:test:ar:simple
npm run cli:test:ar:marketing
```

The CLI output is written to `output/`.

## Document Output

- PDF export uses the existing generator pipeline, including Arabic-capable rendering.
- DOCX export preserves editable structured output.
- Arabic preview/export quality continues to use Amiri for document presentation.

## Repo Shape

```text
app/                Next.js app routes
components/         Shared UI and providers
convex/             Auth and backend schema/functions
lib/                App/workspace/domain helpers
src/                Legacy CLI generator and templates
tests/              Unit tests and Playwright smoke coverage
fonts/              Self-hosted document font assets
output/             Generated files and Playwright artifacts
```

## Related Docs

- [EXECUTION_PLAN.md](./EXECUTION_PLAN.md) — active roadmap
- [handoff.md](./handoff.md) — implementation context
- [USAGE-GUIDE.md](./USAGE-GUIDE.md) — CLI-oriented usage notes
- [INTERVIEW-PROMPT.md](./INTERVIEW-PROMPT.md) — AI-assisted JSON collection prompt

## License

ISC
