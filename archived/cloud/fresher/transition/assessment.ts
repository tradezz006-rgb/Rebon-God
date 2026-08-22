/**
 * Fresher → Building Basics transition.
 * Payload: ./assessment.json
 */
import assessmentData from "./assessment.json";
import { TESTING_ACCEPT_ANY_ANSWER } from "@/data/cloud/ephemeralProgress";

export interface FresherTransitionQuestion {
  id: string;
  gapLessonId?: string;
  if_wrong_route_to?: string;
  contextLabel: string;
  context: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  type?: string;
  difficulty?: string;
  source_lesson?: string;
}

type RawQuestion = {
  id: string;
  source_lesson?: string;
  type?: string;
  difficulty?: string;
  question: string;
  options?: string[];
  correct_index?: number;
  correctIndex?: number;
  explanation?: string;
  if_wrong_route_to?: string;
  gapLessonId?: string;
  contextLabel?: string;
  context?: string;
};

type AssessmentPayload = {
  id?: string;
  title?: string;
  ren_intro?: string;
  duration_minutes?: number;
  total_questions?: number;
  pass_threshold?: number;
  pass_score?: number;
  questions?: RawQuestion[];
  scoring?: {
    pass_score?: number;
    ren_pass_message?: string;
    ren_fail_message?: string;
  };
  after_pass?: {
    unlock?: string;
    ren_narration?: string;
  };
};

const payload = assessmentData as AssessmentPayload;

function stripOptionPrefix(opt: string) {
  return String(opt).replace(/^[A-D]\)\s*/, "");
}

function normalizeQuestion(q: RawQuestion): FresherTransitionQuestion {
  const routeTo = q.if_wrong_route_to || q.gapLessonId || q.source_lesson;
  return {
    id: q.id,
    source_lesson: q.source_lesson,
    type: q.type,
    difficulty: q.difficulty,
    gapLessonId: routeTo,
    if_wrong_route_to: routeTo,
    contextLabel: q.contextLabel || q.source_lesson || "Fresher Transition",
    context:
      q.context ||
      `Source concept: ${q.source_lesson || "Fresher foundations"}`,
    question: q.question,
    options: (q.options || []).map(stripOptionPrefix),
    correctIndex: q.correctIndex ?? q.correct_index ?? 0,
    explanation: q.explanation || "",
  };
}

export const FRESHER_TRANSITION_META = {
  id: payload.id || "fresher_to_building_basics",
  title: payload.title || "Fresher Transition Assessment",
  renIntro: payload.ren_intro || "",
  durationMinutes: payload.duration_minutes || 15,
  passScore:
    payload.pass_threshold ??
    payload.pass_score ??
    payload.scoring?.pass_score ??
    7,
  renPassMessage:
    payload.scoring?.ren_pass_message ||
    payload.after_pass?.ren_narration ||
    "",
  renFailMessage: payload.scoring?.ren_fail_message || "",
  unlockTarget: payload.after_pass?.unlock || "building_basics/cs2/C2.1a",
};

export const FRESHER_TRANSITION_QUESTIONS: FresherTransitionQuestion[] =
  Array.isArray(payload.questions)
    ? payload.questions.map(normalizeQuestion)
    : [];

export function scoreFresherTransition(
  answers: { questionId: string; selectedIndex: number }[]
): {
  score: number;
  maxScore: number;
  passed: boolean;
  gapLessonIds: string[];
  wrongByLesson: Record<string, number>;
} {
  const maxScore = FRESHER_TRANSITION_QUESTIONS.length;
  let score = 0;
  const wrongByLesson: Record<string, number> = {};
  const passScore = FRESHER_TRANSITION_META.passScore;

  // Testing mode: any selected option counts as correct → always pass.
  if (TESTING_ACCEPT_ANY_ANSWER) {
    FRESHER_TRANSITION_QUESTIONS.forEach((q) => {
      const a = answers.find((x) => x.questionId === q.id);
      if (a && typeof a.selectedIndex === "number") score += 1;
    });
    return {
      score: Math.max(score, maxScore),
      maxScore,
      passed: maxScore > 0,
      gapLessonIds: [],
      wrongByLesson: {},
    };
  }

  FRESHER_TRANSITION_QUESTIONS.forEach((q) => {
    const a = answers.find((x) => x.questionId === q.id);
    if (a && a.selectedIndex === q.correctIndex) {
      score += 1;
    } else {
      const route = q.if_wrong_route_to || q.gapLessonId;
      if (route) {
        wrongByLesson[route] = (wrongByLesson[route] || 0) + 1;
      }
    }
  });

  const gapLessonIds = Object.entries(wrongByLesson)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, 2);

  const passed = maxScore === 0 ? false : score >= passScore;
  return {
    score,
    maxScore,
    passed,
    gapLessonIds: passed ? [] : gapLessonIds,
    wrongByLesson,
  };
}
