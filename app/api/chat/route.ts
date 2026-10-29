import { NextResponse } from "next/server";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";

import { readJsonBody, parseChatRequestPayload, RequestValidationError } from "@/lib/api/validation";
import { getSystemPrompt } from "@/lib/cv/prompt";
import { smartStreamCall, type ChatMessage } from "@/lib/llm/router";

export async function POST(req: Request) {
  try {
    if (!(await isAuthenticatedNextjs())) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { messages, language, cvStateJson } = parseChatRequestPayload(await readJsonBody(req));
    const systemPromptMessage: ChatMessage = {
      role: "system",
      content: getSystemPrompt(language, cvStateJson),
    };

    // Truncate message history to save tokens. Keep the system prompt + last 6 messages.
    const MAX_HISTORY = 6;
    const truncatedMessages = messages.length > MAX_HISTORY ? messages.slice(messages.length - MAX_HISTORY) : messages;

    const finalMessages = [systemPromptMessage, ...truncatedMessages];

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
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[API Chat] Error:", error);
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
  }
}
