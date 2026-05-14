import type { AppLocale } from "@/lib/app/content";
import { normalizeCvData } from "@/lib/cv/validation";
import { resolveCvProjectTemplateKey } from "@/lib/cv/templates";
import type { CvData } from "@/lib/cv/demoData";
import type { ChatMessage } from "@/lib/llm/router";

const MAX_JSON_BYTES = 256 * 1024;
const MAX_CHAT_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4000;

export type ChatRequestPayload = {
  messages: ChatMessage[];
  language: AppLocale;
  cvStateJson: string;
};

export type TranslateRequestPayload = {
  cvData: CvData;
  targetLanguage: AppLocale;
  existingTargetData?: CvData;
};

export type ExportRequestPayload = {
  data: CvData;
  format: "pdf" | "docx";
  templateKey: string;
};

export async function readJsonBody(request: Request): Promise<unknown> {
  const rawBody = await request.text();
  if (rawBody.length > MAX_JSON_BYTES) {
    throw new RequestValidationError("Payload is too large.", 413);
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new RequestValidationError("Invalid JSON payload.", 400);
  }
}

export function parseChatRequestPayload(value: unknown): ChatRequestPayload {
  if (!isRecord(value) || !Array.isArray(value.messages)) {
    throw new RequestValidationError("Invalid messages format.", 400);
  }

  const messages = value.messages
    .slice(-MAX_CHAT_MESSAGES)
    .map(normalizeMessage)
    .filter((message): message is ChatMessage => message !== null);

  if (messages.length === 0) {
    throw new RequestValidationError("At least one message is required.", 400);
  }

  const language = value.language === "ar" ? "ar" : "en";
  const cvStateJson = typeof value.cvStateJson === "string"
    ? value.cvStateJson.slice(0, MAX_JSON_BYTES)
    : JSON.stringify(value.cvStateJson ?? {}).slice(0, MAX_JSON_BYTES);

  return { messages, language, cvStateJson };
}

export function parseTranslateRequestPayload(value: unknown): TranslateRequestPayload {
  if (!isRecord(value)) {
    throw new RequestValidationError("Invalid translation payload.", 400);
  }

  const targetLanguage = value.targetLanguage === "en" || value.targetLanguage === "ar" ? value.targetLanguage : null;
  const cvData = normalizeCvData(value.cvData);
  const existingTargetData = normalizeCvData(value.existingTargetData);

  if (!targetLanguage || !cvData) {
    throw new RequestValidationError("Invalid translation payload.", 400);
  }

  return {
    cvData,
    targetLanguage,
    existingTargetData: existingTargetData ?? undefined,
  };
}

export function parseExportRequestPayload(value: unknown): ExportRequestPayload {
  if (!isRecord(value)) {
    throw new RequestValidationError("Invalid export payload.", 400);
  }

  const data = normalizeCvData(value.data);
  const format = value.format === "pdf" || value.format === "docx" ? value.format : null;
  const templateKey = resolveCvProjectTemplateKey(typeof value.templateKey === "string" ? value.templateKey : null) ?? "ats";

  if (!data || !format) {
    throw new RequestValidationError("Invalid export payload.", 400);
  }

  return { data, format, templateKey };
}

export class RequestValidationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RequestValidationError";
    this.status = status;
  }
}

function normalizeMessage(value: unknown): ChatMessage | null {
  if (!isRecord(value)) return null;

  const role = value.role === "user" || value.role === "assistant" || value.role === "system" ? value.role : null;
  const content = typeof value.content === "string" ? value.content.trim().slice(0, MAX_MESSAGE_CHARS) : "";

  return role && content ? { role, content } : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
