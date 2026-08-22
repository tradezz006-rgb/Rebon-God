/**
 * Old Building Basics curriculum removed from production.
 * Historical copy: archived/cloud/building_basics/
 * Live Learn content: src/data/cloud/student_mode/
 */
export const BUILDING_BASICS_PACE = "building_basics" as const;
export const BUILDING_BASICS_FIRST_LESSON = "";
export const BUILDING_BASICS_SESSION_IDS: string[] = [];
export const BUILDING_BASICS_LESSON_ORDER: string[] = [];

export const buildingBasicsLessons: Array<{
  lesson_id: string;
  lesson_title: string;
  section_id: string;
  workspace_tasks?: unknown[];
  id?: string;
}> = [];

export const buildingBasicsSessions: Array<{
  session_id: string;
  session_name: string;
  session_description: string;
  pace: string;
  lessons: unknown[];
  total_lessons: number;
}> = [];

export function getBuildingBasicsLesson(_id: string) {
  return undefined;
}

export function getBuildingBasicsWorkspaceTasks(_lessonId: string) {
  return [];
}

export function getBuildingBasicsArc(_lessonId: string) {
  return undefined;
}

export default buildingBasicsSessions;
