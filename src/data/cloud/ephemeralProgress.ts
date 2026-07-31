/**
 * Testing / content-authoring mode
 * ─────────────────────────────────
 * Only Fresher + Building Basics are open for content work.
 * Progress lives in memory only — a page refresh wipes everything so
 * you can re-walk the pipeline without hunting finished flags.
 */
import type { StudentPaceId } from "@/types/cloudLesson";

/** Paces currently receiving content (everything else stays locked). */
export const ACTIVE_CONTENT_PACES: readonly StudentPaceId[] = [
  "fresher",
  "building_basics",
] as const;

/** When true, progress never hits localStorage / supabase. */
export const EPHEMERAL_PROGRESS = true;

/**
 * When true, every Fresher / Building Basics workspace ticket is open —
 * no lesson-taught / sequential ticket gates — so content can be tested freely.
 */
export const TESTING_UNLOCK_ALL_WORKSPACES = true;

/**
 * When true, any selected option or typed answer is treated as correct
 * across workspace tickets, placement gates, and transition assessments.
 * Flip to false when real grading should return.
 */
export const TESTING_ACCEPT_ANY_ANSWER = true;

/**
 * Runtime override for the flag above, so the three-attempt / crack mechanic
 * can be exercised from the workspace UI without a rebuild.
 */
let acceptAnyOverride: boolean | null = null;

export function isAcceptAnyAnswerActive(): boolean {
  return acceptAnyOverride ?? TESTING_ACCEPT_ANY_ANSWER;
}

export function setAcceptAnyAnswerActive(active: boolean): void {
  acceptAnyOverride = active;
}

/**
 * When true, the cloud phase-selection screen shows on every Learning visit
 * (treat every account like a new user for that session).
 */
export const ALWAYS_SHOW_PHASE_SELECTION = true;

const memory = new Map<string, string>();

const PERSIST_PREFIXES = [
  "phoenix_progress_",
  "phoenix_taught_",
  "phoenix_briefing_",
  "phoenix_intro_played",
  "phoenix_finale_played",
  "rebon_cloud_ops_",
  "rebon_student_pace",
  "rebon_pending_fresher_transition",
  "rebon_fresher_transition_result",
  "rebon_placement_verifications",
  "rebon_placement_retry_",
  "rebon_story_attempts_",
  "rebon_story_unresolved_",
  "rebon_story_repaired_",
  "rebon_story_reclear_",
  "rebon_story_celebrated_",
  "lesson_mail_read_",
  "lesson_mail_reply_",
];

function isProgressKey(key: string): boolean {
  return PERSIST_PREFIXES.some(
    (p) => key === p || key.startsWith(p)
  );
}

/** Wipe any leftover durable progress from earlier testing sessions. */
export function clearDurableProgress(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isProgressKey(key)) doomed.push(key);
    }
    for (const key of doomed) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  memory.clear();
}

if (typeof window !== "undefined" && EPHEMERAL_PROGRESS) {
  clearDurableProgress();
}

export function progressGet(key: string): string | null {
  if (EPHEMERAL_PROGRESS) {
    return memory.has(key) ? memory.get(key)! : null;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function progressSet(key: string, value: string): void {
  if (EPHEMERAL_PROGRESS) {
    memory.set(key, value);
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function progressRemove(key: string): void {
  if (EPHEMERAL_PROGRESS) {
    memory.delete(key);
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function isContentPaceOpen(pace: StudentPaceId): boolean {
  return (ACTIVE_CONTENT_PACES as readonly string[]).includes(pace);
}
