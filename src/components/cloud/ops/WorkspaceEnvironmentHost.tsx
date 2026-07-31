/**
 * Routes a workspace task to the correct environment UI by `type` / `environment`.
 * Shared by Fresher (embedded tasks) and Building Basics (`_workspace.json`).
 */
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  FileCode2,
  ScrollText,
  Layers,
  DollarSign,
} from "lucide-react";
import type { CloudWorkspaceTask } from "@/types/cloudLesson";
import { CostExplorerPanel } from "@/components/cloud/ops/AwsInteractivePanels";

export type EnvAnswerState = {
  selected: number | null;
  answer: string;
  orderItems: number[];
  /** Per-case selections for multi-case MCQ architecture_choice */
  caseAnswers: number[];
  /** Per-case free-text answers for multi-case written architecture_choice */
  caseTexts: string[];
};

type Props = {
  task: CloudWorkspaceTask & Record<string, unknown>;
  review: "idle" | "correct" | "retry" | "revealed";
  state: EnvAnswerState;
  onChange: (next: Partial<EnvAnswerState>) => void;
};

const clean = (t?: string) => (t ? t.replace(/\[cite:\s*\d+\]/g, "").trim() : "");

function resolveEnvironment(task: CloudWorkspaceTask): string {
  if (task.environment) return String(task.environment);
  switch (task.type) {
    case "quiz":
      return "quiz_card";
    case "order_task":
      return "sequence_card";
    case "config_audit":
      return "monaco_editor";
    case "debug_task":
      return "cloudwatch_logs";
    case "architecture_choice":
      return "scenario_card";
    case "cost_analysis":
      return "cost_explorer";
    case "scenario_task":
      return "incident_card";
    default:
      return "incident_card";
  }
}

function ChoiceList({
  choices,
  selected,
  disabled,
  onSelect,
}: {
  choices: string[];
  selected: number | null;
  disabled: boolean;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="mt-6 space-y-2">
      {choices.map((choice, index) => (
        <button
          key={`${index}-${choice}`}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onSelect(index)}
          className={`w-full text-left rounded-lg border p-4 text-sm transition ${
            selected === index
              ? "border-[#ff9900] bg-[#ff9900]/10 text-white"
              : "border-slate-700 hover:border-slate-500 text-slate-300"
          }`}
        >
          <span className="mr-3 text-[#ff9900] font-mono font-bold">
            {String.fromCharCode(65 + index)}.
          </span>
          {clean(choice)}
        </button>
      ))}
    </div>
  );
}

function FreeTextArea({
  value,
  disabled,
  placeholder,
  onChange,
}: {
  value: string;
  disabled: boolean;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={6}
      placeholder={placeholder}
      className="mt-6 w-full rounded-lg border border-slate-700 bg-[#0a0a0a] p-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#ff9900]/60"
    />
  );
}

