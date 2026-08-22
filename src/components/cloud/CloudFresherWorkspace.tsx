/**
 * Cloud Workspace — flat ticket list (Student / Professional entry).
 * Story maps, pace phase cards, and session pickers removed.
 */
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cloud, Lock, CheckCircle2, Circle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fresherLessons } from "@/data/cloud/fresher";
import { buildingBasicsLessons } from "@/data/cloud/building_basics";
import {
  isFresherWorkspaceUnlocked,
  isWorkspaceComplete,
} from "@/data/cloud/studentModePace";
import { LessonWorkspaceChallenge } from "@/components/workspace/LessonWorkspaceChallenge";

type WorkspaceTask = {
  task_id: string;
  type: string;
  difficulty?: string;
  topic?: string;
  question?: string;
  scenario?: string;
  scenario_text?: string;
  broken_config?: string;
  title?: string;
};

type LessonCard = {
  lesson_id: string;
  lesson_title: string;
  section_id: string;
  workspace_tasks: WorkspaceTask[];
};

function taskPreview(task: WorkspaceTask): string {
  return (
    task.title ||
    task.question ||
    task.scenario_text ||
    task.scenario ||
    task.broken_config ||
    task.topic ||
    "Open workspace"
  );
}

export default function CloudFresherWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const allCards: LessonCard[] = useMemo(() => {
    const fresher: LessonCard[] = fresherLessons.map((l) => ({
      lesson_id: l.lesson_id,
      lesson_title: l.lesson_title,
      section_id: l.section_id,
      workspace_tasks: (l.workspace_tasks as WorkspaceTask[]) || [],
    }));
    const bb: LessonCard[] = buildingBasicsLessons
      .filter((l) => (l.workspace_tasks as WorkspaceTask[] | undefined)?.length)
      .map((l) => ({
        lesson_id: l.lesson_id,
        lesson_title: l.lesson_title,
        section_id: l.section_id,
        workspace_tasks: (l.workspace_tasks as WorkspaceTask[]) || [],
      }));
    return [...fresher, ...bb];
  }, []);

  useEffect(() => {
    const fromLesson = searchParams.get("lessonId");
    if (!fromLesson) return;
    if (isFresherWorkspaceUnlocked(fromLesson)) {
      setSelectedLessonId(fromLesson);
    }
  }, [searchParams]);

  const selectedLesson = allCards.find((l) => l.lesson_id === selectedLessonId);

  if (selectedTaskId && selectedLessonId) {
    return (
      <div className="fixed inset-0 z-50 bg-[#030712] overflow-y-auto">
        <LessonWorkspaceChallenge
          key={selectedLessonId}
          lessonId={selectedLessonId}
          initialTaskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      </div>
    );
  }

  if (selectedLessonId && selectedLesson) {
    const unlocked = isFresherWorkspaceUnlocked(selectedLesson.lesson_id);
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <button
            type="button"
            onClick={() => setSelectedLessonId(null)}
            className="mb-6 text-xs text-slate-500 hover:text-amber-400"
          >
            ← All workspaces
          </button>
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90">
            {selectedLesson.section_id} · {selectedLesson.lesson_id}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            {selectedLesson.lesson_title}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {selectedLesson.workspace_tasks.length} tickets
          </p>
          <div className="mt-8 space-y-3">
            {selectedLesson.workspace_tasks.map((task, i) => (
              <button
                key={task.task_id}
                type="button"
                disabled={!unlocked}
                onClick={() => {
                  if (!unlocked) return;
                  setSelectedTaskId(task.task_id);
                }}
                className="flex w-full items-start gap-3 rounded-xl border border-slate-700/80 bg-[#0f1115] px-4 py-3 text-left hover:border-amber-500/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="font-mono text-xs text-amber-400/80 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-200 line-clamp-2">
                  {taskPreview(task)}
                </span>
              </button>
            ))}
          </div>
          {!unlocked && (
            <p className="mt-4 text-xs text-slate-500">
              Locked — finish lesson {selectedLesson.lesson_id} in Learn first.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90">
              Work
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Cloud workspaces</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Open a lesson workspace and run its tickets. IAM console tickets
              unlock as full-screen AWS simulation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/learning")}
            className="text-xs text-slate-500 hover:text-amber-400"
          >
            Learn →
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allCards.map((lesson, index) => {
            const done = isWorkspaceComplete(lesson.lesson_id);
            const unlocked = isFresherWorkspaceUnlocked(lesson.lesson_id);
            const taskCount = lesson.workspace_tasks.length;

            return (
              <motion.button
                key={lesson.lesson_id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.4) }}
                disabled={!unlocked}
                onClick={() => {
                  if (!unlocked) return;
                  setSelectedLessonId(lesson.lesson_id);
                }}
                className={`rounded-xl border p-5 text-left transition ${
                  unlocked
                    ? "border-slate-700/80 bg-[#0f1115] hover:border-amber-500/40"
                    : "cursor-not-allowed border-slate-800 bg-slate-950/40 opacity-50"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15">
                    {unlocked ? (
                      <Cloud className="h-5 w-5 text-amber-400" />
                    ) : (
                      <Lock className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-600" />
                  )}
                </div>
                <p className="text-[10px] font-mono uppercase tracking-wide text-amber-400/90">
                  {lesson.section_id} · {lesson.lesson_id}
                </p>
                <h3 className="mt-1 font-semibold text-foreground">
                  {lesson.lesson_title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {unlocked
                    ? `${taskCount} tickets`
                    : `Locked — finish ${lesson.lesson_id} first`}
                </p>
                {unlocked && (
                  <span className="mt-4 inline-block text-xs font-medium text-amber-400">
                    Open workspace →
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
