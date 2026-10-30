# Ofuqi (أُفُقي) — Bilingual AI CV Builder (English + Arabic)

Ofuqi builds English and Arabic CVs through a chat interview. You describe your experience in plain language, an LLM turns it into structured CV data, and the CV preview updates as you talk. Finished CVs export to PDF and DOCX, with right-to-left layout for Arabic.

The repo has two parts:

- **Web app** (Next.js + Convex): chat-driven CV studio with accounts, saved projects, translation, and export.
- **CLI** (`src/`, plain Node.js): generates English or Arabic CVs as PDF and DOCX from an interactive prompt or a JSON file.

## Features

**Web app**
- **Chat interview → structured CV.** `/api/chat` sends the conversation to an LLM and patches the returned JSON into the CV, validated before it is saved.
- **LLM fallback chain.** `lib/llm/router.ts` tries several Groq-hosted models in order (Llama 3.3 70B, GPT-OSS 120B, Qwen 3 32B, Llama 3.1 8B) and falls through when one fails.
- **English ⇄ Arabic translation** of a finished CV (`/api/translate`), with a per-project translation cache.
- **PDF and DOCX export** (`/api/export`): PDF rendered server-side with Puppeteer + `@sparticuz/chromium-min` (serverless-friendly), DOCX built natively with the `docx` library.
- **RTL-aware UI and documents.** Arabic CVs use RTL layout, Arabic fonts (Tajawal / Amiri) and Unicode bidi isolation so emails, URLs and dates keep the right order inside Arabic text.
- **Accounts and saved projects.** Convex Auth (password provider) with a per-user `cvProjects` table, real-time sync, dashboard, templates and settings pages.

**CLI**
- Interactive prompts (`@inquirer/prompts`) or `--from-json <file>` input.
- English and Arabic HTML templates, rendered to PDF with Puppeteer and to DOCX with `docx`.
- Bidi helper (`src/template/bidi.js`) that detects Arabic text and wraps mixed-direction strings in isolation marks.
- Sample data in English and Arabic (`sample-data*.json`).

## Tech stack

| Area | Tools |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Framer Motion |
| Backend | Convex (database, real-time queries, functions), Convex Auth |
| AI | Groq OpenAI-compatible API, multi-model fallback, JSON patching |
| Documents | Puppeteer / `@sparticuz/chromium-min` (PDF), `docx` (Word) |
| Quality | Vitest (unit), Playwright (E2E smoke), ESLint 9 with zero warnings |
| Hosting | Vercel (with `@vercel/analytics`) |

## Getting started

### Prerequisites
- Node.js 20+
- A [Convex](https://convex.dev) account
- A [Groq](https://console.groq.com) API key

### Install
```bash
git clone https://github.com/Zenith50/ofuqi.git
cd ofuqi
npm install
```

### Configure
Create `.env.local`:
```env
NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
```
Then set these in your Convex deployment (`npx convex dashboard` → Settings → Environment Variables):

- `GROQ_API_KEY`: used by the LLM router
- `SITE_URL`: e.g. `http://localhost:3000`
- `JWT_PRIVATE_KEY`, `JWKS`: generate with `npx @convex-dev/auth`

### Run
```bash
npm run dev        # Next.js on :3000 + Convex dev
npm run test:unit  # Vitest
npm run test:e2e   # Playwright
npm run lint
```

### CLI only
```bash
npm run cli                                   # interactive
node src/index.js --from-json sample-data-ar.json --format pdf
node src/index.js -j sample-data.json -f both # PDF + DOCX into ./output
```

## Project structure
```text
app/          Next.js routes: auth, chat, dashboard, compare, API (chat, translate, export)
components/   CV document components, providers, UI primitives
lib/          CV domain logic (validation, export, templates), LLM router, i18n content
convex/       Schema, auth, projects and users functions
src/          Standalone Node.js CLI (prompts, templates, PDF/DOCX generators)
tests/        Vitest unit tests and Playwright E2E smoke test
```

## Deploying to Vercel
Build command: `npx convex codegen && next typegen && next build` (Convex types must be generated before the Next.js build). Set `NEXT_PUBLIC_CONVEX_URL` in Vercel and the AI and auth variables in Convex.

## License
[MIT](LICENSE) © 2026 Yousif Natiq
