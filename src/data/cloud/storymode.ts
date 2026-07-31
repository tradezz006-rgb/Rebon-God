/**
 * STORY-MODE WORKSPACE MECHANICS — CS2 onward
 * ───────────────────────────────────────────
 * A session is one investigation told in acts: one lesson = one act = one
 * layer of the build. Three mechanics live here:
 *
 *  1. Three attempts per task. Wrong once = nudge, twice = stronger hint,
 *     third time = the answer is revealed and the task is left UNRESOLVED.
 *  2. A lesson that ends with any unresolved task leaves its layer CRACKED.
 *     The student keeps moving, but the NEXT lesson cannot be marked
 *     complete while the crack is open.
 *  3. Repairing a crack in lesson N means re-clearing lesson N-1 first
 *     (shaky foundation, not the immediate step), then retrying only the
 *     unresolved tasks of lesson N with fresh attempts.
 */
import {
  buildingBasicsLessons,
  getBuildingBasicsWorkspaceArc,
} from "./building_basics";
import { progressGet, progressRemove, progressSet } from "./ephemeralProgress";
import type { CloudWorkspaceTask } from "@/types/cloudLesson";

export const STORY_DEFAULT_MAX_ATTEMPTS = 3;

export interface StoryAct {
  lessonId: string;
  sessionId: string;
  /** 0-based position within the session */
  index: number;
  actNumber: number;
  actTitle: string;
  buildsLayer: string;
  arcIntro?: string;
  arcOutro?: string;
  totalTasks: number;
  /** Inspect panel: what the problem actually was */
  problemRecap: string;
  /** Inspect panel: why it matters outside the lesson */
  realWorldWhy: string;
}

export interface StorySession {
  sessionId: string;
  title: string;
  company: string;
  ticket: string;
  ticketTitle: string;
  closingHeadline: string;
  closingRen: string;
  acts: StoryAct[];
}

/**
 * Recap + real-world note per act for the end-of-session inspect panels.
 * Lives here rather than in the workspace JSON because it describes the act
 * as a whole, not any single task.
 */
const INSPECT_NOTES: Record<
  string,
  { problemRecap: string; realWorldWhy: string }
> = {
  "C2.1a": {
    problemRecap:
      "Ten developers shared a single 'dev-shared' login carrying AdministratorAccess, root had MFA off with two live access keys — and an access key was created on that shared user 12 days after a contractor's project had ended, from an IP nobody recognised.",
    realWorldWhy:
      "Shared logins are why breach investigations stall on day one: CloudTrail can name the account but never the person. Individual identities are the cheapest forensic insurance a company can buy.",
  },
  "C2.1b": {
    problemRecap:
      "Long-lived access keys were hardcoded inside running services, so every deploy shipped a permanent secret. You moved those services onto IAM roles that hand out short-lived credentials instead.",
    realWorldWhy:
      "Keys leaked through git history or a container image are one of the most common causes of real AWS account compromise. A role removes the secret entirely instead of trying to hide it better.",
  },
  "C2.2": {
    problemRecap:
      "Account-wide policies used wildcards, so any workload could do anything to anything. You rewrote them to the exact actions and resources each job needs — and the audit surfaced a second unexplained access along the way.",
    realWorldWhy:
      "Wildcard policies turn one stolen credential into a full account takeover. Scoped policies are what keep an incident down to a single bucket instead of the whole company.",
  },
  "C2.3": {
    problemRecap:
      "The CloudTrail anomaly from Act 1 and the extra access from Act 3 connected: a permission left over from an old setup task let someone create a hidden admin user that had been sitting in the account for months.",
    realWorldWhy:
      "Forgotten permissions are the #1 quietly-exploited gap in company AWS accounts. Access reviews exist precisely because nobody notices the door that was never closed.",
  },
  "C2.4": {
    problemRecap:
      "With the account clean, you built new trust deliberately: cross-account roles for the CI/CD pipeline and scoped, time-bound access for an external vendor — with ExternalId instead of shared keys.",
    realWorldWhy:
      "Vendor and pipeline access is how a third party becomes your blast radius. The confused-deputy problem is exactly why ExternalId exists in real AWS integrations.",
  },
  "C2.5": {
    problemRecap:
      "The final hardening pass before the audit: root MFA, a real password policy, Organizations with SCPs as guardrails, then the pre-audit checklist that closed FQ-142 for good.",
    realWorldWhy:
      "Guardrails beat good intentions. An SCP makes the dangerous action impossible instead of trusting every future engineer to remember the rule.",
  },
};

