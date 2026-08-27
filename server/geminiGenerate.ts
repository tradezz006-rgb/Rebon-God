/**
 * Server-side Gemini generateContent (shared by Vite + Vercel /api/gemini-generate).
 */

const ALLOWED_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
]);

export type GeminiGenerateRequest = {
  prompt?: unknown;
  model?: unknown;
  temperature?: unknown;
  json?: unknown;
};

export type GeminiGenerateOk = {
  ok: true;
  text: string;
};

export type GeminiGenerateErr = {
  ok: false;
  error: string;
  status: number;
};

export async function handleGeminiGenerate(
  body: GeminiGenerateRequest,
  apiKey: string
): Promise<GeminiGenerateOk | GeminiGenerateErr> {
  if (!apiKey) {
    return {
      ok: false,
      error: "GEMINI_API_KEY is not configured on the server.",
      status: 503,
    };
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length > 40_000) {
    return {
      ok: false,
      error: "prompt must be a non-empty string (max 40000 chars).",
      status: 400,
    };
  }

  const model =
    typeof body.model === "string" && ALLOWED_MODELS.has(body.model)
      ? body.model
      : "gemini-2.5-flash";

  const temperature =
    typeof body.temperature === "number" && Number.isFinite(body.temperature)
      ? Math.min(1.5, Math.max(0, body.temperature))
      : 0.7;

  const json = body.json === true;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            ...(json ? { responseMimeType: "application/json" } : {}),
          },
        }),
      }
    );

    const rawText = await response.text();
    let data: {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
      error?: { message?: string };
    };
    try {
      data = JSON.parse(rawText) as typeof data;
    } catch {
      return { ok: false, error: "Invalid JSON from Gemini", status: 502 };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: data.error?.message || `Gemini request failed (${response.status})`,
        status:
          response.status >= 400 && response.status < 600 ? response.status : 502,
      };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) {
      return { ok: false, error: "Empty Gemini response", status: 502 };
    }

    return { ok: true, text };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini proxy failed";
    return { ok: false, error: message, status: 500 };
  }
}
