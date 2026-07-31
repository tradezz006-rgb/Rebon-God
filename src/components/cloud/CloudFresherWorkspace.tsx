/**
 * Cloud Workspace — Fresher Phase: Core Workspaces (CS1 + CS1B)
 * Source of truth: each lesson JSON's workspace_tasks
 */
import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  Cloud,
  Lock,
  Layers,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fresherLessons } from "@/data/cloud/fresher";
import { buildingBasicsLessons } from "@/data/cloud/building_basics";
import {
  PACE_META,
  LEARNING_PHASE_ORDER,
  getStoredPace,
  isPaceUnlocked,
  isFresherWorkspaceUnlocked,
  isWorkspaceComplete,
  isFresherTransitionUnlocked,
  isPendingFresherTransition,
} from "@/data/cloud/studentModePace";
import {
  getLayerStatus,
  getStoryAct,
  getUnresolvedTaskIds,
} from "@/data/cloud/storyMode";
import type { StudentPaceId } from "@/types/cloudLesson";
import { LessonWorkspaceChallenge } from "@/components/workspace/LessonWorkspaceChallenge";
import { JourneyMap } from "@/components/cloud/JourneyMap";
import BuildingBasicsMasterMap from "@/components/cloud/BuildingBasicsMasterMap";
import {
  LessonMailBadge,
  LessonMailHost,
} from "@/components/cloud/LessonMailModal";
import {
  canWriteLessonMailReply,
  getLessonMailReply,
  isLessonMailRead,
} from "@/data/cloud/lessonMail";
import type { LessonMailKind } from "@/data/cloud/lessonMail";
import {
  getSessionProgress,
  sessionHasShippedWorkspace,
  sessionIdFromLessonId,
  sessionsForPhase,
  type CloudSessionId,
} from "@/data/cloud/sessionCatalog";

type WorkspaceTask = {
  task_id: string;
  type: string;
  difficulty?: string;
  topic?: string;
  question?: string;
  scenario?: string;
  scenario_text?: string;
  broken_config?: string;
  options?: string[];
};

type LessonCard = {
  lesson_id: string;
  lesson_title: string;
  section_id: string;
  workspace_id?: string;
  workspace_tasks: WorkspaceTask[];
};

const PHASES: {
  id: StudentPaceId;
  label: string;
  blurb: string;
}[] = LEARNING_PHASE_ORDER.map((id) => ({
  id,
  label: PACE_META[id].name,
  blurb: PACE_META[id].tagline,
}));

function taskPreview(task: WorkspaceTask): string {
  return (
    task.question ||
    task.scenario_text ||
    task.scenario ||
    task.broken_config ||
    task.topic ||
    "Complete this ticket"
  );
}

