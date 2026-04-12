# Ofuqi (أُفُقي) – AI-Powered Bilingual CV Generator

Ofuqi is a cutting-edge, bilingual (English + Arabic) CV/Resume builder powered by AI. It functions as an interactive career consultant that interviews users, gathers their professional history, and patches it into a beautifully formatted, ATS-friendly document in real time. 

Built on a modern stack featuring Next.js, Convex, and AI edge computing, the platform allows for seamless editing, automatic translations, and robust exports to PDF and DOCX.

## 🌟 Key Features

*   **AI-Driven Conversational Builder:** Instead of filling out boring forms, users chat with "Ofuqi," an AI consultant that asks targeted questions and extracts professional metrics (powered by Llama 3 on Groq).
*   **Real-time Live Preview:** As the user chats with the AI, the CV document updates dynamically on the screen reflecting the latest extracted details.
*   **True Bilingual Support (EN & AR):** Built natively for RTL (Right-to-Left) languages. Users can swap the entire interface, generating CVs in English and Arabic perfectly.
*   **Auto-Translation Engine:** Instantly translate a fully built English CV into Arabic (or vice versa) with a single click.
*   **High-Fidelity Export:** Generates completely native, ATS-friendly `.docx` files and perfectly styled `.pdf` files.
*   **Real-time Cloud Sync:** Data is saved automatically. If you close the tab and return, you pick up the conversation right where you left off.

---

## 🛠️ Tech Stack & Architecture

### Frontend
*   **Framework:** Next.js 16 (App Router) & React 19
*   **Styling:** Custom CSS with CSS variables for deep RTL logical properties + Framer Motion for smooth animations.
*   **State Management:** Convex React Hooks (subscribing to live database mutations).

### Backend & Database
*   **BaaS (Backend as a Service):** Convex (Serverless Database, Realtime Sync, Cloud Functions).
*   **Authentication:** Convex Auth (`@convex-dev/auth`) handling JWT, sessions, and secure access boundaries.
*   **AI Router:** Edge-runtime routing utilizing streaming APIs (Groq `llama-3.3-70b-versatile`).

### Document Generation
*   **PDF Export:** Uses `puppeteer-core` and `@sparticuz/chromium-min` to render semantic HTML to PDF server-side.
*   **DOCX Export:** Uses the `docx` library to algorithmically build native Word documents.

### Tooling
*   **TypeScript:** Strict mode enabled across the entire repository.
*   **Testing:** Vitest (Unit) and Playwright (E2E workflows).
*   **Linting:** ESLint 9 (Flat config) with a zero-warnings policy.

---

## 🚀 Getting Started locally

### Prerequisites
*   Node.js v20+ (v24 recommended)
*   A Convex account
*   Groq API Key (for LLM routing)

### 1. Clone the repository
```bash
git clone https://github.com/Zenith50/ofuqi.git
cd ofuqi
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
You'll need two sets of environment variables; one for Next.js, and one for Convex.

**Create a `.env.local` file for Next.js:**
```env
NEXT_PUBLIC_CONVEX_URL="your-convex-deployment-url"
```

**Set up your Convex Environment Variables:**
Run the following to open the Convex dashboard:
```bash
npx convex dashboard
```
Navigate to "Settings" -> "Environment Variables" and add:
*   `GROQ_API_KEY`: Your Groq API key for the AI generation.
*   `SITE_URL`: Usually `http://localhost:3000` for local dev.
*   `AUTH_SECRET`: Generate a random string.
*   `JWKS` & `JWT_PRIVATE_KEY`: Run `npx @convex-dev/auth` to generate production authentication keys.

### 4. Run the Development Server
```bash
npm run dev
```
This command runs both the Next.js frontend (`localhost:3000`) and syncs the Convex backend environment simultaneously.

---

## 📦 Build & Deployment (Vercel)

The application is configured to deploy seamlessly to Vercel.

**Vercel Build Command:**
```bash
npx convex codegen && next build
```
*(Crucial: Convex types must be generated before Next builds the pages).*

**Vercel Environment Variables:**
Ensure that Vercel is injected with the production Convex URL and the necessary AI API keys so the edge functions do not fail.

---

## 🏗️ Repository Structure

```text
├── app/                  # Next.js App Router (Pages, Layouts, API Routes)
│   ├── (auth)/           # Authentication flows
│   ├── api/              # AI Edge functions and Export webhooks
│   ├── chat/new/         # The main AI interactive workspace
│   └── dashboard/        # User project library and settings
├── components/           # Shared React UI elements
│   ├── cv/               # PDF/HTML Document layout structures
│   ├── providers/        # Context Providers (Theme, Locale, Convex)
│   └── ui/               # Reusable UI primitives (Buttons, Toggles)
├── lib/                  # Core domain logic
│   ├── app/              # Translation dictionaries and Site content
│   ├── cv/               # Data transformations and export managers
│   └── llm/              # LLM routing and JSON patching logic
├── convex/               # Backend logic (Schema, Mutations, Queries)
└── tests/                # Test suites (E2E with Playwright, Unit with Vitest)
```

## 🐛 Bug Reports & Feature Requests
To report a bug, please check the console logs (specifically for API export errors which log deeply in the server context) and file an issue on GitHub. 

See `CHANGELOG.md` for recent fixes and `ROADMAP.md` for upcoming features.
