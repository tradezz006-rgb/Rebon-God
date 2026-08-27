import { handleStudentDoubt } from "../server/studentDoubtGroq";

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  setHeader: (k: string, v: string) => void;
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  end: () => void;
};

/**
 * Production proxy: POST /api/student-doubt
 * Requires GROQ_API_KEY in Vercel Environment Variables (not VITE_*).
 */
export default async function handler(
  req: ApiRequest,
  res: ApiResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const key = process.env.GROQ_API_KEY || "";
  let body: unknown = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      body = {};
    }
  }
  if (typeof body !== "object" || body === null) {
    body = {};
  }

  const result = await handleStudentDoubt(
    body as Record<string, unknown>,
    key
  );
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  const { ok: _ok, ...payload } = result;
  res.status(200).json(payload);
}
