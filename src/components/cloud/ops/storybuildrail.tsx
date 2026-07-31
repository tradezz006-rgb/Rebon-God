/**
 * Persistent right rail for story sessions (CS2–CS7).
 * Live unlocks above a real architecture board. Click the board to expand.
 */
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { FoodQuickIamDiagram } from "@/components/cloud/ops/FoodQuickIamDiagram";
import { SessionLiveBoard } from "@/components/cloud/ops/SessionLiveBoard";
import { deriveCs2DiagramState } from "@/data/cloud/cs2DiagramState";
import { deriveBoardForLesson } from "@/data/cloud/sessionLiveBoard";
import {
  getSessionBuildForLesson,
  getStorySessionForLesson,
} from "@/data/cloud/storyMode";

interface Props {
  lessonId: string;
  tasksCompleted: number;
  totalTasks: number;
  completedTaskIds: string[];
  version?: number;
  celebratePulse?: string | null;
  celebrateAct?: number | null;
}

export function StoryBuildRail({
  lessonId,
  tasksCompleted,
  totalTasks,
  completedTaskIds,
  version = 0,
  celebratePulse,
  celebrateAct,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  void version;
  const session = getStorySessionForLesson(lessonId);
  const segments = getSessionBuildForLesson(lessonId);
  const isCs2 = session?.sessionId === "CS2";

  const diagramState = useMemo(
    () =>
      deriveCs2DiagramState({
        currentLessonId: lessonId,
        completedTaskIds,
        celebrateAct: celebrateAct ?? undefined,
      }),
    [lessonId, completedTaskIds, celebrateAct, version]
  );

  const liveBoard = useMemo(
    () => deriveBoardForLesson(lessonId, false, completedTaskIds),
    [lessonId, completedTaskIds, version]
  );

  if (!session || !segments.length) return null;

  const sealed = segments.filter(
    (s) => s.status === "clean" || s.status === "repaired"
  ).length;
  const cracks = segments.filter((s) => s.status === "cracked").length;
  const openPins = diagramState.pins.filter(
    (p) => p.phase === "open" || p.phase === "pulse"
  ).length;

  const unlocks = isCs2
    ? diagramState.liveUnlocks
    : liveBoard.liveUnlocks;

  return (
    <>
      <div className="flex h-full flex-col border-l border-slate-800 bg-[#0a0c10]">
        <div className="border-b border-slate-800 bg-[#161b22] px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#ff9900]">
                {session.ticket} · Live Architecture
              </div>
              <div className="mt-0.5 truncate text-xs text-slate-400">
                {session.title}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="shrink-0 rounded border border-slate-700 bg-slate-900/80 p-1.5 text-slate-400 transition hover:border-amber-500/40 hover:text-amber-200"
              title="Expand live architecture"
              aria-label="Expand live architecture"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
          <div className="space-y-1">
            <AnimatePresence>
              {unlocks.map((u) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded border border-emerald-500/30 bg-emerald-950/40 px-2 py-1 font-mono text-[9px] text-emerald-400"
                >
                  ✓ {u.label}
                </motion.div>
              ))}
            </AnimatePresence>
            {isCs2 && openPins > 0 && !diagramState.evidenceLinked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded border border-rose-500/30 bg-rose-950/30 px-2 py-1 font-mono text-[9px] text-rose-300"
              >
                {openPins} open thread{openPins > 1 ? "s" : ""} on the board
              </motion.div>
            )}
            {!isCs2 && liveBoard.deformCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded border border-amber-500/30 bg-amber-950/30 px-2 py-1 font-mono text-[9px] text-amber-200"
              >
                {liveBoard.deformCount} path
                {liveBoard.deformCount > 1 ? "s" : ""} need audit — click nodes
              </motion.div>
            )}
            {isCs2 && diagramState.evidenceLinked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded border border-amber-400/40 bg-amber-500/10 px-2 py-1 font-mono text-[9px] text-amber-200"
              >
                ✓ Three threads → Vikram
              </motion.div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="group relative min-h-0 flex-1 overflow-hidden rounded-lg text-left outline-none ring-offset-2 ring-offset-[#0a0c10] focus-visible:ring-2 focus-visible:ring-amber-400/50"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/50 to-transparent px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-slate-400 opacity-0 transition group-hover:opacity-100">
              Click to inspect connections
            </span>
            {isCs2 ? (
              <FoodQuickIamDiagram
                state={diagramState}
                size="rail"
                celebratePulse={celebratePulse}
                className="min-h-[300px] h-full pointer-events-none"
              />
            ) : (
              <div className="pointer-events-none h-full min-h-[300px]">
                <SessionLiveBoard
                  state={liveBoard}
                  size="rail"
                  interactive={false}
                  liveFlow
                  className="h-full min-h-[300px]"
                />
              </div>
            )}
          </button>
        </div>

        <div className="border-t border-slate-800 bg-[#161b22] px-3 py-2">
          <div className="mb-1 flex justify-between font-mono text-[10px] text-slate-500">
            <span>
              {sealed}/{segments.length} layers sealed
            </span>
            <span>
              {tasksCompleted}/{totalTasks}
            </span>
          </div>
          {cracks > 0 && (
            <p className="mb-1 font-mono text-[9px] text-rose-400">
              {cracks} crack{cracks > 1 ? "s" : ""} in the build
            </p>
          )}
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full bg-[#ff9900]"
              animate={{
                width: `${(sealed / Math.max(segments.length, 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="relative flex h-[min(88vh,720px)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#0b0f16] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 bg-[#161b22] px-4 py-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#ff9900]">
                    {session.ticket} · Live Architecture · audit view
                  </p>
                  <p className="text-sm text-slate-300">{session.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="rounded border border-slate-700 p-2 text-slate-400 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 p-3">
                {isCs2 ? (
                  <FoodQuickIamDiagram
                    state={diagramState}
                    size="hero"
                    celebratePulse={celebratePulse}
                    className="h-full min-h-[420px] border-0"
                  />
                ) : (
                  <SessionLiveBoard
                    state={liveBoard}
                    size="modal"
                    interactive
                    liveFlow
                    className="h-full min-h-[420px]"
                  />
                )}
              </div>
              <p className="border-t border-slate-800 px-4 py-2 text-center text-[11px] text-slate-500">
                Click nodes to trace connections. Amber marks paths shaped by
                your decisions — audit what looks off, then adjust on the next
                tickets.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
