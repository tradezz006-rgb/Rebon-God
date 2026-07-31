/**
 * Automatic Pace Progression Engine — Rebon Student Mode
 *
 * Every student starts at FRESHER and is promoted automatically when
 * transition assessments pass. No manual pace switching in MVP.
 *
 * Fresher = CS1 + CS1B (10 lessons)
 * Building Basics = CS2–CS7 (33 lessons, starts at C2.1a)
 * Total curriculum shells = 43
 *
 * Content focus: only Fresher + Building Basics are open.
 * Later paces stay locked until content ships.
 * Progress is ephemeral while EPHEMERAL_PROGRESS is true (refresh = reset).
 */

import type { StudentPaceId } from "@/types/cloudLesson";
import {
  FRESHER_LESSONS,
  BUILDING_BASICS_LESSONS,
  BUILDING_BASICS_FIRST_LESSON,
  FRESHER_SESSION_IDS as PLAN_FRESHER_SESSIONS,
  BUILDING_BASICS_SESSION_IDS as PLAN_BB_SESSIONS,
} from "./curriculumPlan";
import {
  ACTIVE_CONTENT_PACES,
  EPHEMERAL_PROGRESS,
  TESTING_UNLOCK_ALL_WORKSPACES,
  TESTING_ACCEPT_ANY_ANSWER,
  ALWAYS_SHOW_PHASE_SELECTION,
  isContentPaceOpen,
  progressGet,
  progressRemove,
  progressSet,
} from "./ephemeralProgress";
import { getVerificationRecords } from "./placement/scoring";

export const PACE_ORDER: StudentPaceId[] = [
  "fresher",
  "building_basics",
  "working_level",
  "deep_craft",
  "professional",
];

/**
 * Learning phases shown in placement / phase selection.
 * Professional is a product mode (student vs professional path), not a curriculum phase.
 */
export const LEARNING_PHASE_ORDER: StudentPaceId[] = [
  "fresher",
  "building_basics",
  "working_level",
  "deep_craft",
];

export {
  ACTIVE_CONTENT_PACES,
  EPHEMERAL_PROGRESS,
  TESTING_UNLOCK_ALL_WORKSPACES,
  TESTING_ACCEPT_ANY_ANSWER,
  ALWAYS_SHOW_PHASE_SELECTION,
  isContentPaceOpen,
};

export const PACE_META: Record<
  StudentPaceId,
  { name: string; tagline: string; color: string; hours: string }
> = {
  fresher: {
    name: "Fresher",
    tagline: "Day zero — conceptual mastery",
    color: "#F59E0B",
    hours: "~3–4 hrs",
  },
  building_basics: {
    name: "Building Basics",
    tagline: "Prove the instincts — real tickets",
    color: "#A78BFA",
    hours: "~15–20 hrs",
  },
  working_level: {
    name: "Working Level",
    tagline: "Prove on-call instincts — placement check before tickets",
    color: "#7C3AED",
    hours: "TBD",
  },
  deep_craft: {
    name: "Deep Craft",
    tagline: "Prove system architecture depth — placement check before tickets",
    color: "#10B981",
    hours: "TBD",
  },
  professional: {
    name: "Professional",
    tagline: "Mode — not a learning phase",
    color: "#10B981",
    hours: "TBD",
  },
};

/** Fresher session IDs (CS1 + CS1B) */
export const FRESHER_SESSION_IDS = PLAN_FRESHER_SESSIONS;

/** Building basics session IDs (CS2–CS7) */
export const BUILDING_BASICS_SESSION_IDS = PLAN_BB_SESSIONS;

/** Fresher lesson pipeline — CS1 then CS1B */
export const FRESHER_LESSON_ORDER = FRESHER_LESSONS.map(
  (l) => l.lesson_id
) as readonly string[];

/** Building Basics lesson pipeline — C2.1a … C7.4 */
export const BUILDING_BASICS_LESSON_ORDER = BUILDING_BASICS_LESSONS.map(
  (l) => l.lesson_id
) as readonly string[];

