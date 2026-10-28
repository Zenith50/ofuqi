# AGENTS.md — OC_CV_Maker

AI-powered bilingual CV generator (English + Arabic) built with Next.js 16, React 19, Convex, and TypeScript 5.9.

## Build / Lint / Test Commands

```bash
# Development
npm run dev              # Full-stack dev (Convex backend + Next.js frontend concurrently)
npm run dev:web          # Next.js dev server only
npm run dev:backend      # Convex backend only

# Build & start
npm run build            # next typegen && next build
npm run start            # next start (serves production build)

# Lint (zero-warnings policy)
npm run lint             # eslint . --max-warnings=0
npm run lint:fix         # eslint . --fix

# Type checking
npm run typecheck        # next typegen && tsc --noEmit

# Tests — all
npm test                 # Runs unit + e2e sequentially

# Unit tests (Vitest)
npm run test:unit        # vitest run (all unit tests)
npx vitest run tests/unit/workspace.test.ts          # Single file
npx vitest run -t "test name pattern"                # Single test by name

# E2E tests (Playwright)
npm run test:e2e                                     # All e2e tests
npx playwright test tests/e2e/smoke.spec.ts          # Single spec file
npx playwright test -g "test title"                  # Single test by title

# Legacy CLI
npm run cli              # node src/index.js
npm run cli:test:en      # English sample data
npm run cli:test:ar      # Arabic sample data
```

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Backend:** Convex (serverless DB, realtime, auth via `@convex-dev/auth`)
- **Language:** TypeScript 5.9 (strict mode)
- **Styling:** Vanilla CSS with custom properties (no Tailwind, no CSS modules)
- **Document generation:** `pdf-lib` + `puppeteer` (PDF), `docx` (DOCX)
- **Animation:** Framer Motion + CSS keyframes
- **Fonts:** Manrope Variable (English UI), Tajawal (Arabic UI), Amiri (Arabic documents)

## Project Structure

```
app/                    # Next.js App Router (pages, layouts, API routes)
  (auth)/               # Auth route group (sign-in)
  api/                  # API routes: chat/, export/, translate/
  dashboard/            # Dashboard pages (library, templates, performance, settings)
  chat/new/             # Workspace/chat page
components/             # Shared React components
  cv/                   # CV-specific (CvPreview, CvCardPreview)
  providers/            # Context providers (locale, Convex client)
  ui/                   # Generic UI components
lib/                    # Domain logic and utilities (no JSX)
  app/                  # App-wide (content/i18n, locale types)
  cv/                   # CV domain (export, templates, workspace, projects)
  hooks/                # Custom React hooks
  llm/                  # LLM routing
convex/                 # Convex backend (schema, queries, mutations, auth)
tests/unit/             # Vitest unit tests (*.test.ts)
tests/e2e/              # Playwright E2E tests (*.spec.ts)
src/                    # Legacy CLI generator (CommonJS, excluded from TS)
```

## Code Style

### Imports

Order imports as follows, separated by blank lines:
1. Framework/library imports (`react`, `next`, `convex`, third-party)
2. Internal alias imports (`@/components/...`, `@/lib/...`)
3. Relative imports and CSS

Use `import type` for type-only imports:
```ts
import type { Metadata } from "next";
```

### Naming Conventions

| Element          | Convention        | Example                          |
|------------------|-------------------|----------------------------------|
| Components       | PascalCase `.tsx`  | `CvPreview.tsx`                 |
| Pages            | `page.tsx`         | `app/dashboard/page.tsx`        |
| Layouts          | `layout.tsx`       | `app/dashboard/layout.tsx`      |
| API routes       | `route.ts`         | `app/api/export/route.ts`       |
| Library modules  | camelCase `.ts`    | `workspace.ts`, `export.ts`     |
| Hooks            | `use*.ts`          | `useCharacterLimit.ts`          |
| Unit tests       | `*.test.ts`        | `workspace.test.ts`             |
| E2E tests        | `*.spec.ts`        | `smoke.spec.ts`                 |
| Types            | PascalCase         | `AppLocale`, `CvData`, `ExportJob` |
| Constants        | UPPER_SNAKE_CASE   | `APP_LOCALE_COOKIE_NAME`        |
| CSS classes      | kebab-case (BEM)   | `preview-paper--rtl`            |
| Convex functions | camelCase          | `listUserProjects`, `createProject` |

### Types

- Use `type` aliases exclusively — no `interface` usage in this codebase.
- Inline prop types for simple components:
  ```ts
  function MyComp({ children, locale }: { children: ReactNode; locale: AppLocale }) {}
  ```
- Use `Readonly<>` wrapper for layout children props.

### Exports

