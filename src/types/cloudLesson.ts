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
  | "order_task"
  | "ops_console";

export type CloudWorkspaceTaskType =
  | FresherWorkspaceTaskType
  | BuildingBasicsWorkspaceTaskType;

export type OpsRequestKind =
  | "attach_policy"
  | "reset_access_key"
  | "add_role"
  | "add_to_group"
  | "custom_policy"
  | "sts_update";

export interface OpsTicketMeta {
  from: string;
  subject: string;
  body: string;
  request_kind: OpsRequestKind;
  priority?: "P1" | "P2" | "P3";
}

export interface AccountDirectoryEntry {
  account_id: string;
  name: string;
  environment: string;
}

export interface AccountGateMeta {
  expected_account_id: string;
  /** Hint shown after failed attempts — never the answer itself on first try */
  hint?: string;
  account_directory: AccountDirectoryEntry[];
}

export interface IamSimUser {
  user_name: string;
  user_id?: string;
  arn?: string;
  groups?: string[];
  attached_policies?: string[];
  access_keys?: number;
  console_access?: boolean;
  create_date?: string;
}

export interface IamSimState {
  users: IamSimUser[];
  groups?: { name: string; policies?: string[] }[];
  roles?: { name: string; policies?: string[] }[];
  /** Managed policy names available to attach */
  available_policies?: string[];
}

export interface OpsSuccessCriteria {
  /** Console action types that must appear in the action log */
  required_actions: string[];
  /** Optional: specific user that must be targeted */
  target_user?: string;
  /** Optional: policy that must be attached */
  target_policy?: string;
}

export interface WorkspaceArcMeta {
  lesson_id: string;
  act_number: number;
  act_title: string;
  builds_layer: string;
  arc_intro?: string;
  arc_outro?: string;
  total_tasks: number;
}

export interface CloudWorkspaceTask {
  task_id: string;
  task_number?: number;
  id?: string;
  sequence?: number;
  type: string;
  environment?: string;
  difficulty?: string;
  max_attempts?: number;
  source_lesson?: string;
  if_wrong_route_to?: string;
  title?: string;
  question?: string;
  scenario?: string;
  topic?: string;
  options?: string[];
  correct_index?: number;
  correct_order?: number[];
  correct_answers?: number[];
  items?: string[];
  left_items?: string[];
  right_items?: string[];
  correct_pairs?: number[][];
  cases?: Array<{
    id: string;
    scenario: string;
    expected?: string;
    options?: string[];
  }>;
  response_type?: string;
  broken_config?: string;
  what_to_find?: string[];
  correct_fix?: string;
  diagnosis?: string;
  fix?: string;
  error_shown?: string;
  explanation?: string;
  hints?: string[];
  expected_answer_contains?: string[];
  acceptance_keywords?: string[];
  ren_correct?: string;
  ren_wrong?: string;
  ava_feedback_correct?: string;
  ava_feedback_wrong?: string;
  /** Ops console protocol (CS2+) */
  ticket?: OpsTicketMeta;
  account_gate?: AccountGateMeta;
  iam_state?: IamSimState;
  success_criteria?: OpsSuccessCriteria;
  [key: string]: unknown;
}

export interface CloudLessonMeta {
  lesson_id: string;
  lesson_title: string;
  section_id: string;
  section_name?: string;
  pace?: StudentPaceId;
  workspace_tasks?: Array<Record<string, unknown>>;
}
