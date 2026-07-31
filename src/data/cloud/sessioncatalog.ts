/**
 * Phase → session catalog for Workspace + Journey Map.
 * Each session owns its own Journey Map and ticket set.
 */
import type { StudentPaceId } from "@/types/cloudLesson";
import { CLOUD_LESSON_PLAN } from "@/data/cloud/curriculumPlan";
import { fresherLessons } from "@/data/cloud/fresher";
import { buildingBasicsLessons } from "@/data/cloud/building_basics";
import { isWorkspaceComplete } from "@/data/cloud/studentModePace";
import { isInvestigationComplete } from "@/data/cloud/storyMode";
import { progressGet } from "@/data/cloud/ephemeralProgress";

export type CloudSessionId =
  | "CS1"
  | "CS1B"
  | "CS2"
  | "CS3"
  | "CS4"
  | "CS5"
  | "CS6"
  | "CS7";

export type SessionStatus = "locked" | "ready" | "in_progress" | "complete";

export type CloudSessionDef = {
  id: CloudSessionId;
  phase: StudentPaceId;
  title: string;
  blurb: string;
  /** Journey Map visual family — custom diagrams for shipped sessions */
  journey: "phoenix" | "foodquick" | "generic";
  ticketHint: string;
  /** Building Basics mega-story ticket (FQ-xxx) */
  ticket?: string;
};

export const CLOUD_SESSIONS: CloudSessionDef[] = [
  {
    id: "CS1",
    phase: "fresher",
    title: "CS1 · Cloud Foundations",
    blurb: "Project Phoenix — regions, billing, shared responsibility.",
    journey: "phoenix",
    ticketHint: "Phoenix tickets",
  },
  {
    id: "CS1B",
    phase: "fresher",
    title: "CS1B · Core Services",
    blurb: "EC2, S3, IAM, VPC, CloudWatch — service awareness tickets.",
    journey: "phoenix",
    ticketHint: "WS_C1B tickets",
  },
  {
    id: "CS2",
    phase: "building_basics",
    title: "CS2 · IAM Hands-on",
    blurb:
      "FQ-142 — the wake-up call. Secure IAM before the audit; reveal FoodQuick's 'fix later' pattern.",
    journey: "foodquick",
    ticketHint: "FQ-142 tickets",
    ticket: "FQ-142",
  },
  {
    id: "CS3",
    phase: "building_basics",
    title: "CS3 · Networking",
    blurb:
      "FQ-156 — Priya Nair. Rebuild the VPC that was stood up in one afternoon and never revisited.",
    journey: "foodquick",
    ticketHint: "FQ-156 tickets",
    ticket: "FQ-156",
  },
  {
    id: "CS4",
    phase: "building_basics",
    title: "CS4 · Compute",
    blurb:
      "FQ-171 — Ravi. Right-size compute that was Day-1 guesses for two years.",
    journey: "foodquick",
    ticketHint: "FQ-171 tickets",
    ticket: "FQ-171",
  },
  {
    id: "CS5",
    phase: "building_basics",
    title: "CS5 · Storage",
    blurb:
      "FQ-189 — CFO's office. Unmanaged S3 growth; cost hygiene after FQ-142 earned trust.",
    journey: "foodquick",
    ticketHint: "FQ-189 tickets",
    ticket: "FQ-189",
  },
  {
    id: "CS6",
    phase: "building_basics",
    title: "CS6 · Monitoring",
    blurb:
      "FQ-203 — Karthik Rao (DevOps). Stop learning about outages from Twitter.",
    journey: "foodquick",
    ticketHint: "FQ-203 tickets",
    ticket: "FQ-203",
  },
  {
    id: "CS7",
    phase: "building_basics",
    title: "CS7 · Portfolio Capstone",
    blurb:
      "FQ-218 — Ravi. Build FoodQuick properly end-to-end; explicit callback to FQ-142.",
    journey: "foodquick",
    ticketHint: "FQ-218 tickets",
    ticket: "FQ-218",
  },
];

