/**
 * Journey Map — one destination on every phase page.
 * Same physical space, three states: briefing → live build → session trophy.
 */
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, ShieldCheck } from "lucide-react";
import { ArchitectureVisualizer } from "@/components/workspace/ArchitectureVisualizer";
import { FoodQuickIamDiagram } from "@/components/cloud/ops/FoodQuickIamDiagram";
import { SessionLiveBoard } from "@/components/cloud/ops/SessionLiveBoard";
import { deriveCs2DiagramState } from "@/data/cloud/cs2DiagramState";
import { deriveSessionLiveBoard } from "@/data/cloud/sessionLiveBoard";
import {
  getLayerStatus,
  getStorySession,
  isInvestigationComplete,
} from "@/data/cloud/storyMode";
import { progressGet } from "@/data/cloud/ephemeralProgress";
import { isWorkspaceComplete } from "@/data/cloud/studentModePace";
import { PHOENIX_COMPANY } from "@/data/cloud/projectPhoenix";
import { fresherLessons } from "@/data/cloud/fresher";
import { buildingBasicsLessons } from "@/data/cloud/building_basics";
import {
  getSessionDef,
  getSessionProgress,
  type CloudSessionId,
} from "@/data/cloud/sessionCatalog";

export type JourneyVariant = "fresher" | "cs2";

type JourneyState = "briefing" | "in_progress" | "complete";

type Props = {
  /**
   * Preferred: one Journey Map per session (CS1, CS1B, CS2…).
   * Legacy `variant` still works for older call sites.
   */
  sessionId?: CloudSessionId;
  /** @deprecated use sessionId — "fresher" ≈ CS1+CS1B aggregate, "cs2" ≈ CS2 */
  variant?: JourneyVariant;
  /** Bump when returning from a workspace so progress re-reads */
  refreshKey?: number | string;
};

function opsTicketsDone(lessonId: string, total: number): number {
  const raw = progressGet(`rebon_cloud_ops_${lessonId}`);
  if (raw == null) {
    return isWorkspaceComplete(lessonId) ? total : 0;
  }
  const idx = parseInt(raw, 10);
  if (!Number.isFinite(idx) || idx < 0) return 0;
  return Math.min(total, idx + 1);
}

/** Task ids resolved so far in a lesson (from ops pointer) — for live diagram. */
function completedTaskIdsForLesson(
  lessonId: string,
  taskIds: string[]
): string[] {
  if (!taskIds.length) return [];
  if (isWorkspaceComplete(lessonId)) return [...taskIds];
  const raw = progressGet(`rebon_cloud_ops_${lessonId}`);
  if (raw == null) return [];
  const idx = parseInt(raw, 10);
  if (!Number.isFinite(idx) || idx < 0) return [];
  return taskIds.slice(0, Math.min(taskIds.length, idx + 1));
}

function fresherStats(scope: "all" | "CS1" | "CS1B" = "all") {
  const cs1 = ["C1.1", "C1.2", "C1.3", "C1.4", "C1.5"];
  let layers = 0;
  for (const id of cs1) {
    if (isWorkspaceComplete(id)) layers += 1;
    else break;
  }

  const lessons =
    scope === "all"
      ? fresherLessons
      : fresherLessons.filter((l) => l.section_id === scope);

  let ticketsDone = 0;
  let ticketsTotal = 0;
  let anyStarted = false;

  for (const lesson of lessons) {
    const total = lesson.workspace_tasks?.length || 0;
    if (!total) continue;
    ticketsTotal += total;
    const done = opsTicketsDone(lesson.lesson_id, total);
    ticketsDone += done;
    if (done > 0 || isWorkspaceComplete(lesson.lesson_id)) anyStarted = true;
  }

  const cs1Complete = cs1.every((id) => isWorkspaceComplete(id));
  const cs1bComplete = fresherLessons
    .filter((l) => l.section_id === "CS1B")
    .every((l) => isWorkspaceComplete(l.lesson_id));

  const complete =
    scope === "CS1"
      ? cs1Complete
      : scope === "CS1B"
        ? cs1bComplete
        : cs1Complete && cs1bComplete;

  return {
    ticketsDone,
    ticketsTotal,
    layersBuilt: layers,
    layersTotal: 5,
    anyStarted,
    complete,
    progressLevel: scope === "CS1B" ? Math.max(1, layers || 1) : layers,
  };
}