export default function CloudFresherWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentPace = getStoredPace();
  const [phaseMenuOpen, setPhaseMenuOpen] = useState(false);
  const [activePhase, setActivePhase] = useState<StudentPaceId>(() => {
    const pace = getStoredPace();
    return pace === "professional" ? "fresher" : pace;
  });
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  /** Bumps when leaving a workspace so Journey Map re-reads progress immediately */
  const [journeyRefresh, setJourneyRefresh] = useState(0);
  /** Phase → session → tickets. Null = session picker. */
  const [selectedSessionId, setSelectedSessionId] =
    useState<CloudSessionId | null>(null);
  const [mailLessonId, setMailLessonId] = useState<string | null>(null);
  const [mailKind, setMailKind] = useState<LessonMailKind>("briefing");
  const [mailTick, setMailTick] = useState(0);

  useEffect(() => {
    const fromLesson = searchParams.get("lessonId");
    if (!fromLesson) return;
    if (isFresherWorkspaceUnlocked(fromLesson)) {
      if (fromLesson.startsWith("C2.") || /^C[3-7]/.test(fromLesson)) {
        setActivePhase("building_basics");
      } else {
        setActivePhase("fresher");
      }
      const sid = sessionIdFromLessonId(fromLesson);
      if (sid) setSelectedSessionId(sid);
      setSelectedLessonId(fromLesson);
    }
  }, [searchParams]);

  const fresherCards: LessonCard[] = useMemo(
    () =>
      fresherLessons.map((l) => ({
        lesson_id: l.lesson_id,
        lesson_title: l.lesson_title,
        section_id: l.section_id,
        workspace_id: (l as { workspace_metadata?: { workspace_id?: string } })
          .workspace_metadata?.workspace_id,
        workspace_tasks: (l.workspace_tasks as WorkspaceTask[]) || [],
      })),
    []
  );

  const bbCards: LessonCard[] = useMemo(
    () =>
      buildingBasicsLessons
        .filter(
          (l) => (l.workspace_tasks as WorkspaceTask[] | undefined)?.length
        )
        .map((l) => ({
          lesson_id: l.lesson_id,
          lesson_title: l.lesson_title,
          section_id: l.section_id,
          workspace_id:
            (l as { workspace_metadata?: { workspace_id?: string } })
              .workspace_metadata?.workspace_id || `WS_${l.lesson_id}`,
          workspace_tasks: (l.workspace_tasks as WorkspaceTask[]) || [],
        })),
    []
  );

  const cs1Cards = fresherCards.filter((l) => l.section_id === "CS1");
  const cs1bCards = fresherCards.filter((l) => l.section_id === "CS1B");
  const sessionCards = (
    selectedSessionId === "CS1"
      ? cs1Cards
      : selectedSessionId === "CS1B"
        ? cs1bCards
        : bbCards.filter((l) => l.section_id === selectedSessionId)
  ) as LessonCard[];

  const phaseSessions = sessionsForPhase(activePhase);

  const selectedLesson =
    fresherCards.find((l) => l.lesson_id === selectedLessonId) ||
    bbCards.find((l) => l.lesson_id === selectedLessonId);
  const transitionReady =
    isFresherTransitionUnlocked() || isPendingFresherTransition();

  const firstTaskIdOf = (lessonId: string) =>
    (fresherCards.find((l) => l.lesson_id === lessonId) ||
      bbCards.find((l) => l.lesson_id === lessonId))?.workspace_tasks?.[0]
      ?.task_id;

  if (selectedTaskId && selectedLessonId) {
    return (
      <div className="fixed inset-0 z-50 bg-[#030712] overflow-y-auto">
        <LessonWorkspaceChallenge
          key={selectedLessonId}
          lessonId={selectedLessonId}
          initialTaskId={selectedTaskId}
          onClose={() => {
            setSelectedTaskId(null);
            setJourneyRefresh((n) => n + 1);
          }}
          onReturnToJourney={() => {
            setSelectedTaskId(null);
            setSelectedLessonId(null);
            setJourneyRefresh((n) => n + 1);
          }}
          onSwitchLesson={(nextLessonId, taskId) => {
            setSelectedLessonId(nextLessonId);
            setSelectedTaskId(taskId ?? firstTaskIdOf(nextLessonId) ?? null);
            setJourneyRefresh((n) => n + 1);
          }}
        />
      </div>
    );
  }

  const renderLessonGrid = (cards: LessonCard[], sectionLabel: string) => (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700/60 bg-[#161b22]/40 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
          {sectionLabel}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Read Ravi&rsquo;s mail on each lesson before opening tickets. After you
          clear every ticket, reply with what you fixed.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((lesson, index) => {
          void mailTick;
          const done = isWorkspaceComplete(lesson.lesson_id);
          const unlocked = isFresherWorkspaceUnlocked(lesson.lesson_id);
          const taskCount = lesson.workspace_tasks.length;
          const wsLabel =
            lesson.workspace_id || `WS_${lesson.lesson_id}`;
          const act = getStoryAct(lesson.lesson_id);
          const layer = act ? getLayerStatus(lesson.lesson_id) : null;
          const unresolvedCount = act
            ? getUnresolvedTaskIds(lesson.lesson_id).length
            : 0;
          const mailRead = isLessonMailRead(lesson.lesson_id);
          const replyReady = canWriteLessonMailReply(lesson.lesson_id);
          const replyDone = Boolean(getLessonMailReply(lesson.lesson_id));

          const openTickets = () => {
            if (!unlocked) return;
            if (!mailRead) {
              setMailKind("briefing");
              setMailLessonId(lesson.lesson_id);
              return;
            }
            setSelectedLessonId(lesson.lesson_id);
          };

          return (
            <motion.div
              key={lesson.lesson_id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl border p-5 text-left transition ${
                unlocked
                  ? "border-slate-700/80 bg-[#0f1115] hover:border-amber-500/40"
                  : "cursor-not-allowed border-slate-800 bg-slate-950/40 opacity-50"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15">
                    {unlocked ? (
                      <Cloud className="h-5 w-5 text-amber-400" />
                    ) : (
                      <Lock className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  {unlocked && (
                    <LessonMailBadge
                      unread={!mailRead}
                      replyReady={replyReady}
                      replyDone={replyDone}
                      onClick={() => {
                        setMailKind(
                          replyReady && mailRead ? "reply" : "briefing"
                        );
                        setMailLessonId(lesson.lesson_id);
                      }}
                    />
                  )}
                </div>
                {layer === "cracked" ? (
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                ) : done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-600" />
                )}
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wide text-amber-400/90">
                {act ? `Act ${act.actNumber} · ${wsLabel}` : wsLabel}
              </p>
              <h3 className="mt-1 font-semibold text-foreground">
                {lesson.lesson_title}
              </h3>
              {act && (
                <p className="mt-1.5 text-xs text-slate-500">
                  {act.actTitle} → builds the {act.buildsLayer}
                </p>
              )}
              {unlocked && !mailRead && (
                <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-100">
                  New mail from Ravi — open the envelope and read the situation
                  before tickets unlock.
                </p>
              )}
              {unlocked && mailRead && replyReady && !replyDone && (
                <p className="mt-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-[11px] text-sky-100">
                  Tickets cleared — reply to Ravi&rsquo;s mail with what you fixed.
                </p>
              )}
              {layer === "cracked" && (
                <p className="mt-2 rounded border border-rose-500/40 bg-rose-950/30 px-2 py-1 text-[11px] text-rose-200">
                  Cracked · {unresolvedCount} unresolved — reinforce the previous
                  act to repair
                </p>
              )}
              {(layer === "clean" || layer === "repaired") && (
                <p className="mt-2 text-[11px] text-amber-300/90">
                  {layer === "clean"
                    ? "Layer sealed · clean pass"
                    : "Layer sealed · repaired"}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {unlocked
                  ? `${taskCount} workspace tickets · after ${lesson.lesson_id}`
                  : `Locked — finish lesson ${lesson.lesson_id} first`}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">{lesson.section_id}</span>
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={openTickets}
                  className={`text-xs font-medium ${
                    unlocked
                      ? mailRead
                        ? "text-amber-400 hover:text-amber-300"
                        : "text-slate-400 hover:text-amber-300"
                      : "cursor-not-allowed text-slate-600"
                  }`}
                >
                  {!unlocked
                    ? "Locked"
                    : !mailRead
                      ? "Read mail first →"
                      : "Open tickets →"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <LessonMailHost
        open={Boolean(mailLessonId)}
        lessonId={mailLessonId}
        kind={mailKind}
        onClose={() => {
          setMailLessonId(null);
          setMailTick((n) => n + 1);
        }}
        onBriefingRead={() => {
          setMailTick((n) => n + 1);
          if (mailLessonId) setSelectedLessonId(mailLessonId);
        }}
        onReplySaved={() => setMailTick((n) => n + 1)}
      />
      <div className="fixed left-4 top-28 z-40 md:left-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => setPhaseMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-[#161b22]/95 px-3 py-2.5 text-sm font-semibold text-amber-200 shadow-lg backdrop-blur hover:border-amber-400/70"
          >
            <Layers className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Phase</span>
            <span className="text-foreground">
              {PACE_META[activePhase].name}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition ${phaseMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {phaseMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                className="absolute left-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-slate-700 bg-[#0f1115] shadow-2xl"
              >
                <div className="border-b border-slate-800 px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500">
                  Cloud learning phases
                </div>
                <ul className="p-1.5">
                  {PHASES.map((phase) => {
                    const unlocked = isPaceUnlocked(phase.id, studentPace);
                    const active = activePhase === phase.id;
                    return (
                      <li key={phase.id}>
                        <button
                          type="button"
                          disabled={!unlocked}
                          onClick={() => {
                            if (!unlocked) return;
                            setActivePhase(phase.id);
                            setPhaseMenuOpen(false);
                            setSelectedLessonId(null);
                            setSelectedSessionId(null);
                          }}
                          className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                            active
                              ? "bg-amber-500/15 text-amber-100"
                              : unlocked
                                ? "hover:bg-slate-800/80 text-slate-200"
                                : "cursor-not-allowed opacity-45 text-slate-500"
                          }`}
                        >
                          {unlocked ? (
                            <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                          ) : (
                            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                          )}
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">
                              {phase.label}
                            </span>
                            <span className="block text-xs text-slate-400">
                              {phase.blurb}
                            </span>
                            {!unlocked && (
                              <span className="mt-1 block text-[10px] uppercase tracking-wide text-slate-500">
                                Coming later — content locked
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mb-6 px-4 pt-2 text-center md:px-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-200">
          <Cloud className="h-4 w-4" />
          Cloud Workspace · {PACE_META[activePhase].name}
        </div>
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
          {activePhase === "building_basics"
            ? "Building Basics: Core Workspaces"
            : activePhase === "fresher"
              ? "Fresher Phase: Core Workspaces"
              : `${PACE_META[activePhase].name} Workspaces`}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          {selectedSessionId
            ? activePhase === "building_basics"
              ? "This mission has its own Mission board. Clear tickets here — sealing it lights that layer on the master Journey Map."
              : "This session has its own Journey Map. Finish tickets here — other sessions keep their own finished maps."
            : activePhase === "building_basics"
              ? "One FoodQuick story across CS2–CS7. The master Journey Map above stays dark until each mission restores its layer — scroll down for mission cards."
              : activePhase === "fresher"
                ? "Pick a session. Each one has a separate Journey Map and its own workspace tickets."
                : "Linear flow: finish the lesson → unlock its workspace → clear tickets → unlock the next lesson."}
        </p>
      </div>

      {activePhase !== "fresher" && activePhase !== "building_basics" ? (
        <div className="mx-auto max-w-lg rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center px-4">
          <Lock className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          <p className="font-medium text-foreground">
            {PACE_META[activePhase].name} is locked
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Placement verification + content for this phase still shipping.
          </p>
        </div>
      ) : selectedLesson ? (
        <div className="space-y-5 px-4 md:px-8">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedLessonId(null);
              setJourneyRefresh((n) => n + 1);
            }}
            className="gap-2"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
            Back to {selectedSessionId || "session"} tickets
          </Button>

          <div className="rounded-xl border border-slate-700/80 bg-[#161b22]/60 p-5">
            <p className="text-[10px] uppercase tracking-widest text-amber-400">
              {selectedLesson.workspace_id || `WS_${selectedLesson.lesson_id}`}{" "}
              · {selectedLesson.section_id}
            </p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">
              {selectedLesson.lesson_title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedLesson.workspace_tasks.length} workspace tickets
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {selectedLesson.workspace_tasks.map((task, index) => (
              <motion.button
                key={task.task_id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => setSelectedTaskId(task.task_id)}
                className="rounded-xl border border-slate-700/80 bg-[#0f1115] p-5 text-left transition hover:border-amber-500/50 hover:bg-slate-900/80"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge className="bg-cyan-500/20 text-cyan-300">
                    {task.type.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-[10px] font-mono text-slate-500">
                    {task.task_id}
                  </span>
                </div>
                <h4 className="mb-2 font-semibold text-foreground">
                  Ticket {index + 1}
                  {task.topic ? ` · ${task.topic}` : ""}
                </h4>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {taskPreview(task)}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                  Open ticket <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      ) : !selectedSessionId ? (
        <div className="w-full space-y-8">
          {activePhase === "building_basics" && (
            <BuildingBasicsMasterMap
              refreshKey={journeyRefresh}
              onSelectSession={(id) => {
                if (!sessionHasShippedWorkspace(id)) return;
                setSelectedSessionId(id);
                setJourneyRefresh((n) => n + 1);
              }}
            />
          )}

          <div
            className={`mx-auto space-y-4 px-4 md:px-8 ${
              activePhase === "building_basics" ? "max-w-6xl" : "max-w-4xl"
            }`}
          >
            <p className="text-center text-[10px] uppercase tracking-[0.2em] text-slate-500">
              {activePhase === "building_basics"
                ? "Missions · FoodQuick transformation"
                : `Session selection · ${PACE_META[activePhase].name}`}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {phaseSessions.map((session, index) => {
                void journeyRefresh;
                const progress = getSessionProgress(session.id);
                const shipped = sessionHasShippedWorkspace(session.id);
                const locked = !shipped;
                return (
                  <motion.button
                    key={session.id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    disabled={locked}
                    onClick={() => {
                      if (locked) return;
                      setSelectedSessionId(session.id);
                      setJourneyRefresh((n) => n + 1);
                    }}
                    className={`rounded-xl border p-5 text-left transition ${
                      locked
                        ? "cursor-not-allowed border-slate-800 bg-slate-950/40 opacity-55"
                        : progress.status === "complete"
                          ? "border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400/60"
                          : progress.status === "in_progress"
                            ? "border-amber-500/40 bg-amber-950/15 hover:border-amber-400/60"
                            : "border-slate-700 bg-[#0f1115] hover:border-amber-500/50"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <Badge
                        className={
                          locked
                            ? "bg-slate-700/40 text-slate-400"
                            : progress.status === "complete"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : progress.status === "in_progress"
                                ? "bg-amber-500/20 text-amber-200"
                                : "bg-cyan-500/20 text-cyan-300"
                        }
                      >
                        {locked
                          ? "Coming soon"
                          : progress.status === "complete"
                            ? "Mission sealed"
                            : progress.status === "in_progress"
                              ? "In progress"
                              : "Ready"}
                      </Badge>
                      {locked ? (
                        <Lock className="h-4 w-4 text-slate-500" />
                      ) : progress.status === "complete" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-amber-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {session.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {session.blurb}
                    </p>
                    <p className="mt-3 font-mono text-xs text-slate-500">
                      {shipped
                        ? activePhase === "building_basics"
                          ? `${progress.ticketsDone}/${progress.ticketsTotal} tickets · lights the master map`
                          : `${progress.ticketsDone}/${progress.ticketsTotal} tickets · Mission board`
                        : activePhase === "building_basics"
                          ? "Mission + layer on the master map ship together"
                          : "Workspace + Mission board ship with this session"}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 px-4 md:px-8">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedSessionId(null);
              setJourneyRefresh((n) => n + 1);
            }}
            className="gap-2"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
            Back to session selection
          </Button>

          <JourneyMap
            sessionId={selectedSessionId}
            refreshKey={journeyRefresh}
          />

          {sessionCards.length ? (
            renderLessonGrid(
              sessionCards,
              `${selectedSessionId} · workspace tickets`
            )
          ) : (
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center text-sm text-muted-foreground">
              Workspace tickets for {selectedSessionId} are not loaded yet.
            </div>
          )}

          {selectedSessionId === "CS1B" && (
            <div
              className={`rounded-xl border p-6 ${
                transitionReady
                  ? "border-emerald-500/40 bg-emerald-950/20"
                  : "border-slate-700 bg-slate-900/40"
              }`}
            >
              <div className="flex items-start gap-3">
                {transitionReady ? (
                  <Sparkles className="mx-0 h-6 w-6 shrink-0 text-emerald-400" />
                ) : (
                  <Lock className="h-6 w-6 shrink-0 text-slate-500" />
                )}
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    Phase milestone
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    Fresher Transition Assessment
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {transitionReady
                      ? "WS_C1B.5 cleared. Take the 10-question check to unlock CS2: Building Basics."
                      : "Locked until WS_C1B.5 is successfully completed."}
                  </p>
                  <Button
                    className="mt-4"
                    variant={transitionReady ? "default" : "outline"}
                    disabled={!transitionReady}
                    onClick={() => navigate("/learning")}
                  >
                    {transitionReady
                      ? "Go to Fresher Transition Assessment"
                      : "Locked · finish WS_C1B.5"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
