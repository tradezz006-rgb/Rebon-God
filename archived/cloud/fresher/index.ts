/**
 * STUB — Fresher curriculum archived at:
 *   archived/cloud/fresher/
 * Student Mode replaces this path for Learn.
 * Empty exports keep legacy imports compiling until Professional Mode lands.
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
