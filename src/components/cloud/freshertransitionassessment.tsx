import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import {
  FRESHER_TRANSITION_QUESTIONS,
  FRESHER_TRANSITION_META,
  scoreFresherTransition,
} from "@/data/cloud/fresher/transition/assessment";
import {
  promoteToNextPace,
  saveFresherTransitionResult,
  type FresherTransitionResult,
} from "@/data/cloud/studentModePace";
import { BUILDING_BASICS_FIRST_LESSON } from "@/data/cloud/building_basics";

interface Props {
  onComplete: (result: FresherTransitionResult) => void;
  onReviewGap: (lessonId: string) => void;
}

const FresherTransitionAssessment = ({ onComplete, onReviewGap }: Props) => {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<
    { questionId: string; selectedIndex: number }[]
  >([]);

  const q = FRESHER_TRANSITION_QUESTIONS[index];
  const isLast = index === FRESHER_TRANSITION_QUESTIONS.length - 1;
  const passScore = FRESHER_TRANSITION_META.passScore;

  if (FRESHER_TRANSITION_QUESTIONS.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pt-8 text-center text-muted-foreground">
        Transition assessment payload is empty. Fill{" "}
        <code className="text-xs">fresher/transition/assessment.json</code> to
        enable the quiz.
      </div>
    );
  }

  if (!q) return null;

  const isWrong =
    showResult && selected !== null && selected !== q.correctIndex;

  const handleLockIn = () => {
    if (selected === null) return;
    setShowResult(true);
  };

  const handleNext = () => {
    if (selected === null) return;
    const nextAnswers = [
      ...answers,
      { questionId: q.id, selectedIndex: selected },
    ];
    setAnswers(nextAnswers);

    if (isLast) {
      const scored = scoreFresherTransition(nextAnswers);
      const result: FresherTransitionResult = {
        score: scored.score,
        maxScore: scored.maxScore,
        passed: scored.passed,
        gapLessonIds: scored.gapLessonIds,
        completedAt: new Date().toISOString(),
      };
      saveFresherTransitionResult(result);
      if (scored.passed) {
        promoteToNextPace("fresher");
      }
      onComplete(result);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setShowResult(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <p className="font-mono-data text-[11px] uppercase tracking-[0.28em] text-amber-brand mb-3">
          Fresher Transition Assessment
        </p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
          {FRESHER_TRANSITION_META.title}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          {FRESHER_TRANSITION_META.renIntro ||
            `10 conceptual questions · ~${FRESHER_TRANSITION_META.durationMinutes} minutes. Pass (${passScore}/10) and Ren unlocks CS2: Building Basics at ${BUILDING_BASICS_FIRST_LESSON}.`}
        </p>
      </motion.div>

      <div className="mb-6">
        <div className="flex justify-between font-mono-data text-[11px] text-muted-foreground mb-2">
          <span>
            Question {index + 1} / {FRESHER_TRANSITION_QUESTIONS.length}
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-brand via-violet-brand to-emerald-brand"
            animate={{
              width: `${
                ((index + 1) / FRESHER_TRANSITION_QUESTIONS.length) * 100
              }%`,
            }}
          />
        </div>
      </div>

      <motion.div
        key={q.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="brand-card rounded-lg overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-white/[0.06] bg-amber-brand/[0.04]">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
            {q.contextLabel}
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/90">
            {q.context}
          </p>
        </div>
        <div className="p-7">
          <h2 className="font-display text-lg font-semibold mb-6">
            {q.question}
          </h2>
          <div className="space-y-3 mb-6">
            {q.options.map((opt, i) => {
              const picked = selected === i;
              const correct = showResult && i === q.correctIndex;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={showResult}
                  onClick={() => setSelected(i)}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-md border text-left transition-all"
                  style={{
                    borderColor: correct
                      ? "#10B98180"
                      : picked
                        ? "#7C3AED99"
                        : "hsl(250 8% 22%)",
                    background: correct
                      ? "#10B9811A"
                      : picked
                        ? "#7C3AED1A"
                        : "hsl(248 8% 12% / 0.5)",
                  }}
                >
                  <span className="w-8 h-8 shrink-0 rounded-sm flex items-center justify-center font-mono-data text-xs bg-white/10">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-[15px]">{opt}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 px-5 py-4 rounded-md border border-accent/25 bg-accent/[0.06]"
              >
                <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-accent mb-2">
                  Ren explains
                </p>
                <p className="text-sm leading-relaxed">{q.explanation}</p>
                {isWrong &&
                  (q.if_wrong_route_to || q.gapLessonId) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() =>
                        onReviewGap(
                          q.if_wrong_route_to || q.gapLessonId || ""
                        )
                      }
                    >
                      Review{" "}
                      {q.if_wrong_route_to || q.gapLessonId}
                    </Button>
                  )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end">
            {!showResult ? (
              <Button
                variant="hero"
                disabled={selected === null}
                onClick={handleLockIn}
              >
                Lock in
              </Button>
            ) : (
              <Button variant="hero" className="gap-2" onClick={handleNext}>
                {isLast ? "See result" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function FresherTransitionResultPanel({
  result,
  onContinue,
  onReviewGap,
}: {
  result: FresherTransitionResult;
  onContinue: () => void;
  onReviewGap: (lessonId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto brand-card rounded-lg p-8 text-center"
    >
      {result.passed ? (
        <>
          <Sparkles className="w-10 h-10 text-emerald-brand mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">
            CS2: Building Basics unlocked
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {FRESHER_TRANSITION_META.renPassMessage ||
              `Score ${result.score}/${result.maxScore}. Ren unlocked Building Basics — hands-on tickets start at ${BUILDING_BASICS_FIRST_LESSON}.`}
          </p>
          <Button variant="hero" onClick={onContinue}>
            Enter CS2: Building Basics
          </Button>
        </>
      ) : (
        <>
          <AlertCircle className="w-10 h-10 text-amber-brand mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Gap detected</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            {FRESHER_TRANSITION_META.renFailMessage ||
              `Score ${result.score}/${result.maxScore}. Ren will route you back via if_wrong_route_to before re-testing.`}
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {result.gapLessonIds.slice(0, 4).map((id) => (
              <Button
                key={id}
                variant="outline"
                size="sm"
                onClick={() => onReviewGap(id)}
              >
                Review {id}
              </Button>
            ))}
          </div>
          <Button
            variant="hero"
            onClick={() => onReviewGap(result.gapLessonIds[0])}
            disabled={!result.gapLessonIds[0]}
          >
            Start review
          </Button>
        </>
      )}
    </motion.div>
  );
}

export default FresherTransitionAssessment;