const SESSION_STORY: Record<
  string,
  Omit<StorySession, "acts" | "sessionId">
> = {
  CS2: {
    title: "Secure IAM before the audit",
    company: "FoodQuick",
    ticket: "FQ-142",
    ticketTitle: "Secure IAM before audit",
    closingHeadline: "FQ-142 closed — the account is yours now",
    closingRen:
      "ஆறு layers, ஒரே investigation. Act 1-ல 'something to watch'-ன்னு விட்ட அந்த CloudTrail entry — Act 4-ல அது தான் backdoor admin-ஆ வெளிய வந்துச்சு. இதை நீங்க கண்டுபிடிச்சு, மூடிட்டீங்க. FoodQuick-ன் account இப்போ audit-க்கு தயார்.",
  },
  CS3: {
    title: "Rebuild the network that never got reviewed",
    company: "FoodQuick",
    ticket: "FQ-156",
    ticketTitle: "VPC & network hygiene",
    closingHeadline: "FQ-156 closed — traffic has a real path home",
    closingRen:
      "Default VPC to deliberate network. Public, private, NAT, SG, NACL, DNS — every layer you sealed shows on the Mission board. Priya can sleep.",
  },
  CS4: {
    title: "Right-size compute that was Day-1 guesses",
    company: "FoodQuick",
    ticket: "FQ-171",
    ticketTitle: "EC2 fleet & elasticity",
    closingHeadline: "FQ-171 closed — the fleet scales on purpose",
    closingRen:
      "AMI discipline, ALB, ASG, pricing mix — Ravi's Day-1 guesses are gone. The board shows a compute path that holds under lunch rush.",
  },
  CS5: {
    title: "Storage that doesn't quietly bankrupt us",
    company: "FoodQuick",
    ticket: "FQ-189",
    ticketTitle: "S3, EBS & cost hygiene",
    closingHeadline: "FQ-189 closed — buckets behave",
    closingRen:
      "Lifecycle, Block Public Access, encryption, EBS — the CFO's spreadsheet and the architecture finally agree.",
  },
  CS6: {
    title: "Stop learning about outages from Twitter",
    company: "FoodQuick",
    ticket: "FQ-203",
    ticketTitle: "Observability & guardrails",
    closingHeadline: "FQ-203 closed — signals before symptoms",
    closingRen:
      "Dashboards, alarms, CloudTrail, Config, budgets — Karthik hears from CloudWatch first, not customers.",
  },
  CS7: {
    title: "Build FoodQuick properly, end to end",
    company: "FoodQuick",
    ticket: "FQ-218",
    ticketTitle: "Portfolio capstone rebuild",
    closingHeadline: "FQ-218 closed — the platform you can defend",
    closingRen:
      "Blueprint → network → app → data → observability → proof. FQ-142's wake-up call paid off. This is the architecture you own.",
  },
};

function sessionIdForLesson(lessonId: string): string {
  const lesson = buildingBasicsLessons.find((l) => l.lesson_id === lessonId);
  if (lesson?.section_id) return lesson.section_id;
  const match = /^C(\d+)/.exec(lessonId);
  return match ? `CS${match[1]}` : "";
}

const STORY_SESSIONS: Record<string, StorySession> = (() => {
  const bySession: Record<string, StoryAct[]> = {};

  for (const lesson of buildingBasicsLessons) {
    const arc = getBuildingBasicsWorkspaceArc(lesson.lesson_id);
    if (!arc) continue;
    const sessionId = lesson.section_id || sessionIdForLesson(lesson.lesson_id);
    const notes = INSPECT_NOTES[lesson.lesson_id];
    (bySession[sessionId] ||= []).push({
      lessonId: lesson.lesson_id,
      sessionId,
      index: 0,
      actNumber: arc.act_number,
      actTitle: arc.act_title,
      buildsLayer: arc.builds_layer,
      arcIntro: arc.arc_intro,
      arcOutro: arc.arc_outro,
      totalTasks: arc.total_tasks ?? 0,
      problemRecap: notes?.problemRecap ?? arc.arc_intro ?? "",
      realWorldWhy: notes?.realWorldWhy ?? "",
    });
  }

  const sessions: Record<string, StorySession> = {};
  for (const [sessionId, acts] of Object.entries(bySession)) {
    acts.sort((a, b) => a.actNumber - b.actNumber);
    acts.forEach((act, i) => {
      act.index = i;
    });
    const story = SESSION_STORY[sessionId];
    sessions[sessionId] = {
      sessionId,
      title: story?.title ?? sessionId,
      company: story?.company ?? "Client",
      ticket: story?.ticket ?? sessionId,
      ticketTitle: story?.ticketTitle ?? sessionId,
      closingHeadline: story?.closingHeadline ?? "Investigation complete",
      closingRen: story?.closingRen ?? "",
      acts,
    };
  }
  return sessions;
})();

