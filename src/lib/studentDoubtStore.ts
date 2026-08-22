/**
 * Save Student Mode doubt Q&A into master_datas.json (dev server API)
 * with both English and Tanglish fields.
 */
export type MasterDoubtRecord = {
  lesson_id: string;
  source_language: "english" | "tanglish";
  question: { english: string; tanglish: string };
  answer: { english: string; tanglish: string };
  expected_intent: string;
  verified_response: string;
  whiteboard_summary: string;
  timestamp: string;
  context: "student_mode_doubt" | "student_mode_mid_doubt";
};

export async function saveDoubtToMasterDatas(
  record: MasterDoubtRecord
): Promise<boolean> {
  try {
    const res = await fetch("/api/save-master-datas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Ask Groq for bilingual doubt answer. */
export async function answerDoubtWithGroq(opts: {
  question: string;
  lessonTitle: string;
  lessonContext: string;
  language: "english" | "tanglish";
}): Promise<{
  answer_english: string;
  answer_tanglish: string;
  question_english: string;
  question_tanglish: string;
  whiteboard_summary: string;
}> {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) {
    const fallback =
      opts.language === "tanglish"
        ? "Indha concept paththi clear-aa solreen. Konjam rephrase panni keelungka — naan answer panreen."
        : "I can clarify this concept. Please rephrase your doubt and I will answer.";
    return {
      answer_english: fallback,
      answer_tanglish: fallback,
      question_english: opts.question,
      question_tanglish: opts.question,
      whiteboard_summary: "- Doubt noted\n- Rephrase if needed",
    };
  }

  const system = `You are Ren, a live classroom cloud tutor for Rebon Student Mode.
Lesson: ${opts.lessonTitle}
Lesson / board context:\n${opts.lessonContext.slice(0, 3500)}

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

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Student language preference: ${opts.language}. Doubt: "${opts.question}"`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.35,
      }),
    }
  );

  if (!response.ok) throw new Error(`Groq ${response.status}`);
  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return {
    answer_english: String(parsed.answer_english || ""),
    answer_tanglish: String(parsed.answer_tanglish || ""),
    question_english: String(parsed.question_english || opts.question),
    question_tanglish: String(parsed.question_tanglish || opts.question),
    whiteboard_summary: String(
      parsed.whiteboard_summary || "- Doubt answered"
    ),
  };
}
