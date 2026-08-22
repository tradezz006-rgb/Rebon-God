/**
 * Old Fresher curriculum removed from production.
 * Historical copy: archived/cloud/fresher/
 * Live Learn content: src/data/cloud/student_mode/
 */
export const fresherLessons: Array<Record<string, unknown>> = [];

export const fresherWorkspaceTasks = {
  pace: "fresher" as const,
  domain: "cloud",
  lessons: {} as Record<string, { workspace_tasks: Record<string, unknown>[] }>,
};

export const fresherWorkspaceGuides: Record<
  string,
  { hint_1?: string; hint_2?: string; detailed_explanation?: string }
> = {};

export function getFresherWorkspaceTasks(_lessonId: string) {
  return [];
}

export function countFresherWorkspaceTasks(): number {
  return 0;
}

export function getFresherLesson(_id: string) {
  return undefined;
}
