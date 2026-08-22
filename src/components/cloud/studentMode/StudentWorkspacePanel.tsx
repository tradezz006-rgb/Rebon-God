import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  StudentLanguage,
  StudentWorkspaceFile,
  StudentWorkspaceItem,
} from "@/types/studentMode";
import {
  getCompletedItemIds,
  markDayWorkspaceComplete,
  markItemComplete,
} from "@/data/cloud/studentModeProgress";

interface Props {
  day: number;
  workspace: StudentWorkspaceFile;
  language: StudentLanguage;
  onComplete: () => void;
}

function hintFor(item: StudentWorkspaceItem, language: StudentLanguage) {
  return language === "tanglish"
    ? item.ren_hint_tanglish
    : item.ren_hint_english;
}

function normalizeAnswer(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function StudentWorkspacePanel({
  day,
  workspace,
  language,
  onComplete,
}: Props) {
  const items = workspace.items;
  const completed = useMemo(() => new Set(getCompletedItemIds(day)), [day]);
  const startIndex = Math.max(
    0,
    items.findIndex((i) => !completed.has(i.id))
  );
  const [index, setIndex] = useState(startIndex === -1 ? 0 : startIndex);
  const [selected, setSelected] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const item = items[index];
  if (!item) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        No workspace items for this day yet.
      </div>
    );
  }

  const advance = (itemId: string) => {
    markItemComplete(day, itemId);
    const nextCompleted = new Set([...completed, itemId]);
    const allDone = items.every((i) => nextCompleted.has(i.id));
    if (allDone) {
      markDayWorkspaceComplete(day);
      onComplete();
      return;
    }
    const next = items.findIndex((i) => !nextCompleted.has(i.id));
    setIndex(next >= 0 ? next : index + 1);
    setSelected(null);
    setTextAnswer("");
    setWrongCount(0);
    setFeedback(null);
    setShowExplanation(false);
  };

  const submit = () => {
    let correct = false;
    if (item.type === "account_id") {
      const expected = normalizeAnswer(item.expected_answer);
      const given = normalizeAnswer(textAnswer);
      correct =
        given === expected ||
        given.includes(expected) ||
        expected.includes(given);
    } else {
      correct = selected === item.correct_index;
    }

    if (correct) {
      setFeedback(null);
      setShowExplanation(true);
      window.setTimeout(() => advance(item.id), 900);
      return;
    }

    const nextWrong = wrongCount + 1;
    setWrongCount(nextWrong);
    if (nextWrong >= 2) {
      setShowExplanation(true);
      setFeedback(item.explanation);
      window.setTimeout(() => advance(item.id), 1600);
    } else {
      setFeedback(hintFor(item, language));
    }
  };

  const canSubmit =
    item.type === "account_id"
      ? textAnswer.trim().length >= 2
      : selected !== null;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-5 flex items-end justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Day {day} · {index + 1}/{items.length}
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-foreground md:text-2xl">
            {item.type === "quiz"
              ? "Quiz"
              : item.type === "scenario"
                ? "Scenario"
                : "Account ID habit"}
          </h2>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6">
        {"situation" in item && item.situation && (
          <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {item.situation}
          </p>
        )}
        <p className="text-base font-medium leading-relaxed text-foreground">
          {item.question}
        </p>

        {item.type === "account_id" ? (
          <input
            value={textAnswer}
            onChange={(e) => {
              setTextAnswer(e.target.value);
              setFeedback(null);
            }}
            placeholder="Type your answer…"
            className="mt-5 w-full rounded-lg border border-white/[0.1] bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-[#7C3AED]/55"
            autoComplete="off"
          />
        ) : (
          <div className="mt-5 space-y-2">
            {item.options.map((opt, i) => (
              <button
                key={`${item.id}-${i}`}
                type="button"
                onClick={() => {
                  setSelected(i);
                  setFeedback(null);
                }}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                  selected === i
                    ? "border-[#7C3AED]/60 bg-[rgba(124,58,237,0.12)] text-foreground"
                    : "border-white/[0.08] text-muted-foreground hover:border-white/20 hover:text-foreground"
                }`}
              >
                <span className="mr-2 font-mono text-violet-brand">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {feedback && (
          <p className="mt-4 rounded-lg border border-[rgba(124,58,237,0.3)] bg-[rgba(124,58,237,0.1)] px-3 py-2 text-sm text-violet-100">
            {feedback}
          </p>
        )}
        {showExplanation && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {item.explanation}
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            disabled={!canSubmit || showExplanation}
            onClick={submit}
            className="bg-[#7C3AED] font-semibold text-white hover:bg-[#6D28D9]"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
