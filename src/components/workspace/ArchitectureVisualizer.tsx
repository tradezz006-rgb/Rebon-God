import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Globe2,
  Lock,
  Server,
  Shield,
  X,
} from "lucide-react";
import { progressGet, progressSet } from "@/data/cloud/ephemeralProgress";
import { isWorkspaceComplete } from "@/data/cloud/studentModePace";
import {
  GhostStoryPin,
  type PinPhase,
} from "@/components/cloud/ops/GhostStoryPin";

interface Props {
  progressLevel: number; // 0 to 5
  completedTaskIds?: string[];
  diagramOnly?: boolean;
  /** Journey Map mode — large live board with click-to-trace flows */
  liveInteractive?: boolean;
}

type PhoenixNode = "traffic" | "aza" | "azb" | "region" | "ghost" | "budget";

const PHOENIX_COPY: Record<
  PhoenixNode,
  { title: string; detail: string; story: string }
> = {
  traffic: {
    title: "Global traffic",
    detail: "Users hit Phoenix from the public internet.",
    story: "Demand arrives — the startup is live again.",
  },
  aza: {
    title: "Availability Zone A",
    detail: "First compute landed here. EC2 is the heartbeat of Phoenix.",
    story: "Act one of the migration — a machine in Mumbai.",
  },
  azb: {
    title: "Availability Zone B",
    detail: "Second AZ for resilience. Traffic can fail over.",
    story: "You stopped betting the company on one building.",
  },
  region: {
    title: "ap-south-1 · Mumbai",
    detail: "Region boundary. Everything Phoenix owns lives inside this fence.",
    story: "India region — close to customers, under your account.",
  },
  ghost: {
    title: "Ghost resources",
    detail: "Orphan spend bleeding ₹80K/mo until INV-80K closed it.",
    story: "The silent cost that almost killed the runway.",
  },
  budget: {
    title: "Budget protected",
    detail: "Alerts and budgets keep spend visible before it becomes a crisis.",
    story: "Finance can sleep. Engineering can ship.",
  },
};

export function isFresherGhostResolved(completedTaskIds?: string[]): boolean {
  if (completedTaskIds?.includes("C1.1-T5")) return true;
  const ops = progressGet("rebon_cloud_ops_C1.1");
  if (ops != null) {
    const idx = parseInt(ops, 10);
    if (Number.isFinite(idx) && idx >= 4) return true;
  }
  return isWorkspaceComplete("C1.1");
}