export function WorkspaceEnvironmentHost({
  task,
  review,
  state,
  onChange,
}: Props) {
  const env = resolveEnvironment(task);
  const locked = review === "correct" || review === "revealed";
  const choices = task.options;
  const isTextScenario =
    task.response_type === "text" ||
    (!choices?.length &&
      (task.type === "scenario_task" ||
        task.type === "config_audit" ||
        task.type === "debug_task"));

  const multiCases = Array.isArray(task.cases) && task.cases.length > 0;

  const prompt = useMemo(
    () =>
      clean(task.question) ||
      clean(task.scenario) ||
      clean(task.broken_config)?.slice(0, 120) ||
      task.task_id,
    [task]
  );

  return (
    <div>
      {/* Shared scenario / question prose — full readable block, not fast slides */}
      {(task.scenario || task.question) && env !== "quiz_card" && (
        <div className="mb-4 rounded-xl border border-white/[0.08] bg-[#0a0e14] px-4 py-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
            Ticket context
          </p>
          <p className="whitespace-pre-wrap text-[15px] leading-[1.7] text-slate-200">
            {clean(task.scenario) || clean(task.question)}
          </p>
          {task.scenario && task.question && (
            <p className="mt-3 border-t border-white/[0.06] pt-3 text-sm font-medium leading-relaxed text-slate-100">
              {clean(task.question)}
            </p>
          )}
        </div>
      )}
      {env === "quiz_card" && (
        <div className="mb-3 rounded-xl border border-white/[0.08] bg-[#0a0e14] px-4 py-4">
          <p className="whitespace-pre-wrap text-[15px] leading-[1.7] text-slate-100">
            {prompt}
          </p>
        </div>
      )}

      {env === "quiz_card" && choices?.length ? (
        <ChoiceList
          choices={choices}
          selected={state.selected}
          disabled={locked}
          onSelect={(i) => onChange({ selected: i })}
        />
      ) : null}

      {(env === "incident_card" || env === "scenario_card") && !multiCases && (
        <>
          {task.question && task.scenario ? (
            <p className="text-sm text-slate-300 mb-2 font-medium">
              {clean(task.question)}
            </p>
          ) : null}
          {isTextScenario || task.response_type === "text" ? (
            <FreeTextArea
              value={state.answer}
              disabled={locked}
              placeholder="Write your call — Ren grades after you commit."
              onChange={(v) => onChange({ answer: v })}
            />
          ) : choices?.length ? (
            <ChoiceList
              choices={choices}
              selected={state.selected}
              disabled={locked}
              onSelect={(i) => onChange({ selected: i })}
            />
          ) : (
            <FreeTextArea
              value={state.answer}
              disabled={locked}
              placeholder="Document your decision…"
              onChange={(v) => onChange({ answer: v })}
            />
          )}
        </>
      )}

      {env === "scenario_card" && multiCases && (
        <div className="mt-4 space-y-5">
          <p className="text-xs text-slate-400">
            Answer each case. After you submit, Ren reveals the model call for
            every scenario.
          </p>
          {task.cases!.map((c, ci) => {
            const hasOptions = Boolean(c.options?.length);
            return (
              <div
                key={c.id || ci}
                className="rounded-lg border border-slate-700 bg-[#0a0a0a] p-4"
              >
                <p className="text-[10px] uppercase tracking-widest text-[#ff9900] mb-2">
                  Case {ci + 1}
                  {c.id ? ` · ${c.id}` : ""}
                </p>
                <p className="text-sm text-slate-200 mb-3">
                  {clean(c.scenario) || clean(c.question)}
                </p>
                {hasOptions ? (
                  <ChoiceList
                    choices={c.options!.map((o) =>
                      String(o).replace(/^[A-D]\)\s*/, "")
                    )}
                    selected={state.caseAnswers[ci] ?? null}
                    disabled={locked}
                    onSelect={(i) => {
                      const next = [...state.caseAnswers];
                      next[ci] = i;
                      onChange({ caseAnswers: next });
                    }}
                  />
                ) : (
                  <FreeTextArea
                    value={state.caseTexts[ci] || ""}
                    disabled={locked}
                    placeholder={`Your call for case ${ci + 1}…`}
                    onChange={(v) => {
                      const next = [...(state.caseTexts || [])];
                      while (next.length < task.cases!.length) next.push("");
                      next[ci] = v;
                      onChange({
                        caseTexts: next,
                        answer: next.filter(Boolean).join("\n\n"),
                      });
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {(env === "monaco_editor" || env === "iam_console") && (
        <div className="mt-4">
          <div className="rounded-lg overflow-hidden border border-slate-700">
            <div className="px-4 py-2 bg-[#232f3e] text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode2 className="w-3.5 h-3.5" />
              {env === "iam_console" ? "IAM console · broken config" : "Editor · read-only evidence"}
            </div>
            <pre className="p-4 text-xs leading-5 text-emerald-300/90 whitespace-pre-wrap bg-[#0a0a0a] font-mono overflow-x-auto max-h-80">
              {clean(task.broken_config) || "— no config attached —"}
            </pre>
          </div>
          {task.what_to_find?.length ? (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="text-[10px] uppercase tracking-widest text-amber-400 mb-2">
                Find every issue
              </p>
              <p className="text-xs text-slate-400 mb-3">
                List the problems you see. After submit, Ren reveals the full
                audit checklist.
              </p>
            </div>
          ) : null}
          <FreeTextArea
            value={state.answer}
            disabled={locked}
            placeholder="List every problem you found, then the correct structure…"
            onChange={(v) => onChange({ answer: v })}
          />
        </div>
      )}

      {env === "cloudwatch_logs" && (
        <div className="mt-4">
          <div className="rounded-lg overflow-hidden border border-rose-500/40">
            <div className="px-4 py-2 bg-[#232f3e] text-[10px] uppercase tracking-widest text-rose-300 flex items-center gap-2">
              <ScrollText className="w-3.5 h-3.5" /> CloudWatch Logs · live error
            </div>
            <pre className="p-4 text-xs leading-5 text-rose-200/90 whitespace-pre-wrap bg-[#0a0a0a] font-mono overflow-x-auto max-h-72">
              {clean(task.error_shown) || "— no log stream —"}
            </pre>
          </div>
          <FreeTextArea
            value={state.answer}
            disabled={locked}
            placeholder="Diagnosis + fix — what is the root cause, and what do you change?"
            onChange={(v) => onChange({ answer: v })}
          />
        </div>
      )}

      {env === "sequence_card" && Array.isArray(task.items) && (
        <div className="mt-6 space-y-2">
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" /> Use ↑ ↓ to set the correct sequence
          </p>
          {(state.orderItems.length
            ? state.orderItems
            : task.items.map((_, i) => i)
          ).map((itemIdx, pos) => {
            const order =
              state.orderItems.length > 0
                ? state.orderItems
                : task.items!.map((_, i) => i);
            return (
              <div
                key={`${itemIdx}-${pos}`}
                className="flex items-center gap-3 rounded-lg border border-slate-700 bg-[#0a0a0a] px-3 py-3"
              >
                <span className="font-mono text-xs text-[#ff9900]">{pos + 1}</span>
                <p className="flex-1 text-sm text-slate-200">
                  {task.items![itemIdx]}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={locked || pos === 0}
                    onClick={() => {
                      const next = [...order];
                      [next[pos - 1], next[pos]] = [next[pos], next[pos - 1]];
                      onChange({ orderItems: next });
                    }}
                    className="rounded border border-slate-600 px-2 py-1 text-xs disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={locked || pos === order.length - 1}
                    onClick={() => {
                      const next = [...order];
                      [next[pos + 1], next[pos]] = [next[pos], next[pos + 1]];
                      onChange({ orderItems: next });
                    }}
                    className="rounded border border-slate-600 px-2 py-1 text-xs disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {env === "cost_explorer" && (
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-emerald-400">
            <DollarSign className="w-4 h-4" /> Cost Explorer
          </div>
          <CostExplorerPanel
            onInsight={(text) =>
              onChange({
                answer: state.answer
                  ? `${state.answer}\n${text}`
                  : `Cost driver: ${text}`,
              })
            }
          />
          <FreeTextArea
            value={state.answer}
            disabled={locked}
            placeholder="What is driving cost, and what would you change?"
            onChange={(v) => onChange({ answer: v })}
          />
        </div>
      )}

      {/* Fallback for unknown environments */}
      {![
        "quiz_card",
        "incident_card",
        "scenario_card",
        "monaco_editor",
        "iam_console",
        "cloudwatch_logs",
        "sequence_card",
        "cost_explorer",
      ].includes(env) && (
        <FreeTextArea
          value={state.answer}
          disabled={locked}
          placeholder="Document your answer…"
          onChange={(v) => onChange({ answer: v })}
        />
      )}
    </div>
  );
}

/** Post-submit reveal for open-ended / audit tasks */
export function WorkspaceCompareReveal({
  task,
}: {
  task: CloudWorkspaceTask;
}) {
  const points = task.expected_answer_contains || task.what_to_find;
  return (
    <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-emerald-400 flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5" /> Compare your answer
      </p>
      {points?.length ? (
        <ul className="space-y-1.5">
          {points.map((p) => (
            <li key={p} className="text-sm text-slate-300 flex gap-2">
              <span className="text-emerald-500 shrink-0">•</span>
              {p}
            </li>
          ))}
        </ul>
      ) : null}
      {task.correct_fix ? (
        <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap bg-[#0a0a0a] border border-slate-700 rounded p-3 max-h-48 overflow-y-auto">
          {task.correct_fix}
        </pre>
      ) : null}
      {task.diagnosis ? (
        <p className="text-sm text-slate-300">
          <span className="text-rose-300 font-medium">Diagnosis: </span>
          {task.diagnosis}
        </p>
      ) : null}
      {task.fix ? (
        <p className="text-sm text-slate-300">
          <span className="text-emerald-300 font-medium">Fix: </span>
          {task.fix}
        </p>
      ) : null}
      {task.explanation ? (
        <p className="text-sm text-slate-200 leading-relaxed">{task.explanation}</p>
      ) : null}
      {task.cases?.some((c) => c.expected) ? (
        <div className="space-y-3 pt-2 border-t border-emerald-500/20">
          {task.cases!.map((c, i) =>
            c.expected ? (
              <div key={c.id || i}>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400/80 mb-1">
                  Case {i + 1} model answer
                </p>
                <p className="text-sm text-slate-300">{c.expected}</p>
              </div>
            ) : null
          )}
        </div>
      ) : null}
    </div>
  );
}

export function useEnvAnswerState(task: CloudWorkspaceTask | undefined): {
  state: EnvAnswerState;
  setPartial: (p: Partial<EnvAnswerState>) => void;
  reset: (t?: CloudWorkspaceTask) => void;
} {
  const [state, setState] = useState<EnvAnswerState>({
    selected: null,
    answer: "",
    orderItems: [],
    caseAnswers: [],
    caseTexts: [],
  });

  const reset = (t?: CloudWorkspaceTask) => {
    const target = t || task;
    setState({
      selected: null,
      answer: "",
      orderItems: target?.items?.map((_, i) => i) || [],
      caseAnswers: target?.cases?.map(() => -1) || [],
      caseTexts: target?.cases?.map(() => "") || [],
    });
  };

  return {
    state,
    setPartial: (p) => setState((s) => ({ ...s, ...p })),
    reset,
  };
}

export { resolveEnvironment };
