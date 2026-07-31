/**
 * Fresher pace workspace task sanitizer.
 * Allowed: quiz | cost_analysis | scenario_task | order_task
 * Forbidden: debug_task | config_audit | architecture_choice (remapped at load)
 */

import type { FresherWorkspaceTaskType } from "@/types/cloudLesson";

const FRESHER_ALLOWED = new Set<FresherWorkspaceTaskType>([
  "quiz",
  "cost_analysis",
  "scenario_task",
  "order_task",
]);

export interface WorkspaceTaskLike {
  task_id: string;
  type: string;
  scenario?: string;
  broken_config?: string;
  question?: string;
  [key: string]: unknown;
}

/** Remap forbidden fresher types to scenario_task while preserving content */
export function sanitizeFresherTask<T extends WorkspaceTaskLike>(task: T): T {
  const t = task.type;
  if (FRESHER_ALLOWED.has(t as FresherWorkspaceTaskType)) {
    return task;
  }

  if (t === "debug_task" || t === "config_audit" || t === "architecture_choice") {
    return {
      ...task,
      type: "scenario_task",
      scenario:
        task.scenario ||
        task.broken_config ||
        task.question ||
        "Review this situation and explain what you would do first.",
      ui_component: "ConsoleInteractionComponent",
    };
  }

  // Unknown type — safest fallback for fresher
  return {
    ...task,
    type: "scenario_task",
    scenario: task.scenario || task.question || "Describe your approach.",
  };
}

export function filterTasksForFresherPace<T extends WorkspaceTaskLike>(
  tasks: T[]
): T[] {
  return tasks.map(sanitizeFresherTask);
}

export function isFresherTaskType(type: string): type is FresherWorkspaceTaskType {
  return FRESHER_ALLOWED.has(type as FresherWorkspaceTaskType);
}