- **Components & pages:** `export default function ComponentName`
- **Library functions, types, constants:** Named exports (`export function`, `export type`, `export const`)
- **Convex functions:** Named exports (`export const myQuery = query(...)`)

### Error Handling

- Convex mutations: throw `new Error("Not authenticated")` / `new Error("Project not found")` for auth/ownership checks.
- Convex queries: early return `null` or `[]` when unauthenticated — do not throw.
- Client-side: use defensive optional chaining (`project?.userId`, `data.experience[0]?.role`).
- No try/catch wrappers in business logic; let errors propagate.

### Component Patterns

- Add `"use client"` directive at the top of client components.
- React 19 conventions — no explicit `use` import for `ReactNode`.
- Use `@/*` path aliases (maps to project root) for all non-relative imports.

### Styling

- All CSS lives in `app/globals.css` (~4100 lines) using custom properties for theming.
- RTL support via `html[dir="rtl"]` selectors and CSS logical properties (`padding-inline-start`, `border-inline-end`, `inset-inline-start`).
- Dark theme is the default.

### Bilingual Support

- Locale type: `"en" | "ar"` defined as `AppLocale`.
- All user-facing strings are managed in `lib/app/content.ts`.
- Arabic detection uses pattern matching arrays (e.g., `ENGLISH_TRANSLATION_PATTERNS`).
- Deep clone via `JSON.parse(JSON.stringify(...))` for immutable data transforms.

## Configuration Notes

- **Path alias:** `@/*` → project root (configured in `tsconfig.json` and `vitest.config.ts`)
- **ESLint 9:** Flat config in `eslint.config.mjs`. Ignores: `.convex/**`, `convex/_generated/**`, `output/**`
- **TypeScript strict mode** is enabled — all code must type-check cleanly.
- **Zero-warnings lint policy** — `--max-warnings=0`.
- **Puppeteer** is listed as a `serverExternalPackage` in `next.config.ts` for Arabic PDF rendering.
- **Convex `_generated/`** is auto-generated — never edit files in `convex/_generated/` or `.convex/`.
- The legacy `src/` directory uses CommonJS (`.js`) and is excluded from TypeScript compilation.

## Testing Guidelines

- Unit tests use Vitest (`describe`/`it`/`expect` from `vitest`), placed in `tests/unit/`.
- E2E tests use Playwright (`test`/`expect` from `@playwright/test`), placed in `tests/e2e/`.
- Playwright runs against a built app (`npm run build && npm start`) on `http://127.0.0.1:3000`.
- Screenshots on failure, traces retained on failure, no video recording.

## Cursor Cloud specific instructions

- Node.js 22 on the default image satisfies the Node 20+ requirement. Install with `npm ci` from `package-lock.json`.
- Cloud agents have no Convex login. Start a local anonymous backend with `CONVEX_AGENT_MODE=anonymous` and `npx convex dev --typecheck disable </dev/null`. Redirecting stdin keeps the CLI from refreshing agent skills and rewriting `.claude/skills` and `skills-lock.json`. The dev command writes `NEXT_PUBLIC_CONVEX_URL` (port 3210) and `NEXT_PUBLIC_CONVEX_SITE_URL` (port 3211) into `.env.local`.
- Sign-in needs these Convex deployment variables: `SITE_URL=http://127.0.0.1:3000`, `JWT_PRIVATE_KEY`, `JWKS`, and `AUTH_SECRET`. Generate an extractable RS256 key pair with the `jose` package and a random `AUTH_SECRET`, then set each value with `npx convex env set -- NAME value`. The `--` is required for `JWT_PRIVATE_KEY` because the PEM header starts with dashes and the CLI otherwise treats it as a flag. Pass `JWKS` as raw JSON on the command line. A dotenv `--from-file` value stores escaped quotes, and auth discovery then fails with `AuthProviderDiscoveryFailed` for port 3211. Skip generation when `npx convex env get JWT_PRIVATE_KEY` already returns a key.
- `GROQ_API_KEY` is optional. The chat route tries Groq, then keyless Pollinations. Signup, the library, and creating a CV from a template work without it.
- The environment start script brings up Convex and `next dev` on port 3000. `npm run dev` is the same pair when you need to restart them by hand.
- `npm run typecheck` and `npm run test:unit` are the green checks. `npm run lint` currently reports existing errors in the repo.
- Playwright's `webServer.command` is a Windows `cmd /c` script and `use.channel` is `chrome`. On Linux, Google Chrome is already installed; start the app yourself before running Playwright so `reuseExistingServer` can attach. `npm run cli:test:en` writes a PDF and DOCX under `output/`. PDF generation logs a missing `fonts/fonts/Amiri-Regular.ttf` path and still writes the file.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
