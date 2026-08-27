/**
 * Save Student Mode doubt Q&A into master_datas.json (dev server API)
 * with both English and Tanglish fields.
 *
 * Groq calls go through POST /api/student-doubt (server holds GROQ_API_KEY).
 */
import { safeFetchJson } from "@/lib/safeFetch";
import { sanitizePlainText } from "@/lib/sanitize";

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

export type DoubtAnswerResult = {
  answer_english: string;
  answer_tanglish: string;
  question_english: string;
  question_tanglish: string;
  whiteboard_summary: string;
};

type StudentDoubtApiResponse = DoubtAnswerResult & {
  error?: string;
};

type SaveMasterDatasResponse = {
  ok?: boolean;
  error?: string;
};

function doubtFallback(
  question: string,
  language: "english" | "tanglish"
): DoubtAnswerResult {
  const fallback =
    language === "tanglish"
      ? "Indha concept paththi clear-aa solreen. Konjam rephrase panni keelungka — naan answer panreen."
      : "I can clarify this concept. Please rephrase your doubt and I will answer.";
  return {
    answer_english: fallback,
    answer_tanglish: fallback,
    question_english: question,
    question_tanglish: question,
    whiteboard_summary: "- Doubt noted\n- Rephrase if needed",
  };
}

export async function saveDoubtToMasterDatas(
  record: MasterDoubtRecord
): Promise<boolean> {
  const result = await safeFetchJson<SaveMasterDatasResponse>("/api/save-master-datas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
    timeoutMs: 12_000,
    retryOnce: true,
  });
  return result.ok;
}

/** Ask Groq via server proxy. Never throws — returns a safe fallback on failure. */
export async function answerDoubtWithGroq(opts: {
  question: string;
  lessonTitle: string;
  lessonContext: string;
  language: "english" | "tanglish";
}): Promise<DoubtAnswerResult> {
  const result = await safeFetchJson<StudentDoubtApiResponse>("/api/student-doubt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: opts.question,
      lessonTitle: opts.lessonTitle,
      lessonContext: opts.lessonContext,
      language: opts.language,
    }),
    timeoutMs: 25_000,
    retryOnce: true,
  });

  if (!result.ok) {
    return doubtFallback(opts.question, opts.language);
  }

  const data = result.data;
  if (
    !data ||
    typeof data.answer_english !== "string" ||
    typeof data.answer_tanglish !== "string"
  ) {
    return doubtFallback(opts.question, opts.language);
  }

  return {
    answer_english: sanitizePlainText(data.answer_english, { maxLength: 4000 }),
    answer_tanglish: sanitizePlainText(data.answer_tanglish, { maxLength: 4000 }),
    question_english: sanitizePlainText(data.question_english || opts.question, {
      maxLength: 2000,
    }),
    question_tanglish: sanitizePlainText(data.question_tanglish || opts.question, {
      maxLength: 2000,
    }),
    whiteboard_summary: sanitizePlainText(data.whiteboard_summary || "- Doubt answered", {
      maxLength: 1000,
    }),
  };
}
