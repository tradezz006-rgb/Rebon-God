import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import {
  GATE_DEFINITIONS,
  PLACEHOLDER_DURATION_MINUTES,
  serveGateItems,
  scorePlacement,
  applyPlacementResult,
  type PlacementAnswer,
  type PlacementGateId,
  type PlacementItem,
  type PlacementResult,
} from "@/data/cloud/placement";

interface Props {
  gateId: PlacementGateId;
  onComplete: (result: PlacementResult) => void;
  onAbort: () => void;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PacePlacementRunner({
  gateId,
  onComplete,
  onAbort,
}: Props) {
  const gate = GATE_DEFINITIONS[gateId];
  const items = useMemo(() => serveGateItems(gateId), [gateId]);
  const durationSec = PLACEHOLDER_DURATION_MINUTES[gateId] * 60;

  const [confirmed, setConfirmed] = useState(false);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(durationSec);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const answersRef = useRef<PlacementAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [defense, setDefense] = useState("");
  const [defenseStep, setDefenseStep] = useState(false);
  const finishedRef = useRef(false);

  const item = items[index] as PlacementItem | undefined;
  const isLast = index >= items.length - 1;

  const finish = (finalAnswers: PlacementAnswer[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const result = scorePlacement(gateId, items, finalAnswers);
    applyPlacementResult(result);
    onComplete(result);
  };

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!confirmed || finishedRef.current) return;
    if (remaining <= 0) {
      finish(answersRef.current);
      return;
    }
    const t = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [confirmed, remaining]);

  useEffect(() => {
    if (!item) return;
    setSelected(null);
    setDefense("");
    setDefenseStep(false);
    if (item.type === "order_task" && item.items) {
      setOrder(item.items.map((_, i) => i));
    } else {
      setOrder([]);
    }
  }, [item?.id]);

  const buildAnswer = (): PlacementAnswer | "need_defense" | null => {
    if (!item) return null;
    if (item.type === "order_task") {
      return { itemId: item.id, selectedOrder: order };
    }
    if (typeof item.correct_index === "number") {
      if (selected === null) return null;
      if (item.counter_argument && !defenseStep) return "need_defense";
      if (item.counter_argument && defenseStep) {
        if (defense.trim().length < 12) return null;
        return {
          itemId: item.id,
          selectedIndex: selected,
          defenseText: defense.trim(),
        };
      }
      return { itemId: item.id, selectedIndex: selected };
    }
    return null;
  };

