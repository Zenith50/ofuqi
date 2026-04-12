# Project Roadmap & Tracking

This document outlines the current state, planned features, and architectural goals for the OC_CV_Maker project.

## 🚀 Current Phase: Core Stabilization & Vercel Deployment
**Goal**: Get the Next.js frontend, Convex Backend, and AI Streaming completely stable on the live Vercel environment.

- [x] Integrate Convex Auth for production (JWKS/JWT configs).
- [x] Implement AI Chat streaming with Edge Functions.
- [x] Fix UI localization state syncing with AI Chat.
- [ ] Fix real-time JSON updating failing due to regex constraints.
- [ ] Debug "Client-side Exception" occurring on Vercel deployment (Hydration/Missing Component).
- [ ] Ensure PDF and DOCX export successfully trigger from the Vercel app.

## 🛠 Next Phase: Features & Enhancements
**Goal**: Expand features once the core pipeline works perfectly.

- **Account Management**: Deeper settings, subscription tiers if needed.
- **Improved AI Parsing**: Add ability for AI to extract from uploaded PDFs instead of just text chat.
- **Multiple Themes**: Add extensive CV templates (ats, modern, creative).
- **RTL Generation**: Perfect the Arabic PDF layout generation using Puppeteer.

## 🌿 Branching Strategy Moving Forward
To keep the main branch stable, we will adopt the following Git workflow:
- `main` : Stable, production-ready code. Auto-deploys to Vercel.
- `dev` : Staging branch for merging features.
- `feature/*` : For isolated new features (e.g., `feature/ai-pdf-parsing`).
- `fix/*` : For bug fixes (e.g., `fix/export-endpoint`).