export { BUILDING_BASICS_FIRST_LESSON };

export const FRESHER_TRANSITION_PASS_SCORE = 7;
export const FRESHER_TRANSITION_TOTAL = 10;

const STORAGE_PACE = "rebon_student_pace";
const STORAGE_PENDING_TRANSITION = "rebon_pending_fresher_transition";
const STORAGE_TRANSITION_RESULT = "rebon_fresher_transition_result";

export function getStoredPace(): StudentPaceId {
  try {
    const raw = progressGet(STORAGE_PACE);
    if (raw && PACE_ORDER.includes(raw as StudentPaceId)) {
      const pace = raw as StudentPaceId;
      if (pace === "professional") return "fresher";
      if (isContentPaceOpen(pace)) return pace;
      if (getVerificationRecords().some((r) => r.targetPace === pace)) {
        return pace;
      }
      return "fresher";
    }
  } catch {
    /* ignore */
  }
  return "fresher";
}

export function setStoredPace(pace: StudentPaceId): void {
  // Allow verified skip-ahead paces even when content is still scaffolding.
  const verified = getVerificationRecords().some((r) => r.targetPace === pace);
  if (!isContentPaceOpen(pace) && !verified && pace !== "fresher") return;
  progressSet(STORAGE_PACE, pace);
}

export function promoteToNextPace(current: StudentPaceId): StudentPaceId | null {
  const idx = PACE_ORDER.indexOf(current);
  if (idx < 0 || idx >= PACE_ORDER.length - 1) return null;
  const next = PACE_ORDER[idx + 1];
  // Cap automatic promotion at Building Basics until later content ships —
  // higher paces require placement verification.
  if (!isContentPaceOpen(next)) return null;
  setStoredPace(next);
  return next;
}

/**
 * Pace unlock rules:
 * - Professional is never a learning phase unlock.
 * - Fresher + Building Basics open for content testing.
 * - Working Level / Deep Craft unlock only via placement verification pass.
 */
export function isPaceUnlocked(
  targetPace: StudentPaceId,
  currentPace: StudentPaceId
): boolean {
  if (targetPace === "professional") return false;
  if (isContentPaceOpen(targetPace)) {
    if (TESTING_UNLOCK_ALL_WORKSPACES) return true;
    return PACE_ORDER.indexOf(currentPace) >= PACE_ORDER.indexOf(targetPace);
  }
  // Verified skip-ahead
  if (
    getVerificationRecords().some((r) => r.targetPace === targetPace)
  ) {
    return true;
  }
  return PACE_ORDER.indexOf(currentPace) >= PACE_ORDER.indexOf(targetPace);
}

/** Workspace tickets fully cleared for this lesson */
export function isWorkspaceComplete(lessonId: string): boolean {
  return progressGet(`phoenix_progress_${lessonId}`) === "true";
}

/** Alias — historically phoenix_progress meant "lesson done"; now = workspace done */
export function isLessonComplete(lessonId: string): boolean {
  return isWorkspaceComplete(lessonId);
}

/** Lesson teaching finished (unlocks that lesson's workspace) */
export function isLessonTaught(lessonId: string): boolean {
  return (
    progressGet(`phoenix_taught_${lessonId}`) === "true" ||
    isWorkspaceComplete(lessonId)
  );
}

export function markLessonTaught(lessonId: string): void {
  progressSet(`phoenix_taught_${lessonId}`, "true");
}

