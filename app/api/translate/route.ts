import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

import { smartCall, type ChatMessage } from "@/lib/llm/router";

export const runtime = "edge";

const MAX_TRANSLATE_BODY_BYTES = 512 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCvLanguage(value: unknown): value is "en" | "ar" {
  return value === "en" || value === "ar";
}

async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse }> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
      };
    }
    if (Number(declaredLength) > maxBytes) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Payload too large." }, { status: 413 }),
      };
    }
  }

  if (!request.body) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        return {
          ok: false,
          response: NextResponse.json({ error: "Payload too large." }, { status: 413 }),
        };
      }
      chunks.push(value);
    }
  } catch (error) {
    console.error("[Translate API] Failed to read body:", error);
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    };
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    };
  }
}

export async function POST(req: Request) {
  try {
    const authenticated = await isAuthenticatedNextjs();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bodyResult = await readJsonBody(req, MAX_TRANSLATE_BODY_BYTES);
    if (!bodyResult.ok) {
      return bodyResult.response;
    }

    const body = bodyResult.value;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    const { cvData, targetLanguage, existingTargetData } = body;

    if (!cvData || !targetLanguage) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    if (!isCvLanguage(targetLanguage)) {
      return NextResponse.json({ error: "Invalid target language." }, { status: 400 });
    }

    const langLabel = targetLanguage === "ar" ? "Arabic" : "English";
    const hasExistingTarget = isRecord(existingTargetData) &&
      ((Array.isArray(existingTargetData.experience) && existingTargetData.experience.length > 0) ||
        (typeof existingTargetData.summary === "string" && existingTargetData.summary.length > 0));

    let systemContent: string;

    if (hasExistingTarget) {
      // Smart merge mode: reconcile source translation with existing target
      systemContent = `You are an expert bilingual CV reconciler.

You will receive TWO JSON objects:
1. "source" — the user's most up-to-date CV in ${targetLanguage === "ar" ? "English" : "Arabic"}.
2. "existing_target" — the current ${langLabel} draft which may be outdated or partial.

Your job:
- Translate the SOURCE into professional ${langLabel}.
- For each field, if the existing_target already has a good ${langLabel} value for the same item, prefer and keep it.
- If the source has NEW entries (experience, education, skills, etc.) not in existing_target, translate and add them.
- If the source REMOVED entries that exist in existing_target, remove them from output too.
- PRESERVE proper nouns (company names, institutions, technical skills) in their original language.
- Output ONLY the final merged ${langLabel} CV as raw JSON. No markdown, no explanation. Start with { and end with }.`;
    } else {
      // Full translation mode: target is empty
      systemContent = `You are an expert CV translator. You will receive a JSON document representing a Curriculum Vitae.
Translate ALL text values (summaries, achievements, descriptions, degrees) into professional ${langLabel}.

RULES:
1. Preserve the EXACT JSON structure, keys, and array formats. Do not alter any structural keys.
2. Translate values natively into professional ${langLabel}.
3. PRESERVE proper nouns (company names, institutions, technical skills like "Next.js" or "SEO") in their original language.
4. Output ONLY valid, parseable JSON. No markdown fences, no explanation. Start with { and end with }.`;
    }

    const systemPrompt: ChatMessage = { role: "system", content: systemContent };

    let userContent: string;
    if (hasExistingTarget) {
      userContent = JSON.stringify({
        source: cvData,
        existing_target: existingTargetData,
      }, null, 2);
    } else {
      userContent = JSON.stringify(cvData, null, 2);
    }

    const userMessage: ChatMessage = { role: "user", content: userContent };

    const response = await smartCall([systemPrompt, userMessage], { temperature: 0.2 });

    // Clean up markdown fences the LLM might stubbornly include
    let cleanJsonStr = response.content.trim();
    // Remove ```json ... ``` or ``` ... ``` wrappers
    const fenceMatch = cleanJsonStr.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fenceMatch?.[1]) {
      cleanJsonStr = fenceMatch[1].trim();
    }

    try {
      const parsedData = JSON.parse(cleanJsonStr) as Record<string, unknown>;
      parsedData.language = targetLanguage;
      return NextResponse.json(parsedData);
    } catch {
      console.error("[Translate API] JSON parse error. Raw LLM output:", response.content);
      return NextResponse.json({ error: "Invalid JSON returned from LLM" }, { status: 500 });
    }

  } catch (error) {
    console.error("[Translate API] Error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
