import { Lock, CheckCircle2, BadgeCheck } from "lucide-react";
import type { StudentDayMeta } from "@/types/studentMode";

interface DayProgress {
  done: number;
  total: number;
  unlocked: boolean;
  complete: boolean;
}

interface Props {
  days: StudentDayMeta[];
  activeDay: number;
  progress: Record<number, DayProgress>;
  onSelectDay: (day: number) => void;
}

export function StudentDayNav({ days, activeDay, progress, onSelectDay }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((d) => {
        const p = progress[d.day] || {
          done: 0,
          total: 0,
          unlocked: d.day === 1,
          complete: false,
        };
        const active = activeDay === d.day;
        const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;

        return (
          <button
            key={d.day}
            type="button"
            disabled={!p.unlocked}
            onClick={() => p.unlocked && onSelectDay(d.day)}
            className={`min-w-[140px] shrink-0 rounded-xl border px-3 py-3 text-left transition ${
              active
                ? "border-amber-500/60 bg-amber-500/10"
                : p.unlocked
                  ? "border-white/10 bg-white/[0.03] hover:border-white/25"
                  : "cursor-not-allowed border-white/5 bg-black/20 opacity-45"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90">
                Day {d.day}
              </span>
              {!p.unlocked ? (
                <Lock className="h-3.5 w-3.5 text-slate-500" />
              ) : p.complete ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-100">
              {d.title}
            </p>
            {d.has_readiness_badge && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-violet-200">
                <BadgeCheck className="h-3 w-3" /> Readiness Check
              </span>
            )}
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 font-mono text-[10px] text-slate-500">
              {p.done}/{p.total} items
            </p>
          </button>
        );
      })}
    </div>
  );
}
