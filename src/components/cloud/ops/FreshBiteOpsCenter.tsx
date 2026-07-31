import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, CircleDot, Cloud,
  DollarSign, FileText, Loader2, Lock, Network, Play, Send, ShieldCheck,
  Terminal, UserRound, WalletCards, X
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
import { CloudArchitecturePanel } from "@/components/cloud/ops/CloudArchitecturePanel";
import {
  buildTicketSidebar,
  LESSON_MISSIONS,
  markLessonComplete,
  PHOENIX_COMPANY,
  SESSION_FINALE,
  type LessonMission,
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
import { isLessonMailRead } from "@/data/cloud/lessonMail";
import { StoryBuildRail } from "@/components/cloud/ops/StoryBuildRail";
import {
  auditFeedback,
  classifyConsequence,
  clearActRebuild,
  getLessonDecisions,
  markActNeedsRebuild,
  pickNodeForTask,
  recordLessonDecision,
} from "@/data/cloud/sessionLiveBoard";
import {
  beginCrackRepair,
  getAttemptsUsed,
  getCompletionBlock,
  getRepairPlan,
  getRetryableCrack,
  getStoryAct,
  getStorySessionForLesson,
  getUnresolvedTaskIds,
  isInvestigationComplete,
  isLessonCleared,
  isTaskUnresolved,
  markTaskUnresolved,
  maxAttemptsFor,
  notifyLessonCleared,
  registerWrongAttempt,
  resetAttempts,
  resolveCrackedTask,
  type AttemptOutcome,
  type RepairPlan,
  type StoryAct,
  type StorySession,
} from "@/data/cloud/storyMode";
import {
  CrackRepairModal,
  InvestigationCompleteScreen,
  StoryAttemptMeter,
  StoryRevealPanel,
} from "@/components/cloud/ops/StoryModeOverlays";
import { ActWorkSummaryModal } from "@/components/cloud/ops/ActWorkSummaryModal";
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
  /** Leave ops and show the session Mission board (after act seal) */
  onReturnToJourney?: () => void;
  initialTaskId?: string;
  onFresherTransitionReady?: () => void;
  /** Story-mode repair routing: jump to another act's workspace */
  onSwitchLesson?: (lessonId: string, taskId?: string) => void;
}

const cleanText = (text?: string) => (text ? text.replace(/\[cite:\s*\d+\]/g, "").trim() : "");
const taskText = (task: Task) =>
  cleanText(
    task.question ||
      (task as Task & { scenario_text?: string }).scenario_text ||
      task.scenario ||
      task.broken_config
  ) || "Investigate the assigned production issue and document your decision.";

const firstSentence = (text?: string) => {
  const clean = cleanText(text);
  if (!clean) return "";
  const end = clean.search(/[.!?।]\s/);
  return end > 0 ? clean.slice(0, end + 1) : clean;
};

/**
 * Soft audit ladder — never flash "wrong". Architecture updates; Ren nudges
 * toward re-reading evidence. Student audits the live board themselves.
 */
function hintForStage(
  task: Task,
  stage: "nudge" | "strong_hint",
  fallback: string
): string {
  if (stage === "nudge") {
    return (
      task.hints?.[0] ||
      "Decision logged. Watch Live Architecture — something on that path may need a second look."
    );
  }
  return (
    task.hints?.[1] ||
    cleanText(task.hint) ||
    firstSentence(task.explanation) ||
    fallback ||
    "One more attempt. Expand Live Architecture and audit the amber paths before you commit again."
  );
}

type MatchTask = Task & {
  left_items?: string[];
  right_items?: string[];
  correct_pairs?: number[][];
  items?: string[];
  correct_order?: number[];
};

/**
 * Wrong answers show Ren remediation + if_wrong_route_to. Story-mode acts add
 * the three-attempt ladder on top: nudge, stronger hint, then reveal + crack.
 * Grading can be flipped between testing pass-through and strict in the header.
 */

