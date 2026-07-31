/**
 * Shared "Ghost Resources" / mystery evidence pin.
 * Same visual family for Fresher bleed warnings and Building Basics
 * unexplained-access pins — red while open, gold when the story pays off.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, HelpCircle, Trash2, UserRound } from "lucide-react";

export type PinPhase = "hidden" | "open" | "pulse" | "resolving" | "resolved" | "gone";

type Props = {
  phase: PinPhase;
  label: string;
  sub?: string;
  /** ghost = trash icon (Fresher); mystery = ? badge; person = Vikram avatar */
  variant?: "ghost" | "mystery" | "person";
  /** Shown during resolving (e.g. ₹80,000 → ₹0) */
  costLabel?: string;
  className?: string;
  /** Called after resolve animation finishes (Fresher fade-out) */
  onResolvedGone?: () => void;
};

export function GhostStoryPin({
  phase,
  label,
  sub,
  variant = "ghost",
  costLabel,
  className = "",
  onResolvedGone,
}: Props) {
  const [local, setLocal] = useState<PinPhase>(phase);

  useEffect(() => {
    if (phase === "resolving") {
      setLocal("resolving");
      const t1 = window.setTimeout(() => setLocal("resolved"), 900);
      const t2 = window.setTimeout(() => {
        setLocal("gone");
        onResolvedGone?.();
      }, 2200);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
    setLocal(phase);
  }, [phase, onResolvedGone]);

  if (local === "hidden" || local === "gone") return null;

  const open = local === "open" || local === "pulse";
  const resolving = local === "resolving";
  const resolved = local === "resolved";

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.7, y: 8 }}
        animate={{
          opacity: resolving ? 0.55 : 1,
          scale: local === "pulse" ? [1, 1.08, 1] : resolving ? 0.92 : 1,
          y: 0,
          filter: resolving ? "grayscale(0.4)" : "none",
        }}
        exit={{ opacity: 0, scale: 0.5, y: -20 }}
        transition={
          local === "pulse"
            ? { duration: 1.2, repeat: 2 }
            : { type: "spring", stiffness: 200, damping: 16 }
        }
        className={`relative z-10 flex flex-col items-center ${className}`}
      >
        <div
          className={`relative rounded-lg border-2 p-3 ${
            resolved
              ? "border-amber-300/80 bg-amber-500/15 shadow-[0_0_18px_rgba(251,191,36,0.35)]"
              : open || resolving
                ? "border-rose-500/70 bg-rose-950/50 border-dashed shadow-[0_0_16px_rgba(244,63,94,0.3)]"
                : "border-slate-700 bg-slate-900/40"
          }`}
        >
          {variant === "person" ? (
            <UserRound
              className={`h-7 w-7 ${resolved ? "text-amber-300" : "text-rose-300"}`}
            />
          ) : variant === "mystery" ? (
            <HelpCircle
              className={`h-7 w-7 ${resolved ? "text-amber-300" : "text-rose-400"}`}
            />
          ) : (
            <Trash2
              className={`h-7 w-7 ${resolved ? "text-amber-300" : "text-rose-500 opacity-80"}`}
            />
          )}

          {variant === "mystery" && open && (
            <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow">
              ?
            </span>
          )}

          {resolved && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border-2 border-[#0a0c10] bg-emerald-500 text-black"
            >
              <Check className="h-3 w-3" />
            </motion.span>
          )}

          {resolving && costLabel && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 font-mono text-[8px] text-emerald-400"
            >
              {costLabel}
            </motion.span>
          )}
        </div>

        <span
          className={`mt-2 max-w-[110px] text-center font-mono text-[9px] uppercase tracking-widest ${
            resolved ? "text-amber-300" : "text-rose-400"
          }`}
        >
          {resolved && variant === "ghost" ? "Terminated" : label}
        </span>
        {sub && (
          <span className="mt-0.5 max-w-[110px] text-center font-mono text-[8px] text-slate-500">
            {sub}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/** SVG string that draws itself over ~2s — used for the Act 4 red-string payoff. */
export function EvidenceString({
  active,
  className = "",
}: {
  active: boolean;
  className?: string;
}) {
  if (!active) return null;
  return (
    <motion.svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.path
        d="M 18 28 Q 50 48 82 72"
        fill="none"
        stroke="rgba(251,191,36,0.85)"
        strokeWidth="1.2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      <motion.path
        d="M 22 78 Q 50 55 78 28"
        fill="none"
        stroke="rgba(251,191,36,0.7)"
        strokeWidth="1"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, delay: 0.25, ease: "easeInOut" }}
      />
      <motion.path
        d="M 50 22 L 50 78"
        fill="none"
        stroke="rgba(251,191,36,0.55)"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeDasharray="2 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}
