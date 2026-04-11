export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ProviderConfig {
  name: string;
  url: string;
  model: string;
  keyEnv: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    name: "Groq (Llama 3.3 70B)",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    keyEnv: "GROQ_API_KEY",
  },
  {
    name: "Groq (GPT OSS 120B)",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "openai/gpt-oss-120b",
    keyEnv: "GROQ_API_KEY",
  },
  {
    name: "Groq (Qwen 3 32B)",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "qwen/qwen3-32b",
    keyEnv: "GROQ_API_KEY",
  },
  {
    name: "Groq (Llama 3.1 8B Instant)",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.1-8b-instant",
    keyEnv: "GROQ_API_KEY",
  },
  {
    name: "Pollinations",
    url: "https://text.pollinations.ai/openai/v1/chat/completions",
    model: "openai",
    keyEnv: "POLLINATIONS_API_KEY",
  },
];

export interface LlmResponse {
  content: string;
  provider: string;
  model: string;
}

/**
 * Calls the LLM using the waterfall sequence defined in PROVIDERS.
 * Throws an error if all providers fail.
 */
export async function smartCall(messages: ChatMessage[], options?: { temperature?: number }): Promise<LlmResponse> {
  for (const provider of PROVIDERS) {
    const apiKey = process.env[provider.keyEnv];
    if (!apiKey && provider.name !== "Pollinations") {
      continue; // Skip if no key, unless it's Pollinations which can run keyless temporarily
    }

    try {
      const response = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: options?.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        console.error(`[LLM Router] ${provider.name} failed with status ${response.status}`);
        continue; // Try next provider
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        provider: provider.name,
        model: provider.model,
      };
    } catch (error) {
      console.error(`[LLM Router] Error calling ${provider.name}:`, error);
      continue;
    }
  }

  throw new Error("All LLM providers failed.");
}

/**
 * Creates a streaming fetch request to the LLM using the waterfall sequence.
 * Returns the raw Response object which can be piped to Next.js clients.
 */
export async function smartStreamCall(messages: ChatMessage[], options?: { temperature?: number }): Promise<{ response: Response; provider: string; model: string }> {
  for (const provider of PROVIDERS) {
    const apiKey = process.env[provider.keyEnv];
    if (!apiKey && provider.name !== "Pollinations") {
      continue;
    }

    try {
      const response = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: options?.temperature ?? 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        console.error(`[LLM Router] ${provider.name} failed with status ${response.status}`);
        continue;
      }

      return {
        response,
        provider: provider.name,
        model: provider.model,
      };
    } catch (error) {
      console.error(`[LLM Router] Error streaming from ${provider.name}:`, error);
      continue;
    }
  }

  throw new Error("All LLM streaming providers failed.");
}
