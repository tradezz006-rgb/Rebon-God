/**
 * FoodQuick FQ-142 — live architecture board.
 * Spatial nodes, directional flow particles, click-to-trace.
 * Journey Map uses size="hero" for the full story board.
 */
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Check,
  Cloud,
  HelpCircle,
  KeyRound,
  Server,
  Shield,
  UserRound,
  Users,
  Workflow,
  X,
} from "lucide-react";
import type { Cs2DiagramState, NodeTone } from "@/data/cloud/cs2DiagramState";

type Props = {
  state: Cs2DiagramState;
  size?: "rail" | "hero" | "inspect";
  celebratePulse?: string | null;
  className?: string;
  /** Force live particle flows (default: on for hero) */
  liveFlow?: boolean;
};

type NodeId =
  | "root"
  | "devShared"
  | "groups"
  | "users"
  | "lambda"
  | "ec2"
  | "cicd"
  | "vendor"
  | "org"
  | "pin_access"
  | "pin_role"
  | "pin_timeline"
  | "pin_vikram";

type Edge = { from: NodeId; to: NodeId; label: string; kind: "trust" | "evidence" };

/** Positions in viewBox 0–100 (center of each node) */
const POS: Record<NodeId, { x: number; y: number }> = {
  root: { x: 14, y: 16 },
  devShared: { x: 38, y: 16 },
  groups: { x: 62, y: 16 },
  users: { x: 86, y: 16 },
  lambda: { x: 32, y: 42 },
  ec2: { x: 68, y: 42 },
  cicd: { x: 22, y: 66 },
  vendor: { x: 50, y: 66 },
  org: { x: 78, y: 66 },
  pin_access: { x: 16, y: 88 },
  pin_role: { x: 38, y: 88 },
  pin_timeline: { x: 62, y: 88 },
  pin_vikram: { x: 84, y: 88 },
};

const EDGES: Edge[] = [
  { from: "root", to: "groups", label: "Account owns groups", kind: "trust" },
  { from: "groups", to: "users", label: "Users inherit via groups", kind: "trust" },
  { from: "devShared", to: "users", label: "Shared login → named users", kind: "trust" },
  { from: "users", to: "lambda", label: "Human → Lambda trust", kind: "trust" },
  { from: "users", to: "ec2", label: "Human → EC2 trust", kind: "trust" },
  { from: "lambda", to: "ec2", label: "Shared permission model", kind: "trust" },
  { from: "ec2", to: "cicd", label: "Deploy path", kind: "trust" },
  { from: "cicd", to: "vendor", label: "Cross-account assume", kind: "trust" },
  { from: "vendor", to: "org", label: "SCPs bind perimeter", kind: "trust" },
  { from: "pin_access", to: "pin_vikram", label: "Access key → person", kind: "evidence" },
  { from: "pin_role", to: "pin_vikram", label: "Admin role → person", kind: "evidence" },
  { from: "pin_timeline", to: "pin_vikram", label: "Same-week link", kind: "evidence" },
  { from: "pin_vikram", to: "root", label: "Blast radius on identity", kind: "evidence" },
];

const NODE_COPY: Record<
  NodeId,
  { title: string; detail: string; layer: string; story: string }
> = {
  root: {
    title: "Root account",
    detail: "Crown jewel. MFA on + keys deleted closes the blast radius.",
    layer: "Layer 1 · Identity",
    story: "Act 1 sealed the keys to the kingdom.",
  },
  devShared: {
    title: "dev-shared",
    detail: "The shared login everyone used. Deactivated → named identities only.",
    layer: "Layer 1 · Identity",
    story: "One password for ten people — gone.",
  },
  groups: {
    title: "Groups",
    detail: "Devs · DevOps. Policies attach here, not as chaos.",
    layer: "Layer 1 · Identity",
    story: "Permission containers, not free-for-all.",
  },
  users: {
    title: "IAM users",
    detail: "One person, one identity. Credentials stay personal.",
    layer: "Layer 1 · Identity",
    story: "Every engineer is accountable now.",
  },
  lambda: {
    title: "Lambda",
    detail: "Service principal with an execution role — never a hardcoded human key.",
    layer: "Layer 2 · Service trust",
    story: "Compute stopped borrowing human keys.",
  },
  ec2: {
    title: "EC2",
    detail: "Instance profiles replace embedded secrets.",
    layer: "Layer 2 · Service trust",
    story: "Servers assume roles. Secrets stay out of AMI.",
  },
  cicd: {
    title: "CI/CD",
    detail: "Pipeline assumes into FoodQuick with a scoped role.",
    layer: "Layer 5 · Integrations",
    story: "Deploy path is named and auditable.",
  },
  vendor: {
    title: "Vendor",
    detail: "External access gated by ExternalId + least privilege.",
    layer: "Layer 5 · Integrations",
    story: "Partners enter through a door you control.",
  },
  org: {
    title: "Org + SCP",
    detail: "Organization SCPs form the outer perimeter.",
    layer: "Layer 6 · Perimeter",
    story: "The account cannot outrun its own guardrails.",
  },
  pin_access: {
    title: "Unexplained access key",
    detail: "Evidence from Act 1 — a key that should not exist.",
    layer: "Evidence",
    story: "The first thread of the mystery.",
  },
  pin_role: {
    title: "Forgotten admin role",
    detail: "Elevated role left behind after a contractor left.",
    layer: "Evidence",
    story: "Privilege that outlived its owner.",
  },
  pin_timeline: {
    title: "Same-week link",
    detail: "Timeline bridge — events that only make sense together.",
    layer: "Evidence",
    story: "Timing turned coincidence into proof.",
  },
  pin_vikram: {
    title: "Vikram · former contractor",
    detail: "Three evidence threads converge. The identity behind the blast radius.",
    layer: "Evidence · Act 4",
    story: "The name the audit would have found.",
  },
};

