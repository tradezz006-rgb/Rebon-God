/**
 * Lightweight act wrap-up — what you shipped in this lesson's tickets.
 * Not a seal ceremony. Cancel/close returns to the solved ticket list.
 */
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getStoryAct,
  getStorySessionForLesson,
  getUnresolvedTaskIds,
} from "@/data/cloud/storyMode";

type TicketRow = {
  taskId: string;
  label: string;
  ok: boolean;
};

export function ActWorkSummaryModal({
  lessonId,
  tickets,
  onClose,
  onRepairNow,
  onInspectMission,
}: {
  lessonId: string;
  tickets: TicketRow[];
  onClose: () => void;
  onRepairNow?: () => void;
  /** Only when whole investigation is done */
  onInspectMission?: () => void;
}) {
  const act = getStoryAct(lessonId);
  const session = getStorySessionForLesson(lessonId);
  if (!act || !session) return null;

  const unresolved = getUnresolvedTaskIds(lessonId);
  const cracked = unresolved.length > 0;
  const okCount = tickets.filter((t) => t.ok).length;
  const nextAct = session.acts[act.index + 1];
  const isFinal = act.index === session.acts.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] grid place-items-center bg-[#020711]/80 p-4 backdrop-blur-sm"
    >
      <motion.section
        initial={{ y: 14, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className={`relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-[#12161d] shadow-2xl ${
          cracked ? "border-rose-500/45" : "border-slate-700"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
              Act {act.actNumber} of {session.acts.length} · what you shipped
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {act.actTitle}
            </h2>
            <p className="mt-1 text-xs text-slate-400">{act.buildsLayer}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-400 hover:text-white"
            aria-label="Close and view tickets"
            title="View solved tickets"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-xs text-slate-400">
            {okCount}/{tickets.length} tickets locked in this act. Live
            Architecture and the Mission board update from these decisions —
            expand the board anytime to audit paths.
          </p>

          <ul className="space-y-2">
            {tickets.map((t, i) => (
              <li
                key={t.taskId}
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  t.ok
                    ? "border-emerald-500/25 bg-emerald-950/20 text-slate-200"
                    : "border-amber-500/30 bg-amber-950/25 text-amber-100"
                }`}
              >
                <CheckCircle2
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    t.ok ? "text-emerald-400" : "text-amber-400"
                  }`}
                />
                <span className="min-w-0">
                  <span className="font-mono text-[10px] text-slate-500">
                    {i + 1}. {t.taskId}
                  </span>
                  <span className="mt-0.5 block leading-snug">{t.label}</span>
                </span>
              </li>
            ))}
          </ul>

          {cracked && (
            <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
              {unresolved.length} ticket
              {unresolved.length > 1 ? "s" : ""} left a crack — repair when
              ready, or close and review the tickets you already solved.
            </p>
          )}

          {nextAct && !isFinal && (
            <p className="mt-3 text-center text-[11px] text-slate-500">
              Next act ready: Act {nextAct.actNumber} · {nextAct.actTitle}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-800 px-5 py-4 sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-slate-600 text-slate-200"
          >
            View solved tickets
          </Button>
          {cracked && onRepairNow && (
            <Button
              variant="outline"
              onClick={onRepairNow}
              className="flex-1 border-rose-500/40 text-rose-200 hover:bg-rose-500/10"
            >
              Repair crack
            </Button>
          )}
          {isFinal && onInspectMission ? (
            <Button
              onClick={onInspectMission}
              className="flex-1 bg-amber-400 font-bold text-[#232f3e] hover:bg-amber-300"
            >
              Open Mission board
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </motion.section>
    </motion.div>
  );
}
