/**
 * STUB — Building Basics archived at:
 *   archived/cloud/building_basics/
 * Student Mode replaces Learn path. Empty exports for legacy imports.
 */
export const BUILDING_BASICS_PACE = "building_basics" as const;
export const BUILDING_BASICS_FIRST_LESSON = "";
export const buildingBasicsLessons: Array<{
  lesson_id: string;
  lesson_title: string;
  section_id: string;
  workspace_tasks?: unknown[];
}> = [];

export function getBuildingBasicsWorkspaceTasks(_lessonId: string) {
  return [];
}

export function getBuildingBasicsArc(_lessonId: string) {
  return undefined;
}
