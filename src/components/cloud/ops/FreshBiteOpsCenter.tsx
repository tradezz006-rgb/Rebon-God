import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, DollarSign, FileText,
  Loader2, Lock, ShieldCheck, Terminal, UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AwsConsoleChrome } from "@/components/cloud/ops/AwsConsoleChrome";
import {
  AccountMenuPanel,
  CostExplorerPanel,
  getCorrectRegion,
  getInteractiveMode,
  RegionSelectorPanel,
} from "@/components/cloud/ops/AwsInteractivePanels";
import {
  buildTicketSidebar,
  markLessonComplete,
} from "@/data/cloud/projectPhoenix";
import { getCloudBetaTasks } from "@/data/cloud/cloudBetaTasks";
import { filterTasksForFresherPace } from "@/lib/fresherWorkspaceTasks";
import { markPendingFresherTransition } from "@/data/cloud/studentModePace";
import {
  progressGet,
  progressSet,
  TESTING_UNLOCK_ALL_WORKSPACES,
  isAcceptAnyAnswerActive,
  setAcceptAnyAnswerActive,
} from "@/data/cloud/ephemeralProgress";
import {
  fresherWorkspaceTasks,
  fresherWorkspaceGuides,
} from "@/data/cloud/fresher";
import { getBuildingBasicsWorkspaceTasks } from "@/data/cloud/building_basics";
import {
  validateFreeTextAnswer,
  validateQuizAnswer,
  type CloudTask,
} from "@/lib/cloudTaskValidation";
import {
  WorkspaceEnvironmentHost,
  WorkspaceCompareReveal,
  resolveEnvironment,
  type EnvAnswerState,
} from "@/components/cloud/ops/WorkspaceEnvironmentHost";
import {
  criteriaMet,
  formatAccountIdDisplay,
  useOpsUnlockForTask,
  type IamConsoleAction,
} from "@/components/cloud/awsConsole";
import type { CloudWorkspaceTask } from "@/types/cloudLesson";
import { useAvaVoice } from "@/hooks/useAvaVoice";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type Task = CloudTask &
  CloudWorkspaceTask & {
  title?: string;
  requirements?: string[];
    ui_component?: string;
  solution?: string;
  config?: { options?: string[]; correct_index?: number };
};

interface Props {
  lessonId: string;
  onClose: () => void;
  initialTaskId?: string;
  onFresherTransitionReady?: () => void;
}

const cleanText = (text?: string) => (text ? text.replace(/\[cite:\s*\d+\]/g, "").trim() : "");
const taskText = (task: Task) =>
  cleanText(
    task.question ||
      (task as Task & { scenario_text?: string }).scenario_text ||
      task.scenario ||
      task.broken_config
  ) || "Investigate the assigned production issue and document your decision.";

type MatchTask = Task & {
  left_items?: string[];
  right_items?: string[];
  correct_pairs?: number[][];
  items?: string[];
  correct_order?: number[];
};

const SERVICE_FOR_TYPE: Record<string, string> = {
  quiz: "Knowledge check",
  scenario_task: "CloudShell",
  debug_task: "IAM · Config audit",
  config_audit: "Security Hub",
  cost_analysis: "Cost Explorer",
  architecture_choice: "Architecture decisions",
  match_task: "Concept mapping",
  order_task: "Workflow order",
  ops_console: "IAM",
};

