/**
 * Load lesson JSON from flat pace folders.
 * Filenames = lesson IDs (C1.1.json). Empty `{}` shells hydrate from curriculumPlan.
 */
import type { StudentPaceId } from "@/types/cloudLesson";
import {
  CLOUD_LESSON_PLAN,
  type LessonPlanEntry,
} from "./curriculumPlan";

type RawLesson = Record<string, unknown>;
type GlobModule = { default: RawLesson } | RawLesson;

function unwrap(mod: GlobModule): RawLesson {
  return "default" in mod && mod.default ? mod.default : (mod as RawLesson);
}

function lessonIdFromPath(path: string): string {
  const file = path.split("/").pop() || path.split("\\").pop() || "";
  return file.replace(/\.json$/i, "");
}

const planById = Object.fromEntries(
  CLOUD_LESSON_PLAN.map((e) => [e.lesson_id, e])
) as Record<string, LessonPlanEntry>;

export function hydrateLesson(
  lessonId: string,
  raw: RawLesson,
  pace: StudentPaceId
) {
  const plan = planById[lessonId];
  const isEmpty = !raw || Object.keys(raw).length === 0;

  return {
    lesson_id: lessonId,
    id: lessonId,
    lesson_title: (raw.lesson_title as string) || plan?.lesson_title || lessonId,
    section_id: (raw.section_id as string) || plan?.section_id || "",
    section_name: (raw.section_name as string) || plan?.section_name || "",
    pace,
    mode: "student" as const,
    domain: "cloud" as const,
    language: "tanglish" as const,
    status: (isEmpty ? "scaffold" : "live") as "scaffold" | "live",
    duration_minutes:
      (raw.duration_minutes as number) || plan?.duration_minutes || 20,
    prerequisites: (raw.prerequisites as string) || plan?.prerequisites || "",
    student_will_learn: isEmpty
      ? ["Content pending — empty JSON shell."]
      : (raw.student_will_learn as string[] | undefined),
    ava_lesson_intro: (raw.ava_lesson_intro as object) || {
      ava_speaks: "",
      board: {
        type: "write_title",
        lines: [plan?.lesson_title || lessonId],
      },
    },
    blocks: (raw.blocks as unknown[]) || [],
    lesson_summary: raw.lesson_summary ?? null,
    workspace_metadata: (raw.workspace_metadata as object) || null,
    workspace_tasks: (raw.workspace_tasks as unknown[]) || [],
  };
}

export function loadGlobLessons(
  modules: Record<string, GlobModule>,
  pace: StudentPaceId
) {
  const byId: Record<string, ReturnType<typeof hydrateLesson>> = {};
  for (const [path, mod] of Object.entries(modules)) {
    // Sibling practice sets live as `{id}_workspace.json` — never hydrate as lessons.
    if (/_workspace\.json$/i.test(path)) continue;
    const id = lessonIdFromPath(path);
    if (!id || id.endsWith("_workspace")) continue;
    byId[id] = hydrateLesson(id, unwrap(mod), pace);
  }
  return byId;
}
