import { fresherLessons } from "../cloud/fresher";
import {
  buildingBasicsSessions,
  buildingBasicsLessons,
  getBuildingBasicsLesson,
} from "../cloud/building_basics";

const cs1Lessons = fresherLessons.filter((l) => {
  const id = String((l as { lesson_id?: string }).lesson_id || "");
  const section = String((l as { section_id?: string }).section_id || "");
  return section === "CS1" || (/^C1\.\d/.test(id) && !id.startsWith("C1B"));
});

const cs1bLessons = fresherLessons.filter((l) => {
  const id = String((l as { lesson_id?: string }).lesson_id || "");
  const section = String((l as { section_id?: string }).section_id || "");
  return section === "CS1B" || id.startsWith("C1B");
});

/** @deprecated Prefer cloudSessions[0] — kept for older imports */
export const cloudSessionCS1 = {
  session_id: "CS1",
  session_name: "Session CS1 — How the Cloud & Internet Work",
  session_description:
    "Project Phoenix foundations: cloud economics, regions, console, billing, and shared responsibility.",
  pace: "fresher",
  program: "Rebon Student Mode",
  domain: "cloud",
  language: "tanglish",
  total_lessons: cs1Lessons.length,
  lessons: cs1Lessons,
};

export const cloudSessionCS1B = {
  session_id: "CS1B",
  session_name: "Session CS1B — Core Services Awareness",
  session_description:
    "Meet the AWS building blocks in plain language — EC2, S3, IAM, VPC, CloudWatch.",
  pace: "fresher",
  program: "Rebon Student Mode",
  domain: "cloud",
  language: "tanglish",
  total_lessons: cs1bLessons.length,
  lessons: cs1bLessons,
};

/** Fresher (CS1 + CS1B) + Building Basics (CS2–CS7) for Learn */
export const cloudSessions = [
  cloudSessionCS1,
  cloudSessionCS1B,
  ...buildingBasicsSessions.filter((s) => (s.lessons?.length ?? 0) > 0),
];

export const sessions = cloudSessions;

export const getAllLessons = () => {
  return sessions.reduce((acc: any[], session: any) => {
    return [...acc, ...(session.lessons || [])];
  }, []);
};

export const getCloudLessons = () => getAllLessons();

export function getCloudLessonById(id: string) {
  const fromFresher = fresherLessons.find(
    (l) =>
      (l as { lesson_id?: string }).lesson_id === id ||
      (l as { id?: string }).id === id
  );
  if (fromFresher) return fromFresher;
  return getBuildingBasicsLesson(id) ?? null;
}

export { buildingBasicsLessons, getBuildingBasicsLesson };
