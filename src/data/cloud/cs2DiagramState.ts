/**
 * FoodQuick FQ-142 — diagram + mystery-pin state.
 * Visual language matches Fresher's Project Phoenix board
 * (region boundary, service boxes, live unlocks, ghost-style pins).
 */
import {
  getLayerStatus,
  getStorySession,
  type LayerStatus,
} from "./storyMode";

export type NodeTone =
  | "hidden"
  | "ghost"
  | "broken"
  | "warning"
  | "progress"
  | "resolved"
  | "mystery";

export type PolicyLineTone = "hidden" | "broad" | "precise";

/** Evidence pins — same family as Fresher's Ghost Resources. */
export type MysteryPinId = "access_key" | "admin_role" | "timeline" | "vikram";

export type MysteryPinState = {
  id: MysteryPinId;
  phase: "hidden" | "open" | "pulse" | "resolved";
  label: string;
  sub?: string;
};

export interface Cs2LiveUnlock {
  id: string;
  label: string;
}

export interface Cs2DiagramState {
  focusAct: number;
  inspectAct: number | null;

  // Identity (Act 1)
  root: NodeTone;
  rootMfa: boolean;
  rootKeysGone: boolean;
  devShared: NodeTone;
  individualUsers: NodeTone;
  groups: NodeTone;

  // Service trust (Act 2)
  lambda: NodeTone;
  ec2: NodeTone;
  rolesAttached: boolean;

  // Access precision (Act 3)
  policyLines: PolicyLineTone;

  // Integrations (Act 5)
  cicd: NodeTone;
  vendor: NodeTone;

  // Perimeter (Act 6)
  orgScp: NodeTone;
  perimeterSecured: boolean;

  /** Mystery evidence pins on the board */
  pins: MysteryPinState[];
  /** Draw the red-string / gold converging lines (Act 4 payoff) */
  evidenceLinked: boolean;

  layerStatuses: Record<string, LayerStatus>;
  recentPulse: string | null;
  /** Live checkmarks above the diagram — Fresher pattern */
  liveUnlocks: Cs2LiveUnlock[];
}

function hasTask(completed: Set<string>, id: string) {
  return completed.has(id);
}

function sealed(status: LayerStatus) {
  return status === "clean" || status === "repaired";
}

function cracked(status: LayerStatus) {
  return status === "cracked";
}

const CS2_TASK_UNLOCKS: Record<string, string> = {
  "C2.1a-T5": "Root locked · MFA on, keys deleted",
  "C2.1a-T7": "Unexplained access key pinned",
  "C2.1a-T8": "dev-shared fully deactivated",
  "C2.1a-T9": "Identity process locked in",
  "C2.1b-T7": "Forgotten admin role pinned",
  "C2.1b-T8": "Service roles scoped clean",
  "C2.2-T8": "Timeline connection spotted",
  "C2.2-T9": "Policy lines scoped precise",
  "C2.3-T6": "Vikram — three threads, one answer",
  "C2.3-T8": "Access hygiene sealed",
  "C2.4-T8": "Cross-account trust built",
  "C2.5-T9": "Perimeter secured",
};

/**
 * Derive the FoodQuick diagram from session layer status + current-act tickets.
 */
