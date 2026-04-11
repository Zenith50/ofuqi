import { NextResponse } from "next/server";
import { smartStreamCall, ChatMessage } from "@/lib/llm/router";
import { getSystemPrompt } from "@/lib/cv/prompt";

// We can use the Edge runtime for faster streaming response times
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, language, cvStateJson } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const systemPromptMessage: ChatMessage = {
      role: "system",
      content: getSystemPrompt(language || "en", typeof cvStateJson === "string" ? cvStateJson : JSON.stringify(cvStateJson || {})),
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
                } catch (e) {
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
  } catch (error: any) {
    console.error("[API Chat] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI response" }, { status: 500 });
  }
}
