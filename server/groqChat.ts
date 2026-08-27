/**
 * Server-side Groq chat completions (shared by Vite middleware + Vercel /api/groq-chat).
 * Keeps GROQ_API_KEY off the browser.
 */

const ALLOWED_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.1-70b-versatile",
]);

export type GroqChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GroqChatRequest = {
  messages?: unknown;
  model?: unknown;
  temperature?: unknown;
  response_format?: unknown;
};

export type GroqChatOk = {
  ok: true;
  content: string;
  raw: unknown;
};

export type GroqChatErr = {
  ok: false;
  error: string;
  status: number;
};

function asMessages(raw: unknown): GroqChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 24) return null;
  const out: GroqChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (
      (role !== "system" && role !== "user" && role !== "assistant") ||
      typeof content !== "string"
    ) {
      return null;
    }
    out.push({ role, content: content.slice(0, 12_000) });
  }
  return out;
}

export async function handleGroqChat(
  body: GroqChatRequest,
  groqApiKey: string
): Promise<GroqChatOk | GroqChatErr> {
  if (!groqApiKey) {
    return {
      ok: false,
      error: "GROQ_API_KEY is not configured on the server.",
      status: 503,
    };
  }

  const messages = asMessages(body.messages);
  if (!messages) {
    return {
      ok: false,
      error: "messages must be a non-empty array of { role, content } (max 24).",
      status: 400,
    };
  }

  const model =
    typeof body.model === "string" && ALLOWED_MODELS.has(body.model)
      ? body.model
      : "llama-3.3-70b-versatile";

  const temperature =
    typeof body.temperature === "number" && Number.isFinite(body.temperature)
      ? Math.min(1.5, Math.max(0, body.temperature))
      : 0.3;

  const response_format =
    body.response_format &&
    typeof body.response_format === "object" &&
    (body.response_format as { type?: string }).type === "json_object"
      ? { type: "json_object" as const }
      : undefined;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          ...(response_format ? { response_format } : {}),
        }),
      }
    );

    const text = await response.text();
    let raw: unknown = null;
    try {
      raw = JSON.parse(text);
    } catch {
      raw = { raw: text };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: `Groq request failed (${response.status})`,
        status:
          response.status >= 400 && response.status < 600 ? response.status : 502,
      };
    }

    const content = (raw as {
      choices?: Array<{ message?: { content?: string } }>;
    })?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return { ok: false, error: "Empty Groq response", status: 502 };
    }

    return { ok: true, content, raw };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Groq proxy failed";
    return { ok: false, error: message, status: 500 };
  }
}