/** Story acts: one category = the act title (Fresher-style queue grouping). */
function buildStorySidebar(tasks: Task[], actTitle?: string) {
  const category = actTitle || "Investigation";
  return [
    {
      category,
      items: tasks.map((task, index) => {
        const raw = cleanText(task.question || task.scenario || task.topic);
        const label = `${index + 1}. ${
          raw.length > 52 ? `${raw.slice(0, 52)}…` : raw || task.task_id
        }`;
        const priority =
          task.difficulty === "hard"
            ? "P1"
            : task.difficulty === "medium"
              ? "P2"
              : "P3";
        return { taskId: task.task_id, label, priority };
      }),
    },
  ];
}

const SERVICE_FOR_TYPE: Record<string, string> = {
  quiz: "Knowledge check",
  scenario_task: "CloudShell",
  debug_task: "IAM · Config audit",
  config_audit: "Security Hub",
  cost_analysis: "Cost Explorer",
  architecture_choice: "Architecture decisions",
  match_task: "Concept mapping",
  order_task: "Workflow order",
};

export default function FreshBiteOpsCenter({
  lessonId,
  onClose,
  onReturnToJourney,
  initialTaskId,
  onFresherTransitionReady,
  onSwitchLesson,
}: Props) {
  const goToJourney = onReturnToJourney || onClose;
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

  const mission: LessonMission = LESSON_MISSIONS[lessonId] ?? {
    lessonId,
    title: `${lessonId} · Workspace tickets`,
    architectureLevel: 1,
    renIntro: `Lesson ${lessonId} tickets ready. Solve each problem carefully.`,
    missionBrief: "Complete all tickets for this lesson.",
    completionRen: "Tickets cleared. Concept locked.",
    completionHeadline: "Lesson workspace complete",
    tickets: {},
  };
  const isStoryLessonId = useMemo(() => Boolean(getStoryAct(lessonId)), [lessonId]);
  const storyActForSidebar = useMemo(() => getStoryAct(lessonId), [lessonId]);
  const sidebar = useMemo(
    () =>
      isStoryLessonId
        ? buildStorySidebar(tasks, storyActForSidebar?.actTitle)
        : buildTicketSidebar(tasks, lessonId),
    [isStoryLessonId, storyActForSidebar, tasks, lessonId]
  );


  const [activeIndex, setActiveIndex] = useState(0);
  const [highestCompleted, setHighestCompleted] = useState(-1);
  const [briefingOpen, setBriefingOpen] = useState(
    () =>
      progressGet(`phoenix_briefing_${lessonId}`) !== "seen" &&
      !isLessonMailRead(lessonId)
  );
  const [answer, setAnswer] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [review, setReview] = useState<
    "idle" | "correct" | "retry" | "revealed" | "unresolved"
  >("idle");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finaleOpen, setFinaleOpen] = useState(false);
  const [lessonFinaleOpen, setLessonFinaleOpen] = useState(false);

  /* ── story mode: acts, attempts, cracks ── */
  const storyAct = useMemo(() => getStoryAct(lessonId), [lessonId]);
  const storySession = useMemo(
    () => getStorySessionForLesson(lessonId),
    [lessonId]
  );
  const isStory = Boolean(storyAct);
  /** CS3–CS7: ship decisions → form board (no instant right/wrong). CS2 keeps ladder. */
  const auditMode = Boolean(
    isStory && storySession && storySession.sessionId !== "CS2"
  );
  const [buildVersion, setBuildVersion] = useState(0);
  const bumpBuild = useCallback(() => setBuildVersion((v) => v + 1), []);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<AttemptOutcome | null>(null);
  const [actCelebrationOpen, setActCelebrationOpen] = useState(false);
  const [investigationOpen, setInvestigationOpen] = useState(false);
  const [repairPlan, setRepairPlan] = useState<RepairPlan | null>(null);
  const [pendingRepair, setPendingRepair] = useState<RepairPlan | null>(null);
  const [gradingStrict, setGradingStrict] = useState(
    () => !isAcceptAnyAnswerActive()
  );
  const unresolvedIds = useMemo(
    () => (isStory ? getUnresolvedTaskIds(lessonId) : []),
    [isStory, lessonId, buildVersion]
  );
  /** A crack in the previous act blocks this one from being closed. */
  const blockingPlan = useMemo(
    () => (isStory ? getCompletionBlock(lessonId) : null),
    [isStory, lessonId, buildVersion]
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

  useEffect(() => {
    const saved = progressGet(storageKey);
    if (saved) {
      const idx = parseInt(saved, 10);
      setHighestCompleted(idx);
      setActiveIndex(Math.min(idx + 1, Math.max(tasks.length - 1, 0)));
      return;
    }
    // No pointer (new act, or a queue reset for a reinforce pass)
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
    setLastOutcome(null);
    setAttemptsUsed(
      current?.task_id ? getAttemptsUsed(lessonId, current.task_id) : 0
    );
  }, [activeIndex, tasks, lessonId]);

  /**
   * Returning to a cracked act after its foundation was reinforced:
   * drop the student straight onto the first unresolved task.
   */
  useEffect(() => {
    if (!isStory || initialTaskId) return;
    const plan = getRepairPlan(lessonId);
    if (!plan?.reinforceCleared) return;
    const index = tasks.findIndex((t) =>
      plan.unresolvedTaskIds.includes(t.task_id)
    );
    if (index < 0) return;
    setActiveIndex(index);
    toast({
      title: "Fresh attempt unlocked",
      description: `${plan.reinforceLessonId} is solid again — retry ${plan.unresolvedTaskIds.length} unresolved task(s).`,
    });
  }, [isStory, initialTaskId, lessonId, tasks]);

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
        task.type === "architecture_choice"));
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
  const completedTaskIds = useMemo(
    () => (highestCompleted >= 0 ? tasks.slice(0, highestCompleted + 1).map((t) => t.task_id) : []),
    [highestCompleted, tasks]
  );
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const lessonComplete = highestCompleted >= tasks.length - 1;
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

  /** Close the act — or refuse, if the previous act is still cracked. */
  const finishLesson = useCallback(() => {
    if (isStory) {
      const block = getCompletionBlock(lessonId);
      if (block) {
        setRepairPlan(block);
        bumpBuild();
        toast({
          variant: "destructive",
          title: "This act can't be closed yet",
          description: `${block.crackedLayer} is still cracked — reinforce ${block.reinforceLessonId} first.`,
        });
        return;
      }
      markLessonComplete(lessonId);
      notifyLessonCleared(lessonId);
      bumpBuild();
      // Reinforcing this act may have unlocked a retry on an earlier crack.
      setPendingRepair(
        storySession ? getRetryableCrack(storySession.sessionId, lessonId) : null
      );
      setActCelebrationOpen(true);
      return;
    }
    markLessonComplete(lessonId);
    if (lessonId === "C1B.5") {
      markPendingFresherTransition();
      onFresherTransitionReady?.();
    }
    setLessonFinaleOpen(true);
  }, [isStory, lessonId, bumpBuild, onFresherTransitionReady, storySession]);

  const goNext = useCallback(() => {
    if (activeIndex >= tasks.length - 1) {
      finishLesson();
      return;
    }
    setActiveIndex((v) => v + 1);
    toast({
      title: "Ticket resolved",
      description: "Next incident unlocked in your queue.",
    });
  }, [activeIndex, tasks.length, finishLesson]);

  /** Third strike: the answer was shown, the task stays unresolved, queue moves on. */
  const continueAfterUnresolved = useCallback(() => {
    if (activeIndex > highestCompleted) {
      setHighestCompleted(activeIndex);
      progressSet(storageKey, String(activeIndex));
    }
    goNext();
  }, [activeIndex, highestCompleted, storageKey, goNext]);

  /**
   * An act whose queue was already finished but that couldn't be closed while an
   * earlier layer was cracked: close it as soon as the student returns clean.
   */
  useEffect(() => {
    if (!isStory || !tasks.length) return;
    if (highestCompleted < tasks.length - 1) return;
    if (isLessonCleared(lessonId)) return;
    if (getUnresolvedTaskIds(lessonId).length) return;
    if (getCompletionBlock(lessonId)) return;
    finishLesson();
  }, [isStory, tasks.length, highestCompleted, lessonId, finishLesson]);

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
      if (isMatchTask) {
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

    const choiceLabel = (() => {
      if (isChoice && effectiveSelected != null && Array.isArray(choices)) {
        return String(choices[effectiveSelected] ?? "");
      }
      if (isOrderTask && effectiveOrder.length) {
        return `Order: ${effectiveOrder.join("→")}`;
      }
      if (isMatchTask) {
        return `Pairs: ${matchPairs.join(",")}`;
      }
      if (effectiveAnswer?.trim()) {
        return effectiveAnswer.trim().slice(0, 80);
      }
      return undefined;
    })();

    // CS3–CS7: company audit mode — ship the decision, form the board, no "wrong" flash.
    // CS2 keeps the three-attempt investigation ladder.
    if (auditMode && storyAct && storySession) {
      const severity = classifyConsequence(task, isCorrect);
      const nodeId = pickNodeForTask(
        storySession.sessionId,
        storyAct.actNumber,
        task.task_id
      );

      recordLessonDecision(lessonId, {
        taskId: task.task_id,
        selectedIndex: isChoice ? effectiveSelected : null,
        correct: isCorrect,
        optionLabel: choiceLabel,
        severity: severity ?? undefined,
        nodeId,
        at: Date.now(),
      });

      if (isCorrect) {
        if (isTaskUnresolved(lessonId, task.task_id)) {
          resolveCrackedTask(lessonId, task.task_id);
          toast({
            title: "Path restored",
            description: "Live Architecture updated — expand to inspect.",
          });
        } else {
          resetAttempts(lessonId, task.task_id);
        }
        // If no big mistakes remain, clear rebuild flag
        const stillBig = getLessonDecisions(lessonId).some(
          (d) => !d.correct && d.severity === "big"
        );
        if (!stillBig) clearActRebuild(lessonId);

        bumpBuild();
        setReview(treatAsReveal ? "revealed" : "correct");
        setFeedback(
          treatAsReveal
            ? cleanText(task.explanation) ||
                "Compare with Ren, then watch Live Architecture lock the path."
            : "Decision locked. Live Architecture updated — expand the board to inspect connections."
        );
      } else {
        const sev = severity || "small";
        if (sev === "medium" || sev === "big") {
          markTaskUnresolved(lessonId, task.task_id);
        }
        if (sev === "big") {
          markActNeedsRebuild(lessonId);
        }
        bumpBuild();
        // Soft ship — looks committed, not graded
        setReview("revealed");
        setFeedback(auditFeedback(sev));
      }

      if (activeIndex > highestCompleted) {
        setHighestCompleted(activeIndex);
        progressSet(storageKey, String(activeIndex));
      }

      window.setTimeout(() => {
        setIsSubmitting(false);
        goNext();
      }, 1000);
      return;
    }

    // Story mode (CS2): board audit owns the teaching — don't flash "wrong" copy.
    if (isStory && !isCorrect) hint = "";

    if (isStory) {
      recordLessonDecision(lessonId, {
        taskId: task.task_id,
        selectedIndex: isChoice ? effectiveSelected : null,
        correct: isCorrect,
        optionLabel: choiceLabel,
        at: Date.now(),
      });
    }

    if (!isCorrect) {
      if (isStory) {
        const outcome = registerWrongAttempt(
          lessonId,
          task.task_id,
          maxAttemptsFor(task)
        );
        setAttemptsUsed(outcome.attemptsUsed);
        setLastOutcome(outcome);
        bumpBuild();
        setReview(outcome.stage === "reveal" ? "unresolved" : "retry");
        setFeedback(
          outcome.stage === "reveal"
            ? "Three attempts logged. Ren left a model path on the record — this ticket stays cracked until you repair it. Audit Live Architecture to see what deformed."
            : hintForStage(task, outcome.stage, hint)
        );
      } else {
        setReview("retry");
        setFeedback(hint);
      }
      setIsSubmitting(false);
      return;
    }

    setReview(treatAsReveal ? "revealed" : "correct");
    setFeedback(
      acceptAny
        ? `[Testing] Accepted. ${cleanText(task.ava_feedback_correct) || cleanText(task.solution) || "Architecture updating."}`
        : hint ||
          cleanText(task.ava_feedback_correct) ||
          cleanText(task.solution) ||
          cleanText(task.explanation) ||
          "Decision locked in. Live Architecture updated — expand the board to inspect connections."
    );

    if (isStory) {
      if (isTaskUnresolved(lessonId, task.task_id)) {
        resolveCrackedTask(lessonId, task.task_id);
        toast({
          title: "Crack repaired",
          description: `${task.task_id} resolved on a fresh attempt.`,
        });
        if (
          storySession &&
          isInvestigationComplete(storySession.sessionId)
        ) {
          window.setTimeout(() => setInvestigationOpen(true), 1200);
        }
      } else {
        resetAttempts(lessonId, task.task_id);
      }
      bumpBuild();
    }

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

  const startBriefing = () => {
    progressSet(`phoenix_briefing_${lessonId}`, "seen");
    setBriefingOpen(false);
    speak(mission?.renIntro || PHOENIX_COMPANY.crisis);
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

  const activeService = SERVICE_FOR_TYPE[task.type] || "Operations";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f1115] text-slate-100 overflow-hidden">
      {/* Company header */}
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
            {(storySession?.company ?? "FreshBite").charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {storySession?.company ?? "FreshBite"} · Cloud Operations
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#ff9900]">
              {storySession ? storySession.ticket : "Project Phoenix"} ·{" "}
              {lessonId}
            </div>
          </div>
        </div>
        <div className="hidden md:flex ml-auto items-center gap-4 text-xs text-slate-400">
          {isStory && storySession && (
            <button
              type="button"
              onClick={() => {
                const next = !gradingStrict;
                setGradingStrict(next);
                setAcceptAnyAnswerActive(!next);
                toast({
                  title: next ? "Strict grading on" : "Testing grading on",
                  description: next
                    ? "Wrong answers now burn attempts and can crack a layer."
                    : "Any selection or typed answer is accepted.",
                });
              }}
              className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
                gradingStrict
                  ? "border-rose-500/50 bg-rose-950/40 text-rose-300"
                  : "border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
              title="Toggle between testing pass-through and real three-attempt grading"
            >
              {gradingStrict ? "Grading: strict" : "Grading: testing"}
            </button>
          )}
          <span className="flex items-center gap-1.5">
            <CircleDot className="w-3 h-3 text-rose-400 animate-pulse" /> P1 migration sprint
          </span>
          <span className="flex items-center gap-1.5">
            <UserRound className="w-3.5 h-3.5" /> Cloud Engineer
          </span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Jira-style ticket queue */}
        <aside className="w-64 shrink-0 border-r border-slate-800 bg-[#161b22] flex flex-col overflow-hidden hidden md:flex">
          <div className="p-4 border-b border-slate-800">
            <p className="text-[10px] uppercase tracking-widest text-[#ff9900]">
              {storySession
                ? `${storySession.ticket} · Act ${storyAct?.actNumber}`
                : "Project Phoenix"}
            </p>
            <h2 className="font-semibold text-sm mt-1">
              {storyAct ? storyAct.actTitle : mission.title}
            </h2>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              {storyAct
                ? `Builds the ${storyAct.buildsLayer} · ${tasks.length} tickets, 3 attempts each`
                : mission.missionBrief}
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
                  const unresolved = unresolvedIds.includes(item.taskId);
                  const done = index <= highestCompleted && !unresolved;
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
                        ) : unresolved ? (
                          <AlertTriangle className="w-3 h-3 mt-0.5 text-amber-400 shrink-0" />
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
          <AwsConsoleChrome activeService={activeService} />

          <div className="flex-1 overflow-y-auto p-3 md:p-5 bg-[#0f1115]">
            <div className="max-w-3xl mx-auto">
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
                  {isStory && !auditMode && (
                    <StoryAttemptMeter
                      attemptsUsed={attemptsUsed}
                      maxAttempts={maxAttemptsFor(task)}
                    />
                  )}
                  <span className="text-xs border border-slate-700 bg-[#161b22] rounded px-3 py-1 text-slate-400 capitalize">
                    {task.difficulty || "operational"}
                  </span>
                </div>
              </div>

              {blockingPlan && (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-rose-500/40 bg-rose-950/30 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                  <p className="min-w-0 flex-1 text-xs leading-relaxed text-rose-200">
                    {blockingPlan.crackedLayer} ({blockingPlan.crackedLessonId})
                    is cracked. You can work these tickets, but this act
                    won&rsquo;t close until that crack is repaired.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-rose-500/40 text-rose-200 hover:bg-rose-500/10"
                    onClick={() => setRepairPlan(blockingPlan)}
                  >
                    Repair plan
                  </Button>
                </div>
              )}

              {isStory && storyAct && (
                <div className="mb-4 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                    Act {storyAct.actNumber} of {storySession?.acts.length} ·{" "}
                    {storyAct.actTitle} · builds the {storyAct.buildsLayer}
                  </p>
                </div>
              )}

              {/* Console content panel */}
              <section className="rounded-lg border border-slate-700 bg-[#161b22] overflow-hidden shadow-xl">
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

                <div className="p-5 md:p-6">
                  {usesEnvHost ? (
                    <>
                      <WorkspaceEnvironmentHost
                        task={task}
                        review={
                          review === "correct"
                            ? "correct"
                            : review === "revealed" || review === "unresolved"
                              ? "revealed"
                              : "idle"
                        }
                        state={envState}
                        onChange={(partial) =>
                          setEnvState((s) => ({ ...s, ...partial }))
                        }
                      />
                      {review === "revealed" && (
                        <WorkspaceCompareReveal task={task} />
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
                          : review === "unresolved"
                            ? "bg-amber-950/30 text-amber-100 border-amber-500/40"
                            : "bg-rose-950/40 text-rose-200 border-rose-500/30"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <p className="font-medium">
                          {review === "correct" || review === "revealed"
                            ? "Ren · Accepted"
                            : review === "unresolved"
                              ? "Ren · Left unresolved"
                              : `Ren · Remediation${
                                  lastOutcome
                                    ? ` (attempt ${lastOutcome.attemptsUsed}/${lastOutcome.maxAttempts})`
                                    : ""
                                }`}
                        </p>
                        {isStory && review === "retry" && lastOutcome && (
                          <StoryAttemptMeter
                            attemptsUsed={lastOutcome.attemptsUsed}
                            maxAttempts={lastOutcome.maxAttempts}
                          />
                        )}
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

                  {review === "unresolved" && <StoryRevealPanel task={task} />}

                  <div className="mt-5 flex flex-wrap justify-end gap-2">
                    {review === "unresolved" && (
                      <Button
                        onClick={continueAfterUnresolved}
                        className="bg-amber-400 font-bold text-[#232f3e] hover:bg-amber-300"
                      >
                        Log as unresolved &amp; continue
                      </Button>
                    )}
                    <Button
                      onClick={submit}
                      hidden={review === "unresolved"}
                      disabled={
                        isSubmitting ||
                        review === "correct" ||
                        review === "revealed" ||
                        review === "unresolved" ||
                        (usesEnvHost
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
                      className={`bg-[#ff9900] hover:bg-[#e88b00] text-[#232f3e] font-bold ${
                        review === "unresolved" ? "hidden" : ""
                      }`}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {review === "correct" || review === "revealed"
                        ? "Resolved"
                        : "Submit decision"}
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>

        {/* Live build / architecture panel — slightly wider for story audit */}
        <div className={`shrink-0 hidden lg:block ${isStory ? "w-[372px]" : "w-[280px]"}`}>
          {isStory ? (
            <StoryBuildRail
              lessonId={lessonId}
              tasksCompleted={completedCount}
              totalTasks={tasks.length}
              completedTaskIds={completedTaskIds}
              version={buildVersion}
            />
          ) : (
            <CloudArchitecturePanel
              lessonId={lessonId}
              tasksCompleted={completedCount}
              totalTasks={tasks.length}
              lessonComplete={lessonComplete}
              completedTaskIds={completedTaskIds}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {briefingOpen && (
          <BriefingModal
            mission={mission}
            storyAct={storyAct}
            storySession={storySession}
            onStart={startBriefing}
            onClose={onClose}
          />
        )}
        {lessonFinaleOpen && (
          <LessonFinaleModal
            mission={mission}
            onContinue={() => {
              setLessonFinaleOpen(false);
              const allDone = ["C1.1", "C1.2", "C1.3", "C1.4", "C1.5"].every(
                (id) => progressGet(`phoenix_progress_${id}`) === "true"
              );
              if (allDone) setFinaleOpen(true);
              else onClose();
            }}
          />
        )}
        {finaleOpen && <SessionFinaleModal onClose={onClose} />}

        {actCelebrationOpen && storyAct && storySession && (
          <ActWorkSummaryModal
            key={`act-summary-${lessonId}`}
            lessonId={lessonId}
            tickets={tasks.map((t) => {
              const d = getLessonDecisions(lessonId).find(
                (x) => x.taskId === t.task_id
              );
              const raw = cleanText(t.question || t.scenario || t.topic || "");
              return {
                taskId: t.task_id,
                label:
                  raw.length > 90 ? `${raw.slice(0, 90)}…` : raw || t.task_id,
                ok: d ? d.correct : true,
              };
            })}
            onClose={() => {
              setActCelebrationOpen(false);
              setPendingRepair(null);
              // Stay on this lesson so they can review solved tickets
            }}
            onRepairNow={() => {
              const plan = getRepairPlan(lessonId);
              if (!plan) return;
              setActCelebrationOpen(false);
              setRepairPlan(plan);
            }}
            onInspectMission={
              isInvestigationComplete(storySession.sessionId)
                ? () => {
                    setActCelebrationOpen(false);
                    setInvestigationOpen(true);
                  }
                : undefined
            }
          />
        )}

        {repairPlan && (
          <CrackRepairModal
            plan={repairPlan}
            onLater={() => setRepairPlan(null)}
            onReinforce={() => {
              const plan = beginCrackRepair(repairPlan.crackedLessonId);
              setRepairPlan(null);
              bumpBuild();
              if (!plan) return;
              if (plan.selfReinforce) {
                setActiveIndex(0);
                toast({
                  title: `Re-clearing ${plan.crackedLessonId}`,
                  description: "Walk this act again from ticket 1.",
                });
                return;
              }
              onSwitchLesson?.(plan.reinforceLessonId);
              if (!onSwitchLesson) {
                toast({
                  title: `Reinforce ${plan.reinforceLessonId}`,
                  description:
                    "Open that act from the workspace board and clear it end to end.",
                });
                onClose();
              }
            }}
            onRetryCracked={() => {
              const plan = repairPlan;
              setRepairPlan(null);
              const target = plan.unresolvedTaskIds[0];
              if (plan.crackedLessonId !== lessonId) {
                onSwitchLesson?.(plan.crackedLessonId, target);
                if (!onSwitchLesson) onClose();
                return;
              }
              const index = tasks.findIndex((t) => t.task_id === target);
              if (index >= 0) setActiveIndex(index);
            }}
          />
        )}

        {investigationOpen && storySession && (
          <InvestigationCompleteScreen
            sessionId={storySession.sessionId}
            onClose={() => {
              setInvestigationOpen(false);
              goToJourney();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BriefingModal({
  mission,
  storyAct,
  storySession,
  onStart,
  onClose,
}: {
  mission: (typeof LESSON_MISSIONS)[string];
  storyAct?: StoryAct | null;
  storySession?: StorySession | null;
  onStart: () => void;
  onClose: () => void;
}) {
  if (storyAct && storySession) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] grid place-items-center bg-[#020711]/90 backdrop-blur-sm p-4"
      >
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-2xl overflow-hidden rounded-xl border border-amber-400/30 bg-[#161b22] shadow-2xl"
        >
          <div className="flex items-start justify-between border-b border-slate-700 p-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                {storySession.ticket} · Act {storyAct.actNumber} of{" "}
                {storySession.acts.length}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                {storyAct.actTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {storySession.company} · builds the {storyAct.buildsLayer}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-5 p-6 md:p-8">
            {storyAct.arcIntro && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="mb-2 font-mono text-xs uppercase text-amber-300">
                  Reminder · you already read Ravi&rsquo;s mail
                </p>
                <p className="whitespace-pre-wrap text-[15px] leading-[1.7] text-slate-300">
                  {storyAct.arcIntro}
                </p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Your role", "Cloud Engineer"],
                ["Tickets", `${storyAct.totalTasks || "—"} in this act`],
                ["Attempts", "3 per ticket"],
              ].map(([l, v]) => (
                <div
                  key={l}
                  className="rounded-lg border border-slate-700 bg-[#0f1115] p-3"
                >
                  <p className="text-[10px] uppercase text-slate-500">{l}</p>
                  <p className="mt-1 text-sm text-slate-200">{v}</p>
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Miss a ticket three times and the answer is shown, but the ticket
              is logged unresolved — that cracks this layer of the build until
              the act before it is reinforced.
            </p>
            <Button
              onClick={onStart}
              className="h-12 w-full bg-amber-400 font-bold text-[#232f3e] hover:bg-amber-300"
            >
              <Play className="mr-2 h-4 w-4" /> Start Act {storyAct.actNumber}
            </Button>
          </div>
        </motion.section>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] grid place-items-center bg-[#020711]/90 backdrop-blur-sm p-4"
    >
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-2xl rounded-xl border border-[#ff9900]/30 bg-[#161b22] shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-700 flex justify-between items-start">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#ff9900]">P1 · Incident briefing</p>
            <h2 className="text-2xl font-bold mt-2 text-white">Project Phoenix</h2>
            <p className="text-sm text-slate-400 mt-1">{PHOENIX_COMPANY.tagline}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 md:p-8 space-y-5">
          <div className="bg-rose-950/30 border border-rose-500/20 rounded-lg p-4">
            <p className="text-xs font-mono text-rose-400 uppercase mb-2">Crisis</p>
            <p className="text-slate-300 leading-relaxed">{PHOENIX_COMPANY.crisis}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[["Your role", "Cloud Engineer"], ["Sprint", "30-day migration"], ["Region", "ap-south-1"]].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-slate-700 bg-[#0f1115] p-3">
                <p className="text-[10px] uppercase text-slate-500">{l}</p>
                <p className="text-sm mt-1 text-slate-200">{v}</p>
              </div>
            ))}
          </div>
          <blockquote className="border-l-2 border-[#ff9900] pl-4 text-slate-300 italic leading-relaxed">
            Ren: &ldquo;{mission.renIntro}&rdquo;
          </blockquote>
          <p className="text-sm text-slate-400">{mission.missionBrief}</p>
          <Button onClick={onStart} className="w-full h-12 bg-[#ff9900] hover:bg-[#e88b00] text-[#232f3e] font-bold">
            <Play className="w-4 h-4 mr-2" /> Enter operations center
          </Button>
        </div>
      </motion.section>
    </motion.div>
  );
}

function LessonFinaleModal({
  mission,
  onContinue,
}: {
  mission: (typeof LESSON_MISSIONS)[string];
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] grid place-items-center bg-[#020711]/90 p-4"
    >
      <section className="max-w-lg w-full rounded-xl border border-emerald-500/40 bg-[#161b22] p-8 text-center shadow-2xl">
        <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
        <p className="mt-4 text-[10px] uppercase tracking-widest text-emerald-400">Layer complete</p>
        <h2 className="mt-2 text-2xl font-bold text-white">{mission.completionHeadline}</h2>
        <p className="mt-4 text-slate-300 leading-relaxed italic">
          Ren: &ldquo;{mission.completionRen}&rdquo;
        </p>
        <p className="mt-3 text-sm text-slate-500">Architecture diagram updated. This is real work — not homework.</p>
        <Button onClick={onContinue} className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-[#232f3e] font-bold">
          Continue
        </Button>
      </section>
    </motion.div>
  );
}

function SessionFinaleModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[80] grid place-items-center bg-[#020711]/95 p-4"
    >
      <section className="max-w-xl w-full rounded-xl border border-emerald-500/50 bg-[#161b22] p-8 text-center shadow-2xl">
        <Cloud className="w-16 h-16 text-[#ff9900] mx-auto" />
        <p className="mt-4 text-[10px] uppercase tracking-widest text-emerald-400">Session 1 complete</p>
        <h2 className="mt-2 text-3xl font-bold text-white">{SESSION_FINALE.headline}</h2>
        <p className="mt-4 text-slate-300 leading-relaxed italic">Ren: &ldquo;{SESSION_FINALE.renSpeaks}&rdquo;</p>
        <Button onClick={onClose} className="mt-8 w-full bg-[#ff9900] hover:bg-[#e88b00] text-[#232f3e] font-bold h-12">
          Return to mission board
        </Button>
      </section>
    </motion.div>
  );
}