export default function FreshBiteOpsCenter({
  lessonId,
  onClose,
  initialTaskId,
  onFresherTransitionReady,
}: Props) {
  const { speak } = useAvaVoice();
  const navigate = useNavigate();
  const storageKey = `rebon_cloud_ops_${lessonId}`;

  const tasks = useMemo(() => {
    const fresherRaw =
      (fresherWorkspaceTasks.lessons[lessonId]?.workspace_tasks as Task[]) || [];
    const bbRaw = getBuildingBasicsWorkspaceTasks(lessonId) as Task[];
    const embedded = fresherRaw.length ? fresherRaw : bbRaw;
    const raw = getCloudBetaTasks<Task>(lessonId, embedded);
    const isFresherLesson =
      lessonId.startsWith("C1.") || lessonId.startsWith("C1B.");
    const list = isFresherLesson ? filterTasksForFresherPace(raw) : raw;
    // Lesson JSON often uses scenario_text; ops UI reads scenario / question.
    return list.map((t) => {
      const extra = t as Task & { scenario_text?: string };
      const prose = extra.scenario || extra.question || extra.scenario_text;
      return {
        ...t,
        scenario: extra.scenario || prose,
        question: extra.question || prose,
      };
    });
  }, [lessonId]);

  const sidebar = useMemo(
    () => buildTicketSidebar(tasks, lessonId),
    [tasks, lessonId]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [highestCompleted, setHighestCompleted] = useState(-1);
  const [answer, setAnswer] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [review, setReview] = useState<"idle" | "correct" | "retry" | "revealed">(
    "idle"
  );
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [gradingStrict, setGradingStrict] = useState(
    () => !isAcceptAnyAnswerActive()
  );
  const [matchPairs, setMatchPairs] = useState<number[]>([]);
  const [orderItems, setOrderItems] = useState<number[]>([]);
  const [envState, setEnvState] = useState<EnvAnswerState>({
    selected: null,
    answer: "",
    orderItems: [],
    caseAnswers: [],
    caseTexts: [],
  });
  const [opsUnlock, setOpsUnlock] = useOpsUnlockForTask(
    tasks[activeIndex]?.task_id || ""
  );
  const [iamActions, setIamActions] = useState<IamConsoleAction[]>([]);

  useEffect(() => {
    setIamActions([]);
  }, [activeIndex, tasks]);

  useEffect(() => {
    const saved = progressGet(storageKey);
    if (saved) {
      const idx = parseInt(saved, 10);
      setHighestCompleted(idx);
      setActiveIndex(Math.min(idx + 1, Math.max(tasks.length - 1, 0)));
      return;
    }
    setHighestCompleted(-1);
    setActiveIndex(0);
  }, [storageKey, tasks.length]);

  useEffect(() => {
    if (!initialTaskId) return;
    const index = tasks.findIndex((t) => t.task_id === initialTaskId);
    if (index >= 0) setActiveIndex(index);
  }, [initialTaskId, tasks]);

  useEffect(() => {
    setAnswer("");
    setSelected(null);
    setReview("idle");
    setFeedback("");
    const current = tasks[activeIndex] as MatchTask | undefined;
    setMatchPairs(
      current?.type === "match_task" && current.left_items
        ? current.left_items.map(() => -1)
        : []
    );
    setOrderItems(
      current?.type === "order_task" && current.items
        ? current.items.map((_, i) => i)
        : []
    );
    setEnvState({
      selected: null,
      answer: "",
      orderItems: current?.items?.map((_, i) => i) || [],
      caseAnswers: current?.cases?.map(() => -1) || [],
      caseTexts: current?.cases?.map(() => "") || [],
    });
  }, [activeIndex, tasks, lessonId]);

  const task = tasks[activeIndex] as MatchTask;
  const acceptAnyUi = !gradingStrict;
  const choices = task?.options || task?.config?.options;
  const correctIndex = task?.correct_index ?? task?.config?.correct_index;
  const isMatchTask = task?.type === "match_task" && Array.isArray(task.left_items);
  const isOrderTask =
    (task?.type === "order_task" || resolveEnvironment(task || {}) === "sequence_card") &&
    Array.isArray(task?.items);
  const usesEnvHost =
    Boolean(task?.environment) ||
    (!isMatchTask &&
      !isOrderTask &&
      Boolean(task) &&
      (task.type === "quiz" ||
        task.type === "scenario_task" ||
        task.type === "cost_analysis" ||
        task.type === "config_audit" ||
        task.type === "debug_task" ||
        task.type === "architecture_choice" ||
        task.type === "ops_console"));
  const isOpsConsole =
    Boolean(task) &&
    (task.type === "ops_console" ||
      resolveEnvironment(task) === "aws_iam_console");
  const isMultiCase =
    Array.isArray(task?.cases) && (task.cases?.length || 0) > 0;
  const isMultiCaseMcq =
    isMultiCase && Boolean(task?.cases?.some((c) => c.options?.length));
  const isSelfAssessed =
    usesEnvHost &&
    (task?.response_type === "text" ||
      task?.type === "config_audit" ||
      task?.type === "debug_task" ||
      (isMultiCase && !isMultiCaseMcq) ||
      Boolean(task?.expected_answer_contains?.length) ||
      Boolean(task?.what_to_find?.length) ||
      Boolean(task?.diagnosis));
  const completedCount = highestCompleted + 1;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const interactiveMode = task ? getInteractiveMode(task.task_id) : null;

  const selectTask = useCallback(
    (index: number) => {
      if (!TESTING_UNLOCK_ALL_WORKSPACES && index > highestCompleted + 1) {
        toast({
          variant: "destructive",
          title: "Ticket locked",
          description: `Resolve ticket ${index} before opening ${index + 1}.`,
        });
        return;
      }
      setActiveIndex(index);
    },
    [highestCompleted]
  );

  const finishLesson = useCallback(() => {
        markLessonComplete(lessonId);
    if (lessonId === "C1B.5") {
      markPendingFresherTransition();
      onFresherTransitionReady?.();
    }
    onClose();
  }, [lessonId, onFresherTransitionReady, onClose]);

  const goNext = useCallback(() => {
    if (activeIndex >= tasks.length - 1) {
      finishLesson();
      return;
    }
    setActiveIndex((v) => v + 1);
    toast({
      title: "Ticket resolved",
      description: "Next ticket unlocked in your queue.",
    });
  }, [activeIndex, tasks.length, finishLesson]);

  const submit = async () => {
    if (!task || isSubmitting) return;
    setIsSubmitting(true);
    const acceptAny = isAcceptAnyAnswerActive();

    const effectiveSelected = usesEnvHost ? envState.selected : selected;
    const effectiveAnswer = usesEnvHost ? envState.answer : answer;
    const effectiveOrder = usesEnvHost ? envState.orderItems : orderItems;

    const isChoice =
      !isMultiCase &&
      Array.isArray(choices) &&
      typeof correctIndex === "number" &&
      task.response_type !== "text";
    let isCorrect = false;
    let hint = "";
    let treatAsReveal = false;

    if (acceptAny) {
      if (isOpsConsole) {
        isCorrect = opsUnlock.unlocked;
        if (!isCorrect) hint = "Unlock the account first (testing mode).";
      } else if (isMatchTask) {
        isCorrect = matchPairs.length > 0 && matchPairs.every((v) => v >= 0);
        if (!isCorrect) hint = "Match every item (testing mode).";
      } else if (isOrderTask) {
        isCorrect = effectiveOrder.length > 0;
        if (!isCorrect) hint = "Set an order (testing mode).";
      } else if (isMultiCase) {
        if (isMultiCaseMcq) {
          isCorrect = envState.caseAnswers.every((v) => v >= 0);
          if (!isCorrect) hint = "Answer every case (testing mode).";
        } else {
          isCorrect = envState.caseTexts.every((t) => (t || "").trim().length >= 1);
          if (!isCorrect) hint = "Type something for every case (testing mode).";
          if (isCorrect) treatAsReveal = true;
        }
      } else {
        isCorrect = isChoice
          ? effectiveSelected !== null
          : effectiveAnswer.trim().length >= 1;
        if (!isCorrect) {
          hint = isChoice
            ? "Pick any option to continue (testing mode)."
            : "Type anything to continue (testing mode).";
        }
        if (isCorrect && isSelfAssessed) treatAsReveal = true;
      }
    } else if (isOpsConsole) {
      if (!opsUnlock.unlocked) {
        isCorrect = false;
        hint = "Enter the correct 12-digit Account ID before resolving.";
      } else {
        const criteria = task.success_criteria;
        const required = criteria?.required_actions || ["attach_policy"];
        isCorrect = criteriaMet(iamActions, required, {
          target_user: criteria?.target_user,
          target_policy: criteria?.target_policy,
        });
        if (!isCorrect) {
          hint =
            cleanText(task.ava_feedback_wrong) ||
            cleanText(task.ren_wrong) ||
            "Console actions don't match the request yet. Find the user and attach the policy they need.";
        }
      }
    } else if (isMatchTask) {
      const expected = task.correct_pairs || [];
      isCorrect =
        expected.length === matchPairs.length &&
        expected.every((pair, i) => matchPairs[i] === pair[1]);
      if (!isCorrect)
        hint =
          cleanText(task.ava_feedback_wrong) ||
          cleanText(task.explanation) ||
          "Check your pairs.";
    } else if (isOrderTask) {
      const expected = task.correct_order || [];
      isCorrect =
        expected.length === effectiveOrder.length &&
        expected.every((v, i) => effectiveOrder[i] === v);
      if (!isCorrect)
        hint =
          cleanText(task.ava_feedback_wrong) ||
          cleanText(task.explanation) ||
          "Order is incorrect.";
    } else if (isMultiCase && isMultiCaseMcq) {
      const expected = Array.isArray(task.correct_answers)
        ? task.correct_answers
        : [];
      isCorrect =
        expected.length === envState.caseAnswers.length &&
        expected.every((v, i) => envState.caseAnswers[i] === v);
      if (!isCorrect)
        hint =
          cleanText(task.ava_feedback_wrong) ||
          cleanText(task.explanation) ||
          "One or more cases are wrong.";
    } else if (isMultiCase && !isMultiCaseMcq) {
      const filled = envState.caseTexts.every((t) => (t || "").trim().length >= 8);
      if (!filled) {
        isCorrect = false;
        hint = "Write a call for every case before comparing.";
      } else {
        treatAsReveal = true;
        isCorrect = true;
        hint =
          cleanText(task.explanation) ||
          "Compare your calls with Ren's model answers below.";
      }
    } else if (isChoice) {
      isCorrect = validateQuizAnswer(
        { ...task, correct_index: correctIndex },
        effectiveSelected ?? -1
      );
      if (!isCorrect)
        hint =
          cleanText(task.ava_feedback_wrong) ||
          cleanText(task.explanation) ||
          "That choice would leave the incident unresolved.";
    } else if (isSelfAssessed) {
      // Open-ended BB items: commit + compare reveal (not hard auto-fail).
      if (effectiveAnswer.trim().length < 12) {
        isCorrect = false;
        hint = "Write a fuller answer before comparing with Ren.";
      } else {
        treatAsReveal = true;
        isCorrect = true;
        const soft = validateFreeTextAnswer(task, effectiveAnswer);
        hint = soft.valid
          ? cleanText(task.ava_feedback_correct) ||
            cleanText(task.explanation) ||
            "Compare your answer with Ren's checklist below."
          : cleanText(task.ava_feedback_wrong) ||
            cleanText(task.explanation) ||
            "Review the checklist — cover the missing points next time.";
      }
    } else {
      const result = validateFreeTextAnswer(task, effectiveAnswer);
      isCorrect = result.valid;
      hint =
        result.hint ||
        cleanText(task.ava_feedback_wrong) ||
        cleanText(task.explanation) ||
        "Add root cause, AWS action, and expected outcome.";
    }

    if (!isCorrect) {
      setReview("retry");
      setFeedback(hint);
      setIsSubmitting(false);
      return;
    }

    setReview(treatAsReveal ? "revealed" : "correct");
    setFeedback(
      acceptAny
        ? `[Testing] Accepted. ${cleanText(task.ava_feedback_correct) || cleanText(task.solution) || "Nice work."}`
        : hint ||
          cleanText(task.ava_feedback_correct) ||
          cleanText(task.solution) ||
          cleanText(task.explanation) ||
          "Correct. Ticket resolved."
    );

    if (activeIndex > highestCompleted) {
      setHighestCompleted(activeIndex);
      progressSet(storageKey, String(activeIndex));
    }

    const guide = fresherWorkspaceGuides[task.task_id];
    if (guide?.hint_1)
      speak(cleanText(task.ava_feedback_correct) || guide.hint_1);

    window.setTimeout(() => {
      setIsSubmitting(false);
      goNext();
    }, treatAsReveal ? 1600 : 900);
  };

  if (!tasks.length) {
    return (
      <div className="min-h-screen bg-[#0f1115] grid place-items-center text-slate-300">
        No workspace tickets loaded for {lessonId}.
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-[#0f1115] grid place-items-center text-slate-300">
        Loading ticket…
      </div>
    );
  }

  const activeService =
    isOpsConsole
      ? "IAM"
      : SERVICE_FOR_TYPE[task.type] || "Operations";
  const chromeAccountLabel = opsUnlock.unlocked
    ? `${opsUnlock.accountName} (${formatAccountIdDisplay(opsUnlock.accountId)})`
    : isOpsConsole
      ? "Account locked — enter ID"
      : "FreshBite";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f1115] text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-slate-800 bg-[#161b22] flex items-center px-4 gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Exit operations center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-slate-700" />
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded bg-[#ff9900] text-[#232f3e] font-black text-xs grid place-items-center">
            C
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              Cloud Operations
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#ff9900]">
              {lessonId}
            </div>
          </div>
        </div>
        <div className="hidden md:flex ml-auto items-center gap-4 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => {
              const next = !gradingStrict;
              setGradingStrict(next);
              setAcceptAnyAnswerActive(!next);
              toast({
                title: next ? "Strict grading on" : "Testing grading on",
                description: next
                  ? "Wrong answers now require a retry."
                  : "Any selection or typed answer is accepted.",
              });
            }}
            className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
              gradingStrict
                ? "border-rose-500/50 bg-rose-950/40 text-rose-300"
                : "border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle between testing pass-through and strict grading"
          >
            {gradingStrict ? "Grading: strict" : "Grading: testing"}
          </button>
          <span className="flex items-center gap-1.5">
            <UserRound className="w-3.5 h-3.5" /> Cloud Engineer
          </span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Ticket queue */}
        <aside className="w-64 shrink-0 border-r border-slate-800 bg-[#161b22] flex flex-col overflow-hidden hidden md:flex">
          <div className="p-4 border-b border-slate-800">
            <p className="text-[10px] uppercase tracking-widest text-[#ff9900]">
              Ticket queue
            </p>
            <h2 className="font-semibold text-sm mt-1">{lessonId}</h2>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Resolve each ticket in order.
            </p>
            <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-[#ff9900]" animate={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">{completedCount}/{tasks.length} resolved</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {sidebar.map((group) => (
              <div key={group.category} className="mb-3">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{group.category}</p>
                {group.items.map((item) => {
                  const index = tasks.findIndex((t) => t.task_id === item.taskId);
                  const active = index === activeIndex;
                  const done = index <= highestCompleted;
                  const locked =
                    !TESTING_UNLOCK_ALL_WORKSPACES &&
                    index > highestCompleted + 1;
                  return (
                    <button
                      key={item.taskId}
                      type="button"
                      disabled={locked}
                      onClick={() => selectTask(index)}
                      className={`w-full text-left rounded-lg px-2.5 py-2 mb-0.5 border transition text-xs ${
                        active
                          ? "bg-[#232f3e] border-l-4 border-l-[#ff9900] border-slate-700"
                          : locked
                          ? "opacity-40 cursor-not-allowed border-transparent"
                          : "border-transparent hover:bg-slate-800/80"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {locked ? (
                          <Lock className="w-3 h-3 mt-0.5 text-slate-600 shrink-0" />
                        ) : done ? (
                          <Check className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className={`w-3 h-3 mt-0.5 shrink-0 ${item.priority === "P1" ? "text-rose-400" : "text-slate-500"}`} />
                        )}
                        <span className="leading-4 flex-1">{item.label}</span>
                        <span className={`text-[9px] font-bold px-1 rounded shrink-0 ${item.priority === "P1" ? "text-rose-300" : "text-slate-500"}`}>
                          {item.priority}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* Main AWS console workspace */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AwsConsoleChrome
            activeService={activeService}
            accountLabel={chromeAccountLabel}
          />

          <div className="flex-1 overflow-y-auto p-3 md:p-5 bg-[#0f1115]">
            <div className={`mx-auto ${isOpsConsole ? "max-w-5xl" : "max-w-3xl"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-mono text-[#ff9900] uppercase tracking-widest">
                    {task.task_id} · {task.type.replace("_", " ")}
                  </p>
                  <h2 className="text-xl md:text-2xl font-semibold mt-1 text-white">
                    {task.title || cleanText(task.question)?.slice(0, 80) || task.task_id}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs border border-slate-700 bg-[#161b22] rounded px-3 py-1 text-slate-400 capitalize">
                    {task.difficulty || "operational"}
                  </span>
                </div>
              </div>

              {/* Console content panel */}
              <section className={`rounded-lg border border-slate-700 overflow-hidden shadow-xl ${isOpsConsole ? "bg-transparent border-0 shadow-none" : "bg-[#161b22]"}`}>
                {!isOpsConsole && (
                <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 bg-[#232f3e]/50">
                  {task.type.includes("cost") || task.task_id.startsWith("C1.4") ? (
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  ) : task.type.includes("debug") || task.type.includes("config") ? (
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Terminal className="w-4 h-4 text-[#ff9900]" />
                  )}
                  <span className="text-sm font-medium text-slate-200">{activeService}</span>
                  <span className="ml-auto text-[10px] font-mono text-slate-500">ap-south-1</span>
                </div>
                )}

                <div className={isOpsConsole ? "" : "p-5 md:p-6"}>
                  {usesEnvHost ? (
                    <>
                      <WorkspaceEnvironmentHost
                        task={task}
                        review={
                          review === "correct"
                            ? "correct"
                            : review === "revealed"
                              ? "revealed"
                              : "idle"
                        }
                        state={envState}
                        onChange={(partial) =>
                          setEnvState((s) => ({ ...s, ...partial }))
                        }
                        opsUnlock={opsUnlock}
                        onOpsUnlock={setOpsUnlock}
                        onOpsActions={setIamActions}
                      />
                      {review === "revealed" && !isOpsConsole && (
                        <WorkspaceCompareReveal task={task} />
                      )}
                      {review === "revealed" && isOpsConsole && (
                        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                          <p className="text-[10px] uppercase tracking-widest text-emerald-400">
                            Resolve path
                          </p>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {cleanText(task.explanation) ||
                              "Account ID → IAM → Users → open the requester → Attach the managed policy named in the ticket."}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                  <p className="text-sm md:text-base leading-relaxed text-slate-200">{taskText(task)}</p>

                  {task.requirements?.length ? (
                    <div className="mt-5 rounded-lg border border-slate-700 bg-[#0f1115] p-4">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Acceptance criteria</p>
                      {task.requirements.map((req) => (
                        <div key={req} className="flex gap-2 text-sm text-slate-300 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-[#ff9900] shrink-0 mt-0.5" />
                          {cleanText(req)}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {task.broken_config ? (
                    <div className="mt-5 rounded-lg overflow-hidden border border-slate-700">
                      <div className="px-4 py-2 bg-[#232f3e] text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" /> Evidence · production snapshot
                      </div>
                      <pre className="p-4 text-xs leading-5 text-slate-300 whitespace-pre-wrap bg-[#0a0a0a] font-mono overflow-x-auto">
                        {cleanText(task.broken_config)}
                      </pre>
                    </div>
                  ) : null}

                  {interactiveMode === "region" && (
                    <RegionSelectorPanel
                      correctRegion={getCorrectRegion(task.task_id)}
                      onCorrect={() => {
                        const region = getCorrectRegion(task.task_id);
                        setAnswer(`Switch region to ${region} before deploy — users get low latency`);
                        toast({ title: "Region updated", description: `${region} selected in console.` });
                      }}
                      onWrong={() => {
                        if (acceptAnyUi) {
                          setAnswer(`Region applied (testing mode) — any selection accepted`);
                          toast({ title: "Region updated (testing)", description: "Any region accepted while testing UI." });
                          return;
                        }
                        toast({
                          variant: "destructive",
                          title: "Wrong region",
                          description: "Users are not in Virginia. Pick the region closest to them.",
                        });
                      }}
                    />
                  )}
                  {interactiveMode === "account" && (
                    <AccountMenuPanel
                      onComplete={() => {
                        setAnswer("Account menu top-right → Account ID 123456789012 → Billing Dashboard for monthly bill");
                        toast({ title: "Navigation complete", description: "Account ID and Billing path found." });
                      }}
                    />
                  )}
                  {interactiveMode === "cost" && (
                    <CostExplorerPanel
                      onInsight={(text) => {
                        setAnswer((prev) => (prev ? `${prev}\n${text}` : `Cost driver: ${text}. Investigate and remediate.`));
                      }}
                    />
                  )}

                  {/* Match task */}
                  {isMatchTask && task.left_items && task.right_items && (
                    <div className="mt-6 space-y-3">
                      {task.left_items.map((left, i) => (
                        <div
                          key={left}
                          className="grid gap-2 rounded-lg border border-slate-700 bg-[#0a0a0a] p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center"
                        >
                          <p className="text-sm text-slate-200">{left}</p>
                          <span className="hidden text-slate-500 sm:inline">→</span>
                          <select
                            disabled={review === "correct"}
                            value={matchPairs[i] ?? -1}
                            onChange={(e) => {
                              const next = [...matchPairs];
                              next[i] = Number(e.target.value);
                              setMatchPairs(next);
                            }}
                            className="rounded-md border border-slate-600 bg-[#161b22] px-3 py-2 text-sm text-slate-100"
                          >
                            <option value={-1}>Select match…</option>
                            {task.right_items!.map((right, ri) => (
                              <option key={right} value={ri}>
                                {right}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order task */}
                  {isOrderTask && task.items && (
                    <div className="mt-6 space-y-2">
                      <p className="text-xs text-slate-500">
                        Use ↑ ↓ to set the correct sequence
                      </p>
                      {orderItems.map((itemIdx, pos) => (
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
                              disabled={review === "correct" || pos === 0}
                              onClick={() => {
                                const next = [...orderItems];
                                [next[pos - 1], next[pos]] = [next[pos], next[pos - 1]];
                                setOrderItems(next);
                              }}
                              className="rounded border border-slate-600 px-2 py-1 text-xs disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={
                                review === "correct" || pos === orderItems.length - 1
                              }
                              onClick={() => {
                                const next = [...orderItems];
                                [next[pos + 1], next[pos]] = [next[pos], next[pos + 1]];
                                setOrderItems(next);
                              }}
                              className="rounded border border-slate-600 px-2 py-1 text-xs disabled:opacity-30"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quiz inside console context */}
                  {!isMatchTask && !isOrderTask && choices ? (
                    <div className="mt-6 space-y-2">
                      {choices.map((choice, index) => (
                        <button
                          key={choice}
                          type="button"
                          disabled={review === "correct"}
                          onClick={() => review === "idle" && setSelected(index)}
                          className={`w-full text-left rounded-lg border p-4 text-sm transition ${
                            selected === index
                              ? "border-[#ff9900] bg-[#ff9900]/10 text-white"
                              : "border-slate-700 hover:border-slate-500 text-slate-300"
                          }`}
                        >
                          <span className="mr-3 text-[#ff9900] font-mono font-bold">{String.fromCharCode(65 + index)}.</span>
                          {cleanText(choice)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6">
                      {task.type === "scenario_task" || task.ui_component === "ConsoleInteractionComponent" ? (
                        <div className="rounded-lg overflow-hidden border border-slate-700 mb-4">
                          <div className="px-3 py-2 bg-[#232f3e] flex items-center gap-2 border-b border-slate-700">
                            <div className="flex gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 ml-2">CloudShell · user@freshbite-prod</span>
                          </div>
                          <div className="bg-[#0a0a0a] p-4 font-mono text-sm">
                            <p className="text-slate-500 text-xs mb-3">
                              Authenticated as IAM Role: CloudEngineerAccess. Type your operational decision below.
                            </p>
                            <div className="flex gap-2 text-emerald-400">
                              <span>$</span>
                              <input
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                disabled={review === "correct"}
                                placeholder="Describe action: service, region, resource..."
                                className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-600"
                                onKeyDown={(e) => e.key === "Enter" && submit()}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <label className="text-[10px] uppercase tracking-widest text-slate-500">
                            Engineer decision record
                          </label>
                          <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            disabled={review === "correct"}
                            placeholder="Root cause · AWS action · verification step"
                            className="mt-2 min-h-32 w-full resize-y rounded-lg border border-slate-700 bg-[#0a0a0a] p-4 text-sm leading-6 text-slate-100 placeholder:text-slate-600 focus:border-[#ff9900] focus:outline-none font-mono"
                          />
                        </>
                      )}
                    </div>
                  )}
                    </>
                  )}

                  {review !== "idle" && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 rounded-lg p-4 text-sm border ${
                        review === "correct" || review === "revealed"
                          ? "bg-emerald-950/40 text-emerald-200 border-emerald-500/30"
                          : "bg-rose-950/40 text-rose-200 border-rose-500/30"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <p className="font-medium">
                          {review === "correct" || review === "revealed"
                            ? "Ren · Accepted"
                            : "Ren · Try again"}
                        </p>
                      </div>
                      <p className="leading-relaxed">{feedback}</p>
                      {review === "retry" &&
                        (task.if_wrong_route_to || task.source_lesson) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
                            onClick={() => {
                              const routeTo =
                                task.if_wrong_route_to ||
                                task.source_lesson ||
                                lessonId;
                              navigate(`/lesson/${routeTo}`);
                            }}
                          >
                            Review lesson{" "}
                            {task.if_wrong_route_to || task.source_lesson}
                          </Button>
                        )}
                    </motion.div>
                  )}

                  <div className="mt-5 flex flex-wrap justify-end gap-2">
                    <Button
                      onClick={submit}
                      disabled={
                        isSubmitting ||
                        review === "correct" ||
                        review === "revealed" ||
                        (isOpsConsole
                          ? !opsUnlock.unlocked
                          : usesEnvHost
                          ? isMultiCase
                            ? isMultiCaseMcq
                              ? envState.caseAnswers.some((v) => v < 0)
                              : envState.caseTexts.some(
                                  (t) =>
                                    (t || "").trim().length <
                                    (acceptAnyUi ? 1 : 8)
                                )
                            : isOrderTask
                              ? envState.orderItems.length === 0
                              : task.response_type === "text" ||
                                  !task.options?.length ||
                                  isSelfAssessed
                                ? envState.answer.trim().length <
                                  (acceptAnyUi ? 1 : 8)
                                : envState.selected === null
                          : isMatchTask
                            ? matchPairs.some((v) => v < 0)
                            : isOrderTask
                              ? orderItems.length === 0
                              : choices
                                ? selected === null
                                : answer.trim().length < (acceptAnyUi ? 1 : 8))
                      }
                      className="bg-[#ff9900] font-bold text-[#232f3e] hover:bg-[#ec7211]"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : review === "correct" || review === "revealed" ? (
                        "Resolved"
                      ) : isOpsConsole ? (
                        "Resolve ticket"
                      ) : (
                        "Submit decision"
                      )}
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
