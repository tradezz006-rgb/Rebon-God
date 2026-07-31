/**
 * CS3–CS7 FoodQuick live boards — act-mapped topology that forms from
 * layer status + student decisions (wrong choices deform specific nodes).
 */
import { progressGet, progressRemove, progressSet } from "./ephemeralProgress";
import { buildingBasicsLessons } from "./building_basics";
import {
  getLayerStatus,
  getStorySession,
  isLessonCleared,
  type LayerStatus,
} from "./storyMode";

export type NodeTone =
  | "hidden"
  | "ghost"
  | "broken"
  | "progress"
  | "resolved"
  | "warning";

export type LiveNode = {
  id: string;
  label: string;
  tone: NodeTone;
  detail: string;
  lane: string;
  /** Percent position on the board */
  x: number;
  y: number;
  icon:
    | "network"
    | "globe"
    | "shield"
    | "server"
    | "database"
    | "activity"
    | "cloud"
    | "wallet"
    | "layers"
    | "file";
  note?: string;
  fromWrong?: boolean;
  /** Which act primarily owns this node (1-based) */
  act: number;
};

export type LiveEdge = {
  from: string;
  to: string;
  label: string;
  tone: "ok" | "risk" | "cut" | "idle";
};

export type SessionLiveBoardState = {
  sessionId: string;
  title: string;
  ticket: string;
  subtitle: string;
  nodes: LiveNode[];
  edges: LiveEdge[];
  lanes: { id: string; label: string; top: string }[];
  liveUnlocks: { id: string; label: string }[];
  deformCount: number;
  sealedLayers: number;
  totalLayers: number;
  focusAct: number;
  layerStatuses: Record<string, LayerStatus>;
  /** Mission outcome from shipped decisions */
  outcome: "healthy" | "degraded" | "failed";
  outcomeNote: string;
  worstSeverity: ConsequenceSeverity | null;
};

export type ConsequenceSeverity = "small" | "medium" | "big";

export type DecisionRecord = {
  taskId: string;
  selectedIndex: number | null;
  correct: boolean;
  optionLabel?: string;
  /** Company-style blast radius of a shipped mistake */
  severity?: ConsequenceSeverity;
  /** Node this decision shaped / deformed */
  nodeId?: string;
  at: number;
};

const decisionKey = (lessonId: string) => `rebon_live_decisions_${lessonId}`;
const rebuildKey = (lessonId: string) => `rebon_story_rebuild_${lessonId}`;

