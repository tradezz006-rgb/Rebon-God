export type {
  PlacementGateId,
  PlacementItem,
  PlacementAnswer,
  PlacementResult,
  PlacementOutcome,
  PlacementVerificationRecord,
  TopicBreakdown,
  PlacementTopic,
} from "./types";

export {
  GATE_DEFINITIONS,
  GATE_FOR_PACE,
  PLACEHOLDER_SERVE_COUNT,
  PLACEHOLDER_DURATION_MINUTES,
  TOPIC_LABELS,
} from "./gateConfig";

export {
  serveGateItems,
  scorePlacement,
  applyPlacementResult,
  getVerificationRecords,
  getGateRetryBlockedUntil,
} from "./scoring";
