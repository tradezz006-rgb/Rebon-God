/**
 * Student Mode progress — local unlock / workspace completion / readiness.
 */
import { progressGet, progressSet } from "@/data/cloud/ephemeralProgress";
import type { StudentLanguage } from "@/types/studentMode";

const LANG_KEY = "rebon_student_language";
const DAY_DONE_PREFIX = "rebon_student_day_ws_";
const ITEM_DONE_PREFIX = "rebon_student_item_";
const READINESS_PASS = "rebon_student_readiness_pass";
const PRO_UNLOCK = "rebon_professional_unlocked";

export function getStudentLanguage(): StudentLanguage {
  const v = progressGet(LANG_KEY);
  return v === "tanglish" ? "tanglish" : "english";
}

export function setStudentLanguage(lang: StudentLanguage) {
  progressSet(LANG_KEY, lang);
}

export function isDayWorkspaceComplete(day: number): boolean {
  return progressGet(`${DAY_DONE_PREFIX}${day}`) === "1";
}

export function markDayWorkspaceComplete(day: number) {
  progressSet(`${DAY_DONE_PREFIX}${day}`, "1");
}

export function getCompletedItemIds(day: number): string[] {
  const raw = progressGet(`${ITEM_DONE_PREFIX}${day}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function markItemComplete(day: number, itemId: string) {
  const next = Array.from(new Set([...getCompletedItemIds(day), itemId]));
  progressSet(`${ITEM_DONE_PREFIX}${day}`, JSON.stringify(next));
}

/** Day 1 unlocked; day N unlocks when day N-1 workspace is complete. */
export function isDayUnlocked(day: number): boolean {
  if (day <= 1) return true;
  return isDayWorkspaceComplete(day - 1);
}

export function isReadinessPassed(): boolean {
  return progressGet(READINESS_PASS) === "1";
}

export function markReadinessPassed() {
  progressSet(READINESS_PASS, "1");
  progressSet(PRO_UNLOCK, "1");
}

export function isProfessionalUnlocked(): boolean {
  return progressGet(PRO_UNLOCK) === "1" || isReadinessPassed();
}

/** Readiness available after Day 5 workspace complete. */
export function isReadinessAvailable(): boolean {
  return isDayWorkspaceComplete(5);
}
