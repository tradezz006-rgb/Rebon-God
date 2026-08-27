/**
 * Browser-safe Groq client — calls /api/groq-chat (server holds the key).
 */
import { safeFetchJson } from "@/lib/safeFetch";

export type GroqClientMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GroqProxyResponse = {
  content?: string;
  error?: string;
};

export async function groqChat(opts: {
  messages: GroqClientMessage[];
  model?: string;
  temperature?: number;
  json?: boolean;
}): Promise<string> {
  const result = await safeFetchJson<GroqProxyResponse>("/api/groq-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: opts.messages,
      model: opts.model,
      temperature: opts.temperature,
      response_format: opts.json ? { type: "json_object" } : undefined,
    }),
    timeoutMs: 45_000,
    retryOnce: true,
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }
  if (!result.data.content || typeof result.data.content !== "string") {
    throw new Error(result.data.error || "Empty Groq response");
  }
  return result.data.content;
}

export async function groqChatJson<T>(opts: {
  messages: GroqClientMessage[];
  model?: string;
  temperature?: number;
}): Promise<T> {
  const content = await groqChat({ ...opts, json: true });
  return JSON.parse(content) as T;
}
