/**
 * Pace Placement Assessment — types
 * Gates that verify skip-ahead into Building Basics / Working Level / Deep Craft.
 */

export type PlacementGateId =
  | "building_basics_entry"
  | "working_level_entry"
  | "deep_craft_entry";

export type PlacementTopic =
  | "fundamentals"
  | "iam"
  | "networking"
  | "compute"
  | "storage"
  | "monitoring"
  | "cross_cutting";

export type PlacementItemType =
  | "quiz"
  | "scenario_task"
  | "order_task"
  | "cost_analysis"
  | "config_audit"
  | "debug_task"
  | "architecture_choice";

export interface PlacementSignal {
  source: "cloudwatch" | "cloudtrail" | "cost_explorer" | "user_reports";
  label: string;
  value: string;
  tone?: "ok" | "warn" | "bad";
}

export interface PlacementItem {
  id: string;
  gate: PlacementGateId;
  type: PlacementItemType;
  difficulty: "easy" | "medium" | "hard" | "architect";
  weight: number;
  tests_topic: PlacementTopic;
  question: string;
  scenario?: string;
  options?: string[];
  correct_index?: number;
  /** order_task */
  items?: string[];
  correct_order?: number[];
  /** config / debug surfaces */
  broken_config?: string;
  error_shown?: string;
  signals?: PlacementSignal[];
  /** Deep Craft Section C — Socratic defense */
  counter_argument?: string;
  response_type?: "choice" | "text";
  expected_defense_contains?: string[];
  review_flag_threshold?: number;
  explanation: string;
  section?: "A" | "B" | "C";
}

export interface GateDefinition {
  id: PlacementGateId;
  targetPace: "building_basics" | "working_level" | "deep_craft";
  title: string;
  subtitle: string;
  itemCount: number;
  durationMinutes: number;
  passPercent: number;
  /** Borderline band (Deep Craft) — under review instead of auto-fail */
  borderlineMinPercent?: number;
  retryWaitDays: number;
  highestTrust?: boolean;
  failRoutesTo: "fresher" | "building_basics" | PlacementGateId;
}

export interface PlacementAnswer {
  itemId: string;
  selectedIndex?: number;
  selectedOrder?: number[];
  textResponse?: string;
  defenseText?: string;
  /** scored after submit */
  correct?: boolean;
  partialScore?: number;
}

export interface TopicBreakdown {
  topic: PlacementTopic;
  earned: number;
  possible: number;
  percent: number;
}

export type PlacementOutcome =
  | "pass"
  | "fail"
  | "borderline_review"
  | "shortened_path";

export interface PlacementResult {
  gateId: PlacementGateId;
  score: number;
  maxScore: number;
  percent: number;
  outcome: PlacementOutcome;
  topicBreakdown: TopicBreakdown[];
  weakTopics: PlacementTopic[];
  strongTopics: PlacementTopic[];
  unlockedPace: "fresher" | "building_basics" | "working_level" | "deep_craft";
  completedAt: string;
  /** public profile record only written on pass */
  verificationRecord?: PlacementVerificationRecord;
}

export interface PlacementVerificationRecord {
  gateId: PlacementGateId;
  targetPace: string;
  score: number;
  maxScore: number;
  percent: number;
  passedAt: string;
  topicBreakdown: TopicBreakdown[];
}