/** Next Fresher lesson unlocks only after previous workspace is cleared */
export function isFresherLessonUnlocked(lessonId: string): boolean {
  if (TESTING_UNLOCK_ALL_WORKSPACES) return true;
  const idx = FRESHER_LESSON_ORDER.indexOf(lessonId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  return isWorkspaceComplete(FRESHER_LESSON_ORDER[idx - 1]);
}

/** Workspace unlocks after its lesson teaching finishes */
export function isFresherWorkspaceUnlocked(lessonId: string): boolean {
  if (
    TESTING_UNLOCK_ALL_WORKSPACES &&
    (lessonId.startsWith("C1.") ||
      lessonId.startsWith("C1B.") ||
      lessonId.startsWith("C2.") ||
      lessonId.startsWith("C3.") ||
      lessonId.startsWith("C4.") ||
      lessonId.startsWith("C5.") ||
      lessonId.startsWith("C6.") ||
      lessonId.startsWith("C7."))
  ) {
    return true;
  }
  // Building Basics / later: unlock after prior workspace + this lesson taught.
  if (/^C[2-7]/.test(lessonId)) {
    const idx = BUILDING_BASICS_LESSON_ORDER.indexOf(lessonId);
    if (idx < 0) return isLessonTaught(lessonId);
    if (idx === 0) return isLessonTaught(lessonId);
    return (
      isWorkspaceComplete(BUILDING_BASICS_LESSON_ORDER[idx - 1]) &&
      isLessonTaught(lessonId)
    );
  }
  if (!isFresherLessonUnlocked(lessonId)) return false;
  return isLessonTaught(lessonId);
}

/** Alias — Fresher + Building Basics workspace tickets */
export function isCloudWorkspaceUnlocked(lessonId: string): boolean {
  return isFresherWorkspaceUnlocked(lessonId);
}

/** Transition assessment unlocks only after WS_C1B.5 (C1B.5 workspace) */
export function isFresherTransitionUnlocked(): boolean {
  if (TESTING_UNLOCK_ALL_WORKSPACES) return true;
  return isWorkspaceComplete("C1B.5");
}

export function isFresherTrackComplete(): boolean {
  return FRESHER_LESSON_ORDER.every((id) => isWorkspaceComplete(id));
}

export function getNextFresherLesson(): string | null {
  for (const id of FRESHER_LESSON_ORDER) {
    if (!isLessonComplete(id)) return id;
  }
  return null;
}

export function getNextBuildingBasicsLesson(): string | null {
  for (const id of BUILDING_BASICS_LESSON_ORDER) {
    if (!isLessonComplete(id)) return id;
  }
  return null;
}

export function isBuildingBasicsTrackComplete(): boolean {
  return BUILDING_BASICS_LESSON_ORDER.every((id) => isLessonComplete(id));
}

export function markPendingFresherTransition(): void {
  progressSet(STORAGE_PENDING_TRANSITION, "true");
}

export function clearPendingFresherTransition(): void {
  progressRemove(STORAGE_PENDING_TRANSITION);
}

export function isPendingFresherTransition(): boolean {
  return progressGet(STORAGE_PENDING_TRANSITION) === "true";
}

export interface FresherTransitionResult {
  score: number;
  maxScore: number;
  passed: boolean;
  gapLessonIds: string[];
  completedAt: string;
}

export function saveFresherTransitionResult(
  result: FresherTransitionResult
): void {
  progressSet(STORAGE_TRANSITION_RESULT, JSON.stringify(result));
  clearPendingFresherTransition();
}

export function getFresherTransitionResult(): FresherTransitionResult | null {
  try {
    const raw = progressGet(STORAGE_TRANSITION_RESULT);
    return raw ? (JSON.parse(raw) as FresherTransitionResult) : null;
  } catch {
    return null;
  }
}

/** Map legacy placement pace IDs → student pace (migration) */
export function legacyPaceToStudentPace(legacy: string | null): StudentPaceId {
  const map: Record<string, StudentPaceId> = {
    beginner: "fresher",
    moderate: "building_basics",
    pro: "working_level",
    ultra_pro: "deep_craft",
    fresher: "fresher",
    building_basics: "building_basics",
  };
  const mapped = map[legacy ?? ""] ?? "fresher";
  return isContentPaceOpen(mapped) ? mapped : "fresher";
}