export function deriveCs2DiagramState(opts: {
  currentLessonId: string;
  completedTaskIds: string[];
  /** Session-wide completed task ids (for mystery pins across acts) */
  sessionCompletedTaskIds?: string[];
  focusAct?: number;
  inspectAct?: number | null;
  celebrateAct?: number | null;
}): Cs2DiagramState {
  const session = getStorySession("CS2");
  const layerStatuses: Record<string, LayerStatus> = {};
  for (const act of session?.acts ?? []) {
    layerStatuses[act.lessonId] = getLayerStatus(act.lessonId);
  }

  const s = (id: string) => layerStatuses[id] ?? "not_reached";
  const done = new Set([
    ...(opts.sessionCompletedTaskIds || []),
    ...opts.completedTaskIds,
  ]);
  // Also treat sealed acts as having completed their key milestone tasks
  const markSealedMilestones = (lessonId: string, milestones: string[]) => {
    if (sealed(s(lessonId)) || cracked(s(lessonId))) {
      for (const m of milestones) done.add(m);
    }
  };
  markSealedMilestones("C2.1a", [
    "C2.1a-T5",
    "C2.1a-T7",
    "C2.1a-T8",
    "C2.1a-T9",
    "C2.1a-T10",
  ]);
  markSealedMilestones("C2.1b", ["C2.1b-T7", "C2.1b-T8", "C2.1b-T10"]);
  markSealedMilestones("C2.2", ["C2.2-T8", "C2.2-T9", "C2.2-T14"]);
  markSealedMilestones("C2.3", ["C2.3-T6", "C2.3-T8", "C2.3-T12"]);
  markSealedMilestones("C2.4", ["C2.4-T8", "C2.4-T10"]);
  markSealedMilestones("C2.5", ["C2.5-T9", "C2.5-T10"]);

  const inAct = (lessonId: string) => opts.currentLessonId === lessonId;
  const a1 = s("C2.1a");
  const a2 = s("C2.1b");
  const a3 = s("C2.2");
  const a4 = s("C2.3");
  const a5 = s("C2.4");
  const a6 = s("C2.5");

  let root: NodeTone = "hidden";
  let rootMfa = false;
  let rootKeysGone = false;
  let devShared: NodeTone = "hidden";
  let individualUsers: NodeTone = "hidden";
  let groups: NodeTone = "hidden";
  let recentPulse: string | null = null;

  if (sealed(a1) || cracked(a1) || a1 === "in_progress" || inAct("C2.1a")) {
    const mapped =
      sealed(a1) ||
      cracked(a1) ||
      hasTask(done, "C2.1a-T3") ||
      hasTask(done, "C2.1a-T4");
    const rootFixed = sealed(a1) || cracked(a1) || hasTask(done, "C2.1a-T5");
    const sharedGone = sealed(a1) || cracked(a1) || hasTask(done, "C2.1a-T8");
    const processSet =
      sealed(a1) ||
      cracked(a1) ||
      hasTask(done, "C2.1a-T9") ||
      hasTask(done, "C2.1a-T10");

    if (
      mapped ||
      hasTask(done, "C2.1a-T1") ||
      hasTask(done, "C2.1a-T2") ||
      inAct("C2.1a")
    ) {
      root = rootFixed ? "resolved" : "broken";
      rootMfa = rootFixed;
      rootKeysGone = rootFixed;
      devShared = sharedGone
        ? "resolved"
        : mapped || hasTask(done, "C2.1a-T1")
          ? "broken"
          : "warning";
      groups = processSet ? "resolved" : mapped ? "ghost" : "hidden";
      individualUsers = processSet
        ? "resolved"
        : hasTask(done, "C2.1a-T6") || sharedGone
          ? "progress"
          : "hidden";
      if (hasTask(done, "C2.1a-T8") && !sealed(a1)) recentPulse = "devShared";
      else if (hasTask(done, "C2.1a-T5") && !sealed(a1)) recentPulse = "root";
      else if (processSet && !sealed(a1)) recentPulse = "users";
    }
  }

  if (sealed(a1) || cracked(a1)) {
    root = cracked(a1) ? "warning" : "resolved";
    rootMfa = true;
    rootKeysGone = true;
    devShared = cracked(a1) ? "warning" : "resolved";
    individualUsers = "resolved";
    groups = "resolved";
  }

  let lambda: NodeTone = "hidden";
  let ec2: NodeTone = "hidden";
  let rolesAttached = false;
  if (sealed(a2) || cracked(a2)) {
    lambda = cracked(a2) ? "warning" : "resolved";
    ec2 = cracked(a2) ? "warning" : "resolved";
    rolesAttached = !cracked(a2);
  } else if (a2 === "in_progress" || inAct("C2.1b")) {
    lambda = "broken";
    ec2 = "broken";
    const mid =
      hasTask(done, "C2.1b-T5") ||
      hasTask(done, "C2.1b-T6") ||
      hasTask(done, "C2.1b-T8");
    if (mid) {
      lambda = "progress";
      ec2 = "progress";
      rolesAttached = hasTask(done, "C2.1b-T8") || hasTask(done, "C2.1b-T9");
      recentPulse = "roles";
    }
  } else if (sealed(a1) || cracked(a1)) {
    lambda = "ghost";
    ec2 = "ghost";
  }

  let policyLines: PolicyLineTone = "hidden";
  if (sealed(a3) || cracked(a3)) {
    policyLines = cracked(a3) ? "broad" : "precise";
  } else if (a3 === "in_progress" || inAct("C2.2")) {
    policyLines =
      hasTask(done, "C2.2-T8") || hasTask(done, "C2.2-T9")
        ? "precise"
        : "broad";
    if (policyLines === "precise") recentPulse = "policies";
  } else if (sealed(a2) || cracked(a2)) {
    policyLines = "broad";
  }

  let cicd: NodeTone = "hidden";
  let vendor: NodeTone = "hidden";
  if (sealed(a5) || cracked(a5)) {
    cicd = cracked(a5) ? "warning" : "resolved";
    vendor = cracked(a5) ? "warning" : "resolved";
  } else if (a5 === "in_progress" || inAct("C2.4")) {
    cicd = "progress";
    vendor =
      hasTask(done, "C2.4-T6") || hasTask(done, "C2.4-T8")
        ? "progress"
        : "ghost";
    if (hasTask(done, "C2.4-T8")) recentPulse = "cicd";
  }

  let orgScp: NodeTone = "hidden";
  let perimeterSecured = false;
  if (sealed(a6) || cracked(a6)) {
    orgScp = cracked(a6) ? "warning" : "resolved";
    perimeterSecured = !cracked(a6);
  } else if (a6 === "in_progress" || inAct("C2.5")) {
    orgScp = "progress";
    perimeterSecured =
      hasTask(done, "C2.5-T8") ||
      hasTask(done, "C2.5-T9") ||
      hasTask(done, "C2.5-T10");
    if (perimeterSecured) recentPulse = "perimeter";
  }

  /* ── Mystery pins (Ghost Resources pattern) ── */
  const revealDone = hasTask(done, "C2.3-T6") || sealed(a4) || cracked(a4);
  const timelineSeen = hasTask(done, "C2.2-T8");
  const pin1Open = hasTask(done, "C2.1a-T7");
  const pin2Open = hasTask(done, "C2.1b-T7");
  const pin3Open = timelineSeen;

  // Inspect Act 1: show planted mystery even after reveal
  const inspect = opts.inspectAct;
  const forcePulse = timelineSeen && !revealDone && (inAct("C2.2") || inspect === 3);

  const pins: MysteryPinState[] = [
    {
      id: "access_key",
      phase: !pin1Open && inspect !== 1
        ? "hidden"
        : revealDone
          ? "resolved"
          : forcePulse
            ? "pulse"
            : "open",
      label: "Unexplained Access Key",
      sub: "CloudTrail · +12 days",
    },
    {
      id: "admin_role",
      phase: !pin2Open
        ? "hidden"
        : revealDone
          ? "resolved"
          : forcePulse
            ? "pulse"
            : "open",
      label: "Forgotten Admin Role",
      sub: "deleted creator",
    },
    {
      id: "timeline",
      phase: !pin3Open
        ? "hidden"
        : revealDone
          ? "resolved"
          : forcePulse
            ? "pulse"
            : "open",
      label: "Same Week Link",
      sub: "deleted account",
    },
    {
      id: "vikram",
      phase: revealDone || inspect === 4 ? "resolved" : "hidden",
      label: "Vikram — Former Contractor",
      sub: "three threads, one answer",
    },
  ];

  if (inspect === 1 && pins[0].phase === "hidden") {
    pins[0].phase = "open";
  }

  const evidenceLinked = revealDone || inspect === 4;

  if (revealDone) recentPulse = recentPulse || "backdoor";

  const liveUnlocks: Cs2LiveUnlock[] = [];
  for (const [taskId, label] of Object.entries(CS2_TASK_UNLOCKS)) {
    if (done.has(taskId)) liveUnlocks.push({ id: taskId, label });
  }
  // Keep the freshest 3 visible above the diagram
  const recentLive = liveUnlocks.slice(-3);

  const focusAct =
    opts.celebrateAct ??
    opts.focusAct ??
    session?.acts.find((a) => a.lessonId === opts.currentLessonId)?.actNumber ??
    1;

  return {
    focusAct,
    inspectAct: opts.inspectAct ?? null,
    root,
    rootMfa,
    rootKeysGone,
    devShared,
    individualUsers,
    groups,
    lambda,
    ec2,
    rolesAttached,
    policyLines,
    cicd,
    vendor,
    orgScp,
    perimeterSecured,
    pins,
    evidenceLinked,
    layerStatuses,
    recentPulse,
    liveUnlocks: recentLive,
  };
}

