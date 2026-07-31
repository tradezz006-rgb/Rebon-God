/**
 * Building Basics phase Journey Map — FoodQuick end-to-end platform.
 * Full-bleed board on the phase page. Starts dark; each sealed mission
 * restores its column and live flows into the next layers.
 * (Per-session boards are Mission boards; this is the phase Journey Map.)
 */
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Database,
  HardDrive,
  Lock,
  Network,
  Server,
  Shield,
  Workflow,
} from "lucide-react";
import {
  FOODQUICK_MEGA_STORY,
  type MegaStorySession,
} from "@/data/cloud/buildingBasicsBible";
import {
  getSessionProgress,
  sessionHasShippedWorkspace,
  type CloudSessionId,
  type SessionStatus,
} from "@/data/cloud/sessionCatalog";

type BbSessionId = Extract<
  CloudSessionId,
  "CS2" | "CS3" | "CS4" | "CS5" | "CS6" | "CS7"
>;

type LayerTone = "dark" | "warm" | "lit";

type Props = {
  refreshKey?: number | string;
  onSelectSession?: (id: BbSessionId) => void;
};

/** Six mission columns across a wide board (viewBox 0–100 × 0–56). */
const COL_X: Record<BbSessionId, number> = {
  CS2: 8.5,
  CS3: 25,
  CS4: 41.5,
  CS5: 58,
  CS6: 74.5,
  CS7: 91,
};

const LAYER_META: Record<
  BbSessionId,
  {
    icon: typeof Shield;
    accent: string;
    accentSoft: string;
    nodes: { id: string; label: string; dy: number }[];
  }
> = {
  CS2: {
    icon: Shield,
    accent: "#F59E0B",
    accentSoft: "rgba(245,158,11,0.35)",
    nodes: [
      { id: "root", label: "Root + MFA", dy: 0 },
      { id: "users", label: "Named users", dy: 9 },
      { id: "roles", label: "Roles", dy: 18 },
      { id: "policy", label: "Least privilege", dy: 27 },
    ],
  },
  CS3: {
    icon: Network,
    accent: "#38BDF8",
    accentSoft: "rgba(56,189,248,0.35)",
    nodes: [
      { id: "vpc", label: "VPC", dy: 0 },
      { id: "pub", label: "Public subnet", dy: 9 },
      { id: "priv", label: "Private subnet", dy: 18 },
      { id: "alb", label: "ALB + SG", dy: 27 },
    ],
  },
  CS4: {
    icon: Server,
    accent: "#A78BFA",
    accentSoft: "rgba(167,139,250,0.35)",
    nodes: [
      { id: "ec2", label: "EC2 fleet", dy: 0 },
      { id: "asg", label: "Auto Scaling", dy: 9 },
      { id: "lambda", label: "Lambda", dy: 18 },
    ],
  },
  CS5: {
    icon: HardDrive,
    accent: "#34D399",
    accentSoft: "rgba(52,211,153,0.35)",
    nodes: [
      { id: "s3", label: "S3 buckets", dy: 0 },
      { id: "life", label: "Lifecycle", dy: 9 },
      { id: "ebs", label: "EBS", dy: 18 },
    ],
  },
  CS6: {
    icon: Activity,
    accent: "#FB7185",
    accentSoft: "rgba(251,113,133,0.35)",
    nodes: [
      { id: "cw", label: "CloudWatch", dy: 0 },
      { id: "alarm", label: "Alarms", dy: 9 },
      { id: "dash", label: "Dashboards", dy: 18 },
    ],
  },
  CS7: {
    icon: Workflow,
    accent: "#F8FAFC",
    accentSoft: "rgba(248,250,252,0.25)",
    nodes: [
      { id: "edge", label: "Edge / DNS", dy: 0 },
      { id: "app", label: "App plane", dy: 9 },
      { id: "data", label: "Data plane", dy: 18 },
    ],
  },
};

/** Story spine + a few real cross-links (not a spaghetti mesh). */
const FLOW_EDGES: { from: BbSessionId; to: BbSessionId; label: string }[] = [
  { from: "CS2", to: "CS3", label: "Identity gates network" },
  { from: "CS3", to: "CS4", label: "Traffic reaches compute" },
  { from: "CS4", to: "CS5", label: "Compute reads / writes data" },
  { from: "CS5", to: "CS6", label: "Storage emits metrics" },
  { from: "CS6", to: "CS7", label: "Ops feeds designed platform" },
  { from: "CS2", to: "CS7", label: "IAM in final architecture" },
  { from: "CS3", to: "CS7", label: "Network in final architecture" },
  { from: "CS4", to: "CS7", label: "Compute in final architecture" },
  { from: "CS5", to: "CS7", label: "Storage in final architecture" },
];

