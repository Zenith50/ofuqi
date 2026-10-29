const fs = require('fs');
const path = require('path');

// Modern Dark Theme Colors
const THEME = {
  bg: "#0a0a0a",
  text: {
    hero: "#ffffff",
    title: "#f3f4f6",
    subtitle: "#9ca3af",
    code: "#34d399",
    accent: "#60a5fa"
  },
  client: { fill: "#1e3a8a", stroke: "#3b82f6", boxFill: "#172554" },
  convex: { fill: "#2e1065", stroke: "#8b5cf6", boxFill: "#1e1b4b" },
  ai: { fill: "#064e3b", stroke: "#10b981", boxFill: "#022c22" },
  export: { fill: "#7c2d12", stroke: "#f97316", boxFill: "#450a0a" }
};

let idCounter = 0;
function id() { return `elem_${Date.now()}_${idCounter++}`; }

function rect(x, y, w, h, fill, stroke, strokeWidth=2) {
  return {
    id: id(), type: "rectangle", x, y, width: w, height: h,
    strokeColor: stroke, backgroundColor: fill, strokeWidth,
    roughness: 0, opacity: 100, strokeStyle: "solid",
    roundness: { type: 3, value: 16 }, fillStyle: "solid"
  };
}

function text(x, y, str, size, color, align="left", font=3) {
  const lineCount = str.split('\n').length;
  const maxLineLen = Math.max(...str.split('\n').map(s => s.length));
  const w = maxLineLen * (size * 0.65);
  const h = lineCount * (size * 1.3);
  return {
    id: id(), type: "text", x, y, width: w, height: h,
    text: str, originalText: str, fontSize: size, fontFamily: font,
    textAlign: align, verticalAlign: "top", strokeColor: color,
    roughness: 0, opacity: 100
  };
}

function arrow(x1, y1, x2, y2, color, textStr="", side="top") {
  const els = [];
  const w = x2 - x1;
  const h = y2 - y1;
  const arrowEl = {
    id: id(), type: "arrow",
    x: x1, y: y1, width: w, height: h,
    strokeColor: color, strokeWidth: 2, roughness: 0, opacity: 100,
    startArrowhead: null, endArrowhead: "triangle",
    points: [[0, 0], [w, h]], roundness: { type: 2 }
  };
  els.push(arrowEl);
  
  if (textStr) {
     const tElem = text(0, 0, textStr, 14, color, "center");
     let midX = x1 + (w / 2) - (tElem.width / 2);
     let midY = y1 + (h / 2) - (tElem.height / 2);
     if (side === "top") midY -= 30;
     if (side === "bottom") midY += 30;
     tElem.x = midX; tElem.y = midY;
     els.push(tElem);
  }
  return els;
}

const elements = [];

// ==========================================
// TITLE
// ==========================================
elements.push(text(100, 0, "Ofuqi (أُفُقي) ─ Technical Infrastructure Map", 40, THEME.text.hero, "left", 3));
elements.push(text(100, 60, "Detailed architecture of Next.js, Convex BaaS, AI Edge rendering, and Serverless PDF generation.", 20, THEME.text.subtitle, "left", 3));

// ==========================================
// 1. CLIENT APP (Left)
// ==========================================
const clX = 100; const clY = 250;
elements.push(rect(clX, clY, 520, 480, THEME.client.fill, THEME.client.stroke));
elements.push(text(clX + 30, clY + 30, "Client Browser (React 19 / Next.js)", 24, THEME.text.hero, "left"));
elements.push(text(clX + 30, clY + 65, "Interactive Workspace UI & Core State", 18, THEME.text.subtitle, "left"));

// Workspace UI Box
elements.push(rect(clX + 30, clY + 120, 460, 200, THEME.client.boxFill, THEME.client.stroke, 1));
elements.push(text(clX + 50, clY + 140, "app/chat/new/page.tsx", 16, THEME.text.accent, "left"));

elements.push(rect(clX + 50, clY + 180, 180, 100, "transparent", THEME.text.subtitle, 1));
elements.push(text(clX + 90, clY + 220, "AI Chat\nThread", 16, THEME.text.hero, "center"));

elements.push(rect(clX + 270, clY + 180, 180, 100, "transparent", THEME.text.subtitle, 1));
elements.push(text(clX + 310, clY + 220, "Live CV\nPreview", 16, THEME.text.hero, "center"));

// State Machine Box
elements.push(rect(clX + 30, clY + 350, 460, 100, THEME.client.boxFill, THEME.client.stroke, 1));
elements.push(text(clX + 50, clY + 370, "Internal React State", 16, THEME.text.accent, "left"));
elements.push(text(clX + 50, clY + 400, "• useDebounce(saveMutation, 800ms) - Debounced DB Saves\n• AppLocaleContext - RTL/LTR Translation syncing\n• useCharacterLimit() - Message composer limits", 14, THEME.text.hero, "left"));

// ==========================================
// 2. CONVEX BACKEND (Top Right)
// ==========================================
const cxX = 900; const cxY = 250;
elements.push(rect(cxX, cxY, 560, 240, THEME.convex.fill, THEME.convex.stroke));
elements.push(text(cxX + 30, cxY + 30, "Real-time Backend (Convex BaaS)", 24, THEME.text.hero, "left"));
elements.push(text(cxX + 30, cxY + 65, "Websockets & Serverless PostgreSQL", 18, THEME.text.subtitle, "left"));

