/**
 * Building Basics — locked product bible for MVP.
 * Pillars 1–3 + FoodQuick mega-story through-line (CS2→CS7).
 * CS2 content stays as-is; CS3–CS7 open with callbacks into this arc.
 */

import type { CloudSessionId } from "@/data/cloud/sessionCatalog";

/** Pillar 1 — every workspace task must bridge, never spoil. */
export const PILLAR_LEARNING_BRIDGE = {
  id: "pillar_1_learning_bridge",
  rule: "Every workspace task requires a concept the lesson taught — but must never be solvable by recalling a lesson sentence verbatim. The student applies the idea to a new, specific situation.",
  passTest:
    "Could a student pass by memorizing the lesson's exact wording without understanding why? If yes, rewrite. If they must think and apply to a new detail, it's correct.",
  spoilingExample:
    'Lesson: "Bucket-level ops need ARN without /*; object-level need ARN with /*." Task: "What does arn:aws:s3:::bucket/* mean?" — memory only.',
  bridgingExample:
    'Task: "ananya-analyst can\'t list bucket contents even though her policy includes s3:ListBucket. Find the bug." — apply ARN-level concept to a new situation (C2.2-T4 standard).',
  durationNote:
    "Building Basics workspace target ~40–45 hours across the phase; 10–14 items per lesson scaled by complexity.",
} as const;

/** Pillar 3 — tone: professional, lightly gamified, real corporate. */
export const PILLAR_TONE = {
  id: "pillar_3_tone",
  keep: [
    "Real AWS error messages, verbatim format",
    "Named managers with a real voice (Ravi, Priya, etc.) — not generic NPCs",
    "Ticket numbers (FQ-142) mirroring Jira",
    "Rebon Score / tickets resolved on public profile — not inside workspace HUD",
    "3-attempt system as mentorship, never punishment",
    "Mail mechanic as real workplace communication",
  ],
  avoidGamified: [
    "Points, XP, level-up SFX, confetti bursts inside workspace",
    "Cartoon mascots reacting to answers",
    "Leaderboards inside the workspace simulation",
    "Countdown timers on individual workspace tasks",
  ],
  avoidDry: [
    "Generic scenarios with no named people, numbers, or stakes",
    "Tasks with no link to the ongoing FoodQuick arc",
    "Mails that read like documentation instead of a person writing",
  ],
  balance:
    "Everything should feel like a screenshot from real internal tools (Slack, Jira, AWS, CloudWatch) with a real story underneath — not gamification bolted on.",
} as const;

export type MegaStorySession = {
  sessionId: Extract<
    CloudSessionId,
    "CS2" | "CS3" | "CS4" | "CS5" | "CS6" | "CS7"
  >;
  ticket: string;
  layer: string;
  title: string;
  /** Mail From */
  senderName: string;
  senderEmail: string;
  senderRole: string;
  /** One-line subject seed */
  subject: string;
  /** Opens the session mail / first act arc_intro — callback to prior work */
  arcOpener: string;
  /** What this session proves in the company transformation */
  throughLine: string;
};

/**
 * Pillar 2 — one FoodQuick transformation across Building Basics.
 * CS2 already shipped; later sessions only need this connective layer.
 */