  const handleNext = () => {
    const ans = buildAnswer();
    if (ans === "need_defense") {
      setDefenseStep(true);
      return;
    }
    if (!ans) return;
    const nextAnswers = [
      ...answers.filter((a) => a.itemId !== ans.itemId),
      ans,
    ];
    setAnswers(nextAnswers);
    answersRef.current = nextAnswers;
    if (isLast) {
      finish(nextAnswers);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const moveOrder = (from: number, dir: -1 | 1) => {
    const to = from + dir;
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
  };

  if (!confirmed) {
    return (
      <div className="max-w-xl mx-auto brand-card rounded-lg p-8 text-center">
        <p className="font-mono-data text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-3">
          {gate.title}
        </p>
        <h2 className="font-display text-2xl font-bold mb-3">
          Starting the timer is a commitment
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Placeholder run: {items.length} items · ~
          {PLACEHOLDER_DURATION_MINUTES[gateId]} min (scaled for testing). Full
          banks/timings apply when real content loads. No pause. No
          correct/incorrect feedback until the end.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onAbort}>
            Back
          </Button>
          <Button variant="hero" onClick={() => setConfirmed(true)}>
            Start verification
          </Button>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const canAdvance =
    item.type === "order_task"
      ? order.length > 0
      : defenseStep
        ? selected !== null && defense.trim().length >= 12
        : selected !== null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono-data text-[11px] text-muted-foreground">
          Item {index + 1} of {items.length}
          {item.section ? ` · Section ${item.section}` : ""}
        </p>
        <span
          className={`inline-flex items-center gap-2 font-mono-data text-sm ${
            remaining < 60 ? "text-rose-400" : "text-amber-brand"
          }`}
        >
          <Clock className="w-4 h-4" />
          {formatTime(remaining)}
        </span>
      </div>

      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-8">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-brand via-violet-brand to-emerald-brand"
          animate={{ width: `${((index + 1) / items.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id + String(defenseStep)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="brand-card rounded-lg overflow-hidden"
        >
          {(item.scenario || item.broken_config || item.error_shown) && (
            <div className="px-6 py-5 border-b border-white/[0.06] bg-amber-brand/[0.04] space-y-3">
              {item.scenario && (
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {item.scenario}
                </p>
              )}
              {item.broken_config && (
                <pre className="text-xs font-mono overflow-x-auto rounded-md bg-black/40 p-3 text-emerald-200/90 whitespace-pre-wrap">
                  {item.broken_config}
                </pre>
              )}
              {item.error_shown && (
                <pre className="text-xs font-mono overflow-x-auto rounded-md bg-rose-950/40 p-3 text-rose-200 whitespace-pre-wrap">
                  {item.error_shown}
                </pre>
              )}
            </div>
          )}

          {item.signals && item.signals.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-2 p-4 border-b border-white/[0.06] bg-[#0a0a12]">
              {item.signals.map((sig, i) => (
                <div
                  key={i}
                  className="rounded-md border p-3"
                  style={{
                    borderColor:
                      sig.tone === "bad"
                        ? "#f43f5e55"
                        : sig.tone === "warn"
                          ? "#f59e0b55"
                          : "#ffffff18",
                  }}
                >
                  <p className="font-mono-data text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
                    {sig.source.replace("_", " ")} · {sig.label}
                  </p>
                  <p className="text-sm text-foreground">{sig.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="p-7">
            {!defenseStep ? (
              <>
                <h2 className="font-display text-lg font-semibold mb-6">
                  {item.question}
                </h2>

                {item.type === "order_task" && item.items ? (
                  <div className="space-y-2 mb-6">
                    {order.map((idx, pos) => (
                      <div
                        key={`${idx}-${pos}`}
                        className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2"
                      >
                        <span className="font-mono-data text-xs text-muted-foreground w-6">
                          {pos + 1}.
                        </span>
                        <span className="flex-1 text-sm">{item.items![idx]}</span>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground px-2"
                          onClick={() => moveOrder(pos, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground px-2"
                          onClick={() => moveOrder(pos, 1)}
                        >
                          ↓
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {(item.options || []).map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelected(i)}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-md border text-left transition-all"
                        style={{
                          borderColor:
                            selected === i ? "#7C3AED99" : "hsl(250 8% 22%)",
                          background:
                            selected === i
                              ? "#7C3AED1A"
                              : "hsl(248 8% 12% / 0.5)",
                        }}
                      >
                        <span className="w-8 h-8 shrink-0 rounded-sm flex items-center justify-center font-mono-data text-xs bg-white/10">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-[15px]">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-accent mb-2">
                  Ren challenges your call
                </p>
                <h2 className="font-display text-lg font-semibold mb-4">
                  {item.counter_argument}
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Defend your choice in writing — surface memorization fails
                  here.
                </p>
                <textarea
                  value={defense}
                  onChange={(e) => setDefense(e.target.value)}
                  className="w-full min-h-32 rounded-md border border-white/15 bg-black/30 p-4 text-sm mb-6"
                  placeholder="Write your defense…"
                />
              </>
            )}

            <div className="flex justify-end">
              <Button
                variant="hero"
                className="gap-2"
                disabled={!canAdvance}
                onClick={handleNext}
              >
                {isLast && (defenseStep || !item.counter_argument)
                  ? "Submit assessment"
                  : item.counter_argument && !defenseStep
                    ? "Continue"
                    : "Lock & next"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="mt-4 text-center font-mono-data text-[10px] text-muted-foreground/70">
        Feedback suppressed until the end — verification integrity
      </p>
    </div>
  );
}