function genericSessionStats(sessionId: CloudSessionId) {
  const progress = getSessionProgress(sessionId);
  const def = getSessionDef(sessionId);
  return {
    ...progress,
    title: def?.title ?? sessionId,
    blurb: def?.blurb ?? "Session journey map",
    ticket: sessionId,
  };
}

function storySessionStats(sessionId: CloudSessionId) {
  const session = getStorySession(sessionId);
  const acts = session?.acts ?? [];
  let ticketsDone = 0;
  let ticketsTotal = 0;
  let layersBuilt = 0;
  let anyStarted = false;

  for (const act of acts) {
    const lesson = buildingBasicsLessons.find(
      (l) => l.lesson_id === act.lessonId
    );
    const total =
      lesson?.workspace_tasks?.length || act.totalTasks || 10;
    ticketsTotal += total;
    const done = opsTicketsDone(act.lessonId, total);
    ticketsDone += done;
    const status = getLayerStatus(act.lessonId);
    if (status === "clean" || status === "repaired") layersBuilt += 1;
    if (
      done > 0 ||
      status === "in_progress" ||
      status === "cracked" ||
      status === "clean" ||
      status === "repaired"
    ) {
      anyStarted = true;
    }
  }

  const fallbackTotal =
    sessionId === "CS2" ? 60 : Math.max(ticketsTotal, acts.length * 8);

  return {
    ticketsDone,
    ticketsTotal: ticketsTotal || fallbackTotal,
    layersBuilt,
    layersTotal: acts.length || 1,
    anyStarted,
    complete: isInvestigationComplete(sessionId),
    sessionTitle: session?.title ?? getSessionDef(sessionId)?.title ?? sessionId,
    ticket: session?.ticket ?? getSessionDef(sessionId)?.ticket ?? sessionId,
    blurb: getSessionDef(sessionId)?.blurb ?? "",
  };
}

