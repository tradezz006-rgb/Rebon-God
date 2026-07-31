/**
 * Lesson mail — situation briefing before tickets (inbox),
 * student reply after the lesson is cleared (understanding check).
 * Matches Building Basics Pillar 3: real workplace mail, not slides.
 */
import { getStoryAct, getStorySessionForLesson } from "@/data/cloud/storyMode";
import {
  LESSON_MISSIONS,
  PHOENIX_COMPANY,
} from "@/data/cloud/projectPhoenix";
import { progressGet, progressSet } from "@/data/cloud/ephemeralProgress";
import { isWorkspaceComplete } from "@/data/cloud/studentModePace";
import { fresherLessons } from "@/data/cloud/fresher";
import { buildingBasicsLessons } from "@/data/cloud/building_basics";
import { sessionIdFromLessonId } from "@/data/cloud/sessionCatalog";
import { getMegaStorySession } from "@/data/cloud/buildingBasicsBible";

export type LessonMailKind = "briefing" | "reply";

export type LessonMailContent = {
  lessonId: string;
  lessonTitle: string;
  fromName: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  subject: string;
  /** Full readable body — not slide-split */
  body: string;
  /** What the student must do */
  ask: string;
  ticketLabel?: string;
  company: string;
};

const readKey = (id: string) => `lesson_mail_read_${id}`;
const replyKey = (id: string) => `lesson_mail_reply_${id}`;

export function isLessonMailRead(lessonId: string): boolean {
  return progressGet(readKey(lessonId)) === "1";
}

export function markLessonMailRead(lessonId: string): void {
  progressSet(readKey(lessonId), "1");
}

export function getLessonMailReply(lessonId: string): string {
  return progressGet(replyKey(lessonId)) || "";
}

export function saveLessonMailReply(lessonId: string, text: string): void {
  progressSet(replyKey(lessonId), text.trim());
}

export function canWriteLessonMailReply(lessonId: string): boolean {
  return isWorkspaceComplete(lessonId);
}

function lessonTitleOf(lessonId: string): string {
  const act = getStoryAct(lessonId);
  if (act?.actTitle) return act.actTitle;
  const mission = LESSON_MISSIONS[lessonId];
  if (mission) return mission.title;
  const all = [...fresherLessons, ...buildingBasicsLessons];
  return (
    all.find((l) => l.lesson_id === lessonId)?.lesson_title || lessonId
  );
}

export function getLessonMailContent(lessonId: string): LessonMailContent {
  const act = getStoryAct(lessonId);
  const session = getStorySessionForLesson(lessonId);
  const mission = LESSON_MISSIONS[lessonId];
  const title = lessonTitleOf(lessonId);
  const sid = sessionIdFromLessonId(lessonId);
  const mega = sid ? getMegaStorySession(sid) : undefined;

  // Building Basics story acts (CS2–CS7 FoodQuick mega-story)
  if (act && session) {
    const body =
      act.arcIntro ||
      mega?.arcOpener ||
      act.problemRecap ||
      `We need you on ${act.buildsLayer}. Open the tickets for this act and clear them carefully.`;
    return {
      lessonId,
      lessonTitle: title,
      fromName: mega?.senderName || "Ravi Krishnan",
      fromEmail: mega?.senderEmail || "ravi@foodquick.in",
      toName: "You · Cloud Engineer",
      toEmail: "engineer@rebon.cloud",
      subject:
        mega && act.actNumber === 1
          ? mega.subject
          : `${session.ticket} · Act ${act.actNumber}: ${act.actTitle}`,
      body,
      ask: `Clear the workspace tickets for this act and secure the ${act.buildsLayer}. When you're done, reply to this mail with what the real problem was and how you fixed it — in your own words, not a copy of the lesson.`,
      ticketLabel: session.ticket,
      company: session.company,
    };
  }

  // Future BB lessons before story acts ship — still use mega-story mail voice
  if (mega) {
    return {
      lessonId,
      lessonTitle: title,
      fromName: mega.senderName,
      fromEmail: mega.senderEmail,
      toName: "You · Cloud Engineer",
      toEmail: "engineer@rebon.cloud",
      subject: mega.subject,
      body: mega.arcOpener,
      ask: `${mega.throughLine}\n\nClear every ticket in this lesson, then reply with what was actually wrong and how you fixed it.`,
      ticketLabel: mega.ticket,
      company: "FoodQuick",
    };
  }

  // Fresher / Phoenix
  const ren = mission?.renIntro || PHOENIX_COMPANY.crisis;
  const brief =
    mission?.missionBrief ||
    "Open the workspace tickets for this lesson and clear them in order.";
  return {
    lessonId,
    lessonTitle: title,
    fromName: "Ravi · Ops Lead",
    fromEmail: "ravi@freshbite.in",
    toName: "You · Cloud Engineer",
    toEmail: "engineer@rebon.cloud",
    subject: `Project Phoenix · ${title}`,
    body: `${PHOENIX_COMPANY.crisis}\n\n${ren}`,
    ask: `${brief}\n\nWhen every ticket in this lesson is cleared, reply to this mail: what broke, what you fixed, and what you'd check first next time.`,
    ticketLabel: "PHOENIX",
    company: PHOENIX_COMPANY.name,
  };
}