const ORDER: BbSessionId[] = ["CS2", "CS3", "CS4", "CS5", "CS6", "CS7"];
const NODE_BASE_Y = 22;

function toneFor(status: SessionStatus): LayerTone {
  if (status === "complete") return "lit";
  if (status === "in_progress") return "warm";
  return "dark";
}

function nodePos(id: BbSessionId, dy: number) {
  return { x: COL_X[id], y: NODE_BASE_Y + dy };
}

function zoneCenter(id: BbSessionId): { x: number; y: number } {
  const nodes = LAYER_META[id].nodes;
  const mid = nodes[Math.floor((nodes.length - 1) / 2)];
  return nodePos(id, mid.dy);
}

export default function BuildingBasicsMasterMap({
  refreshKey,
  onSelectSession,
}: Props) {
  void refreshKey;
  const [selected, setSelected] = useState<BbSessionId | null>(null);

  const layers = useMemo(() => {
    return ORDER.map((id) => {
      const progress = getSessionProgress(id);
      const mega = FOODQUICK_MEGA_STORY.find((s) => s.sessionId === id)!;
      const shipped = sessionHasShippedWorkspace(id);
      return {
        id,
        mega,
        progress,
        shipped,
        tone: toneFor(progress.status),
      };
    });
  }, [refreshKey]);

  const completedCount = layers.filter((l) => l.progress.complete).length;
  const allLit = completedCount === layers.length;
  const anyLit = completedCount > 0;
  const selectedLayer = layers.find((l) => l.id === selected) ?? null;

  return (
    <section className="w-full bg-[#070b12]">
      {/* Header — full width, no boxed card */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] px-4 pb-5 pt-1 md:px-8 lg:px-10">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
            Building Basics · Journey Map
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
            <Cloud className="h-6 w-6 text-slate-400" />
            FoodQuick · production architecture
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400 md:text-[15px]">
            One company story. Six missions (CS2–CS7). The board starts dark and
            broken — seal a mission and that column lights, with live flows into
            the next restored layers. Finish all six and the whole platform runs.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div
            className={`rounded-full px-3 py-1 text-[11px] font-medium tracking-wide ${
              allLit
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                : anyLit
                  ? "bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/25"
                  : "bg-slate-800/80 text-slate-400 ring-1 ring-white/10"
            }`}
          >
            {allLit
              ? "Platform restored · all flows live"
              : anyLit
                ? `${completedCount}/6 layers restored`
                : "System dark · needs repair"}
          </div>
          <p className="font-mono text-[10px] text-slate-600">
            FQ-142 → FQ-218 · scroll for missions below
          </p>
        </div>
      </div>

      {/* Full-bleed board */}
      <div className="relative w-full">
        <div className="relative h-[min(78vh,720px)] w-full min-h-[520px] bg-[radial-gradient(ellipse_at_50%_0%,#121a28_0%,#070b12_58%)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.09) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          <svg
            viewBox="0 0 100 56"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            aria-label="FoodQuick Building Basics master architecture"
          >
            <defs>
              {ORDER.map((id) => (
                <linearGradient
                  key={`g-${id}`}
                  id={`bb-flow-${id}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={LAYER_META[id].accent} stopOpacity="0" />
                  <stop offset="50%" stopColor={LAYER_META[id].accent} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={LAYER_META[id].accent} stopOpacity="0" />
                </linearGradient>
              ))}
              <filter id="bb-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="0.9" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Soft column lanes */}
            {ORDER.map((id) => (
              <rect
                key={`lane-${id}`}
                x={COL_X[id] - 6.5}
                y="4"
                width="13"
                height="48"
                rx="1.2"
                fill="#0b1220"
                opacity="0.35"
              />
            ))}

            {/* Broken spine when nothing complete */}
            {!anyLit && (
              <path
                d="M 8.5 28 H 91"
                fill="none"
                stroke="#334155"
                strokeWidth="0.28"
                strokeDasharray="1.1 1.3"
                opacity="0.55"
              />
            )}

            {/* Flow edges */}
            {FLOW_EDGES.map((edge) => {
              const fromLayer = layers.find((l) => l.id === edge.from)!;
              const toLayer = layers.find((l) => l.id === edge.to)!;
              const a = zoneCenter(edge.from);
              const b = zoneCenter(edge.to);
              const live =
                fromLayer.progress.complete &&
                (toLayer.progress.complete ||
                  toLayer.progress.status === "in_progress" ||
                  (edge.to === "CS7" && allLit));
              const halfLit = fromLayer.progress.complete && !live;
              const isSpine =
                ORDER.indexOf(edge.to) === ORDER.indexOf(edge.from) + 1;
              const my = isSpine ? (a.y + b.y) / 2 : Math.min(a.y, b.y) - 6;
              const path = `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${my} ${b.x} ${b.y}`;

              // Capstone cross-links only draw when source is lit (keeps dark board clean)
              if (!isSpine && !fromLayer.progress.complete && !allLit) {
                return null;
              }

              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke={
                      live
                        ? LAYER_META[edge.from].accent
                        : halfLit
                          ? "#475569"
                          : "#1e293b"
                    }
                    strokeWidth={live ? (isSpine ? 0.42 : 0.28) : 0.26}
                    strokeOpacity={live ? 0.55 : halfLit ? 0.5 : 0.5}
                    strokeDasharray={live ? undefined : "0.85 1.1"}
                  />
                  {live && (
                    <>
                      <path
                        d={path}
                        fill="none"
                        stroke={`url(#bb-flow-${edge.from})`}
                        strokeWidth={isSpine ? 0.65 : 0.4}
                        filter="url(#bb-glow)"
                        className="bb-flow-pulse"
                      />
                      <circle r="0.45" fill={LAYER_META[edge.from].accent}>
                        <animateMotion
                          dur={isSpine ? "2.6s" : "3.4s"}
                          repeatCount="indefinite"
                          path={path}
                        />
                      </circle>
                    </>
                  )}
                </g>
              );
            })}

            {/* Nodes per column */}
            {layers.map((layer) => {
              const meta = LAYER_META[layer.id];
              const lit = layer.tone === "lit";
              const warm = layer.tone === "warm";
              const color = lit
                ? meta.accent
                : warm
                  ? "#94a3b8"
                  : "#334155";

              return (
                <g key={layer.id}>
                  {meta.nodes.map((node, i) => {
                    const { x, y } = nodePos(layer.id, node.dy);
                    return (
                      <g key={node.id}>
                        {!lit && (
                          <line
                            x1={x - 1.8}
                            y1={y - 1.4}
                            x2={x + 1.8}
                            y2={y + 1.4}
                            stroke="#64748b"
                            strokeWidth="0.12"
                            opacity="0.3"
                          />
                        )}
                        <circle
                          cx={x}
                          cy={y}
                          r={lit ? 1.9 : 1.7}
                          fill={lit ? "#0b1220" : "#0a0f18"}
                          stroke={color}
                          strokeWidth={lit ? 0.38 : 0.24}
                          opacity={lit ? 1 : warm ? 0.9 : 0.58}
                          filter={lit ? "url(#bb-glow)" : undefined}
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r="0.42"
                          fill={color}
                          opacity={lit ? 0.95 : 0.4}
                        >
                          {lit && (
                            <animate
                              attributeName="opacity"
                              values="0.5;1;0.5"
                              dur={`${2.2 + i * 0.15}s`}
                              repeatCount="indefinite"
                            />
                          )}
                        </circle>
                        <text
                          x={x}
                          y={y + 3.2}
                          textAnchor="middle"
                          fill={lit ? "#e2e8f0" : "#64748b"}
                          fontSize="1.45"
                          fontFamily="ui-sans-serif, system-ui, sans-serif"
                          opacity={lit || warm ? 0.95 : 0.58}
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* Mission zone cards — one per column, top aligned */}
          <div className="pointer-events-none absolute inset-x-0 top-3 grid grid-cols-6 gap-2 px-3 md:top-4 md:gap-3 md:px-6 lg:px-8">
            {layers.map((layer) => {
              const meta = LAYER_META[layer.id];
              const Icon = meta.icon;
              const locked = !layer.shipped;
              const lit = layer.tone === "lit";
              const warm = layer.tone === "warm";

              return (
                <button
                  key={`hit-${layer.id}`}
                  type="button"
                  onClick={() => setSelected(layer.id)}
                  className="pointer-events-auto rounded-xl border px-2 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 md:px-2.5 md:py-2.5"
                  style={{
                    borderColor: lit
                      ? meta.accent
                      : warm
                        ? "rgba(148,163,184,0.45)"
                        : "rgba(51,65,85,0.75)",
                    background: lit
                      ? "rgba(15,23,42,0.94)"
                      : "rgba(8,12,20,0.88)",
                    boxShadow: lit ? `0 0 24px ${meta.accentSoft}` : "none",
                    opacity: locked && !lit ? 0.78 : 1,
                  }}
                  title={`${layer.mega.ticket} · ${layer.mega.title}`}
                >
                  <div className="flex items-center gap-1">
                    {locked && !lit ? (
                      <Lock className="h-3 w-3 shrink-0 text-slate-500" />
                    ) : lit ? (
                      <CheckCircle2
                        className="h-3 w-3 shrink-0"
                        style={{ color: meta.accent }}
                      />
                    ) : warm ? (
                      <AlertTriangle className="h-3 w-3 shrink-0 text-amber-300" />
                    ) : (
                      <Icon className="h-3 w-3 shrink-0 text-slate-500" />
                    )}
                    <span className="truncate font-mono text-[8px] uppercase tracking-wider text-slate-500 md:text-[9px]">
                      {layer.mega.ticket}
                    </span>
                  </div>
                  <p
                    className="mt-1 text-[10px] font-semibold leading-tight md:text-[11px]"
                    style={{
                      color: lit ? meta.accent : warm ? "#e2e8f0" : "#94a3b8",
                    }}
                  >
                    {layer.id} · {layer.mega.layer}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[8px] leading-snug text-slate-500 md:text-[9px]">
                    {lit
                      ? "Layer restored · flows live"
                      : warm
                        ? "Repair in progress"
                        : locked
                          ? "Dark · awaiting mission"
                          : "Broken · start mission"}
                  </p>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {allLit && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-emerald-400/30 bg-emerald-950/85 px-4 py-1.5 text-[11px] font-medium text-emerald-200 backdrop-blur"
              >
                FoodQuick platform live — IAM · Network · Compute · Storage ·
                Monitoring · Capstone
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Inspector strip */}
      <div className="grid gap-0 border-y border-white/[0.06] md:grid-cols-[1.5fr_1fr]">
        <div className="border-b border-white/[0.06] px-4 py-5 md:border-b-0 md:border-r md:px-8 md:py-6 lg:px-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Mission inspector
          </p>
          {selectedLayer ? (
            <MissionInspector
              mega={selectedLayer.mega}
              status={selectedLayer.progress.status}
              ticketsDone={selectedLayer.progress.ticketsDone}
              ticketsTotal={selectedLayer.progress.ticketsTotal}
              shipped={selectedLayer.shipped}
              onOpen={
                selectedLayer.shipped
                  ? () => onSelectSession?.(selectedLayer.id)
                  : undefined
              }
            />
          ) : (
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Click a mission column to inspect it. Completing workspace tickets
              in that session seals the layer here — same FoodQuick story, next
              mission. Scroll down for the mission cards.
            </p>
          )}
        </div>
        <div className="px-4 py-5 md:px-6 md:py-6 lg:px-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Layer status
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
            {layers.map((layer) => {
              const meta = LAYER_META[layer.id];
              return (
                <li key={`leg-${layer.id}`}>
                  <button
                    type="button"
                    onClick={() => setSelected(layer.id)}
                    className="flex w-full items-center justify-between gap-2 text-left text-xs text-slate-300 hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background:
                            layer.tone === "lit"
                              ? meta.accent
                              : layer.tone === "warm"
                                ? "#94a3b8"
                                : "#334155",
                          boxShadow:
                            layer.tone === "lit"
                              ? `0 0 8px ${meta.accent}`
                              : "none",
                        }}
                      />
                      <span className="font-medium">{layer.id}</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {layer.progress.status === "locked"
                        ? "dark"
                        : layer.progress.status === "complete"
                          ? "live"
                          : layer.progress.status === "in_progress"
                            ? "repairing"
                            : "broken"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <style>{`
        .bb-flow-pulse {
          stroke-dasharray: 3.5 9;
          animation: bb-dash 2.4s linear infinite;
        }
        @keyframes bb-dash {
          to { stroke-dashoffset: -28; }
        }
      `}</style>
    </section>
  );
}

function MissionInspector({
  mega,
  status,
  ticketsDone,
  ticketsTotal,
  shipped,
  onOpen,
}: {
  mega: MegaStorySession;
  status: SessionStatus;
  ticketsDone: number;
  ticketsTotal: number;
  shipped: boolean;
  onOpen?: () => void;
}) {
  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-amber-300/90">
          {mega.ticket}
        </span>
        <span className="text-slate-600">·</span>
        <span className="text-xs text-slate-400">{mega.senderRole}</span>
      </div>
      <h3 className="mt-1 text-base font-semibold text-slate-100 md:text-lg">
        {mega.sessionId} · {mega.title}
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
        {mega.throughLine}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Database className="h-3 w-3" />
          {shipped
            ? `${ticketsDone}/${ticketsTotal} tickets`
            : "Workspace ships with this mission"}
        </span>
        <span>
          {status === "complete"
            ? "Layer restored on master map"
            : status === "in_progress"
              ? "Repair underway"
              : status === "locked"
                ? "Not shipped yet"
                : "Awaiting first ticket"}
        </span>
      </div>
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-100"
        >
          Enter {mega.sessionId} mission
        </button>
      )}
    </div>
  );
}
