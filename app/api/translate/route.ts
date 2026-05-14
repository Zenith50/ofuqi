import { NextResponse } from "next/server";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";

import { readJsonBody, parseTranslateRequestPayload, RequestValidationError } from "@/lib/api/validation";
import { normalizeCvData } from "@/lib/cv/validation";
import { smartCall, type ChatMessage } from "@/lib/llm/router";

export async function POST(req: Request) {
  try {
    if (!(await isAuthenticatedNextjs())) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { cvData, targetLanguage, existingTargetData } = parseTranslateRequestPayload(await readJsonBody(req));
    const langLabel = targetLanguage === "ar" ? "Arabic" : "English";
    const hasExistingTarget = existingTargetData &&
      ((existingTargetData.experience?.length > 0) || (existingTargetData.summary?.length > 0));

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
    if (fenceMatch) {
      cleanJsonStr = fenceMatch[1].trim();
    }

    try {
      const parsedData = JSON.parse(cleanJsonStr);
      const normalizedData = normalizeCvData({ ...parsedData, language: targetLanguage });
      if (!normalizedData) {
        return NextResponse.json({ error: "Invalid JSON returned from LLM" }, { status: 502 });
      }
      return NextResponse.json(normalizedData);
    } catch {
      console.error("[Translate API] JSON parse error.", { outputLength: response.content.length });
      return NextResponse.json({ error: "Invalid JSON returned from LLM" }, { status: 502 });
    }

  } catch (error) {
    if (error instanceof RequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[Translate API] Error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
