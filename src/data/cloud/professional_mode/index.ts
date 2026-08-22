import curriculum from "./_curriculum.json";
import workspaceCatalog from "./_workspace_catalog.json";
import pm01English from "./lessons/PM-0.1_english.json";
import pm01Tanglish from "./lessons/PM-0.1_tanglish.json";
import { normalizeProfessionalLesson } from "./normalizeLesson";
import type {
  ProfessionalCurriculum,
  ProfessionalLanguage,
  ProfessionalLessonFile,
} from "@/types/professionalMode";

/**
 * Runtime lesson registry keyed by `${LESSON_ID}:${language}`.
 * Also aliases bare lesson id → english for /lesson/PM-0.1 routes.
 */
const lessonsByKey: Record<string, ProfessionalLessonFile> = {};

function register(raw: Record<string, unknown>) {
  if (raw.status === "stub") return;
  const hasSegments =
    (Array.isArray(raw.segments) && raw.segments.length > 0) ||
    (Array.isArray(raw.console_segments) && raw.console_segments.length > 0);
  if (!hasSegments) return;
  const normalized = normalizeProfessionalLesson(raw);
  const id = normalized.lesson.toUpperCase();
  const lang = normalized.language;
  lessonsByKey[`${id}:${lang}`] = normalized;
  if (lang === "english") {
    lessonsByKey[id] = normalized;
  }
}

register(pm01English as unknown as Record<string, unknown>);
register(pm01Tanglish as unknown as Record<string, unknown>);

export function getProfessionalCurriculum(): ProfessionalCurriculum {
  return curriculum as ProfessionalCurriculum;
}

export function getProfessionalWorkspaceCatalog() {
  return workspaceCatalog;
}

export function getProfessionalLesson(
  lessonId: string,
  language: ProfessionalLanguage = "english"
): ProfessionalLessonFile | null {
  const id = lessonId.toUpperCase();
  return (
    lessonsByKey[`${id}:${language}`] ||
    lessonsByKey[id] ||
    lessonsByKey[`${id}:english`] ||
    null
  );
}

export function listAvailableProfessionalLessons(): string[] {
  return Object.keys(lessonsByKey)
    .filter((k) => !k.includes(":") || k.endsWith(":english"))
    .map((k) => k.split(":")[0])
    .filter((v, i, a) => a.indexOf(v) === i);
}
