/**
 * Beta overrides disabled — CS1 workspace tickets now live in lesson JSON.
 * Keep this file so older imports continue to resolve.
 */
export type CloudBetaTask = {
  task_id: string;
  type: string;
  difficulty: "easy" | "medium" | "hard" | "fresher";
  title?: string;
  question?: string;
  scenario?: string;
  broken_config?: string;
  requirements?: string[];
  options?: string[];
  correct_index?: number;
  solution?: string;
};

/** No overrides — always use lesson JSON / fallback tasks */
export const CLOUD_BETA_TASK_OVERRIDES: Record<string, CloudBetaTask[]> = {};

export function getCloudBetaTasks<T>(lessonId: string, fallback: T[]): T[] {
  const override = CLOUD_BETA_TASK_OVERRIDES[lessonId];
  return (override as T[] | undefined) || fallback;
}
