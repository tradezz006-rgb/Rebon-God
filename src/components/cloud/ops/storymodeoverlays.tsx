/**
 * Story-mode overlays for CS2-style sessions:
 *  - attempt meter + third-strike reveal
 *  - act celebration when a layer seals
 *  - crack repair routing (re-clear the previous act first)
 *  - Investigation Complete: the assembled build, inspectable layer by layer
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  Hammer,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getLayerBadge,
  getLayerStatus,
  getSessionBuild,
  getStoryAct,
  getStorySessionForLesson,
  type LayerStatus,
  type RepairPlan,
  type StoryAct,
} from "@/data/cloud/storyMode";
import {
  CS2_LAYER_INSPECT,
  deriveCs2DiagramState,
} from "@/data/cloud/cs2DiagramState";
import { FoodQuickIamDiagram } from "@/components/cloud/ops/FoodQuickIamDiagram";
import { SessionLiveBoard } from "@/components/cloud/ops/SessionLiveBoard";
import {
  deriveBoardForLesson,
  deriveSessionLiveBoard,
} from "@/data/cloud/sessionLiveBoard";
import { StoryLineReveal } from "@/components/cloud/ops/StoryLineReveal";
import type { CloudWorkspaceTask } from "@/types/cloudLesson";

const clean = (text?: string) =>
  text ? text.replace(/\[cite:\s*\d+\]/g, "").trim() : "";

  const ACT_PULSE: Record<number, string> = {
  1: "users",
  2: "roles",
  3: "policies",
  4: "vikram",
  5: "cicd",
  6: "perimeter",
};

/* ───────────────────────── attempts ───────────────────────── */