export const ArchitectureVisualizer: React.FC<Props> = ({
  progressLevel,
  completedTaskIds,
  diagramOnly = false,
  liveInteractive = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ghostDone = isFresherGhostResolved(completedTaskIds);
  const [ghostPhase, setGhostPhase] = useState<PinPhase>("hidden");
  const [selected, setSelected] = useState<PhoenixNode | null>(null);
  const sawOpen = useRef(false);

  useEffect(() => {
    const effectiveLevel = diagramOnly
      ? Math.max(1, progressLevel)
      : progressLevel;
    if (effectiveLevel <= 0) {
      setGhostPhase("hidden");
      return;
    }
    if (ghostDone) {
      if (sawOpen.current || ghostPhase === "open" || ghostPhase === "pulse") {
        setGhostPhase("resolving");
      } else {
        setGhostPhase("gone");
      }
      return;
    }
    sawOpen.current = true;
    setGhostPhase("open");
  }, [progressLevel, ghostDone, diagramOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (diagramOnly) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (progressLevel === 0 && progressGet("phoenix_intro_played") !== "true") {
      const audio = new Audio("/assets/audio/phoenix_intro.mp3");
      audio.volume = 0.8;
      audio.play().catch(() => undefined);
      audioRef.current = audio;
      progressSet("phoenix_intro_played", "true");
    }
    if (progressLevel >= 5 && progressGet("phoenix_finale_played") !== "true") {
      const audio = new Audio("/assets/audio/grand_finale.mp3");
      audio.volume = 0.8;
      audio.play().catch(() => undefined);
      audioRef.current = audio;
      progressSet("phoenix_finale_played", "true");
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [progressLevel, diagramOnly]);

  const level = diagramOnly ? Math.max(1, progressLevel || 1) : progressLevel;
  const interactive = liveInteractive || diagramOnly;

  const pick = (id: PhoenixNode) => {
    if (!interactive) return;
    setSelected((cur) => (cur === id ? null : id));
  };

  const nodeShell = (
    id: PhoenixNode,
    children: React.ReactNode,
    className = ""
  ) => (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        pick(id);
      }}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pick(id);
        }
      }}
      className={`text-left transition ${
        interactive ? "cursor-pointer" : "cursor-default"
      } ${
        selected && selected !== id ? "opacity-25" : "opacity-100"
      } ${selected === id ? "ring-2 ring-amber-300/50 rounded-xl" : ""} ${className}`}
    >
      {children}
    </div>
  );

  const canvas = (
    <div
      className={`relative flex h-full w-full items-center justify-center ${
        diagramOnly ? "min-h-[520px]" : ""
      }`}
      onClick={() => setSelected(null)}
    >
      {!diagramOnly && progressLevel === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 rounded-2xl border border-white/10 bg-black/40 p-8 text-center backdrop-blur-md"
        >
          <Activity className="mx-auto mb-4 h-12 w-12 animate-pulse text-[#FF9900]" />
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-slate-100">
            Mission: Project Phoenix
          </h2>
          <p className="max-w-md text-sm text-slate-400">
            Local servers crashed. The CEO mandated an immediate migration to
            AWS. Clear tickets to build the startup&rsquo;s new architecture.
          </p>
        </motion.div>
      )}

      {level > 0 && (
        <div className="relative flex h-full w-full flex-col items-center justify-center px-4 py-6">
          {/* Live flow SVG */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {level >= 5 && (
              <>
                <path
                  d="M 12 50 H 28"
                  fill="none"
                  stroke="rgba(255,153,0,0.45)"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                />
                <circle r="0.9" fill="#ff9900">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M 12 50 H 28" />
                </circle>
              </>
            )}
            {level >= 2 && (
              <>
                <path
                  d="M 38 52 H 62"
                  fill="none"
                  stroke="rgba(52,211,153,0.55)"
                  strokeWidth="0.55"
                  vectorEffect="non-scaling-stroke"
                />
                <circle r="0.85" fill="#34d399">
                  <animateMotion dur="1.8s" repeatCount="indefinite" path="M 38 52 H 62" />
                </circle>
                <circle r="0.85" fill="#34d399">
                  <animateMotion
                    dur="1.8s"
                    begin="0.9s"
                    repeatCount="indefinite"
                    path="M 38 52 H 62"
                  />
                </circle>
              </>
            )}
          </svg>

          <AnimatePresence>
            {level >= 5 && (
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute left-4 top-1/2 z-20 -translate-y-1/2 md:left-8"
              >
                {nodeShell(
                  "traffic",
                  <div className="flex flex-col items-center">
                    <div className="rounded-xl border border-white/10 bg-[#1a2330] p-3 shadow-lg">
                      <Globe2 className="h-7 w-7 text-slate-300" />
                    </div>
                    <span className="mt-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Global traffic
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {nodeShell(
            "region",
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative flex min-h-[240px] min-w-[300px] items-center justify-center rounded-2xl border p-8 transition-all md:min-h-[280px] md:min-w-[460px] md:p-10 ${
                level >= 4
                  ? "border-emerald-500/45 bg-[#121821]/92 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
                  : level >= 2
                    ? "border-white/10 border-dashed bg-[#121821]/85"
                    : "border-transparent bg-transparent"
              }`}
            >
              {level >= 2 && (
                <div className="absolute left-0 top-0 rounded-br-lg rounded-tl-2xl bg-[#FF9900] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
                  ap-south-1 · Mumbai
                </div>
              )}

              {level >= 4 &&
                nodeShell(
                  "budget",
                  <div className="absolute -top-3 right-4 flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                    <Shield className="h-3 w-3" /> Budget protected
                  </div>
                )}

              <div className="relative z-10 flex w-full items-center justify-center gap-12 md:gap-20">
                {nodeShell(
                  "aza",
                  <div className="flex flex-col items-center">
                    <span className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      {level >= 2 ? "Availability Zone A" : "First compute"}
                    </span>
                    <div className="relative rounded-xl border border-[#FF9900]/70 bg-[#1a2330] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
                      <Server className="h-11 w-11 text-[#FF9900]" />
                      {level >= 5 && (
                        <span className="absolute -right-2.5 -top-2.5 rounded-full border-2 border-[#121821] bg-emerald-500 p-1">
                          <Lock className="h-3 w-3 text-black" />
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {level >= 2 &&
                  nodeShell(
                    "azb",
                    <div className="flex flex-col items-center">
                      <span className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        Availability Zone B
                      </span>
                      <div className="relative rounded-xl border border-[#FF9900]/70 bg-[#1a2330] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
                        <Server className="h-11 w-11 text-[#FF9900]" />
                        {level >= 5 && (
                          <span className="absolute -right-2.5 -top-2.5 rounded-full border-2 border-[#121821] bg-emerald-500 p-1">
                            <Lock className="h-3 w-3 text-black" />
                          </span>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </motion.div>
          )}

          <div className="absolute right-4 top-10 z-20 md:right-10 md:top-14">
            {nodeShell(
              "ghost",
              <GhostStoryPin
                phase={ghostPhase}
                variant="ghost"
                label="Ghost Resources"
                sub="₹80K / mo bleed"
                costLabel="₹80,000 → ₹0"
                onResolvedGone={() => setGhostPhase("gone")}
              />
            )}
          </div>

          <AnimatePresence>
            {level >= 5 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-16 rounded-full border border-emerald-400/40 bg-[#121821]/95 px-5 py-2.5 text-xs font-medium tracking-wide text-emerald-300 shadow-lg md:bottom-20"
              >
                Architecture deployed · startup saved
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selected && interactive && (
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
                className="absolute inset-x-3 bottom-3 z-30 rounded-xl border border-white/10 bg-[#0e141c]/95 p-4 backdrop-blur-md md:inset-x-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Project Phoenix
                    </p>
                    <h4 className="mt-0.5 text-sm font-semibold text-slate-50">
                      {PHOENIX_COPY[selected].title}
                    </h4>
                    <p className="mt-1 text-[12px] text-slate-400">
                      {PHOENIX_COPY[selected].detail}
                    </p>
                    <p className="mt-1.5 text-[12px] italic text-amber-200/80">
                      {PHOENIX_COPY[selected].story}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-slate-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {selected === "aza" && level >= 2 && (
                  <button
                    type="button"
                    onClick={() => pick("azb")}
                    className="mt-3 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-100"
                  >
                    flows to · Availability Zone B · failover path
                  </button>
                )}
                {selected === "traffic" && (
                  <button
                    type="button"
                    onClick={() => pick("aza")}
                    className="mt-3 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-100"
                  >
                    flows to · Zone A · first hop
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {interactive && !selected && (
            <p className="absolute bottom-3 text-[11px] text-slate-500">
              Click a node to see where traffic and trust move · scroll for tickets
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (diagramOnly) {
    return (
      <div className="relative h-full min-h-[560px] w-full overflow-hidden md:min-h-[640px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 0%, rgba(255,153,0,0.09), transparent 45%), radial-gradient(ellipse at 80% 100%, rgba(56,189,248,0.05), transparent 40%)",
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
        {level >= 1 && (
          <div className="absolute left-4 top-3 z-20 flex items-center gap-2 md:left-5">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live flow
            </span>
          </div>
        )}
        <div className="relative z-10 flex h-full items-center justify-center">
          {canvas}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-8 flex h-[400px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0f14] shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {canvas}
    </div>
  );
};
