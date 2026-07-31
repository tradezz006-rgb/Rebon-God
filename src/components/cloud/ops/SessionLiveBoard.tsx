/**
 * Professional FoodQuick live architecture (CS3–CS7).
 * Card nodes, lane labels, directional flow — same language as CS2 IAM board.
 */
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Check,
  Cloud,
  Database,
  FileText,
  Globe,
  Layers,
  Network,
  Server,
  Shield,
  Wallet,
  X,
} from "lucide-react";
import type {
  LiveNode,
  NodeTone,
  SessionLiveBoardState,
} from "@/data/cloud/sessionLiveBoard";

type Size = "rail" | "hero" | "modal" | "inspect";

const ICONS = {
  network: Network,
  globe: Globe,
  shield: Shield,
  server: Server,
  database: Database,
  activity: Activity,
  cloud: Cloud,
  wallet: Wallet,
  layers: Layers,
  file: FileText,
} as const;

function toneClasses(tone: NodeTone, selected: boolean): string {
  const base =
    "rounded-xl border px-3 py-2.5 text-left shadow-[0_12px_28px_rgba(0,0,0,0.4)] backdrop-blur-sm transition";
  const ring = selected ? " ring-2 ring-amber-300/60" : " hover:border-slate-400/40";
  switch (tone) {
    case "resolved":
      return `${base} border-emerald-500/40 bg-emerald-950/25${ring}`;
    case "broken":
      return `${base} border-rose-500/45 bg-rose-950/30${ring}`;
    case "warning":
      return `${base} border-amber-400/50 bg-amber-950/35${ring}`;
    case "progress":
      return `${base} border-sky-400/40 bg-sky-950/30${ring}`;
    case "ghost":
      return `${base} border-white/8 bg-[#121821]/70 opacity-55${ring}`;
    default:
      return `${base} border-white/10 bg-[#121821]/95${ring}`;
  }
}

function curve(
  a: { x: number; y: number },
  b: { x: number; y: number }
): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const cx = mx - dy * 0.12;
  const cy = my + dx * 0.12;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

function FlowDots({
  d,
  hot,
  color,
}: {
  d: string;
  hot: boolean;
  color: string;
}) {
  return (
    <>
      {[0, 0.9, 1.8].map((delay) => (
        <circle key={delay} r={hot ? 1.05 : 0.7} fill={color} opacity={hot ? 1 : 0.75}>
          <animateMotion
            dur={hot ? "1.7s" : "2.6s"}
            begin={`${delay}s`}
            repeatCount="indefinite"
            path={d}
          />
        </circle>
      ))}
    </>
  );
}

interface Props {
  state: SessionLiveBoardState;
  size?: Size;
  className?: string;
  interactive?: boolean;
  liveFlow?: boolean;
}