export function sessionsForPhase(phase: StudentPaceId): CloudSessionDef[] {
  return CLOUD_SESSIONS.filter((s) => s.phase === phase);
}

export function getSessionDef(id: CloudSessionId): CloudSessionDef | undefined {
  return CLOUD_SESSIONS.find((s) => s.id === id);
}

export function sessionIdFromLessonId(lessonId: string): CloudSessionId | null {
  if (lessonId.startsWith("C1B.")) return "CS1B";
  if (lessonId.startsWith("C1.")) return "CS1";
  if (lessonId.startsWith("C2.")) return "CS2";
  if (lessonId.startsWith("C3.")) return "CS3";
  if (lessonId.startsWith("C4.")) return "CS4";
  if (lessonId.startsWith("C5.")) return "CS5";
  if (lessonId.startsWith("C6.")) return "CS6";
  if (lessonId.startsWith("C7.")) return "CS7";
  return null;
}

function lessonsForSession(sessionId: CloudSessionId) {
  if (sessionId === "CS1" || sessionId === "CS1B") {
    return fresherLessons.filter((l) => l.section_id === sessionId);
  }
  return buildingBasicsLessons.filter((l) => l.section_id === sessionId);
}

export function sessionTicketCount(sessionId: CloudSessionId): number {
  const live = lessonsForSession(sessionId).reduce(
    (n, l) => n + ((l.workspace_tasks as unknown[] | undefined)?.length || 0),
    0
  );
  if (live > 0) return live;
  return CLOUD_LESSON_PLAN.filter((l) => l.section_id === sessionId).reduce(
    (n, l) => n + l.workspace_task_count,
    0
  );
}

export function sessionHasShippedWorkspace(sessionId: CloudSessionId): boolean {
  return lessonsForSession(sessionId).some(
    (l) => ((l.workspace_tasks as unknown[] | undefined)?.length || 0) > 0
  );
}

function opsDone(lessonId: string, total: number): number {
  const raw = progressGet(`rebon_cloud_ops_${lessonId}`);
  if (raw == null) return isWorkspaceComplete(lessonId) ? total : 0;
  const idx = parseInt(raw, 10);
  if (!Number.isFinite(idx) || idx < 0) return 0;
  return Math.min(total, idx + 1);
}

export function getSessionProgress(sessionId: CloudSessionId): {
  ticketsDone: number;
  ticketsTotal: number;
  anyStarted: boolean;
  complete: boolean;
  status: SessionStatus;
} {
  const lessons = lessonsForSession(sessionId);
  const shipped = sessionHasShippedWorkspace(sessionId);

  if (!shipped) {
    return {
      ticketsDone: 0,
      ticketsTotal: sessionTicketCount(sessionId),
      anyStarted: false,
      complete: false,
      status: "locked",
    };
  }

  let ticketsDone = 0;
  let ticketsTotal = 0;
  let anyStarted = false;
  let allComplete = lessons.length > 0;

  for (const lesson of lessons) {
    const total = (lesson.workspace_tasks as unknown[] | undefined)?.length || 0;
    if (!total) {
      allComplete = false;
      continue;
    }
    ticketsTotal += total;
    const done = opsDone(lesson.lesson_id, total);
    ticketsDone += done;
    if (done > 0 || isWorkspaceComplete(lesson.lesson_id)) anyStarted = true;
    if (!isWorkspaceComplete(lesson.lesson_id) && done < total) {
      allComplete = false;
    }
  }

  // Story sessions (CS2–CS7): complete only when investigation layers seal
  const storyComplete = isInvestigationComplete(sessionId);
  const complete =
    sessionId === "CS1" || sessionId === "CS1B"
      ? allComplete && ticketsTotal > 0
      : storyComplete;

  const status: SessionStatus = !shipped
    ? "locked"
    : complete
      ? "complete"
      : anyStarted
        ? "in_progress"
        : "ready";

  return { ticketsDone, ticketsTotal, anyStarted, complete, status };
}