export function getStorySession(sessionId: string): StorySession | null {
  return STORY_SESSIONS[sessionId] ?? null;
}

export function getStorySessionForLesson(lessonId: string): StorySession | null {
  return getStorySession(sessionIdForLesson(lessonId));
}

export function getStoryAct(lessonId: string): StoryAct | null {
  const session = getStorySessionForLesson(lessonId);
  return session?.acts.find((a) => a.lessonId === lessonId) ?? null;
}

export function isStoryLesson(lessonId: string): boolean {
  return Boolean(getStoryAct(lessonId));
}

/* ───────────────────────── attempts ───────────────────────── */

const attemptKey = (lessonId: string, taskId: string) =>
  `rebon_story_attempts_${lessonId}::${taskId}`;
const unresolvedKey = (lessonId: string) => `rebon_story_unresolved_${lessonId}`;
const repairedKey = (lessonId: string) => `rebon_story_repaired_${lessonId}`;
const reclearKey = (lessonId: string) => `rebon_story_reclear_${lessonId}`;
const opsPointerKey = (lessonId: string) => `rebon_cloud_ops_${lessonId}`;

export function maxAttemptsFor(task: Pick<CloudWorkspaceTask, "max_attempts">) {
  return task.max_attempts && task.max_attempts > 0
    ? task.max_attempts
    : STORY_DEFAULT_MAX_ATTEMPTS;
}