export const CS2_LAYER_INSPECT: Record<
  string,
  { diagramLabel: string; impact: string; callout?: string }
> = {
  "C2.1a": {
    diagramLabel: "Identity Layer — root locked, individual users, groups",
    impact:
      "Shared logins erase accountability. Individual IAM users are the cheapest forensic insurance a company can buy.",
    callout:
      "CloudTrail · CreateAccessKey · +12 days after contractor left — pinned as the first red thread.",
  },
  "C2.1b": {
    diagramLabel: "Service Trust — roles instead of hardcoded keys",
    impact:
      "Keys in git or images are how real AWS accounts get owned. Roles remove the secret instead of hiding it.",
    callout:
      "Forgotten AdministratorAccess role — second red pin, same unexplained-access habit.",
  },
  "C2.2": {
    diagramLabel: "Access Precision — scoped policy lines",
    impact:
      "Wildcard policies turn one stolen credential into a full takeover. Scoped lines keep blast radius to one resource.",
    callout:
      "Same week, deleted account — both earlier pins pulse. The threads are related.",
  },
  "C2.3": {
    diagramLabel: "Access Hygiene — three pins → Vikram",
    impact:
      "Forgotten permissions are the #1 quietly-exploited gap. The Act 1 anomaly was never a coincidence.",
    callout:
      "All three red pins converge on Vikram — former contractor, 14-day offboarding gap.",
  },
  "C2.4": {
    diagramLabel: "Service Integration — CI/CD + vendor trust",
    impact:
      "Vendor and pipeline access is how a third party becomes your blast radius. ExternalId exists for a reason.",
  },
  "C2.5": {
    diagramLabel: "Perimeter Defense — Org SCPs + full shield",
    impact:
      "Guardrails beat good intentions. An SCP makes the dangerous action impossible for every future engineer.",
  },
};
