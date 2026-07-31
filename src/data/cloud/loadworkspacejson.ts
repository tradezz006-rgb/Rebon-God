/**
 * Load sibling `{lessonId}_workspace.json` files (Building Basics+).
 * Fresher still embeds workspace_tasks inside lesson JSON.
 */
import type { CloudWorkspaceTask, WorkspaceArcMeta } from "@/types/cloudLesson";

type RawWorkspace = {
  lesson_id?: string;
  total_tasks?: number;
  tasks?: Record<string, unknown>[];
  /** Story-mode header (CS2 onward) */
  act_number?: number;
  act_title?: string;
  builds_layer?: string;
  arc_intro?: string;
  arc_outro?: string;
};

export interface WorkspacePack {
  total_tasks: number;
  tasks: CloudWorkspaceTask[];
  /** Present only for story-mode workspaces */
  arc?: WorkspaceArcMeta;
}

type GlobModule = { default: RawWorkspace } | RawWorkspace;

function unwrap(mod: GlobModule): RawWorkspace {
  return "default" in mod && mod.default ? mod.default : (mod as RawWorkspace);
}

function lessonIdFromWorkspacePath(path: string): string {
  const file = path.split("/").pop() || path.split("\\").pop() || "";
  return file.replace(/_workspace\.json$/i, "");
}

function stripOptionPrefix(opt: string): string {
  return String(opt).replace(/^[A-D]\)\s*/, "");
}

/** Story-mode default: 3 tries, then the answer is revealed and the task cracks the layer. */
export const DEFAULT_MAX_ATTEMPTS = 3;

export function normalizeWorkspaceTask(
  task: Record<string, unknown>,
  lessonId: string,
  index: number
): CloudWorkspaceTask {
  const id =
    (task.id as string) ||
    (task.task_id as string) ||
    `${lessonId}-T${index + 1}`;

  const options = Array.isArray(task.options)
    ? (task.options as string[]).map(stripOptionPrefix)
    : undefined;

  // Multi-case architecture_choice often ships as:
  //   cases: { case_1: "scenario…", case_2: "…" }
  //   correct_answers: { case_1: "expected…", … }
  let cases = task.cases as CloudWorkspaceTask["cases"];
  const rawAnswers = task.correct_answers;
  if (cases && !Array.isArray(cases) && typeof cases === "object") {
    const answerMap =
      rawAnswers && !Array.isArray(rawAnswers) && typeof rawAnswers === "object"
        ? (rawAnswers as Record<string, string>)
        : {};
    cases = Object.entries(cases as Record<string, string>).map(
      ([key, scenario]) => ({
        id: key,
        scenario,
        expected: answerMap[key],
      })
    );
  }

  return {
    ...(task as CloudWorkspaceTask),
    task_id: id,
    task_number:
      (task.task_number as number) || (task.sequence as number) || index + 1,
    max_attempts: (task.max_attempts as number) || DEFAULT_MAX_ATTEMPTS,
    type: (task.type as string) || "quiz",
    options,
    cases,
    correct_answers: Array.isArray(rawAnswers)
      ? (rawAnswers as number[])
      : undefined,
    source_lesson: (task.source_lesson as string) || lessonId,
    if_wrong_route_to:
      (task.if_wrong_route_to as string) ||
      (task.source_lesson as string) ||
      lessonId,
    ava_feedback_correct:
      (task.ren_correct as string) || (task.ava_feedback_correct as string),
    ava_feedback_wrong:
      (task.ren_wrong as string) || (task.ava_feedback_wrong as string),
  };
}

/**
 * Eager-load all `*_workspace.json` modules from a Vite glob map.
 * Keys in the returned map are lesson IDs (e.g. C2.1a).
 */
export function loadWorkspaceGlob(
  modules: Record<string, GlobModule>
): Record<string, WorkspacePack> {
  const byId: Record<string, WorkspacePack> = {};

  for (const [path, mod] of Object.entries(modules)) {
    if (!/_workspace\.json$/i.test(path)) continue;
    const lessonId = lessonIdFromWorkspacePath(path);
    if (!lessonId) continue;
    const raw = unwrap(mod);
    const tasks = (raw.tasks || []).map((t, i) =>
      normalizeWorkspaceTask(t, lessonId, i)
    );
    byId[lessonId] = {
      total_tasks: raw.total_tasks ?? tasks.length,
      tasks,
      arc:
        typeof raw.act_number === "number"
          ? {
              lesson_id: raw.lesson_id || lessonId,
              act_number: raw.act_number,
              act_title: raw.act_title || `Act ${raw.act_number}`,
              builds_layer: raw.builds_layer || "Unnamed Layer",
              arc_intro: raw.arc_intro,
              arc_outro: raw.arc_outro,
              total_tasks: raw.total_tasks ?? tasks.length,
            }
          : undefined,
    };
  }

  return byId;
}

export function getWorkspaceTasksForLesson(
  map: Record<string, { tasks: CloudWorkspaceTask[] }>,
  lessonId: string
): CloudWorkspaceTask[] {
  return map[lessonId]?.tasks ?? [];
}