export function getAttemptsUsed(lessonId: string, taskId: string): number {
  const raw = progressGet(attemptKey(lessonId, taskId));
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export type AttemptStage = "nudge" | "strong_hint" | "reveal";

export interface AttemptOutcome {
  attemptsUsed: number;
  attemptsLeft: number;
  maxAttempts: number;
  stage: AttemptStage;
  /** true when the third strike landed and the task is now unresolved */
  unresolved: boolean;
}

/** Record a wrong answer and return what Ren should do about it. */
export function registerWrongAttempt(
  lessonId: string,
  taskId: string,
  maxAttempts = STORY_DEFAULT_MAX_ATTEMPTS
): AttemptOutcome {
  const attemptsUsed = Math.min(
    getAttemptsUsed(lessonId, taskId) + 1,
    maxAttempts
  );
  progressSet(attemptKey(lessonId, taskId), String(attemptsUsed));

  const attemptsLeft = Math.max(0, maxAttempts - attemptsUsed);
  const stage: AttemptStage =
    attemptsLeft === 0 ? "reveal" : attemptsUsed === 1 ? "nudge" : "strong_hint";

  if (stage === "reveal") markTaskUnresolved(lessonId, taskId);

  return {
    attemptsUsed,
    attemptsLeft,
    maxAttempts,
    stage,
    unresolved: stage === "reveal",
  };
}

export function resetAttempts(lessonId: string, taskId: string): void {
  progressRemove(attemptKey(lessonId, taskId));
}

/* ──────────────────── unresolved / cracks ─────────────────── */

export function getUnresolvedTaskIds(lessonId: string): string[] {
  const raw = progressGet(unresolvedKey(lessonId));
  if (!raw) return [];
  return raw.split(",").filter(Boolean);
}

export function markTaskUnresolved(lessonId: string, taskId: string): void {
  const current = getUnresolvedTaskIds(lessonId);
  if (current.includes(taskId)) return;
  progressSet(unresolvedKey(lessonId), [...current, taskId].join(","));
}

export function clearTaskUnresolved(lessonId: string, taskId: string): void {
  const next = getUnresolvedTaskIds(lessonId).filter((id) => id !== taskId);
  if (next.length) progressSet(unresolvedKey(lessonId), next.join(","));
  else progressRemove(unresolvedKey(lessonId));
}

export function isTaskUnresolved(lessonId: string, taskId: string): boolean {
  return getUnresolvedTaskIds(lessonId).includes(taskId);
}

export function isLessonCleared(lessonId: string): boolean {
  return progressGet(`phoenix_progress_${lessonId}`) === "true";
}

export function wasLessonRepaired(lessonId: string): boolean {
  return progressGet(repairedKey(lessonId)) === "true";
}

export type LayerStatus =
  | "not_reached"
  | "in_progress"
  | "clean"
  | "repaired"
  | "cracked";

export function getLayerStatus(lessonId: string): LayerStatus {
  const cracked = getUnresolvedTaskIds(lessonId).length > 0;
  const cleared = isLessonCleared(lessonId);
  if (cracked) return "cracked";
  if (cleared) return wasLessonRepaired(lessonId) ? "repaired" : "clean";
  const started = progressGet(opsPointerKey(lessonId)) !== null;
  return started ? "in_progress" : "not_reached";
}

export function isLayerCracked(lessonId: string): boolean {
  return getLayerStatus(lessonId) === "cracked";
}

export interface LayerSegment {
  act: StoryAct;
  status: LayerStatus;
  unresolvedCount: number;
  isCurrent: boolean;
}

export function getSessionBuild(
  sessionId: string,
  currentLessonId?: string
): LayerSegment[] {
  const session = getStorySession(sessionId);
  if (!session) return [];
  return session.acts.map((act) => ({
    act,
    status: getLayerStatus(act.lessonId),
    unresolvedCount: getUnresolvedTaskIds(act.lessonId).length,
    isCurrent: act.lessonId === currentLessonId,
  }));
}

export function getSessionBuildForLesson(lessonId: string): LayerSegment[] {
  return getSessionBuild(sessionIdForLesson(lessonId), lessonId);
}

/** Every act cleared, no crack left anywhere. */
export function isInvestigationComplete(sessionId: string): boolean {
  const session = getStorySession(sessionId);
  if (!session) return false;
  return session.acts.every((act) => {
    const status = getLayerStatus(act.lessonId);
    return status === "clean" || status === "repaired";
  });
}

/* ─────────────────────── repair routing ───────────────────── */

export interface RepairPlan {
  /** Lesson whose layer is cracked */
  crackedLessonId: string;
  crackedActTitle: string;
  crackedLayer: string;
  /** Lesson that must be re-cleared first (foundation) */
  reinforceLessonId: string;
  reinforceActTitle: string;
  unresolvedTaskIds: string[];
  /** Foundation lesson already re-cleared → cracked tasks are open for retry */
  reinforceCleared: boolean;
  /** Same lesson is its own foundation (act 1 has nothing before it) */
  selfReinforce: boolean;
  renSays: string;
}

export function getRepairPlan(crackedLessonId: string): RepairPlan | null {
  const unresolvedTaskIds = getUnresolvedTaskIds(crackedLessonId);
  if (!unresolvedTaskIds.length) return null;

  const session = getStorySessionForLesson(crackedLessonId);
  const act = getStoryAct(crackedLessonId);
  if (!session || !act) return null;

  const previous = act.index > 0 ? session.acts[act.index - 1] : null;
  const forceRebuild =
    progressGet(`rebon_story_rebuild_${crackedLessonId}`) === "true";
  const reinforce = forceRebuild ? act : previous ?? act;
  const selfReinforce = !previous || forceRebuild;

  const renSays = selfReinforce
    ? forceRebuild
      ? `This break in ${act.actTitle} is too large to patch in place. Rebuild this act from ticket 1 — same as rolling back a bad production change.`
      : `இந்த crack ${act.actTitle}-ல தான் இருக்கு, இதுக்கு முன்னாடி வேற act இல்ல. So this act-ஐ முதல்ல இருந்து முழுசா re-clear பண்ணுங்க — அப்புறம் இந்த piece hold ஆகும்.`
    : `This crack in ${act.actTitle} traces back to something not fully solid in ${previous!.actTitle}. அதை முதல்ல reinforce பண்ணுவோம் — அப்புறம் இது தானா hold ஆகும்.`;

  return {
    crackedLessonId,
    crackedActTitle: act.actTitle,
    crackedLayer: act.buildsLayer,
    reinforceLessonId: reinforce.lessonId,
    reinforceActTitle: reinforce.actTitle,
    unresolvedTaskIds,
    reinforceCleared: progressGet(reclearKey(crackedLessonId)) === "true",
    selfReinforce,
    renSays,
  };
}

/**
 * A crack in the previous act blocks THIS act from being marked complete.
 * Returns the repair plan that has to be worked through first.
 */
export function getCompletionBlock(lessonId: string): RepairPlan | null {
  const session = getStorySessionForLesson(lessonId);
  const act = getStoryAct(lessonId);
  if (!session || !act || act.index === 0) return null;
  const previous = session.acts[act.index - 1];
  if (!isLayerCracked(previous.lessonId)) return null;
  return getRepairPlan(previous.lessonId);
}

/**
 * Send the student back to reinforce the foundation lesson: its ticket queue
 * is reset so it has to be walked end to end again.
 */
export function beginCrackRepair(crackedLessonId: string): RepairPlan | null {
  const plan = getRepairPlan(crackedLessonId);
  if (!plan) return null;
  if (plan.selfReinforce) {
    progressSet(reclearKey(crackedLessonId), "true");
    for (const taskId of plan.unresolvedTaskIds)
      resetAttempts(crackedLessonId, taskId);
    // Full rebuild: walk the act from ticket 1 again
    if (progressGet(`rebon_story_rebuild_${crackedLessonId}`) === "true") {
      progressRemove(opsPointerKey(crackedLessonId));
    }
    return getRepairPlan(crackedLessonId);
  }
  progressRemove(opsPointerKey(plan.reinforceLessonId));
  progressRemove(reclearKey(crackedLessonId));
  return plan;
}

/**
 * Called whenever a lesson's ticket queue is fully resolved. Closes the loop
 * for any crack that was waiting on this lesson as its foundation, and marks
 * a previously cracked lesson repaired once its unresolved tasks are clean.
 */
export function notifyLessonCleared(lessonId: string): void {
  const session = getStorySessionForLesson(lessonId);
  if (!session) return;

  for (const act of session.acts) {
    const plan = getRepairPlan(act.lessonId);
    if (plan && plan.reinforceLessonId === lessonId && !plan.selfReinforce) {
      progressSet(reclearKey(act.lessonId), "true");
      for (const taskId of plan.unresolvedTaskIds)
        resetAttempts(act.lessonId, taskId);
    }
  }
}

/** Cracks anywhere in the session that still need work, foundation-first. */
export function getOpenRepairPlans(sessionId: string): RepairPlan[] {
  const session = getStorySession(sessionId);
  if (!session) return [];
  return session.acts
    .map((act) => getRepairPlan(act.lessonId))
    .filter((plan): plan is RepairPlan => Boolean(plan));
}

/** A crack whose foundation is already reinforced — ready for a fresh attempt. */
export function getRetryableCrack(
  sessionId: string,
  excludeLessonId?: string
): RepairPlan | null {
  return (
    getOpenRepairPlans(sessionId).find(
      (plan) =>
        plan.reinforceCleared && plan.crackedLessonId !== excludeLessonId
    ) ?? null
  );
}

/** Mark a cracked task solved on retry; seals the layer when it was the last one. */
export function resolveCrackedTask(lessonId: string, taskId: string): void {
  if (!isTaskUnresolved(lessonId, taskId)) return;
  clearTaskUnresolved(lessonId, taskId);
  resetAttempts(lessonId, taskId);
  if (!getUnresolvedTaskIds(lessonId).length) {
    progressSet(repairedKey(lessonId), "true");
    progressRemove(reclearKey(lessonId));
    progressRemove(`rebon_story_rebuild_${lessonId}`);
  }
}

/** True when the student may retry a cracked task right now. */
export function canRetryCrackedTask(lessonId: string, taskId: string): boolean {
  if (!isTaskUnresolved(lessonId, taskId)) return true;
  const plan = getRepairPlan(lessonId);
  return Boolean(plan?.reinforceCleared);
}

/** Private, student-only record for the inspect panel. */
export function getLayerBadge(lessonId: string): {
  label: string;
  tone: "clean" | "repaired" | "open";
} {
  const status = getLayerStatus(lessonId);
  if (status === "clean")
    return { label: "Resolved clean, first pass", tone: "clean" };
  if (status === "repaired") {
    const session = getStorySessionForLesson(lessonId);
    const act = getStoryAct(lessonId);
    const previous =
      session && act && act.index > 0 ? session.acts[act.index - 1] : null;
    return {
      label: previous
        ? `Resolved after reinforcing ${previous.lessonId}`
        : "Resolved after a repair pass",
      tone: "repaired",
    };
  }
  return { label: "Still open", tone: "open" };
}
