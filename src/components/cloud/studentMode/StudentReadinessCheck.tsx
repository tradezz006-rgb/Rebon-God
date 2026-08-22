import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ReadinessCheckFile, StudentLanguage } from "@/types/studentMode";
import { markReadinessPassed } from "@/data/cloud/studentModeProgress";

interface Props {
  check: ReadinessCheckFile;
  language: StudentLanguage;
  onClose: () => void;
  onRevisitDay: (day: number) => void;
}

function normalizeAnswer(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function StudentReadinessCheck({
  check,
  language,
  onClose,
  onRevisitDay,
}: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [results, setResults] = useState<
    { id: string; source_day: number; correct: boolean }[]
  >([]);
  const [finished, setFinished] = useState(false);

  const q = check.questions[index];
  const score = useMemo(() => {
    if (!results.length) return 0;
    return results.filter((r) => r.correct).length / results.length;
  }, [results]);

  const weakestDay = useMemo(() => {
    const misses: Record<number, number> = {};
    for (const r of results) {
      if (!r.correct) misses[r.source_day] = (misses[r.source_day] || 0) + 1;
    }
    const entries = Object.entries(misses).sort((a, b) => b[1] - a[1]);
    return entries.length ? Number(entries[0][0]) : 1;
  }, [results]);

  const submit = () => {
    if (!q) return;
    let correct = false;
    if (q.type === "account_id" && q.expected_answer) {
      const expected = normalizeAnswer(q.expected_answer);
      const given = normalizeAnswer(textAnswer);
      correct =
        given === expected ||
        given.includes(expected) ||
        expected.includes(given);
    } else if (typeof q.correct_index === "number") {
      correct = selected === q.correct_index;
    }

    const nextResults = [
      ...results,
      { id: q.id, source_day: q.source_day, correct },
    ];
    setResults(nextResults);
    setSelected(null);
    setTextAnswer("");

    if (index >= check.questions.length - 1) {
      const passRate =
        nextResults.filter((r) => r.correct).length / nextResults.length;
      if (passRate >= check.pass_threshold) {
        markReadinessPassed();
      }
      setFinished(true);
      return;
    }
    setIndex(index + 1);
  };

  if (finished) {
    const passed = score >= check.pass_threshold;
    const msg = passed
      ? language === "tanglish"
        ? check.on_pass.message_tanglish
        : check.on_pass.message_english
      : (language === "tanglish"
          ? check.on_fail.message_tanglish
          : check.on_fail.message_english
        ).replace("{day}", String(weakestDay));

    return (
      <div className="mx-auto flex h-full max-w-xl flex-col justify-center px-4 py-10 text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
          Console Readiness Check
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          {Math.round(score * 100)}%
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">{msg}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {passed ? (
            <Button
              onClick={onClose}
              className="bg-amber-500 font-semibold text-black hover:bg-amber-400"
            >
              Continue
            </Button>
          ) : (
            <>
              <Button
                onClick={() => onRevisitDay(weakestDay)}
                className="bg-amber-500 font-semibold text-black hover:bg-amber-400"
              >
                Revisit Day {weakestDay}
              </Button>
              <Button variant="outline" onClick={onClose} className="border-white/15">
                Close
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Readiness questions not loaded.
      </div>
    );
  }

  const canSubmit =
    q.type === "account_id"
      ? textAnswer.trim().length >= 2
      : selected !== null;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col justify-center px-4 py-8">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-300">
        Exam mode · no hints · {index + 1}/{check.questions.length}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        Console Readiness Check
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        {check.time_limit_minutes} min suggested · pass{" "}
        {Math.round(check.pass_threshold * 100)}%
      </p>

      <div className="mt-6 rounded-2xl border border-violet-500/20 bg-[#0f141c] p-6">
        {q.situation && (
          <p className="mb-4 text-sm leading-relaxed text-slate-300">
            {q.situation}
          </p>
        )}
        <p className="text-base font-medium text-slate-50">{q.question}</p>

        {q.type === "account_id" ? (
          <input
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Type your answer…"
            className="mt-5 w-full rounded-lg border border-slate-600 bg-[#070b12] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
          />
        ) : (
          <div className="mt-5 space-y-2">
            {(q.options || []).map((opt, i) => (
              <button
                key={`${q.id}-${i}`}
                type="button"
                onClick={() => setSelected(i)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                  selected === i
                    ? "border-violet-400 bg-violet-500/10 text-white"
                    : "border-slate-700 text-slate-300 hover:border-slate-500"
                }`}
              >
                <span className="mr-2 font-mono text-violet-300">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            disabled={!canSubmit}
            onClick={submit}
            className="bg-violet-500 font-semibold text-white hover:bg-violet-400"
          >
            {index >= check.questions.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