function JourneyChrome({
  accent,
  progressLabel,
  progressRatio,
  storyLine,
  children,
}: {
  accent: "orange" | "gold";
  progressLabel: string;
  progressRatio: number;
  storyLine?: string;
  children: ReactNode;
}) {
  const bar = accent === "gold" ? "bg-amber-400" : "bg-[#ff9900]";
  const accentText =
    accent === "gold" ? "text-amber-300/90" : "text-[#ff9900]/90";

  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0f14] shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            accent === "gold"
              ? "radial-gradient(ellipse at 12% 0%, rgba(251,191,36,0.11), transparent 42%), radial-gradient(ellipse at 88% 100%, rgba(16,185,129,0.06), transparent 40%)"
              : "radial-gradient(ellipse at 12% 0%, rgba(255,153,0,0.11), transparent 42%), radial-gradient(ellipse at 88% 100%, rgba(56,189,248,0.06), transparent 40%)",
        }}
      />

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] px-5 py-4 md:px-6">
        <div className="min-w-0 max-w-2xl">
          <p className={`text-[10px] font-medium uppercase tracking-[0.22em] ${accentText}`}>
            Mission board · living session map
          </p>
          <p className="mt-1 text-base font-semibold text-slate-50 md:text-lg">
            {progressLabel}
          </p>
          {storyLine && (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
              {storyLine}
            </p>
          )}
        </div>
        <div className="w-full max-w-[220px] sm:w-52">
          <div className="mb-1 flex justify-between text-[10px] text-slate-500">
            <span>Session progress</span>
            <span className="tabular-nums text-slate-300">
              {Math.round(Math.min(1, progressRatio) * 100)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className={`h-full rounded-full ${bar}`}
              animate={{ width: `${Math.min(100, progressRatio * 100)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 min-h-[560px] md:min-h-[680px]">
        {children}
      </div>
    </div>
  );
}

function MissionBriefingCard({
  accent,
  eyebrow,
  title,
  body,
}: {
  accent: "orange" | "gold";
  eyebrow: string;
  title: string;
  body: string;
}) {
  const ring =
    accent === "gold"
      ? "border-amber-400/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      : "border-[#ff9900]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]";
  const icon =
    accent === "gold" ? "text-amber-300" : "text-[#ff9900]";
  const eye =
    accent === "gold" ? "text-amber-300/80" : "text-[#ff9900]/80";

  return (
    <div className="grid min-h-[480px] place-items-center p-6 md:min-h-[560px]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.4 }}
        className={`relative z-10 w-full max-w-lg rounded-2xl border bg-[#10161f]/92 p-8 text-left backdrop-blur-md ${ring}`}
      >
        <div className="mb-5 flex items-center gap-3">
          <motion.span
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] ring-1 ring-white/10"
          >
            <Activity className={`h-5 w-5 ${icon}`} />
          </motion.span>
          <p className={`text-[10px] font-medium uppercase tracking-[0.22em] ${eye}`}>
            {eyebrow}
          </p>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{body}</p>
        <p className="mt-6 border-t border-white/[0.06] pt-4 text-[11px] text-slate-500">
          Resolve your first ticket — this map becomes your live architecture.
        </p>
      </motion.div>
    </div>
  );
}

export function JourneyMap({
  sessionId,
  variant,
  refreshKey = 0,
}: Props) {
  // refreshKey forces a re-read of ephemeral progress after leaving a workspace
  void refreshKey;

  const resolvedSession: CloudSessionId =
    sessionId ||
    (variant === "cs2" ? "CS2" : "CS1");

  const def = getSessionDef(resolvedSession);
  const journey = def?.journey ?? "generic";

  // ── Phoenix family (CS1 / CS1B / legacy fresher aggregate) ──
  if (journey === "phoenix" || (!sessionId && variant === "fresher")) {
    const scope =
      resolvedSession === "CS1B"
        ? "CS1B"
        : resolvedSession === "CS1"
          ? "CS1"
          : "all";
    const fresher =
      !sessionId && variant === "fresher"
        ? fresherStats("all")
        : fresherStats(scope === "all" ? "CS1" : scope);

    const state: JourneyState = fresher.complete
      ? "complete"
      : fresher.anyStarted
        ? "in_progress"
        : "briefing";

    const progressLabel =
      state === "briefing"
        ? `${resolvedSession} standing by · 0 tickets resolved`
        : state === "complete"
          ? `${resolvedSession} sealed · journey complete`
          : `${fresher.ticketsDone} of ${fresher.ticketsTotal} tickets · ${fresher.layersBuilt} of ${fresher.layersTotal} layers`;

    const ratio =
      state === "complete"
        ? 1
        : fresher.ticketsTotal > 0
          ? fresher.ticketsDone / fresher.ticketsTotal
          : fresher.layersBuilt / 5;

    const briefingTitle =
      resolvedSession === "CS1B"
        ? "Mission: Core Services Desk"
        : "Mission: Project Phoenix";
    const briefingBody =
      resolvedSession === "CS1B"
        ? "Phoenix is online. Now learn the five services every ticket will touch — EC2, S3, IAM, VPC, CloudWatch — then clear the awareness desk."
        : `${PHOENIX_COMPANY.crisis} ${PHOENIX_COMPANY.goal}`;

    return (
      <JourneyChrome
        accent="orange"
        progressLabel={progressLabel}
        progressRatio={ratio}
        storyLine={
          state === "briefing"
            ? "Your board is waiting. Clear the first ticket and Project Phoenix starts building live here."
            : state === "complete"
              ? "Phoenix is sealed. Click regions and services to replay how traffic and trust move."
              : "This board grows as you clear tickets — click nodes to see where traffic goes."
        }
      >
        <AnimatePresence mode="wait">
          {state === "briefing" ? (
            <motion.div key={`${resolvedSession}-briefing`} className="absolute inset-0">
              <MissionBriefingCard
                accent="orange"
                eyebrow={`${resolvedSession} · Mission briefing`}
                title={briefingTitle}
                body={briefingBody}
              />
            </motion.div>
          ) : (
            <motion.div
              key={state === "complete" ? `${resolvedSession}-complete` : `${resolvedSession}-live`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.55 }}
              className="absolute inset-0"
            >
              <ArchitectureVisualizer
                progressLevel={Math.max(1, fresher.progressLevel || 1)}
                diagramOnly
                liveInteractive
              />
            </motion.div>
          )}
        </AnimatePresence>
      </JourneyChrome>
    );
  }

  // ── FoodQuick story sessions (CS2–CS7) — Mission board ──
  if (journey === "foodquick") {
  const story = storySessionStats(resolvedSession);
    // Mission board "complete" = investigation sealed (layers), not ticket ops alone
    const state: JourneyState = story.complete
      ? "complete"
      : story.anyStarted || story.ticketsDone > 0
        ? "in_progress"
        : "briefing";

    const progressLabel =
      state === "briefing"
        ? `${story.ticket} standing by · investigation not started`
        : state === "complete"
          ? `${story.ticket} closed · all ${story.layersTotal} layers sealed`
          : `${story.layersBuilt} of ${story.layersTotal} layers sealed · ${story.ticketsDone}/${story.ticketsTotal} tickets`;

    const ratio =
      state === "complete"
        ? 1
        : story.layersTotal > 0
          ? Math.max(
              story.layersBuilt / story.layersTotal,
              story.ticketsTotal > 0
                ? story.ticketsDone / story.ticketsTotal * 0.35
                : 0
            )
          : 0;

    const briefingBodies: Partial<Record<CloudSessionId, string>> = {
      CS2: "Ravi Krishnan flagged FoodQuick's IAM setup as priority one before next month's audit. Six acts. One investigation. Every layer you seal shows up here — and the mystery planted in Act 1 pays off in Act 4.",
      CS3: "Priya Nair: rebuild the VPC that was stood up in one afternoon and never revisited. Seal each network layer on this Mission board as you clear tickets.",
      CS4: "Ravi's Day-1 EC2 guesses have run for two years. Right-size, template, balance, and scale — watch the compute path form here.",
      CS5: "The CFO wants storage that doesn't quietly bankrupt FoodQuick. Buckets, lifecycle, encryption — this board shows what you locked in.",
      CS6: "Karthik Rao is done learning about outages from Twitter. Alarms, trails, budgets — signals before symptoms.",
      CS7: "Build FoodQuick properly end-to-end. Capstone callback to FQ-142 — every prior mission lights a column on the master Journey Map.",
    };

    // CS2 keeps the IAM investigation diagram; CS3–CS7 use SessionLiveBoard
    if (resolvedSession === "CS2") {
      const sessionCompletedTaskIds: string[] = [];
      for (const lesson of buildingBasicsLessons) {
        if (lesson.section_id !== "CS2") continue;
        const taskIds =
          lesson.workspace_tasks?.map((t) => t.task_id).filter(Boolean) || [];
        sessionCompletedTaskIds.push(
          ...completedTaskIdsForLesson(lesson.lesson_id, taskIds)
        );
      }

      const currentLessonId =
        getStorySession("CS2")?.acts.find((a) => {
          const st = getLayerStatus(a.lessonId);
          return st === "in_progress" || st === "cracked";
        })?.lessonId ||
        getStorySession("CS2")?.acts[story.layersBuilt]?.lessonId ||
        "C2.1a";

      const currentTaskIds =
        buildingBasicsLessons
          .find((l) => l.lesson_id === currentLessonId)
          ?.workspace_tasks?.map((t) => t.task_id)
          .filter(Boolean) || [];

      const diagramState = deriveCs2DiagramState({
        currentLessonId,
        completedTaskIds: completedTaskIdsForLesson(
          currentLessonId,
          currentTaskIds
        ),
        sessionCompletedTaskIds,
        celebrateAct: state === "complete" ? 6 : undefined,
        inspectAct: state === "complete" ? 6 : undefined,
      });

      return (
        <JourneyChrome
          accent="gold"
          progressLabel={progressLabel}
          progressRatio={ratio}
          storyLine={
            state === "briefing"
              ? "Clear the first ticket — this Mission board becomes your live IAM architecture."
              : state === "complete"
                ? "FQ-142 sealed. Click nodes to replay how trust and evidence connect."
                : "This board grows from your decisions — click nodes to inspect connections."
          }
        >
          <AnimatePresence mode="wait">
            {state === "briefing" ? (
              <motion.div key="cs2-briefing" className="absolute inset-0">
                <MissionBriefingCard
                  accent="gold"
                  eyebrow={`${story.ticket} · FoodQuick`}
                  title={story.sessionTitle}
                  body={briefingBodies.CS2!}
                />
              </motion.div>
            ) : (
              <motion.div
                key={state === "complete" ? "cs2-complete" : "cs2-live"}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.55 }}
                className="absolute inset-0 p-3"
              >
                {state === "complete" && (
                  <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">
                    <ShieldCheck className="h-3.5 w-3.5" /> FQ-142 closed
                  </div>
                )}
                <FoodQuickIamDiagram
                  state={diagramState}
                  size="hero"
                  celebratePulse={state === "complete" ? "perimeter" : null}
                  className="h-full min-h-[300px] border-0"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </JourneyChrome>
      );
    }

    // Mission board = full session progress (same flows as Live Architecture).
    // Do not pin currentLessonId to the first in-progress act — that ghosted
    // later acts and killed live edges even when tickets were already cleared.
    const liveBoard = deriveSessionLiveBoard({
      sessionId: resolvedSession,
      celebrate: state === "complete" && story.complete,
    });

    return (
      <JourneyChrome
        accent="gold"
        progressLabel={progressLabel}
        progressRatio={ratio}
          storyLine={
            state === "briefing"
              ? "Clear the first ticket — this Mission board becomes your live architecture."
              : state === "complete"
                ? liveBoard.outcome === "failed"
                  ? liveBoard.outcomeNote
                  : `${story.ticket} sealed. Click nodes to audit how your decisions shaped the build.`
                : liveBoard.outcome !== "healthy"
                  ? liveBoard.outcomeNote
                  : "Decisions form this board live — click nodes to inspect connections and audit gaps."
          }
      >
        <AnimatePresence mode="wait">
          {state === "briefing" ? (
            <motion.div
              key={`${resolvedSession}-briefing`}
              className="absolute inset-0"
            >
              <MissionBriefingCard
                accent="gold"
                eyebrow={`${story.ticket} · FoodQuick`}
                title={story.sessionTitle}
                body={
                  briefingBodies[resolvedSession] ||
                  story.blurb ||
                  "One investigation. Seal each act — the Mission board shows what you built."
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key={
                state === "complete"
                  ? `${resolvedSession}-complete`
                  : `${resolvedSession}-live`
              }
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.55 }}
              className="absolute inset-0 p-3"
            >
              {state === "complete" && liveBoard.outcome !== "failed" && (
                <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">
                  <ShieldCheck className="h-3.5 w-3.5" /> {story.ticket} closed
                </div>
              )}
              {liveBoard.outcome === "failed" && (
                <div className="absolute left-1/2 top-3 z-20 flex max-w-[90%] -translate-x-1/2 items-center gap-1.5 rounded-full border border-rose-500/50 bg-rose-950/80 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-200">
                  Failed to solve cleanly — rebuild cracked paths
                </div>
              )}
              {liveBoard.outcome === "degraded" && state !== "briefing" && (
                <div className="absolute left-1/2 top-3 z-20 flex max-w-[90%] -translate-x-1/2 items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/80 px-3 py-1 font-mono text-[10px] text-amber-100">
                  Degraded — audit amber paths on the board
                </div>
              )}
              <SessionLiveBoard
                state={liveBoard}
                size="hero"
                interactive
                liveFlow
                className="h-full min-h-[480px] border-0"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </JourneyChrome>
    );
  }

  // ── Fallback (unshipped / unknown) ──
  const generic = genericSessionStats(resolvedSession);
  const state: JourneyState = generic.complete
    ? "complete"
    : generic.anyStarted
      ? "in_progress"
      : "briefing";

  const progressLabel =
    state === "briefing"
      ? `${resolvedSession} standing by · session not started`
      : state === "complete"
        ? `${resolvedSession} closed · mission complete`
        : `${generic.ticketsDone} of ${generic.ticketsTotal} tickets resolved`;

  const ratio =
    state === "complete"
      ? 1
      : generic.ticketsTotal > 0
        ? generic.ticketsDone / generic.ticketsTotal
        : 0;

  return (
    <JourneyChrome
      accent="gold"
      progressLabel={progressLabel}
      progressRatio={ratio}
      storyLine={
        state === "briefing"
          ? "This session’s Mission board unlocks when its workspace tickets ship."
          : "Each session keeps its own sealed board — never overwritten by the next one."
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${resolvedSession}-${state}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="absolute inset-0"
        >
          <MissionBriefingCard
            accent="gold"
            eyebrow={`${resolvedSession} · Mission board`}
            title={
              state === "complete"
                ? `${resolvedSession} complete`
                : state === "in_progress"
                  ? `${resolvedSession} in progress`
                  : generic.title
            }
            body={
              state === "complete"
                ? "This session's mission is sealed. Reopen anytime to review what you built — new sessions never overwrite this map."
                : state === "in_progress"
                  ? `You're mid-session. ${generic.ticketsDone}/${generic.ticketsTotal} tickets cleared.`
                  : `${generic.blurb} When this session's tickets ship, this map becomes their live build.`
            }
          />
        </motion.div>
      </AnimatePresence>
    </JourneyChrome>
  );
}
