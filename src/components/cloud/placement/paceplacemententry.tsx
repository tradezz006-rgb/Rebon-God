import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Lock, Sparkles } from "lucide-react";
import {
  GATE_DEFINITIONS,
  getGateRetryBlockedUntil,
  type PlacementGateId,
} from "@/data/cloud/placement";

interface Props {
  onStartFresher: () => void;
  onStartGate: (gateId: PlacementGateId) => void;
}

const GATE_ORDER: PlacementGateId[] = [
  "building_basics_entry",
  "working_level_entry",
  "deep_craft_entry",
];

export default function PacePlacementEntry({
  onStartFresher,
  onStartGate,
}: Props) {
  return (
    <div className="max-w-5xl mx-auto pt-2">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <p className="font-mono-data text-[11px] uppercase tracking-[0.3em] text-amber-brand mb-5">
          Trust layer · Placement
        </p>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-[1.1] mb-4">
          Skip ahead? Prove it first.
        </h1>
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
          Every phase you skip is verified, not assumed. Companies trust your
          Rebon profile because what it says is real. Choose which level you
          want to test into — the assessment gets harder and more realistic the
          further you skip.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5 mb-10">
        {GATE_ORDER.map((gateId, index) => {
          const gate = GATE_DEFINITIONS[gateId];
          const blockedUntil = getGateRetryBlockedUntil(gateId);
          const blocked = blockedUntil != null;
          const daysLeft = blocked
            ? Math.ceil((blockedUntil! - Date.now()) / (24 * 60 * 60 * 1000))
            : 0;

          return (
            <motion.button
              key={gateId}
              type="button"
              disabled={blocked}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index }}
              onClick={() => !blocked && onStartGate(gateId)}
              className={`relative brand-card rounded-lg p-6 text-left transition-all ${
                blocked
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:-translate-y-1"
              } ${
                gate.highestTrust
                  ? "border border-emerald-brand/40 shadow-[0_0_40px_-16px_#10B981]"
                  : ""
              }`}
            >
              {gate.highestTrust && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-emerald-brand/40 bg-emerald-brand/10 px-2 py-0.5 font-mono-data text-[9px] uppercase tracking-wider text-emerald-brand">
                  <ShieldCheck className="w-3 h-3" /> Highest trust signal
                </span>
              )}
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Gate {index + 1}
              </p>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2 pr-6">
                {gate.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                {gate.subtitle}
              </p>
              {blocked ? (
                <span className="inline-flex items-center gap-2 text-xs text-amber-brand">
                  <Lock className="w-3.5 h-3.5" />
                  Retry in {daysLeft}d
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm font-medium text-accent">
                  Begin verification <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="rounded-lg border border-white/10 bg-white/[0.03] p-6 text-center"
      >
        <Sparkles className="w-5 h-5 text-amber-brand mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto leading-relaxed">
          Not sure? Start at Fresher — no test needed, and you can attempt any
          of these gates later once you&apos;ve learned more.
        </p>
        <button
          type="button"
          onClick={onStartFresher}
          className="px-6 py-3 rounded-md text-sm font-semibold border border-amber-brand/40 text-amber-brand hover:bg-amber-brand/10 transition-colors"
        >
          Start at Fresher — no gate
        </button>
      </motion.div>
    </div>
  );
}