export function getLessonDecisions(lessonId: string): DecisionRecord[] {
  try {
    const raw = progressGet(decisionKey(lessonId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DecisionRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordLessonDecision(
  lessonId: string,
  record: DecisionRecord
): void {
  const prev = getLessonDecisions(lessonId).filter(
    (d) => d.taskId !== record.taskId
  );
  prev.push(record);
  progressSet(decisionKey(lessonId), JSON.stringify(prev));
}

/** Real-company consequence ladder from task difficulty. */
export function classifyConsequence(
  task: { difficulty?: string; type?: string },
  isCorrect: boolean
): ConsequenceSeverity | null {
  if (isCorrect) return null;
  const d = (task.difficulty || "").toLowerCase();
  if (d === "hard") return "big";
  if (d === "medium") return "medium";
  return "small";
}

export function needsActRebuild(lessonId: string): boolean {
  return progressGet(rebuildKey(lessonId)) === "true";
}

export function markActNeedsRebuild(lessonId: string): void {
  progressSet(rebuildKey(lessonId), "true");
}

export function clearActRebuild(lessonId: string): void {
  progressRemove(rebuildKey(lessonId));
}

export function pickNodeForTask(
  sessionId: string,
  actNumber: number,
  taskId: string
): string | undefined {
  const bp = BLUEPRINTS[sessionId] || BLUEPRINTS.CS3;
  const ids = bp.actNodes[actNumber] || bp.nodes.map((n) => n.id);
  if (!ids.length) return undefined;
  let h = 0;
  for (let i = 0; i < taskId.length; i++) h = (h * 31 + taskId.charCodeAt(i)) >>> 0;
  return ids[h % ids.length];
}

export function auditFeedback(severity: ConsequenceSeverity): string {
  if (severity === "big") {
    return "Decision shipped. Live Architecture shows a major break — expand the board and audit connections. This act needs a rebuild from the start.";
  }
  if (severity === "medium") {
    return "Decision shipped. A path on Live Architecture looks unstable — expand to audit. Reinforce the prior foundation, then patch this ticket.";
  }
  return "Decision shipped. Live Architecture shifted — expand the board and audit the amber path. A local patch on this ticket can fix it.";
}

type NodeSeed = Omit<LiveNode, "tone" | "note" | "fromWrong">;

type SessionBlueprint = {
  subtitle: string;
  lanes: SessionLiveBoardState["lanes"];
  nodes: NodeSeed[];
  edges: { from: string; to: string; label: string }[];
  /** act number → node ids owned by that act */
  actNodes: Record<number, string[]>;
};

const BLUEPRINTS: Record<string, SessionBlueprint> = {
  CS3: {
    subtitle: "FoodQuick · live network path",
    lanes: [
      { id: "edge", label: "Edge", top: "10%" },
      { id: "vpc", label: "VPC fabric", top: "38%" },
      { id: "control", label: "Controls", top: "66%" },
    ],
    nodes: [
      {
        id: "igw",
        label: "Internet Gateway",
        detail: "Public ingress / egress hinge for the VPC.",
        lane: "Edge",
        x: 18,
        y: 16,
        icon: "globe",
        act: 3,
      },
      {
        id: "dns",
        label: "Route 53",
        detail: "Names resolve to the paths you actually built.",
        lane: "Edge",
        x: 50,
        y: 16,
        icon: "globe",
        act: 7,
      },
      {
        id: "peer",
        label: "VPC peering",
        detail: "Cross-VPC trust — only if the route tells the truth.",
        lane: "Edge",
        x: 82,
        y: 16,
        icon: "network",
        act: 6,
      },
      {
        id: "vpc",
        label: "VPC",
        detail: "The boundary. Default VPC means nobody designed this.",
        lane: "VPC fabric",
        x: 18,
        y: 44,
        icon: "cloud",
        act: 1,
      },
      {
        id: "public",
        label: "Public subnet",
        detail: "ALB / bastion land here — not the database.",
        lane: "VPC fabric",
        x: 50,
        y: 44,
        icon: "network",
        act: 2,
      },
      {
        id: "private",
        label: "Private subnet",
        detail: "App + data stay inward; outbound only via NAT.",
        lane: "VPC fabric",
        x: 82,
        y: 44,
        icon: "server",
        act: 2,
      },
      {
        id: "nat",
        label: "NAT Gateway",
        detail: "Private subnet egress without public IPs.",
        lane: "Controls",
        x: 22,
        y: 72,
        icon: "network",
        act: 3,
      },
      {
        id: "sg",
        label: "Security Groups",
        detail: "Stateful allow-lists on ENIs — least privilege.",
        lane: "Controls",
        x: 50,
        y: 72,
        icon: "shield",
        act: 4,
      },
      {
        id: "nacl",
        label: "Network ACL",
        detail: "Subnet-level filter; deny rules cut traffic hard.",
        lane: "Controls",
        x: 78,
        y: 72,
        icon: "shield",
        act: 5,
      },
    ],
    edges: [
      { from: "dns", to: "igw", label: "Resolve → edge" },
      { from: "igw", to: "public", label: "Public route" },
      { from: "public", to: "nat", label: "Egress hop" },
      { from: "nat", to: "private", label: "Private outbound" },
      { from: "vpc", to: "public", label: "Subnet CIDR" },
      { from: "vpc", to: "private", label: "Subnet CIDR" },
      { from: "sg", to: "private", label: "ENI allow" },
      { from: "nacl", to: "public", label: "Subnet filter" },
      { from: "peer", to: "vpc", label: "Peered trust" },
    ],
    actNodes: {
      1: ["vpc"],
      2: ["public", "private"],
      3: ["igw", "nat"],
      4: ["sg"],
      5: ["nacl"],
      6: ["peer"],
      7: ["dns"],
    },
  },
  CS4: {
    subtitle: "FoodQuick · live compute path",
    lanes: [
      { id: "shape", label: "Shape", top: "12%" },
      { id: "fleet", label: "Fleet", top: "42%" },
      { id: "scale", label: "Scale & cost", top: "72%" },
    ],
    nodes: [
      {
        id: "ami",
        label: "AMI / Launch template",
        detail: "Golden image — every instance starts the same way.",
        lane: "Shape",
        x: 28,
        y: 18,
        icon: "layers",
        act: 4,
      },
      {
        id: "shape",
        label: "Instance shape",
        detail: "Family + size chosen for the real workload, not Day-1 guess.",
        lane: "Shape",
        x: 72,
        y: 18,
        icon: "server",
        act: 1,
      },
      {
        id: "ec2",
        label: "EC2 fleet",
        detail: "Running capacity behind the load balancer.",
        lane: "Fleet",
        x: 50,
        y: 42,
        icon: "server",
        act: 2,
      },
      {
        id: "storage",
        label: "Instance storage",
        detail: "EBS / ephemeral attached with the right durability story.",
        lane: "Fleet",
        x: 18,
        y: 48,
        icon: "database",
        act: 3,
      },
      {
        id: "alb",
        label: "Application LB",
        detail: "Traffic entry — health checks decide who stays in.",
        lane: "Fleet",
        x: 82,
        y: 48,
        icon: "globe",
        act: 5,
      },
      {
        id: "tg",
        label: "Target group",
        detail: "Registered targets the ALB actually trusts.",
        lane: "Scale & cost",
        x: 22,
        y: 74,
        icon: "network",
        act: 5,
      },
      {
        id: "asg",
        label: "Auto Scaling",
        detail: "Capacity follows demand — not a fixed guess.",
        lane: "Scale & cost",
        x: 50,
        y: 74,
        icon: "activity",
        act: 6,
      },
      {
        id: "cost",
        label: "Pricing mix",
        detail: "On-Demand / Spot / Savings — cost is architecture too.",
        lane: "Scale & cost",
        x: 78,
        y: 74,
        icon: "wallet",
        act: 7,
      },
    ],
    edges: [
      { from: "ami", to: "ec2", label: "Launch from image" },
      { from: "shape", to: "ec2", label: "Size the box" },
      { from: "storage", to: "ec2", label: "Attach volume" },
      { from: "alb", to: "tg", label: "Forward" },
      { from: "tg", to: "ec2", label: "Register" },
      { from: "asg", to: "ec2", label: "Scale out/in" },
      { from: "cost", to: "asg", label: "Purchase model" },
    ],
    actNodes: {
      1: ["shape"],
      2: ["ec2"],
      3: ["storage"],
      4: ["ami"],
      5: ["alb", "tg"],
      6: ["asg"],
      7: ["cost"],
    },
  },
  CS5: {
    subtitle: "FoodQuick · live storage path",
    lanes: [
      { id: "object", label: "Object", top: "14%" },
      { id: "guard", label: "Guards", top: "44%" },
      { id: "block", label: "Block & cost", top: "74%" },
    ],
    nodes: [
      {
        id: "bucket",
        label: "S3 buckets",
        detail: "Object home for media, logs, and backups.",
        lane: "Object",
        x: 35,
        y: 18,
        icon: "database",
        act: 1,
      },
      {
        id: "lifecycle",
        label: "Lifecycle",
        detail: "Hot → cool → archive — growth without surprise bills.",
        lane: "Object",
        x: 70,
        y: 18,
        icon: "layers",
        act: 2,
      },
      {
        id: "bpa",
        label: "Block Public Access",
        detail: "Account + bucket locks against accidental exposure.",
        lane: "Guards",
        x: 28,
        y: 46,
        icon: "shield",
        act: 3,
      },
      {
        id: "encrypt",
        label: "Encryption",
        detail: "At rest with KMS / SSE — every object, every volume.",
        lane: "Guards",
        x: 72,
        y: 46,
        icon: "shield",
        act: 3,
      },
      {
        id: "ebs",
        label: "EBS volumes",
        detail: "Block storage sized and typed for the workload.",
        lane: "Block & cost",
        x: 28,
        y: 76,
        icon: "server",
        act: 4,
      },
      {
        id: "cost",
        label: "Storage economics",
        detail: "Classes, snapshots, orphaned volumes — the CFO board.",
        lane: "Block & cost",
        x: 72,
        y: 76,
        icon: "wallet",
        act: 5,
      },
    ],
    edges: [
      { from: "bucket", to: "lifecycle", label: "Age objects" },
      { from: "bpa", to: "bucket", label: "Lock exposure" },
      { from: "encrypt", to: "bucket", label: "Encrypt objects" },
      { from: "encrypt", to: "ebs", label: "Encrypt volumes" },
      { from: "ebs", to: "cost", label: "Bill the GB" },
      { from: "lifecycle", to: "cost", label: "Class spend" },
    ],
    actNodes: {
      1: ["bucket"],
      2: ["lifecycle"],
      3: ["bpa", "encrypt"],
      4: ["ebs"],
      5: ["cost"],
    },
  },
  CS6: {
    subtitle: "FoodQuick · live observability path",
    lanes: [
      { id: "see", label: "See", top: "16%" },
      { id: "act", label: "Act", top: "46%" },
      { id: "govern", label: "Govern", top: "76%" },
    ],
    nodes: [
      {
        id: "dash",
        label: "CloudWatch dash",
        detail: "One pane for the signals that matter.",
        lane: "See",
        x: 32,
        y: 18,
        icon: "activity",
        act: 1,
      },
      {
        id: "alarm",
        label: "Alarms + SNS",
        detail: "Threshold → page before Twitter does.",
        lane: "See",
        x: 72,
        y: 18,
        icon: "activity",
        act: 2,
      },
      {
        id: "trail",
        label: "CloudTrail",
        detail: "Who did what — immutable accountability.",
        lane: "Act",
        x: 32,
        y: 48,
        icon: "file",
        act: 3,
      },
      {
        id: "config",
        label: "Config rules",
        detail: "Drift detection against the standards you set.",
        lane: "Act",
        x: 72,
        y: 48,
        icon: "layers",
        act: 3,
      },
      {
        id: "ta",
        label: "Trusted Advisor",
        detail: "Best-practice and limit signals, not vibes.",
        lane: "Govern",
        x: 32,
        y: 78,
        icon: "shield",
        act: 4,
      },
      {
        id: "budget",
        label: "Budgets",
        detail: "Spend alerts tied to real thresholds.",
        lane: "Govern",
        x: 72,
        y: 78,
        icon: "wallet",
        act: 4,
      },
    ],
    edges: [
      { from: "dash", to: "alarm", label: "Metric → alert" },
      { from: "alarm", to: "trail", label: "Who changed it" },
      { from: "config", to: "ta", label: "Compliance signal" },
      { from: "budget", to: "alarm", label: "Spend page" },
      { from: "trail", to: "config", label: "API ↔ resource" },
    ],
    actNodes: {
      1: ["dash"],
      2: ["alarm"],
      3: ["trail", "config"],
      4: ["ta", "budget"],
    },
  },
  CS7: {
    subtitle: "FoodQuick · live platform rebuild",
    lanes: [
      { id: "plan", label: "Plan", top: "14%" },
      { id: "build", label: "Build", top: "44%" },
      { id: "prove", label: "Prove", top: "74%" },
    ],
    nodes: [
      {
        id: "design",
        label: "Blueprint",
        detail: "Architecture that answers FQ-142's wake-up call.",
        lane: "Plan",
        x: 50,
        y: 18,
        icon: "file",
        act: 1,
      },
      {
        id: "net",
        label: "Network build",
        detail: "VPC path from CS3 — deliberate, not default.",
        lane: "Build",
        x: 22,
        y: 46,
        icon: "network",
        act: 2,
      },
      {
        id: "app",
        label: "App tier",
        detail: "Compute + entry from CS4 — sized and balanced.",
        lane: "Build",
        x: 50,
        y: 46,
        icon: "server",
        act: 3,
      },
      {
        id: "data",
        label: "Data tier",
        detail: "Storage hygiene from CS5 — encrypted and aged.",
        lane: "Build",
        x: 78,
        y: 46,
        icon: "database",
        act: 3,
      },
      {
        id: "obs",
        label: "Observability",
        detail: "Signals from CS6 — alarms before customers.",
        lane: "Prove",
        x: 32,
        y: 76,
        icon: "activity",
        act: 4,
      },
      {
        id: "docs",
        label: "Portfolio proof",
        detail: "Diagram + decisions you can defend in an interview.",
        lane: "Prove",
        x: 72,
        y: 76,
        icon: "file",
        act: 4,
      },
    ],
    edges: [
      { from: "design", to: "net", label: "Draw → build" },
      { from: "net", to: "app", label: "Host the app" },
      { from: "app", to: "data", label: "Persist" },
      { from: "app", to: "obs", label: "Emit metrics" },
      { from: "obs", to: "docs", label: "Evidence" },
      { from: "data", to: "docs", label: "Data story" },
    ],
    actNodes: {
      1: ["design"],
      2: ["net"],
      3: ["app", "data"],
      4: ["obs", "docs"],
    },
  },
};

function sessionIdFromLesson(lessonId: string): string {
  const lesson = buildingBasicsLessons.find((l) => l.lesson_id === lessonId);
  if (lesson?.section_id) return lesson.section_id;
  const m = /^C(\d+)/.exec(lessonId);
  return m ? `CS${m[1]}` : "CS3";
}

function truncate(s: string, n = 90): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}

/** Ticket ids completed so far in a lesson (ops pointer + sealed). */
export function completedTaskIdsForLesson(
  lessonId: string,
  taskIds: string[]
): string[] {
  if (!taskIds.length) return [];
  if (isLessonCleared(lessonId)) return [...taskIds];
  const raw = progressGet(`rebon_cloud_ops_${lessonId}`);
  if (raw == null) return [];
  const idx = parseInt(raw, 10);
  if (!Number.isFinite(idx) || idx < 0) return [];
  return taskIds.slice(0, Math.min(taskIds.length, idx + 1));
}

export function deriveSessionLiveBoard(opts: {
  sessionId: string;
  currentLessonId?: string;
  /** Live ticket progress for the open lesson (ops rail) */
  currentCompletedTaskIds?: string[];
  /** Only when investigation truly sealed — not mere ticket ops */
  celebrate?: boolean;
}): SessionLiveBoardState {
  const sessionId = opts.sessionId;
  const story = getStorySession(sessionId);
  const bp = BLUEPRINTS[sessionId] || BLUEPRINTS.CS3;

  const layerStatuses: Record<string, LayerStatus> = {};
  const actStatus = new Map<number, LayerStatus>();
  const actWrong = new Map<number, string | undefined>();
  /** How many act-owned nodes are revealed for each act (progressive CS2-style). */
  const actUnlockCount = new Map<number, number>();
  const liveUnlocks: { id: string; label: string }[] = [];

  let focusAct = 1;
  if (opts.currentLessonId && story) {
    const cur = story.acts.find((a) => a.lessonId === opts.currentLessonId);
    if (cur) focusAct = cur.actNumber;
  }

  let sealedLayers = 0;
  let deformCount = 0;
  let worstSeverity: ConsequenceSeverity | null = null;
  const nodeDeforms = new Map<
    string,
    { note: string; severity: ConsequenceSeverity }
  >();
  /** Act fully cleared by tickets (even if phoenix seal flag lagging) */
  const actFullyDone = new Map<number, boolean>();

  const rank = (s: ConsequenceSeverity) =>
    s === "big" ? 3 : s === "medium" ? 2 : 1;

  if (story) {
    for (const act of story.acts) {
      const status = getLayerStatus(act.lessonId);
      layerStatuses[act.lessonId] = status;
      actStatus.set(act.actNumber, status);

      const lesson = buildingBasicsLessons.find(
        (l) => l.lesson_id === act.lessonId
      );
      const taskIds =
        lesson?.workspace_tasks?.map((t) => t.task_id).filter(Boolean) || [];
      const completed =
        opts.currentLessonId === act.lessonId &&
        opts.currentCompletedTaskIds != null
          ? opts.currentCompletedTaskIds
          : completedTaskIdsForLesson(act.lessonId, taskIds);

      const actNodes = bp.actNodes[act.actNumber] || [];
      const sealed = status === "clean" || status === "repaired";
      const done = completed.length;
      const total = Math.max(1, taskIds.length || 1);
      const fullyDone = sealed || (taskIds.length > 0 && done >= taskIds.length);
      actFullyDone.set(act.actNumber, fullyDone);

      // Unlock from ticket progress on EVERY act — Mission map + rail stay in sync
      if (sealed || status === "cracked" || fullyDone) {
        actUnlockCount.set(act.actNumber, actNodes.length);
      } else if (done > 0 || status === "in_progress") {
        let unlock = Math.ceil((done / total) * actNodes.length);
        if (done > 0) unlock = Math.max(1, unlock);
        actUnlockCount.set(
          act.actNumber,
          Math.min(actNodes.length, unlock)
        );
      } else {
        actUnlockCount.set(act.actNumber, 0);
      }

      if (sealed) {
        sealedLayers += 1;
        liveUnlocks.push({
          id: `${act.lessonId}-seal`,
          label: `${act.buildsLayer} sealed`,
        });
      } else if (fullyDone) {
        liveUnlocks.push({
          id: `${act.lessonId}-tickets`,
          label: `${act.buildsLayer} tickets clear`,
        });
      }

      const decisions = getLessonDecisions(act.lessonId);
      for (const d of decisions) {
        if (d.correct) {
          if (opts.currentLessonId === act.lessonId) {
            liveUnlocks.push({
              id: `${d.taskId}-ok`,
              label: `Path locked · ${act.actTitle}`,
            });
          }
          continue;
        }
        deformCount += 1;
        const severity = d.severity || "small";
        if (!worstSeverity || rank(severity) > rank(worstSeverity)) {
          worstSeverity = severity;
        }
        const nodeId =
          d.nodeId ||
          pickNodeForTask(sessionId, act.actNumber, d.taskId) ||
          bp.actNodes[act.actNumber]?.[0];
        if (nodeId) {
          nodeDeforms.set(nodeId, {
            severity,
            note: d.optionLabel
              ? truncate(`Shipped call: ${d.optionLabel}`)
              : severity === "big"
                ? "Major break on this path — rebuild required."
                : severity === "medium"
                  ? "Unstable path — reinforce foundation, then patch."
                  : "Local gap — patch this ticket to restore the path.",
          });
        }
        actWrong.set(
          act.actNumber,
          d.optionLabel
            ? truncate(`Your call: ${d.optionLabel}`)
            : "A shipped decision left a gap — audit Live Architecture."
        );
      }

      if (status === "cracked" && !actWrong.has(act.actNumber)) {
        deformCount += 1;
        actWrong.set(
          act.actNumber,
          "Unresolved tickets cracked this layer — repair to seal it."
        );
        if (!worstSeverity) worstSeverity = "medium";
      }
    }
  }

  // Focus = furthest act with work (Mission map), or the open lesson (rail)
  if (!opts.currentLessonId && story) {
    let furthest = 1;
    for (const act of story.acts) {
      const n = actUnlockCount.get(act.actNumber) ?? 0;
      if (n > 0) furthest = act.actNumber;
    }
    const open = [...story.acts].reverse().find((a) => {
      const st = getLayerStatus(a.lessonId);
      return st === "in_progress" || st === "cracked";
    });
    focusAct = open?.actNumber ?? furthest;
  } else if (opts.currentLessonId && story) {
    // Rail: still allow prior acts to stay lit (don't ghost finished work behind focus)
    let furthest = focusAct;
    for (const act of story.acts) {
      const n = actUnlockCount.get(act.actNumber) ?? 0;
      if (n > 0) furthest = Math.max(furthest, act.actNumber);
    }
    // keep focusAct as current lesson for "Act N · click nodes" label
    void furthest;
  }

  const nodes: LiveNode[] = bp.nodes.map((seed) => {
    const status = actStatus.get(seed.act) ?? "not_reached";
    const isFocus = seed.act === focusAct;
    const deform = nodeDeforms.get(seed.id);
    const actNote = actWrong.get(seed.act);
    const hasWrong = Boolean(deform || actNote);
    const sealed = status === "clean" || status === "repaired";
    const fullyDone = actFullyDone.get(seed.act) === true;
    const actNodes = bp.actNodes[seed.act] || [];
    const unlockCount = actUnlockCount.get(seed.act) ?? 0;
    const nodeIndex = actNodes.indexOf(seed.id);
    const unlocked =
      nodeIndex >= 0 ? nodeIndex < unlockCount : unlockCount > 0;

    let tone: NodeTone;
    // Only ghost acts with zero ticket progress — never hide finished work on Mission map
    if (!unlocked) {
      tone = isFocus ? "broken" : "ghost";
    } else if (opts.celebrate && !hasWrong) {
      tone = "resolved";
    } else if (sealed || fullyDone) {
      tone = "resolved";
    } else if (isFocus) {
      tone = "progress";
    } else if (status === "cracked") {
      tone = "warning";
    } else {
      tone = "progress";
    }

    if (deform) {
      tone = deform.severity === "big" ? "broken" : "warning";
    } else if (hasWrong && unlocked) {
      tone = "warning";
    }

    return {
      ...seed,
      tone,
      fromWrong: Boolean(deform),
      note: deform?.note || (hasWrong && unlocked ? actNote : undefined),
    };
  });

  // Celebrate only clears if truly clean — keep shipped mistakes visible for audit
  if (opts.celebrate && deformCount === 0) {
    for (const n of nodes) {
      if ((actUnlockCount.get(n.act) ?? 0) === 0) continue;
      n.tone = "resolved";
      n.fromWrong = false;
      n.note = undefined;
    }
  }

  const edges: LiveEdge[] = bp.edges.map((e) => {
    const a = nodes.find((n) => n.id === e.from);
    const b = nodes.find((n) => n.id === e.to);
    if (!a || !b) return { ...e, tone: "idle" as const };
    if (
      a.tone === "hidden" ||
      b.tone === "hidden" ||
      a.tone === "ghost" ||
      b.tone === "ghost"
    ) {
      return { ...e, tone: "idle" as const };
    }
    const aDef = nodeDeforms.get(a.id);
    const bDef = nodeDeforms.get(b.id);
    if (aDef?.severity === "big" || bDef?.severity === "big")
      return { ...e, tone: "cut" as const };
    if (a.fromWrong || b.fromWrong || aDef || bDef)
      return { ...e, tone: "risk" as const };
    if (a.tone === "broken" || b.tone === "broken")
      return { ...e, tone: "cut" as const };
    if (
      (a.tone === "resolved" || a.tone === "progress") &&
      (b.tone === "resolved" ||
        b.tone === "progress" ||
        b.tone === "warning")
    ) {
      return { ...e, tone: "ok" as const };
    }
    if (
      (b.tone === "resolved" || b.tone === "progress") &&
      (a.tone === "resolved" ||
        a.tone === "progress" ||
        a.tone === "warning")
    ) {
      return { ...e, tone: "ok" as const };
    }
    return { ...e, tone: "idle" as const };
  });

  let outcome: SessionLiveBoardState["outcome"] = "healthy";
  let outcomeNote = "Paths look stable — keep shipping clean decisions.";
  if (worstSeverity === "big" || (deformCount >= 3 && sealedLayers === 0)) {
    outcome = "failed";
    outcomeNote =
      "Investigation failed to seal cleanly — major breaks remain. Rebuild cracked acts from the start.";
  } else if (deformCount > 0 || worstSeverity) {
    outcome = "degraded";
    outcomeNote =
      worstSeverity === "medium"
        ? "System degraded — reinforce foundations, then patch amber paths."
        : "Small gaps on the board — patch the amber tickets locally.";
  }

  return {
    sessionId,
    title: story?.title ?? sessionId,
    ticket: story?.ticket ?? sessionId,
    subtitle: bp.subtitle,
    nodes,
    edges,
    lanes: bp.lanes,
    liveUnlocks: liveUnlocks.slice(-6),
    deformCount,
    sealedLayers,
    totalLayers: story?.acts.length || bp.nodes.length,
    focusAct,
    layerStatuses,
    outcome,
    outcomeNote,
    worstSeverity,
  };
}

export function deriveBoardForLesson(
  lessonId: string,
  celebrate = false,
  currentCompletedTaskIds?: string[]
): SessionLiveBoardState {
  return deriveSessionLiveBoard({
    sessionId: sessionIdFromLesson(lessonId),
    currentLessonId: lessonId,
    celebrate,
    currentCompletedTaskIds,
  });
}
