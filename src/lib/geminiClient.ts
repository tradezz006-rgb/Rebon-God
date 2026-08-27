/**
 * Browser-safe Gemini client — POST /api/gemini-generate (server holds GEMINI_API_KEY).
 */
import { safeFetchJson } from "@/lib/safeFetch";

type GeminiProxyResponse = {
  text?: string;
  error?: string;
};

export async function geminiGenerate(opts: {
  prompt: string;
  model?: string;
  temperature?: number;
  json?: boolean;
}): Promise<string> {
  const result = await safeFetchJson<GeminiProxyResponse>("/api/gemini-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: opts.prompt,
      model: opts.model,
      temperature: opts.temperature,
      json: opts.json === true,
    }),
    timeoutMs: 60_000,
    retryOnce: true,
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }
  if (!result.data.text || typeof result.data.text !== "string") {
    throw new Error(result.data.error || "Empty Gemini response");
  }
  return result.data.text;
}

export async function geminiGenerateJson<T>(opts: {
  prompt: string;
  model?: string;
  temperature?: number;
}): Promise<T> {
  const text = await geminiGenerate({ ...opts, json: true });
  return JSON.parse(text) as T;
}
