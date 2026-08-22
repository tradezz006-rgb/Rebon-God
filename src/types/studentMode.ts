/** Student Mode — 5-day orientation (8-step live classroom schema) */

export type StudentLanguage = "english" | "tanglish";

/** 8-step interactive lesson architecture */
export type LessonBlockType =
  | "lesson_intro"
  | "concept_intro"
  | "why_companies"
  | "live_build"
  | "visual_output"
  | "student_try"
  | "mistake_simulation"
  | "mini_challenge"
  | "real_workflow"
  // legacy aliases (older JSON)
  | "what"
  | "concept"
  | "why"
  | "how"
  | "when"
  | "example"
  | "summary"
  | "check_voice"
  | "check_quiz"
  | "doubt_prompt";

export interface StudentCheckQuestion {
  question: string;
  expected_response_type?: "open" | "quiz";
  options?: string[];
  correct_index?: number;
  ren_response_if_correct: string;
  ren_response_if_incorrect: string;
  /** Optional explicit keywords; otherwise derived at runtime */
  accept_keywords?: string[];
}

export interface StudentLessonBlock {
  block?: number;
  type: LessonBlockType;
  heading: string;
  /** Always English on the board */
  board_text: string;
  /** Spoken by Ren — language-specific */
  ren_voice: string;
  /** After teaching this step — mic check (null on final workflow step) */
  check_question?: StudentCheckQuestion | null;
  // legacy flat check fields
  question?: string;
  accept_keywords?: string[];
  ren_correct?: string;
  ren_wrong?: string;
  options?: string[];
  correct_index?: number;
}

export interface StudentLessonSummary {
  board_text: string;
  ren_voice: string;
}

export interface StudentDoubtSession {
  ren_opening: string;
  wait_for_response?: boolean;
  ren_response_template?: string;
  ren_closing: string;
}

export interface StudentLessonFile {
  day: number;
  part: string;
  language: StudentLanguage;
  title: string;
  duration_minutes: number;
  blocks: StudentLessonBlock[];
  lesson_summary?: StudentLessonSummary;
  doubt_session?: StudentDoubtSession;
}

export type WorkspaceItemType = "quiz" | "scenario" | "account_id";

export interface StudentWorkspaceQuiz {
  id: string;
  type: "quiz";
  question: string;
  options: string[];
  correct_index: number;
  ren_hint_english: string;
  ren_hint_tanglish: string;
  explanation: string;
}

export interface StudentWorkspaceScenario {
  id: string;
  type: "scenario";
  situation: string;
  question: string;
  options: string[];
  correct_index: number;
  ren_hint_english: string;
  ren_hint_tanglish: string;
  explanation: string;
}

export interface StudentWorkspaceAccountId {
  id: string;
  type: "account_id";
  situation: string;
  question: string;
  expected_answer: string;
  ren_hint_english: string;
  ren_hint_tanglish: string;
  explanation: string;
}

export type StudentWorkspaceItem =
  | StudentWorkspaceQuiz
  | StudentWorkspaceScenario
  | StudentWorkspaceAccountId;

export interface StudentWorkspaceFile {
  day: number;
  language: "english";
  items: StudentWorkspaceItem[];
}

export interface ReadinessQuestion {
  id: string;
  source_day: number;
  type: WorkspaceItemType;
  question: string;
  situation?: string;
  options?: string[];
  correct_index?: number;
  expected_answer?: string;
  explanation: string;
}

export interface ReadinessCheckFile {
  total_questions: number;
  pass_threshold: number;
  time_limit_minutes: number;
  questions: ReadinessQuestion[];
  on_fail: {
    action: "surface_weakest_day";
    message_english: string;
    message_tanglish: string;
    recheck_after_revisit: boolean;
  };
  on_pass: {
    action: "unlock_professional_mode";
    message_english: string;
    message_tanglish: string;
  };
}

export interface StudentDayMeta {
  day: number;
  title: string;
  lesson_parts: string[];
  workspace: string;
  has_readiness_badge?: boolean;
}

export interface StudentCurriculum {
  mode: "student";
  total_days: number;
  hours_ceiling: number;
  hours_per_day: number;
  days: StudentDayMeta[];
  readiness_check: string;
}

const EIGHT_STEP: LessonBlockType[] = [
  "lesson_intro",
  "concept_intro",
  "why_companies",
  "live_build",
  "visual_output",
  "student_try",
  "mistake_simulation",
  "mini_challenge",
  "real_workflow",
];

const LEGACY_TEACH: LessonBlockType[] = [
  "what",
  "concept",
  "why",
  "how",
  "when",
  "example",
  "summary",
];

export function isTeachBlock(b: StudentLessonBlock): boolean {
  return (
    EIGHT_STEP.includes(b.type) ||
    LEGACY_TEACH.includes(b.type)
  );
}

export function isCheckVoiceBlock(b: StudentLessonBlock): boolean {
  return b.type === "check_voice";
}

export function isCheckQuizBlock(b: StudentLessonBlock): boolean {
  return b.type === "check_quiz";
}

export function isDoubtPromptBlock(b: StudentLessonBlock): boolean {
  return b.type === "doubt_prompt";
}

const STOP = new Set([
  "that",
  "this",
  "with",
  "from",
  "your",
  "have",
  "what",
  "when",
  "where",
  "which",
  "their",
  "there",
  "about",
  "would",
  "could",
  "should",
  "exactly",
  "right",
  "correct",
  "good",
  "think",
  "using",
  "because",
  "before",
  "after",
  "into",
  "only",
  "just",
  "also",
  "very",
  "more",
  "most",
  "than",
  "then",
  "them",
  "they",
  "were",
  "been",
  "being",
  "does",
  "doing",
]);

/** Build soft accept keywords from check_question for open mic grading. */
export function keywordsFromCheck(
  check: StudentCheckQuestion | null | undefined
): string[] {
  if (!check) return [];
  if (check.accept_keywords?.length) return check.accept_keywords;
  const blob = `${check.question} ${check.ren_response_if_correct}`.toLowerCase();
  const words = blob.match(/[a-z0-9][a-z0-9\-]{3,}/g) || [];
  const uniq = Array.from(new Set(words.filter((w) => !STOP.has(w))));
  return uniq.slice(0, 24);
}