export function SessionLiveBoard({
  state,
  size = "rail",
  className = "",
  interactive = true,
  liveFlow,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const flowsOn = liveFlow ?? (size === "hero" || size === "modal");

  const byId = useMemo(
    () => Object.fromEntries(state.nodes.map((n) => [n.id, n])),
    [state.nodes]
  );

  const related = useMemo(() => {
    if (!selected) return null;
    const set = new Set<string>([selected]);
    for (const e of state.edges) {
      if (e.from === selected) set.add(e.to);
      if (e.to === selected) set.add(e.from);
    }
    return set;
  }, [selected, state.edges]);

  const liveEdges = useMemo(() => {
    return state.edges
      .map((e) => {
        const a = byId[e.from];
        const b = byId[e.to];
        if (!a || !b) return null;
        if (a.tone === "hidden" || b.tone === "hidden") return null;
        const d = curve(a, b);
        const active = e.tone === "ok" || e.tone === "risk";
        const hot =
          selected != null && (e.from === selected || e.to === selected);
        return { ...e, d, active, hot, a, b };
      })
      .filter(Boolean) as {
      from: string;
      to: string;
      label: string;
      tone: string;
      d: string;
      active: boolean;
      hot: boolean;
      a: LiveNode;
      b: LiveNode;
    }[];
  }, [state.edges, byId, selected]);

  const selectedNode = selected ? byId[selected] : null;

  const height =
    size === "hero"
      ? "min-h-[640px] h-[min(78vh,760px)]"
      : size === "modal"
        ? "min-h-[460px] h-[min(70vh,640px)]"
        : size === "inspect"
          ? "min-h-[320px] h-[340px]"
          : "min-h-[360px] h-full";

  const cardW =
    size === "rail"
      ? "w-[112px] md:w-[120px]"
      : size === "inspect"
        ? "w-[128px]"
        : "w-[138px] md:w-[158px]";

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0f14] ${height} ${className}`}
      onClick={() => interactive && setSelected(null)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 18% 8%, rgba(255,153,0,0.09), transparent 42%), radial-gradient(ellipse at 82% 92%, rgba(16,185,129,0.07), transparent 40%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2 md:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-[#ff9900] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
            ap-south-1
          </span>
          <span className="text-[11px] text-slate-300 md:text-[12px]">
            {state.subtitle}
          </span>
          {flowsOn && (
            <span className="hidden items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live flow
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {state.deformCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
              <AlertTriangle className="h-3 w-3" />
              {state.deformCount} path{state.deformCount > 1 ? "s" : ""} to audit
            </span>
          ) : (
            <span className="text-[10px] text-slate-500">
              Act {state.focusAct} · click nodes
            </span>
          )}
          {state.outcome === "failed" && (
            <span className="rounded-full border border-rose-500/40 bg-rose-950/50 px-2 py-0.5 text-[10px] font-medium text-rose-200">
              Failed to seal
            </span>
          )}
          {state.outcome === "degraded" && (
            <span className="rounded-full border border-amber-500/35 bg-amber-950/40 px-2 py-0.5 text-[10px] text-amber-200">
              Degraded
            </span>
          )}
        </div>
      </div>

      <div
        className={`relative z-10 flex-1 ${
          size === "rail" ? "p-2" : "p-3 md:p-5"
        }`}
      >
        <div className="relative h-full w-full">
          {state.lanes.map((lane) => (
            <div
              key={lane.id}
              className="pointer-events-none absolute left-0 text-[9px] font-medium uppercase tracking-[0.2em] text-slate-600"
              style={{ top: lane.top }}
            >
              {lane.label}
            </div>
          ))}

          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`${state.sessionId}-ok`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(52,211,153,0.15)" />
                <stop offset="50%" stopColor="rgba(52,211,153,0.75)" />
                <stop offset="100%" stopColor="rgba(52,211,153,0.15)" />
              </linearGradient>
              <linearGradient id={`${state.sessionId}-risk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(251,191,36,0.2)" />
                <stop offset="50%" stopColor="rgba(251,191,36,0.85)" />
                <stop offset="100%" stopColor="rgba(251,191,36,0.2)" />
              </linearGradient>
            </defs>
            {liveEdges.map((e) => {
              const dimmed = related != null && !e.hot;
              const stroke =
                e.tone === "risk"
                  ? `url(#${state.sessionId}-risk)`
                  : e.tone === "cut"
                    ? "rgba(244,63,94,0.55)"
                    : e.active
                      ? `url(#${state.sessionId}-ok)`
                      : "rgba(148,163,184,0.22)";
              return (
                <g key={`${e.from}-${e.to}`} opacity={dimmed ? 0.12 : 1}>
                  <path
                    d={e.d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={e.hot ? 0.9 : e.active ? 0.55 : 0.35}
                    strokeDasharray={e.active ? undefined : "1.2 1.6"}
                    vectorEffect="non-scaling-stroke"
                  />
                  {e.active && (
                    <circle
                      cx={e.b.x}
                      cy={e.b.y}
                      r={e.hot ? 1.3 : 0.85}
                      fill={
                        e.tone === "risk"
                          ? "rgba(251,191,36,0.9)"
                          : "rgba(52,211,153,0.85)"
                      }
                      opacity={dimmed ? 0 : 1}
                    />
                  )}
                  {flowsOn && e.active && !dimmed && (
                    <FlowDots
                      d={e.d}
                      hot={e.hot}
                      color={e.tone === "risk" ? "#fbbf24" : "#34d399"}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {state.nodes
            .filter((n) => n.tone !== "hidden")
            .map((n) => {
              const Icon = ICONS[n.icon] || Cloud;
              const isSel = selected === n.id;
              const dimmed = related != null && !related.has(n.id);
              const resolved = n.tone === "resolved";

              return (
                <motion.button
                  key={n.id}
                  type="button"
                  disabled={!interactive}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{
                    opacity: dimmed ? 0.16 : 1,
                    scale: isSel ? 1.05 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  onClick={(ev) => {
                    if (!interactive) return;
                    ev.stopPropagation();
                    setSelected((s) => (s === n.id ? null : n.id));
                  }}
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                  className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 ${cardW} ${toneClasses(
                    n.tone,
                    isSel
                  )} ${!interactive ? "pointer-events-none" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-black/40">
                      <Icon
                        className={`h-3.5 w-3.5 ${
                          resolved
                            ? "text-emerald-300"
                            : n.tone === "warning"
                              ? "text-amber-300"
                              : n.tone === "broken"
                                ? "text-rose-300"
                                : n.tone === "progress"
                                  ? "text-sky-300"
                                  : "text-slate-300"
                        }`}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold leading-tight text-slate-100">
                        {n.label}
                      </p>
                      <p className="truncate text-[9px] text-slate-500">
                        Act {n.act} · {n.lane}
                      </p>
                    </div>
                    {resolved && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    )}
                    {n.fromWrong && (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    )}
                  </div>
                </motion.button>
              );
            })}
        </div>
      </div>

      <AnimatePresence>
        {selectedNode && interactive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute inset-x-3 bottom-3 z-30 rounded-xl border border-slate-700/80 bg-[#12161f]/95 p-3 shadow-xl backdrop-blur md:inset-x-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-amber-300">
                  {selectedNode.label}
                  <span className="ml-2 text-slate-500">{selectedNode.tone}</span>
                </p>
                <p className="mt-1 text-[12px] leading-snug text-slate-300">
                  {selectedNode.detail}
                </p>
                {selectedNode.note && (
                  <p className="mt-2 rounded border border-amber-500/30 bg-amber-950/40 px-2 py-1.5 text-[11px] leading-snug text-amber-100">
                    {selectedNode.note}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded border border-slate-700 p-1 text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SessionLiveBoard;
