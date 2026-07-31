import type {
  PlacementAnswer,
  PlacementGateId,
  PlacementItem,
  PlacementOutcome,
  PlacementResult,
  PlacementTopic,
  PlacementVerificationRecord,
  TopicBreakdown,
} from "./types";
import { GATE_DEFINITIONS, PLACEHOLDER_SERVE_COUNT } from "./gateConfig";
import { BUILDING_BASICS_ENTRY_POOL } from "./placeholders/buildingBasicsEntry";
import { WORKING_LEVEL_ENTRY_POOL } from "./placeholders/workingLevelEntry";
import { DEEP_CRAFT_ENTRY_POOL } from "./placeholders/deepCraftEntry";
import { progressGet, progressSet, TESTING_ACCEPT_ANY_ANSWER } from "../ephemeralProgress";

const POOLS: Record<PlacementGateId, PlacementItem[]> = {
  building_basics_entry: BUILDING_BASICS_ENTRY_POOL,
  working_level_entry: WORKING_LEVEL_ENTRY_POOL,
  deep_craft_entry: DEEP_CRAFT_ENTRY_POOL,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Serve a randomized subset from the gate pool (placeholder count for E2E). */
export function serveGateItems(gateId: PlacementGateId): PlacementItem[] {
  const pool = POOLS[gateId];
  const n = Math.min(PLACEHOLDER_SERVE_COUNT[gateId], pool.length);
  return shuffle(pool).slice(0, n);
}

export function scoreItem(
  item: PlacementItem,
  answer: PlacementAnswer
): { correct: boolean; partial: number } {
  // Testing mode: any committed answer passes so the flow can be walked end-to-end.
  if (TESTING_ACCEPT_ANY_ANSWER) {
    const hasAnswer =
      typeof answer.selectedIndex === "number" ||
      (Array.isArray(answer.selectedOrder) && answer.selectedOrder.length > 0) ||
      Boolean(answer.defenseText?.trim()) ||
      Boolean((answer as { freeText?: string }).freeText?.trim());
    if (hasAnswer) return { correct: true, partial: 1 };
  }

  if (item.type === "order_task" && item.correct_order && answer.selectedOrder) {
    const ok =
      item.correct_order.length === answer.selectedOrder.length &&
      item.correct_order.every((v, i) => answer.selectedOrder![i] === v);
    return { correct: ok, partial: ok ? 1 : 0 };
  }

  if (
    typeof item.correct_index === "number" &&
    typeof answer.selectedIndex === "number"
  ) {
    const ok = answer.selectedIndex === item.correct_index;
    // Defense text for Deep Craft Section C — soft keyword check
    if (ok && item.expected_defense_contains?.length && answer.defenseText) {
      const text = answer.defenseText.toLowerCase();
      const hits = item.expected_defense_contains.filter((k) =>
        text.includes(k.toLowerCase())
      ).length;
      const ratio = hits / item.expected_defense_contains.length;
      const threshold = item.review_flag_threshold ?? 0.5;
      if (ratio < threshold) {
        return { correct: false, partial: ratio };
      }
      return { correct: true, partial: Math.max(ratio, 0.85) };
    }
    return { correct: ok, partial: ok ? 1 : 0 };
  }

  return { correct: false, partial: 0 };
}

export function scorePlacement(
  gateId: PlacementGateId,
  items: PlacementItem[],
  answers: PlacementAnswer[]
): PlacementResult {
  const def = GATE_DEFINITIONS[gateId];
  let earned = 0;
  let possible = 0;
  const byTopic = new Map<PlacementTopic, { earned: number; possible: number }>();

  const scored = items.map((item) => {
    const a = answers.find((x) => x.itemId === item.id) || { itemId: item.id };
    const { correct, partial } = scoreItem(item, a);
    const w = item.weight || 1;
    possible += w;
    earned += correct ? w : partial * w * 0.4;
    const t = byTopic.get(item.tests_topic) || { earned: 0, possible: 0 };
    t.possible += w;
    t.earned += correct ? w : partial * w * 0.4;
    byTopic.set(item.tests_topic, t);
    return { ...a, correct, partialScore: partial };
  });

  const percent = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  // Testing mode: force a clean pass once every item has an answer.
  const forcedPass =
    TESTING_ACCEPT_ANY_ANSWER &&
    items.every((item) => {
      const a = answers.find((x) => x.itemId === item.id);
      return (
        a &&
        (typeof a.selectedIndex === "number" ||
          (Array.isArray(a.selectedOrder) && a.selectedOrder.length > 0) ||
          Boolean(a.defenseText?.trim()))
      );
    });
  const effectivePercent = forcedPass ? 100 : percent;
  const topicBreakdown: TopicBreakdown[] = [...byTopic.entries()].map(
    ([topic, v]) => ({
      topic,
      earned: Math.round(v.earned * 10) / 10,
      possible: v.possible,
      percent: v.possible ? Math.round((v.earned / v.possible) * 100) : 0,
    })
  );

  const weakTopics = topicBreakdown
    .filter((t) => t.percent < 75)
    .map((t) => t.topic);
  const strongTopics = topicBreakdown
    .filter((t) => t.percent >= 75)
    .map((t) => t.topic);

  let outcome: PlacementOutcome = "fail";
  if (effectivePercent >= def.passPercent) {
    outcome = "pass";
  } else if (
    def.borderlineMinPercent != null &&
    effectivePercent >= def.borderlineMinPercent
  ) {
    outcome = "borderline_review";
  } else if (
    gateId === "working_level_entry" &&
    effectivePercent >= 65 &&
    effectivePercent < def.passPercent &&
    weakTopics.length > 0 &&
    weakTopics.length < topicBreakdown.length
  ) {
    outcome = "shortened_path";
  }

  const unlockedPace =
    outcome === "pass"
      ? def.targetPace
      : outcome === "shortened_path"
        ? "building_basics"
        : outcome === "borderline_review"
          ? "fresher"
          : def.failRoutesTo === "fresher"
            ? "fresher"
            : def.failRoutesTo === "building_basics"
              ? "building_basics"
              : def.failRoutesTo === "building_basics_entry"
                ? "building_basics"
                : def.failRoutesTo === "working_level_entry"
                  ? "working_level"
                  : "fresher";

  // Fail routing: don't unlock the fail-route pace — land them to attempt/learn there
  const landingPace =
    outcome === "pass"
      ? def.targetPace
      : outcome === "shortened_path"
        ? "building_basics"
        : outcome === "borderline_review"
          ? def.targetPace // held pending review — don't unlock yet
          : def.failRoutesTo === "working_level_entry"
            ? "building_basics" // offer Gate 2 next; don't unlock WL
            : def.failRoutesTo === "building_basics_entry"
              ? "fresher"
              : def.failRoutesTo === "building_basics"
                ? "building_basics"
                : "fresher";

  const completedAt = new Date().toISOString();
  let verificationRecord: PlacementVerificationRecord | undefined;
  if (outcome === "pass") {
    verificationRecord = {
      gateId,
      targetPace: def.targetPace,
      score: Math.round(earned * 10) / 10,
      maxScore: possible,
      percent: effectivePercent,
      passedAt: completedAt,
      topicBreakdown,
    };
  }

  // silence unused
  void scored;
  void unlockedPace;

  return {
    gateId,
    score: Math.round(earned * 10) / 10,
    maxScore: possible,
    percent: effectivePercent,
    outcome,
    topicBreakdown,
    weakTopics,
    strongTopics,
    unlockedPace: landingPace,
    completedAt,
    verificationRecord,
  };
}

const STORAGE_VERIFICATIONS = "rebon_placement_verifications";
const STORAGE_RETRY = "rebon_placement_retry_";

export function saveVerificationRecord(
  record: PlacementVerificationRecord
): void {
  const existing = getVerificationRecords();
  // One public pass record per gate — keep latest pass
  const next = [
    ...existing.filter((r) => r.gateId !== record.gateId),
    record,
  ];
  progressSet(STORAGE_VERIFICATIONS, JSON.stringify(next));
}

export function getVerificationRecords(): PlacementVerificationRecord[] {
  try {
    const raw = progressGet(STORAGE_VERIFICATIONS);
    return raw ? (JSON.parse(raw) as PlacementVerificationRecord[]) : [];
  } catch {
    return [];
  }
}

export function markGateRetryCooldown(gateId: PlacementGateId, days: number): void {
  if (days <= 0) return;
  const until = Date.now() + days * 24 * 60 * 60 * 1000;
  progressSet(`${STORAGE_RETRY}${gateId}`, String(until));
}

export function getGateRetryBlockedUntil(gateId: PlacementGateId): number | null {
  const raw = progressGet(`${STORAGE_RETRY}${gateId}`);
  if (!raw) return null;
  const until = parseInt(raw, 10);
  if (Number.isNaN(until) || until <= Date.now()) return null;
  return until;
}

export function applyPlacementResult(result: PlacementResult): void {
  if (result.outcome === "pass" && result.verificationRecord) {
    saveVerificationRecord(result.verificationRecord);
  }
  if (result.outcome === "fail" || result.outcome === "borderline_review") {
    const days = GATE_DEFINITIONS[result.gateId].retryWaitDays;
    markGateRetryCooldown(result.gateId, days);
  }
}
