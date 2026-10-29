import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

import { getSystemPrompt } from "@/lib/cv/prompt";
import { smartStreamCall, type ChatMessage } from "@/lib/llm/router";

// We can use the Edge runtime for faster streaming response times
export const runtime = "edge";

const MAX_CHAT_BODY_BYTES = 256 * 1024;
const MAX_HISTORY = 6;
const MAX_MESSAGE_CHARS = 20_000;
const MAX_CV_STATE_CHARS = 80_000;

type AcceptedChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    console.error("[API Chat] Failed to read body:", error);
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

function acceptChatMessages(value: unknown): AcceptedChatMessage[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const accepted: AcceptedChatMessage[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) {
      return null;
    }
    if (entry.role === "system") {
      continue;
    }
    if (entry.role !== "user" && entry.role !== "assistant") {
      return null;
    }
    if (typeof entry.content !== "string") {
      return null;
    }
    accepted.push({ role: entry.role, content: entry.content });
  }

  const forwarded = accepted.slice(-MAX_HISTORY);
  if (forwarded.length === 0) {
    return null;
  }
  if (forwarded.some((message) => message.content.length > MAX_MESSAGE_CHARS)) {
    return null;
  }
  return forwarded;
}

function serializeCvState(value: unknown): string | null {
  if (value === undefined || value === null) {
    return "{}";
  }

  let serialized: string;
  if (typeof value === "string") {
    serialized = value;
  } else if (typeof value === "object") {
    try {
      serialized = JSON.stringify(value);
    } catch {
      return null;
    }
  } else {
    return null;
  }

  if (serialized.length > MAX_CV_STATE_CHARS) {
    return null;
  }
  return serialized;
}

export async function POST(req: Request) {
  try {
    const authenticated = await isAuthenticatedNextjs();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bodyResult = await readJsonBody(req, MAX_CHAT_BODY_BYTES);
    if (!bodyResult.ok) {
      return bodyResult.response;
    }
    if (!isRecord(bodyResult.value)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const messages = acceptChatMessages(bodyResult.value.messages);
    if (!messages) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const requestedLanguage = bodyResult.value.language;
    const language = requestedLanguage === undefined || requestedLanguage === null
      ? "en"
      : requestedLanguage === "en" || requestedLanguage === "ar"
        ? requestedLanguage
        : null;
    if (!language) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const cvStateJson = serializeCvState(bodyResult.value.cvStateJson);
    if (cvStateJson === null) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const systemPromptMessage: ChatMessage = {
      role: "system",
      content: getSystemPrompt(language, cvStateJson),
    };
    const finalMessages = [systemPromptMessage, ...messages];

    // Get the streaming response from our smart router
    const { response, provider, model } = await smartStreamCall(finalMessages, { temperature: 0.5 });

    if (!response.body) throw new Error("No response body returned from LLM");

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep the last partial line in the buffer

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith("data: ") && trimmedLine !== "data: [DONE]") {
                try {
                  const data = JSON.parse(trimmedLine.slice(6));
                  const content = data.choices[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content));
                  }
                } catch {
                  // Silently ignore incomplete JSON chunks
                }
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    // Return the simplified text stream back to the client.
    return new Response(stream, {
      status: response.status,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        // Pass metadata via custom headers so frontend knows which LLM was used
        "X-LLM-Provider": provider,
        "X-LLM-Model": model,
      },
    });
  } catch (error: unknown) {
    console.error("[API Chat] Error:", error);
    const message = error instanceof Error && error.message
      ? error.message
      : "Failed to generate AI response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