elements.push(rect(cxX + 30, cxY + 110, 240, 100, THEME.convex.boxFill, THEME.convex.stroke, 1));
elements.push(text(cxX + 50, cxY + 130, "@convex-dev/auth", 16, THEME.text.hero, "left"));
elements.push(text(cxX + 50, cxY + 160, "• JWT/JWKS Edges\n• Strict Auth Route Rules", 14, THEME.text.subtitle, "left"));

elements.push(rect(cxX + 290, cxY + 110, 240, 100, THEME.convex.boxFill, THEME.convex.stroke, 1));
elements.push(text(cxX + 310, cxY + 130, "cvProjects Schema", 16, THEME.text.hero, "left"));
elements.push(text(cxX + 310, cxY + 160, "• saveProjectStateMutation\n• Websocket Auto-sync", 14, THEME.text.subtitle, "left"));


// ==========================================
// 3. AI EDGE NETWORK (Middle Right)
// ==========================================
const aiX = 900; const aiY = 550;
elements.push(rect(aiX, aiY, 560, 220, THEME.ai.fill, THEME.ai.stroke));
elements.push(text(aiX + 30, aiY + 30, "AI Edge Network (Vercel Edge)", 24, THEME.text.hero, "left"));
elements.push(text(aiX + 30, aiY + 65, "POST /api/chat - Edge Runtime Streaming", 18, THEME.text.subtitle, "left"));

elements.push(rect(aiX + 30, aiY + 110, 500, 80, THEME.ai.boxFill, THEME.ai.stroke, 1));
elements.push(text(aiX + 50, aiY + 130, "Groq Llama-3.3-70B Streaming Router", 16, THEME.text.accent, "left"));
elements.push(text(aiX + 50, aiY + 160, "Regex JSON Patches: /```(?:json)?\\s*(\\{[\\s\\S]*?\\})\\s*```/i", 14, THEME.text.code, "left", 3));


// ==========================================
// 4. SERVERLESS EXPORT (Bottom Left & Right Span)
// ==========================================
const exX = 100; const exY = 820;
elements.push(rect(exX, exY, 1360, 220, THEME.export.fill, THEME.export.stroke));
elements.push(text(exX + 30, exY + 30, "Vercel Node.js Serverless Environment", 24, THEME.text.hero, "left"));
elements.push(text(exX + 30, exY + 65, "POST /api/export - Document Renderers (PDF & DOCX)", 18, THEME.text.subtitle, "left"));

elements.push(rect(exX + 30, exY + 110, 420, 80, THEME.export.boxFill, THEME.export.stroke, 1));
elements.push(text(exX + 50, exY + 130, "@sparticuz/chromium-min (v131.0.1)", 16, THEME.text.accent, "left"));
elements.push(text(exX + 50, exY + 160, "Limits bypassed: --disable-dev-shm-usage", 14, THEME.text.code, "left", 3));

elements.push(rect(exX + 470, exY + 110, 420, 80, THEME.export.boxFill, THEME.export.stroke, 1));
elements.push(text(exX + 490, exY + 130, "Base64 Font Loader", 16, THEME.text.accent, "left"));
elements.push(text(exX + 490, exY + 160, "Bypasses Chromium file:/// sandbox for Amiri/Tajawal", 14, THEME.text.code, "left", 3));

elements.push(rect(exX + 910, exY + 110, 420, 80, THEME.export.boxFill, THEME.export.stroke, 1));
elements.push(text(exX + 930, exY + 130, "Next.js Vercel Optimizations", 16, THEME.text.accent, "left"));
elements.push(text(exX + 930, exY + 160, "maxDuration: 60s, outputFileTracingIncludes (fonts/ HTML)", 14, THEME.text.code, "left", 3));

// ==========================================
// ARROWS & CONNECTIONS
// ==========================================

// Client -> Convex (Sync)
elements.push(...arrow(620, 320, 900, 320, THEME.convex.stroke, "Websocket Connection\n(Incremental 800ms Saves)", "top"));

// Client -> Edge AI (Chat payload)
elements.push(...arrow(620, 600, 900, 600, THEME.ai.stroke, "HTTP POST\n(CV Schema + Chat Hist)", "top"));

// Edge AI -> Client (Stream Return)
elements.push(...arrow(900, 650, 620, 650, THEME.client.stroke, "ReadableStream\n(Text UI + JSON Target Patches)", "top"));

// Client -> Export
elements.push(...arrow(400, 730, 400, 820, THEME.export.stroke, "Triggers Request", "left"));

const excalidraw = {
  type: "excalidraw",
  version: 2,
  source: "https://excalidraw.com",
  elements,
  appState: { viewBackgroundColor: THEME.bg, gridSize: 20 },
  files: {}
};

fs.writeFileSync(path.join(__dirname, 'docs', 'architecture', 'ofuqi-master.excalidraw'), JSON.stringify(excalidraw, null, 2));
