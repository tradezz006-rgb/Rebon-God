import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Hourglass, Route } from "lucide-react";
import {
  GATE_DEFINITIONS,
  TOPIC_LABELS,
  type PlacementGateId,
  type PlacementResult,
} from "@/data/cloud/placement";
import { PACE_META } from "@/data/cloud/studentModePace";

interface Props {
  result: PlacementResult;
  onEnterPace: () => void;
  onRetryLowerGate?: (gateId: PlacementGateId) => void;
  onStartFresher: () => void;
}

export default function PacePlacementResults({
  result,
  onEnterPace,
  onRetryLowerGate,
  onStartFresher,
}: Props) {
  const gate = GATE_DEFINITIONS[result.gateId];
  const paceMeta = PACE_META[result.unlockedPace];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto brand-card rounded-lg p-8"
    >
      {result.outcome === "pass" && (
        <div className="text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-brand mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">
            Verified into {gate.targetPace.replace("_", " ")}
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            Score {result.score}/{result.maxScore} ({result.percent}%). This
            pass is now a timestamped trust record on your profile — companies
            can see it.
          </p>
        </div>
      )}

      {result.outcome === "fail" && (
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-amber-brand mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">
            Not verified — yet
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            Score {result.score}/{result.maxScore} ({result.percent}%). This
            attempt stays private. You&apos;ll land where the proof still holds.
          </p>
        </div>
      )}

      {result.outcome === "borderline_review" && (
        <div className="text-center">
          <Hourglass className="w-10 h-10 text-violet-brand mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Under review</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            Score {result.percent}% sits in the judgment band. Ren is evaluating
            free-text defenses — result within 24 hours. Not a lesser outcome; a
            more careful one.
          </p>
        </div>
      )}

      {result.outcome === "shortened_path" && (
        <div className="text-center">
          <Route className="w-10 h-10 text-violet-brand mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">
            Shortened Building Basics
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            Borderline ({result.percent}%). Strong in{" "}
            {result.strongTopics.map((t) => TOPIC_LABELS[t] || t).join(", ") ||
              "some areas"}
            ; focus first on{" "}
            {result.weakTopics.map((t) => TOPIC_LABELS[t] || t).join(", ")}.
          </p>
        </div>
      )}

      {result.topicBreakdown.length > 0 && (
        <div className="mb-6 space-y-2 text-left">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Category breakdown
          </p>
          {result.topicBreakdown.map((t) => (
            <div key={t.topic} className="flex items-center justify-between text-sm">
              <span>{TOPIC_LABELS[t.topic] || t.topic}</span>
              <span className="font-mono-data text-muted-foreground">
                {t.percent}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {result.outcome === "pass" && (
          <Button variant="hero" onClick={onEnterPace}>
            Enter {paceMeta.name}
          </Button>
        )}

        {result.outcome === "shortened_path" && (
          <Button variant="hero" onClick={onEnterPace}>
            Enter Building Basics (focused path)
          </Button>
        )}

        {result.outcome === "fail" &&
          gate.failRoutesTo === "working_level_entry" &&
          onRetryLowerGate && (
            <Button
              variant="hero"
              onClick={() => onRetryLowerGate("working_level_entry")}
            >
              Take Working Level gate next
            </Button>
          )}

        {result.outcome === "fail" &&
          (gate.failRoutesTo === "building_basics_entry" ||
            gate.failRoutesTo === "building_basics") &&
          onRetryLowerGate && (
            <Button
              variant="outline"
              onClick={() => onRetryLowerGate("building_basics_entry")}
            >
              Try Building Basics gate
            </Button>
          )}

        {(result.outcome === "fail" ||
          result.outcome === "borderline_review") && (
          <Button variant="outline" onClick={onStartFresher}>
            {result.outcome === "fail" && gate.failRoutesTo === "fresher"
              ? "Start Fresher at C1.1"
              : "Continue from Fresher / dashboard"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
