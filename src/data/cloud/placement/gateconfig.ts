import type { StudentPaceId } from "@/types/cloudLesson";
import type { GateDefinition, PlacementGateId } from "./types";

export const GATE_DEFINITIONS: Record<PlacementGateId, GateDefinition> = {
  building_basics_entry: {
    id: "building_basics_entry",
    targetPace: "building_basics",
    title: "Test into Building Basics",
    subtitle: "18 questions · 25 min · Knowledge check",
    itemCount: 18,
    durationMinutes: 25,
    passPercent: 75,
    retryWaitDays: 0,
    failRoutesTo: "fresher",
  },
  working_level_entry: {
    id: "working_level_entry",
    targetPace: "working_level",
    title: "Test into Working Level",
    subtitle: "22 tasks · 55 min · Hands-on proof required",
    itemCount: 22,
    durationMinutes: 55,
    passPercent: 80,
    retryWaitDays: 0,
    failRoutesTo: "building_basics_entry",
  },
  deep_craft_entry: {
    id: "deep_craft_entry",
    targetPace: "deep_craft",
    title: "Test into Deep Craft",
    subtitle: "16 tasks · 90 min · Senior judgment required",
    itemCount: 16,
    durationMinutes: 90,
    passPercent: 85,
    borderlineMinPercent: 70,
    retryWaitDays: 14,
    highestTrust: true,
    failRoutesTo: "working_level_entry",
  },
};

/**
 * Which gate a phase card launches. Fresher has no gate — it is the
 * always-open default entry.
 */
export const GATE_FOR_PACE: Record<StudentPaceId, PlacementGateId | null> = {
  fresher: null,
  building_basics: "building_basics_entry",
  working_level: "working_level_entry",
  deep_craft: "deep_craft_entry",
  professional: null,
};

/** Placeholder mode serves fewer items so the flow can be tested E2E. */
export const PLACEHOLDER_SERVE_COUNT: Record<PlacementGateId, number> = {
  building_basics_entry: 5,
  working_level_entry: 5,
  deep_craft_entry: 5,
};

/** Scale timer for placeholder runs (keeps UX feel without 90-min waits). */
export const PLACEHOLDER_DURATION_MINUTES: Record<PlacementGateId, number> = {
  building_basics_entry: 8,
  working_level_entry: 12,
  deep_craft_entry: 15,
};

export const TOPIC_LABELS: Record<string, string> = {
  fundamentals: "Cloud fundamentals",
  iam: "IAM",
  networking: "Networking",
  compute: "Compute",
  storage: "Storage",
  monitoring: "Monitoring",
  cross_cutting: "Cross-cutting",
};