function toneOf(
  id: NodeId,
  state: Cs2DiagramState
): NodeTone | "hidden" {
  switch (id) {
    case "root":
      return state.root;
    case "devShared":
      return state.devShared;
    case "groups":
      return state.groups;
    case "users":
      return state.individualUsers;
    case "lambda":
      return state.lambda;
    case "ec2":
      return state.ec2;
    case "cicd":
      return state.cicd;
    case "vendor":
      return state.vendor;
    case "org":
      return state.orgScp;
    case "pin_access": {
      const p = state.pins.find((x) => x.id === "access_key");
      if (!p || p.phase === "hidden") return "hidden";
      return p.phase === "resolved" ? "resolved" : "mystery";
    }
    case "pin_role": {
      const p = state.pins.find((x) => x.id === "admin_role");
      if (!p || p.phase === "hidden") return "hidden";
      return p.phase === "resolved" ? "resolved" : "mystery";
    }
    case "pin_timeline": {
      const p = state.pins.find((x) => x.id === "timeline");
      if (!p || p.phase === "hidden") return "hidden";
      return p.phase === "resolved" ? "resolved" : "mystery";
    }
    case "pin_vikram": {
      const p = state.pins.find((x) => x.id === "vikram");
      if (!p || p.phase === "hidden") return "hidden";
      return p.phase === "resolved" ? "resolved" : "mystery";
    }
    default:
      return "hidden";
  }
}

function subOf(id: NodeId, state: Cs2DiagramState): string | undefined {
  switch (id) {
    case "root":
      return state.rootMfa ? "MFA on · keys deleted" : "MFA off · keys exposed";
    case "devShared":
      return state.devShared === "resolved"
        ? "Deactivated"
        : state.devShared === "broken"
          ? "Shared by ~10"
          : undefined;
    case "groups":
      return state.groups === "resolved" ? "Devs · DevOps" : "Not set";
    case "users":
      return state.individualUsers === "resolved" ? "One identity each" : "Pending";
    case "lambda":
      return state.rolesAttached
        ? "Execution role"
        : state.lambda === "broken"
          ? "Hardcoded key"
          : undefined;
    case "ec2":
      return state.rolesAttached
        ? "Instance profile"
        : state.ec2 === "broken"
          ? "Hardcoded key"
          : undefined;
    case "cicd":
      return "AssumeRole path";
    case "vendor":
      return "ExternalId gate";
    case "org":
      return state.perimeterSecured ? "Perimeter locked" : "Guards forming";
    case "pin_access":
      return state.pins.find((p) => p.id === "access_key")?.sub;
    case "pin_role":
      return state.pins.find((p) => p.id === "admin_role")?.sub;
    case "pin_timeline":
      return state.pins.find((p) => p.id === "timeline")?.sub;
    case "pin_vikram":
      return state.pins.find((p) => p.id === "vikram")?.sub;
    default:
      return undefined;
  }
}

function iconFor(id: NodeId) {
  if (id === "root") return KeyRound;
  if (id === "lambda") return Cloud;
  if (id === "ec2") return Server;
  if (id === "cicd") return Workflow;
  if (id === "vendor" || id === "org") return Building2;
  if (id === "pin_vikram") return UserRound;
  if (id.startsWith("pin_")) return HelpCircle;
  if (id === "org") return Shield;
  return Users;
}

