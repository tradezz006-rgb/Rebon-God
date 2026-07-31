/** Rebon Student Mode — cloud lesson & session schema */

export type StudentPaceId =
  | "fresher"
  | "building_basics"
  | "working_level"
  | "deep_craft"
  | "professional";

export type FresherWorkspaceTaskType =
  | "quiz"
  | "cost_analysis"
  | "scenario_task"
  | "order_task"
  | "match_task";

export type BuildingBasicsWorkspaceTaskType =
  | "config_audit"
  | "debug_task"
  | "scenario_task"
  | "architecture_choice"
  | "quiz"
  | "order_task";

export type CloudWorkspaceTaskType =
  | FresherWorkspaceTaskType
  | BuildingBasicsWorkspaceTaskType;

export interface CloudLessonMeta {
  lesson_id: string;
  lesson_title: string;
  section_id: string;
  section_name?: string;
  pace?: StudentPaceId;
  workspace_tasks?: Array<Record<string, unknown>>;
}