export function StoryAttemptMeter({
  attemptsUsed,
  maxAttempts,
}: {
  attemptsUsed: number;
  maxAttempts: number;
}) {
  return (
    <span className="flex items-center gap-1.5" title="Attempts on this task">
      {Array.from({ length: maxAttempts }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-4 rounded-full ${
            i < attemptsUsed ? "bg-rose-500" : "bg-slate-700"
          }`}
        />
      ))}
      <span className="font-mono text-[10px] text-slate-500">
        {Math.max(0, maxAttempts - attemptsUsed)} left
      </span>
    </span>
  );
}

/** Shown after the third wrong attempt — the answer, so learning still happens. */
export function StoryRevealPanel({ task }: { task: CloudWorkspaceTask }) {
  const correctOption =
    typeof task.correct_index === "number" && task.options?.length
      ? task.options[task.correct_index]
      : undefined;

  const correctSequence =
    task.correct_order?.length && task.items?.length
      ? task.correct_order.map((i) => task.items![i])
      : undefined;

  const caseAnswers = task.cases?.filter((c) => c.expected || c.options?.length);

  return (
    <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-950/20 p-4">
      <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-300">
        <Eye className="h-3.5 w-3.5" /> Answer revealed · task left unresolved
      </p>

      {correctOption && (
        <p className="mt-3 text-sm text-amber-100">
          <span className="font-semibold">Correct choice: </span>
          {clean(correctOption)}
        </p>
      )}

      {correctSequence && (
        <ol className="mt-3 space-y-1 text-sm text-amber-100">
          {correctSequence.map((step, i) => (
            <li key={`${step}-${i}`} className="flex gap-2">
              <span className="font-mono text-amber-400">{i + 1}.</span>
              {clean(step)}
            </li>
          ))}
        </ol>
      )}

      {task.what_to_find?.length ? (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-widest text-amber-400/80">
            What you were meant to spot
          </p>
          <ul className="mt-1 space-y-1 text-sm text-amber-100">
            {task.what_to_find.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-400">·</span>
                {clean(item)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {task.diagnosis && (
        <p className="mt-3 text-sm text-amber-100">
          <span className="font-semibold">Diagnosis: </span>
          {clean(task.diagnosis)}
        </p>
      )}

      {(task.correct_fix || task.fix) && (
        <pre className="mt-3 whitespace-pre-wrap rounded border border-amber-500/20 bg-[#0a0a0a] p-3 font-mono text-xs leading-5 text-amber-100/90">
          {clean(task.correct_fix || task.fix)}
        </pre>
      )}

      {task.expected_answer_contains?.length ? (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-widest text-amber-400/80">
            Ren&rsquo;s answer had to cover
          </p>
          <ul className="mt-1 space-y-1 text-sm text-amber-100">
            {task.expected_answer_contains.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-400">·</span>
                {clean(item)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {caseAnswers?.length ? (
        <div className="mt-3 space-y-2">
          {caseAnswers.map((c, i) => (
            <div
              key={c.id || i}
              className="rounded border border-amber-500/20 bg-[#0a0a0a] p-3"
            >
              <p className="text-[10px] font-mono uppercase text-amber-400/80">
                {c.id || `case_${i + 1}`}
              </p>
              <p className="mt-1 text-sm text-amber-100">
                {clean(
                  c.expected ||
                    (typeof c.correct_index === "number"
                      ? c.options?.[c.correct_index]
                      : "")
                )}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {task.explanation && (
        <p className="mt-3 border-l-2 border-amber-500/50 pl-3 text-sm italic leading-relaxed text-amber-100/90">
          Ren: &ldquo;{clean(task.explanation)}&rdquo;
        </p>
      )}
    </div>
  );
}

/* ──────────────────── act celebration ─────────────────── */

export function ActCelebrationModal({
  lessonId,
  unresolvedCount,
  isFinalAct,
  onContinue,
  onRepairNow,
  completedTaskIds = [],
}: {
  lessonId: string;
  unresolvedCount: number;
  isFinalAct: boolean;
  onContinue: () => void;
  onRepairNow?: () => void;
  completedTaskIds?: string[];
}) {
  const act = getStoryAct(lessonId);
  const session = getStorySessionForLesson(lessonId);
  const [phase, setPhase] = useState<"diagram" | "ren" | "actions">("diagram");

  useEffect(() => {
    setPhase("diagram");
    const t1 = window.setTimeout(() => setPhase("ren"), 1600);
    const t2 = window.setTimeout(() => setPhase("actions"), 3200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [lessonId]);

  if (!act || !session) return null;

  const cracked = unresolvedCount > 0;
  const nextAct = session.acts[act.index + 1];
  const isCs2 = session.sessionId === "CS2";
  const diagramState = deriveCs2DiagramState({
    currentLessonId: lessonId,
    completedTaskIds,
    celebrateAct: act.actNumber,
  });
  const liveBoard = deriveBoardForLesson(lessonId, !cracked);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] grid place-items-center bg-[#020711]/88 p-4 backdrop-blur-sm"
    >
      <motion.section
        initial={{ y: 18, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className={`relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-[#12161d] shadow-2xl ${
          cracked ? "border-rose-500/50" : "border-amber-400/50"
        }`}
      >
        <div className="sticky top-0 z-30 flex items-start justify-between gap-3 border-b border-slate-800 bg-[#12161d]/95 px-5 py-3 backdrop-blur-md">
          <div className="min-w-0 text-left">
            <p
              className={`text-[10px] font-mono uppercase tracking-[0.2em] ${
                cracked ? "text-rose-300" : "text-amber-300"
              }`}
            >
              Act {act.actNumber} of {session.acts.length} ·{" "}
              {cracked ? "layer set, but cracked" : "watching the build seal"}
            </p>
            <h2 className="mt-1 truncate text-lg font-bold text-white md:text-xl">
              {act.buildsLayer}
            </h2>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
            aria-label="Close and continue"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="relative px-4 pt-4">
            {isCs2 ? (
              <FoodQuickIamDiagram
                state={diagramState}
                size="inspect"
                liveFlow
                celebratePulse={ACT_PULSE[act.actNumber]}
                className="min-h-[300px]"
              />
            ) : (
              <SessionLiveBoard
                state={liveBoard}
                size="inspect"
                liveFlow
                interactive
                className="min-h-[300px]"
              />
            )}
            {!cracked && phase !== "diagram" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pointer-events-none absolute inset-4 rounded-lg ring-2 ring-amber-300/40"
              />
            )}
          </div>

          <div className="space-y-4 p-5 md:p-6">
            {(phase === "ren" || phase === "actions") && act.arcOutro && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-amber-400/30 bg-black/40 p-4"
              >
                <StoryLineReveal
                  text={act.arcOutro}
                  speaker="Ren:"
                  autoMs={2400}
                  lineClassName="text-sm italic leading-relaxed text-slate-200"
                />
              </motion.div>
            )}

            {phase === "actions" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {cracked ? (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-left">
                    <p className="text-sm font-medium text-rose-200">
                      {unresolvedCount} unresolved — this layer holds, but
                      it&rsquo;s cracked.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-xs text-amber-200/80">
                    <Sparkles className="h-3.5 w-3.5" />
                    Layer sealed on Live Architecture — open this session&rsquo;s
                    Mission board anytime from the workspace page.
                  </div>
                )}

                {nextAct && !isFinalAct && (
                  <p className="text-center text-xs text-slate-500">
                    Next: Act {nextAct.actNumber} · {nextAct.actTitle}
                  </p>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  {cracked && onRepairNow && (
                    <Button
                      onClick={onRepairNow}
                      variant="outline"
                      className="flex-1 border-rose-500/40 text-rose-200 hover:bg-rose-500/10"
                    >
                      <Wrench className="mr-2 h-4 w-4" /> Repair the crack
                    </Button>
                  )}
                  <Button
                    onClick={onContinue}
                    className={`flex-1 font-bold ${
                      cracked
                        ? "bg-slate-200 text-slate-900 hover:bg-white"
                        : "bg-amber-400 text-[#232f3e] hover:bg-amber-300"
                    }`}
                  >
                    {isFinalAct
                      ? "Inspect the finished build"
                      : nextAct
                        ? "Continue to tickets"
                        : "Back to tickets"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {phase === "diagram" && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-center font-mono text-[10px] uppercase tracking-widest text-slate-600">
                  Sealing {act.buildsLayer}…
                </p>
                <Button
                  variant="outline"
                  onClick={onContinue}
                  className="border-slate-600 text-slate-300"
                >
                  Skip · continue
                </Button>
              </div>
            )}

            {phase === "ren" && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={onContinue}
                  className="border-slate-600 text-slate-300"
                >
                  Close · continue
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

/* ──────────────────── crack repair routing ─────────────────── */

export function CrackRepairModal({
  plan,
  onReinforce,
  onRetryCracked,
  onLater,
}: {
  plan: RepairPlan;
  onReinforce: () => void;
  onRetryCracked: () => void;
  onLater: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[78] grid place-items-center bg-[#020711]/93 p-4 backdrop-blur-sm"
    >
      <motion.section
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-[#12161d] p-7 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-rose-500/50 bg-rose-950/40">
            <Hammer className="h-5 w-5 text-rose-300" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-rose-300">
              Reconstruction required
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              {plan.crackedLayer} is cracked
            </h3>
          </div>
        </div>

        <p className="mt-5 border-l-2 border-rose-500/50 pl-4 text-sm italic leading-relaxed text-slate-300">
          Ren: &ldquo;{plan.renSays}&rdquo;
        </p>

        <ol className="mt-5 space-y-2 text-sm text-slate-300">
          <li className="flex gap-2">
            <span
              className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${
                plan.reinforceCleared
                  ? "bg-emerald-500 text-slate-900"
                  : "bg-rose-500 text-white"
              }`}
            >
              {plan.reinforceCleared ? "✓" : "1"}
            </span>
            Re-clear <span className="font-mono">{plan.reinforceLessonId}</span>{" "}
            ({plan.reinforceActTitle}) end to end
          </li>
          <li className="flex gap-2">
            <span
              className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${
                plan.reinforceCleared
                  ? "bg-rose-500 text-white"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              2
            </span>
            Retry the {plan.unresolvedTaskIds.length} unresolved task
            {plan.unresolvedTaskIds.length > 1 ? "s" : ""} in{" "}
            <span className="font-mono">{plan.crackedLessonId}</span> with fresh
            attempts
          </li>
        </ol>

        <div className="mt-4 rounded-lg border border-slate-700 bg-[#0a0c10] p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Unresolved
          </p>
          <p className="mt-1 font-mono text-xs text-rose-300">
            {plan.unresolvedTaskIds.join(" · ")}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={onLater}
            className="text-slate-400 hover:text-white"
          >
            Not now
          </Button>
          {plan.reinforceCleared ? (
            <Button
              onClick={onRetryCracked}
              className="flex-1 bg-rose-500 font-bold text-white hover:bg-rose-400"
            >
              Retry unresolved tasks <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={onReinforce}
              className="flex-1 bg-rose-500 font-bold text-white hover:bg-rose-400"
            >
              Reinforce {plan.reinforceLessonId}{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}

/* ──────────────── investigation complete + inspect ──────────── */

const PLATE_TONE: Record<LayerStatus, string> = {
  not_reached: "border-slate-800 border-dashed bg-slate-900/40 text-slate-600",
  in_progress: "border-[#ff9900]/50 bg-[#ff9900]/5 text-slate-300",
  clean:
    "border-amber-300/70 bg-gradient-to-r from-amber-500/20 to-amber-300/5 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.18)]",
  repaired:
    "border-amber-400/45 bg-gradient-to-r from-amber-500/10 to-slate-900/40 text-amber-100/90",
  cracked: "border-rose-500/60 bg-rose-950/30 text-rose-100",
};

export function InvestigationCompleteScreen({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const segments = getSessionBuild(sessionId);
  const session = segments.length
    ? getStorySessionForLesson(segments[0].act.lessonId)
    : null;
  const [inspecting, setInspecting] = useState<StoryAct | null>(
    () => segments[0]?.act ?? null
  );

  const cleanCount = segments.filter((s) => s.status === "clean").length;
  const isCs2 = sessionId === "CS2";
  const fullDiagram = deriveCs2DiagramState({
    currentLessonId: "C2.5",
    completedTaskIds: [],
    celebrateAct: 6,
    inspectAct: inspecting?.actNumber ?? null,
  });
  const liveBoard = deriveSessionLiveBoard({
    sessionId,
    currentLessonId: inspecting?.lessonId,
    celebrate: true,
  });

  if (!session || !segments.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[85] overflow-y-auto bg-[#020711]/97 p-4 backdrop-blur-sm"
    >
      <div className="mx-auto grid min-h-full max-w-5xl place-items-center py-6">
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative w-full overflow-hidden rounded-2xl border border-amber-400/40 bg-[#12161d] shadow-2xl"
        >
          <div className="relative border-b border-slate-800 px-7 py-6 text-center">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
              aria-label="Close and view Mission board"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-300">
              {session.ticket} · investigation complete
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">
              {session.closingHeadline}
            </h2>
            <div className="mx-auto mt-3 max-w-2xl text-left">
              <StoryLineReveal
                text={session.closingRen}
                speaker="Ren:"
                autoMs={2800}
                lineClassName="text-sm italic leading-relaxed text-slate-300"
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {cleanCount}/{segments.length} layers cleared clean · private
              record
            </p>
          </div>

          {/* Full assembled architecture */}
          <div className="border-b border-slate-800 px-5 py-4">
            <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-widest text-slate-500">
              FoodQuick architecture — assembled
            </p>
            {isCs2 ? (
              <FoodQuickIamDiagram
                state={fullDiagram}
                size="hero"
                celebratePulse="perimeter"
              />
            ) : (
              <SessionLiveBoard
                state={liveBoard}
                size="hero"
                liveFlow
                interactive
              />
            )}
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:p-7">
            <div>
              <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                Click a layer to inspect its fragment
              </p>
              <div className="flex flex-col-reverse gap-2">
                {segments.map((segment) => {
                  const selected =
                    inspecting?.lessonId === segment.act.lessonId;
                  return (
                    <button
                      key={segment.act.lessonId}
                      type="button"
                      onClick={() => setInspecting(segment.act)}
                      className={`relative overflow-hidden rounded-lg border px-4 py-3 text-left transition hover:brightness-125 ${
                        PLATE_TONE[segment.status]
                      } ${selected ? "ring-2 ring-amber-300/70" : ""}`}
                    >
                      <span className="relative flex items-center gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/10 bg-black/30 font-mono text-xs">
                          {segment.act.actNumber}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {segment.act.buildsLayer}
                          </span>
                          <span className="block truncate text-[10px] font-mono text-slate-500">
                            {segment.act.lessonId} · {segment.act.actTitle}
                          </span>
                        </span>
                        {segment.status === "clean" && (
                          <Check className="h-4 w-4 shrink-0 text-amber-300" />
                        )}
                        {segment.status === "repaired" && (
                          <Wrench className="h-4 w-4 shrink-0 text-amber-200/80" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-[320px] rounded-lg border border-slate-700 bg-[#0a0c10] p-4">
              {inspecting ? (
                <InspectPanel
                  act={inspecting}
                  onClose={() => setInspecting(null)}
                />
              ) : (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <Eye className="mx-auto h-8 w-8 text-slate-700" />
                    <p className="mt-3 text-sm text-slate-500">
                      Pick a layer to inspect its diagram fragment.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-800 p-6 md:p-7">
            <Button
              onClick={onClose}
              className="h-12 w-full bg-amber-400 font-bold text-[#232f3e] hover:bg-amber-300"
            >
              Close · View Mission board
            </Button>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}

function InspectPanel({
  act,
  onClose,
}: {
  act: StoryAct;
  onClose: () => void;
}) {
  const status = getLayerStatus(act.lessonId);
  const badge = getLayerBadge(act.lessonId);
  const meta = CS2_LAYER_INSPECT[act.lessonId];
  const fragment = deriveCs2DiagramState({
    currentLessonId: act.lessonId,
    completedTaskIds: [],
    celebrateAct: act.actNumber,
    inspectAct: act.actNumber,
  });
  const badgeTone =
    badge.tone === "clean"
      ? "border-amber-400/50 bg-amber-500/10 text-amber-200"
      : badge.tone === "repaired"
        ? "border-slate-600 bg-slate-800/60 text-slate-300"
        : "border-rose-500/40 bg-rose-950/40 text-rose-200";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
            Layer {act.actNumber} · {act.buildsLayer}
          </p>
          <h4 className="mt-1 text-base font-semibold text-white">
            Built in {act.lessonId} — {act.actTitle}
          </h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-500 hover:text-white"
          aria-label="Close inspect panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Actual diagram fragment — never empty */}
      <div className="mt-3">
        <FoodQuickIamDiagram
          state={fragment}
          size="inspect"
          celebratePulse={ACT_PULSE[act.actNumber]}
        />
        {meta?.diagramLabel && (
          <p className="mt-1.5 text-center font-mono text-[9px] text-slate-500">
            {meta.diagramLabel}
          </p>
        )}
      </div>

      {(meta?.callout || act.lessonId === "C2.1a") && (
        <div className="mt-3 rounded border border-rose-500/30 bg-rose-950/20 px-3 py-2">
          <p className="text-[9px] font-mono uppercase tracking-widest text-rose-300">
            Thread callout
          </p>
          <p className="mt-1 text-xs leading-relaxed text-rose-100/90">
            {meta?.callout ||
              "CloudTrail anomaly planted here — paid off in Act 4."}
          </p>
        </div>
      )}

      <div className="mt-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          Why it matters
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">
          {meta?.impact || act.realWorldWhy}
        </p>
      </div>

      <div
        className={`mt-auto flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${badgeTone}`}
      >
        {status === "clean" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : status === "repaired" ? (
          <Wrench className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
        {badge.label}
      </div>
      <p className="mt-1 text-[10px] leading-4 text-slate-600">
        Private record — not shown to companies.
      </p>
    </div>
  );
}