function curve(from: NodeId, to: NodeId): string {
  const a = POS[from];
  const b = POS[to];
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const lift = Math.abs(b.y - a.y) > 20 ? -6 : a.y === b.y ? -8 : 0;
  return `M ${a.x} ${a.y} Q ${mx} ${my + lift} ${b.x} ${b.y}`;
}

function neighborsOf(id: NodeId): Set<NodeId> {
  const set = new Set<NodeId>([id]);
  for (const e of EDGES) {
    if (e.from === id) set.add(e.to);
    if (e.to === id) set.add(e.from);
  }
  return set;
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
      {[0, 0.85, 1.7].map((delay) => (
        <circle key={delay} r={hot ? 1.1 : 0.75} fill={color} opacity={hot ? 1 : 0.75}>
          <animateMotion
            dur={hot ? "1.8s" : "2.8s"}
            begin={`${delay}s`}
            repeatCount="indefinite"
            path={d}
          />
        </circle>
      ))}
    </>
  );
}

export function FoodQuickIamDiagram({
  state,
  size = "rail",
  celebratePulse,
  className = "",
  liveFlow,
}: Props) {
  const [selected, setSelected] = useState<NodeId | null>(null);
  void celebratePulse;

  const flowsOn = liveFlow ?? size === "hero";
  const related = useMemo(
    () => (selected ? neighborsOf(selected) : null),
    [selected]
  );

  const visible = useMemo(() => {
    const ids = Object.keys(POS) as NodeId[];
    return ids.filter((id) => toneOf(id, state) !== "hidden");
  }, [state]);

  const visibleSet = useMemo(() => new Set(visible), [visible]);

  const liveEdges = useMemo(() => {
    return EDGES.filter(
      (e) => visibleSet.has(e.from) && visibleSet.has(e.to)
    ).map((e) => {
      const fromTone = toneOf(e.from, state);
      const toTone = toneOf(e.to, state);
      const active =
        (fromTone === "resolved" || fromTone === "progress") &&
        (toTone === "resolved" ||
          toTone === "progress" ||
          toTone === "mystery");
      const hot =
        selected != null &&
        (e.from === selected || e.to === selected);
      return { ...e, d: curve(e.from, e.to), active, hot };
    });
  }, [state, visibleSet, selected]);

  const select = (id: NodeId) =>
    setSelected((cur) => (cur === id ? null : id));

  const height =
    size === "hero"
      ? "min-h-[640px] h-[min(78vh,760px)]"
      : size === "inspect"
        ? "min-h-[320px] h-[340px]"
        : "min-h-[360px] h-full";

  const boardPad = size === "hero" ? "p-5 md:p-6" : "p-3";

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0f14] ${height} ${className}`}
      onClick={() => setSelected(null)}
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

      {/* Story / region header */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5 md:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-[#ff9900] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
            ap-south-1
          </span>
          <span className="text-[12px] text-slate-300">
            FoodQuick · live trust map
          </span>
          {flowsOn && (
            <span className="hidden items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live flow
            </span>
          )}
        </div>
        {state.perimeterSecured ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300">
            <Shield className="h-3 w-3" /> Perimeter secured
          </span>
        ) : (
          <span className="text-[10px] text-slate-500">
            Click any node · watch where trust moves
          </span>
        )}
      </div>

      {/* Spatial board */}
      <div className={`relative z-10 flex-1 ${boardPad}`}>
        <div className="relative h-full w-full">
          {/* Lane labels */}
          <div className="pointer-events-none absolute left-0 top-[8%] text-[9px] font-medium uppercase tracking-[0.2em] text-slate-600">
            Identity
          </div>
          <div className="pointer-events-none absolute left-0 top-[34%] text-[9px] font-medium uppercase tracking-[0.2em] text-slate-600">
            Service trust
          </div>
          <div className="pointer-events-none absolute left-0 top-[58%] text-[9px] font-medium uppercase tracking-[0.2em] text-slate-600">
            Integrations
          </div>
          {visible.some((id) => id.startsWith("pin_")) && (
            <div className="pointer-events-none absolute left-0 top-[80%] text-[9px] font-medium uppercase tracking-[0.2em] text-slate-600">
              Evidence
            </div>
          )}

          {/* SVG flows */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="fq-trust" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(52,211,153,0.15)" />
                <stop offset="50%" stopColor="rgba(52,211,153,0.7)" />
                <stop offset="100%" stopColor="rgba(52,211,153,0.15)" />
              </linearGradient>
              <linearGradient id="fq-evidence" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(251,191,36,0.15)" />
                <stop offset="50%" stopColor="rgba(251,191,36,0.75)" />
                <stop offset="100%" stopColor="rgba(251,191,36,0.15)" />
              </linearGradient>
            </defs>
            {liveEdges.map((e) => {
              const dimmed =
                related != null && !e.hot;
              const stroke =
                e.kind === "evidence"
                  ? "url(#fq-evidence)"
                  : e.active
                    ? "url(#fq-trust)"
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
                  {/* Direction arrow tip near end */}
                  {e.active && (
                    <circle
                      cx={POS[e.to].x}
                      cy={POS[e.to].y}
                      r={e.hot ? 1.4 : 0.9}
                      fill={
                        e.kind === "evidence"
                          ? "rgba(251,191,36,0.85)"
                          : "rgba(52,211,153,0.85)"
                      }
                      opacity={dimmed ? 0 : 1}
                    />
                  )}
                  {flowsOn && e.active && !dimmed && (
                    <FlowDots
                      d={e.d}
                      hot={e.hot}
                      color={
                        e.kind === "evidence"
                          ? "#fbbf24"
                          : "#34d399"
                      }
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {visible.map((id) => {
            const tone = toneOf(id, state);
            const pos = POS[id];
            const Icon = iconFor(id);
            const dimmed = related != null && !related.has(id);
            const isSel = selected === id;
            const evidence = id.startsWith("pin_");
            const resolved = tone === "resolved";
            const broken = tone === "broken";
            const mystery = tone === "mystery";

            return (
              <motion.button
                key={id}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: dimmed ? 0.18 : 1,
                  scale: isSel ? 1.06 : 1,
                }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  select(id);
                }}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className={`absolute z-10 w-[138px] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2.5 text-left shadow-[0_12px_28px_rgba(0,0,0,0.4)] backdrop-blur-sm transition md:w-[158px] ${
                  evidence
                    ? resolved
                      ? "border-amber-400/40 bg-amber-500/10"
                      : "border-rose-400/40 bg-rose-950/35"
                    : resolved
                      ? "border-emerald-500/40 bg-emerald-950/25"
                      : broken
                        ? "border-rose-500/45 bg-rose-950/30"
                        : mystery
                          ? "border-rose-400/45 bg-rose-950/30"
                          : "border-white/10 bg-[#121821]/95"
                } ${
                  isSel
                    ? "ring-2 ring-amber-300/60"
                    : "hover:border-slate-400/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-black/40">
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        evidence
                          ? resolved
                            ? "text-amber-300"
                            : "text-rose-300"
                          : "text-[#ff9900]"
                      }`}
                    />
                  </span>
                  <span className="truncate text-[11px] font-semibold text-slate-100">
                    {NODE_COPY[id].title}
                  </span>
                  {resolved && (
                    <span className="ml-auto grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-black">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  )}
                  {broken && (
                    <span className="ml-auto grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-white">
                      <AlertTriangle className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                {subOf(id, state) && (
                  <p className="mt-1.5 pl-9 text-[10px] leading-snug text-slate-400">
                    {subOf(id, state)}
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Inspector — always available on Journey Map */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-30 border-t border-white/[0.08] bg-[#0e141c]/98 px-4 py-3.5 backdrop-blur-md md:px-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  {NODE_COPY[selected].layer}
                </p>
                <h4 className="mt-0.5 text-base font-semibold text-slate-50">
                  {NODE_COPY[selected].title}
                </h4>
                <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-slate-400">
                  {NODE_COPY[selected].detail}
                </p>
                <p className="mt-2 text-[12px] italic text-amber-200/80">
                  {NODE_COPY[selected].story}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {EDGES.filter(
                (e) => e.from === selected || e.to === selected
              )
                .filter(
                  (e) =>
                    visibleSet.has(e.from) && visibleSet.has(e.to)
                )
                .map((edge) => {
                  const other =
                    edge.from === selected ? edge.to : edge.from;
                  const dir = edge.from === selected ? "flows to" : "comes from";
                  return (
                    <button
                      key={`${edge.from}-${edge.to}`}
                      type="button"
                      onClick={() => select(other)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-100 transition hover:border-amber-300/50 hover:bg-amber-500/15"
                    >
                      <span className="text-amber-300/90">{dir}</span>
                      <span className="font-semibold">
                        {NODE_COPY[other].title}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{edge.label}</span>
                    </button>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selected && size === "hero" && (
        <div className="relative z-20 border-t border-white/[0.04] px-4 py-2 text-center text-[11px] text-slate-500 md:px-5">
          This is your session&rsquo;s living map — scroll down for tickets. Click nodes to trace how trust moves.
        </div>
      )}
    </div>
  );
}
