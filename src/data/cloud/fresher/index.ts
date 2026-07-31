import c11 from "./tanglish/cs1/C1.1.json";
import c12 from "./tanglish/cs1/C1.2.json";
import c13 from "./tanglish/cs1/C1.3.json";
import c14 from "./tanglish/cs1/C1.4.json";
import c15 from "./tanglish/cs1/C1.5.json";
import c1b1 from "./tanglish/cs1b/C1B.1.json";
import c1b2 from "./tanglish/cs1b/C1B.2.json";
import c1b3 from "./tanglish/cs1b/C1B.3.json";
import c1b4 from "./tanglish/cs1b/C1B.4.json";
import c1b5 from "./tanglish/cs1b/C1B.5.json";

/** Fresher Tanglish lesson JSON — English stubs live under ./english/ for Nemotron fill-in. */
export const fresherLessons = [
  c11,
  c12,
  c13,
  c14,
  c15,
  c1b1,
  c1b2,
  c1b3,
  c1b4,
  c1b5,
];

/** Workspace tasks bundle derived from the lesson JSON (MedGo bridging scenarios). */
export const fresherWorkspaceTasks = {
  pace: "fresher",
  domain: "cloud",
  lessons: Object.fromEntries(
    fresherLessons.map((l) => [
      (l as { lesson_id: string }).lesson_id,
      {
        workspace_tasks:
          ((l as Record<string, unknown>).workspace_tasks as Record<
            string,
            unknown
          >[]) ?? [],
      },
    ])
  ) as Record<string, { workspace_tasks: Record<string, unknown>[] }>,
};

/** Per-task hint guides (feedback now lives inside each task's JSON). */
export const fresherWorkspaceGuides: Record<
  string,
  { hint_1?: string; hint_2?: string; detailed_explanation?: string }
> = {};

export function getFresherWorkspaceTasks(lessonId: string) {
  return fresherWorkspaceTasks.lessons[lessonId]?.workspace_tasks ?? [];
}

export function countFresherWorkspaceTasks(): number {
  return Object.values(fresherWorkspaceTasks.lessons).reduce(
    (n, lesson) => n + (lesson.workspace_tasks?.length ?? 0),
    0
  );
}
