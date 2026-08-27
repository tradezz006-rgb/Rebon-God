/**
 * Shared Student Mode doubt → Groq handler body (server-side only).
 * Used by Vite dev middleware and Vercel /api/student-doubt.
 */

export type StudentDoubtRequest = {
  question?: unknown;
  lessonTitle?: unknown;
  lessonContext?: unknown;
  language?: unknown;
};

export type StudentDoubtOk = {
  ok: true;
  answer_english: string;
  answer_tanglish: string;
  question_english: string;
  question_tanglish: string;
  whiteboard_summary: string;
};

export type StudentDoubtErr = {
  ok: false;
  error: string;
  status: number;
};

function asString(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

export async function handleStudentDoubt(
  body: StudentDoubtRequest,
  groqApiKey: string
): Promise<StudentDoubtOk | StudentDoubtErr> {
  if (!groqApiKey) {
    return {
      ok: false,
      error: "GROQ_API_KEY is not configured on the server.",
      status: 503,
    };
  }

  const question = asString(body.question, 2000);
  const lessonTitle = asString(body.lessonTitle, 200) || "Cloud lesson";
  const lessonContext = asString(body.lessonContext, 3500);
  const language =
    body.language === "tanglish" || body.language === "english"
      ? body.language
      : "english";

  if (!question) {
    return { ok: false, error: "question is required", status: 400 };
  }

  const system = `You are Ren, a live classroom cloud tutor for Rebon Student Mode.
Lesson: ${lessonTitle}
Lesson / board context:\n${lessonContext}

The student may interrupt mid-lesson ("re-explain this", "why this not that", "tell me about X") or ask at the end. Answer like a real teacher: clear, short, spoken aloud — not a long essay.

Reply as JSON only:
{
  "question_english": "student question in clear English",
  "question_tanglish": "same question in Tanglish (Tamil words in Latin script + English)",
  "answer_english": "2-5 sentence spoken English answer",
  "answer_tanglish": "same answer in Tanglish",
  "whiteboard_summary": "2-4 short bullet lines for the board"
}
Be accurate. Prefer AWS fundamentals. No markdown fences.`;

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
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: `Student language preference: ${language}. Doubt: "${question}"`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.35,
        }),
      }
    );

    const text = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        error: `Groq request failed (${response.status})`,
        status: response.status >= 400 && response.status < 600 ? response.status : 502,
      };
    }

    let parsedOuter: { choices?: Array<{ message?: { content?: string } }> };
    try {
      parsedOuter = JSON.parse(text) as typeof parsedOuter;
    } catch {
      return { ok: false, error: "Invalid JSON from Groq", status: 502 };
    }

    const content = parsedOuter.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return { ok: false, error: "Empty Groq response", status: 502 };
    }

    let payload: {
      answer_english?: string;
      answer_tanglish?: string;
      question_english?: string;
      question_tanglish?: string;
      whiteboard_summary?: string;
    };
    try {
      payload = JSON.parse(content) as typeof payload;
    } catch {
      return { ok: false, error: "Invalid model JSON payload", status: 502 };
    }

    return {
      ok: true,
      answer_english: String(payload.answer_english || ""),
      answer_tanglish: String(payload.answer_tanglish || ""),
      question_english: String(payload.question_english || question),
      question_tanglish: String(payload.question_tanglish || question),
      whiteboard_summary: String(payload.whiteboard_summary || "- Doubt answered"),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Groq proxy failed";
    return { ok: false, error: message, status: 500 };
  }
}
