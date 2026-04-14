const fs = require('fs');
const path = require('path');

// Colors
const bg = "transparent";
const white = "#ffffff";
const gray = "#9ca3af";
const darkBox = "#1f2937";
const blue = "#3b82f6";
const purple = "#8b5cf6";
const green = "#10b981";
const cyan = "#06b6d4";
const orange = "#f97316";

function id() {
  return Math.random().toString(36).substr(2, 9);
}

function rect(x, y, w, h, fill, stroke, strokeWidth, rx = 8) {
  return {
    id: id(), type: "rectangle", x, y, width: w, height: h,
    strokeColor: stroke, backgroundColor: fill, strokeWidth,
    roughness: 0, opacity: 100, roundness: { type: 3 },
    fillStyle: "solid"
  };
}

function text(x, y, str, size = 16, color = white, align = "left", font = 3) {
  return {
    id: id(), type: "text", x, y, width: str.length * (size * 0.6), height: size * 1.2,
    text: str, originalText: str, fontSize: size, fontFamily: font,
    textAlign: align, verticalAlign: "top", strokeColor: color,
    roughness: 0, opacity: 100
  };
}

function line(x1, y1, x2, y2, color, arrowStr = "none") {
    let startArrow = null;
    let endArrow = null;
    if (arrowStr === "end") endArrow = "triangle";
    if (arrowStr === "both") { startArrow = "triangle"; endArrow = "triangle"; }
    return {
        id: id(), type: "arrow",
        x: x1, y: y1, width: Math.abs(x2-x1), height: Math.abs(y2-y1),
        strokeColor: color, strokeWidth: 2, roughness: 0, opacity: 100,
        startArrowhead: startArrow, endArrowhead: endArrow,
        points: [[0, 0], [x2-x1, y2-y1]]
    };
}

const elements = [];

// ==========================================
// TITLE
// ==========================================
elements.push(text(400, -100, "Ofuqi (أُفُقي) ─ Technical Architecture Master Map", 36, white, "center"));
elements.push(text(400, -50, "Full-Stack Deployment Topology (Next.js + Convex + Vercel + AI)", 20, gray, "center"));

// ==========================================
// 1. CLIENT TIER (Left)
// ==========================================
elements.push(rect(-100, 50, 360, 450, "#111827", "#374151", 2));
elements.push(text(-70, 80, "Client Browser (React 19)", 24, white, "left"));
elements.push(text(-70, 120, "User Interface & Local State", 16, gray, "left"));

// Interactive Workspace Box
elements.push(rect(-70, 160, 300, 140, "#1f2937", blue, 1));
elements.push(text(-50, 180, "Interactive Workspace (chat/new)", 20, cyan, "left"));
elements.push(text(-40, 220, "• useCharacterLimit()", 14, white, "left"));
elements.push(text(-40, 245, "• Next.js App Router", 14, white, "left"));
elements.push(text(-40, 270, "• CVPreview Renderer", 14, white, "left"));

// Deep State Box
elements.push(rect(-70, 320, 300, 140, "#172554", blue, 2));
elements.push(text(-50, 340, "AppLocaleContext", 16, cyan, "left"));
elements.push(text(-50, 370, "{\"locale\": \"ar\", \"CVState\": {...}}", 14, green, "left", 2));
elements.push(text(-50, 420, "Debounced Auto-save (800ms)", 14, white, "left"));


// ==========================================
// 2. CONVEX REALTIME BACKEND (Top Middle)
// ==========================================
elements.push(rect(400, 50, 360, 300, "#111827", "#374151", 2));
elements.push(text(430, 80, "Convex System (Real-time BaaS)", 24, white, "left"));

elements.push(rect(430, 130, 300, 70, "#1f2937", purple, 1));
elements.push(text(450, 150, "@convex-dev/auth", 20, purple, "left"));
elements.push(text(450, 175, "JWT edge verification & Next.js provider", 14, gray, "left"));

elements.push(rect(430, 220, 300, 100, "#1f2937", purple, 2));
elements.push(text(450, 240, "cvProjects Schema", 20, purple, "left"));
elements.push(text(450, 270, "• saveProjectStateMutation", 14, white, "left"));
elements.push(text(450, 290, "• Websocket subscription sync", 14, white, "left"));


// ==========================================
// 3. AI EDGE PIPELINE (Bottom Right)
// ==========================================
elements.push(rect(400, 400, 500, 250, "#111827", "#374151", 2));
elements.push(text(430, 430, "AI Edge Network (Vercel Edge)", 24, white, "left"));

elements.push(rect(430, 480, 440, 140, "#064e3b", green, 2));
elements.push(text(450, 500, "POST /api/chat (Edge Runtime)", 20, green, "left"));
elements.push(text(450, 530, "Groq Llama-3.3-70B API Stream", 16, white, "left"));

elements.push(rect(450, 560, 400, 50, darkBox, gray, 1));
elements.push(text(460, 575, "JSON Extractor: /```(?:json)?\\s*(\\{[\\s\\S]*?\\})\\s*```/i", 14, orange, "left", 2));


// ==========================================
// 4. SERVERLESS EXPORT ENGINE (Top Right)
// ==========================================
elements.push(rect(850, 50, 450, 300, "#111827", "#374151", 2));
elements.push(text(880, 80, "Vercel Serverless (Nodejs)", 24, white, "left"));

elements.push(rect(880, 120, 390, 80, "#450a0a", orange, 2));
elements.push(text(900, 140, "POST /api/export", 20, orange, "left"));
elements.push(text(900, 170, "maxDuration: 60s bypass", 16, cyan, "left"));

elements.push(rect(880, 220, 390, 100, "#450a0a", orange, 1));
elements.push(text(900, 240, "@sparticuz/chromium-min Payload", 18, white, "left"));
elements.push(text(900, 270, "--disable-dev-shm-usage (Prevents AWS crash)", 14, gray, "left"));
elements.push(text(900, 290, "Base64 local font injection (Bypasses Sandbox)", 14, gray, "left"));

// ==========================================
// CONNECTIONS
// ==========================================
// Client <-> Convex
elements.push(line(260, 190, 400, 190, purple, "both"));
elements.push(text(280, 160, "WebSocket Sync", 14, gray, "center"));

// Client -> Export
elements.push(line(260, 100, 850, 100, orange, "end"));
elements.push(text(600, 80, "Triggers PDF / DOCX Download", 14, gray, "center"));

// Client -> Edge AI
elements.push(line(260, 250, 400, 450, green, "both"));
elements.push(text(250, 350, "Sends Draft JSON\nReads Streamed Patches", 14, gray, "center"));

const excalidraw = {
  type: "excalidraw",
  version: 2,
  source: "https://excalidraw.com",
  elements,
  appState: { viewBackgroundColor: "#0a0a0a", gridSize: 20 },
  files: {}
};

fs.writeFileSync(path.join(__dirname, 'docs', 'architecture', 'ofuqi-master.excalidraw'), JSON.stringify(excalidraw, null, 2));