export const FOODQUICK_MEGA_STORY: MegaStorySession[] = [
  {
    sessionId: "CS2",
    ticket: "FQ-142",
    layer: "IAM",
    title: "Secure IAM before the audit",
    senderName: "Ravi Krishnan",
    senderEmail: "ravi@foodquick.in",
    senderRole: "Engineering Manager",
    subject: "FQ-142 · Secure IAM before the audit",
    arcOpener:
      "FQ-142 starts here. FoodQuick's IAM was built the way everything else was — fast, temporary, 'we'll fix it later.' That later never came. Your job: make identity real before the auditor walks in.",
    throughLine:
      "The wake-up call. One investigation reveals the company-wide pattern: built fast, never revisited.",
  },
  {
    sessionId: "CS3",
    ticket: "FQ-156",
    layer: "Networking",
    title: "Rebuild the network architecture",
    senderName: "Priya Nair",
    senderEmail: "priya.nair@foodquick.in",
    senderRole: "Cloud Architect",
    subject: "FQ-156 · Rebuild our network architecture",
    arcOpener:
      "Priya Nair was brought in because of what FQ-142 exposed. Leadership is finally taking the foundation seriously. The VPC was stood up in one afternoon before the first big funding round — default settings, never touched since. Same 'temporary, fix later' habit as Vikram's access. Different layer. Same company.",
    throughLine:
      "Leadership signs off on a real network rebuild — proof that CS2 changed how FoodQuick operates.",
  },
  {
    sessionId: "CS4",
    ticket: "FQ-171",
    layer: "Compute",
    title: "Fix the scaling problems",
    senderName: "Ravi Krishnan",
    senderEmail: "ravi@foodquick.in",
    senderRole: "Engineering Manager",
    subject: "FQ-171 · Fix the scaling problems",
    arcOpener:
      "Ravi: 'After FQ-142 and FQ-156, we finally have permission to stop guessing.' EC2 sizes were Day-1 gut calls from one overworked early engineer. Nobody owned right-sizing for two years. Same rush pattern — now we fix compute properly.",
    throughLine:
      "Scope expands: the engineer who cleaned IAM now owns how FoodQuick scales.",
  },
  {
    sessionId: "CS5",
    ticket: "FQ-189",
    layer: "Storage",
    title: "Storage costs are out of control",
    senderName: "Meera Iyer",
    senderEmail: "cfo-office@foodquick.in",
    senderRole: "CFO's office",
    subject: "FQ-189 · Storage costs — leadership wants answers",
    arcOpener:
      "Finance has visibility into engineering decisions now — a direct consequence of the FQ-142 investigation earning leadership trust. Years of unmanaged S3 growth, no lifecycle policies, no owner for cost hygiene. They're asking you because you already proved FoodQuick can clean house.",
    throughLine:
      "Trust reaches the CFO's office. Cost hygiene becomes an engineering mandate.",
  },
  {
    sessionId: "CS6",
    ticket: "FQ-203",
    layer: "Monitoring",
    title: "Eyes on production 24/7",
    senderName: "Karthik Rao",
    senderEmail: "karthik.rao@foodquick.in",
    senderRole: "DevOps Lead (new hire)",
    subject: "FQ-203 · We need eyes on production 24/7",
    arcOpener:
      "Karthik is new — FoodQuick is visibly changing how it operates because of everything found since FQ-142. Right now outages still arrive via customer complaints on Twitter, not any internal system. Last blind spot. Let's put real eyes on production.",
    throughLine:
      "Ops maturity arrives: monitoring replaces luck and social media as the early-warning system.",
  },
  {
    sessionId: "CS7",
    ticket: "FQ-218",
    layer: "Portfolio Capstone",
    title: "Build it all — final architecture",
    senderName: "Ravi Krishnan",
    senderEmail: "ravi@foodquick.in",
    senderRole: "Engineering Manager",
    subject: "FQ-218 · Build FoodQuick properly — final architecture",
    arcOpener:
      "Ravi: 'This isn't a new fire. It's the payoff. Design FoodQuick's infrastructure properly — IAM, network, compute, storage, monitoring — incorporating everything since FQ-142, the ticket that started the whole turnaround. From survived-by-luck to built-to-last. One architecture. Your name on it.'",
    throughLine:
      "Capstone payoff: one designed platform that shows the full transformation, with an explicit callback to FQ-142.",
  },
];

export function getMegaStorySession(
  sessionId: string
): MegaStorySession | undefined {
  return FOODQUICK_MEGA_STORY.find((s) => s.sessionId === sessionId);
}

/** Suggested first-line callback for a session's opening mail / act 1 arc_intro. */
export function getSessionArcOpener(sessionId: string): string | undefined {
  return getMegaStorySession(sessionId)?.arcOpener;
}
