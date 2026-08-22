/**
 * Professional Mode Learn — console-first lesson schema (v2).
 * Steps pair voice + cursor concurrently; segment types encode teaching rhythm.
 */

export type ProfessionalLanguage = "english" | "tanglish";

export type ConsoleCursorAction = {
  action:
    | "click"
    | "type"
    | "hover"
    | "scroll"
    | "select"
    | "navigate"
    | "navigate_to_url"
    | "highlight"
    | "key";
  /** Matches data-console-target on the teachable console */
  target: string;
  value?: string;
  pause_ms?: number;
  voice?: string;
};

/** One beat: voice plays concurrently with cursor; then pause_ms. */
export type LessonStep = {
  voice: string | null;
  cursor: ConsoleCursorAction | null;
  pause_ms: number;
};

export type SegmentCheck = {
  voice: string;
  wait_for_input: boolean;
  response_if_correct: string;
  response_if_incorrect: string;
  accept_keywords?: string[];
};

export type DemonstrateSegment = {
  id?: string;
  type: "demonstrate";
  title?: string;
  setup_voice?: string;
  steps: LessonStep[];
  lesson_voice?: string;
  check?: SegmentCheck;
};

export type TeachSegment = {
  id?: string;
  type: "teach";
  title?: string;
  steps: LessonStep[];
  check?: SegmentCheck;
};

export type PracticeSegment = {
  id?: string;
  type: "practice";
  title?: string;
  instruction_voice: string;
  target: string;
  success_targets?: string[];
  hint_after_seconds: number;
  hint_voice: string;
  completion_voice?: string;
};

export type AskSegment = {
  id?: string;
  type: "ask";
  title?: string;
  voice?: string;
  question: string;
  wait_for_input?: boolean;
  response_if_correct: string;
  response_if_incorrect: string;
  accept_keywords?: string[];
};

/** @deprecated v1 — still normalized into v2 at load time */
export type RenNavigatesSegment = {
  segment?: number;
  id?: string;
  type: "ren_navigates";
  heading?: string;
  console_path?: string;
  ren_voice: string;
  cursor_actions: ConsoleCursorAction[];
};

/** @deprecated v1 */
export type RenAsksSegment = {
  segment?: number;
  id?: string;
  type: "ren_asks";
  heading?: string;
  ren_voice: string;
  question: string;
  accept_keywords?: string[];
  ren_response_if_correct: string;
  ren_response_if_incorrect: string;
};

/** @deprecated v1 */
export type StudentNavigatesSegment = {
  segment?: number;
  id?: string;
  type: "student_navigates";
  heading?: string;
  instruction: string;
  ren_monitors: boolean;
  hint_after_seconds: number;
  hint_text: string;
  success_targets?: string[];
  success_action?: string;
  ren_response_if_correct?: string;
  ren_response_if_incorrect?: string;
};

/** @deprecated v1 */
export type ConsequenceDemoSegment = {
  segment?: number;
  id?: string;
  type: "consequence_demo";
  heading?: string;
  scenario?: string;
  ren_voice: string;
  console_path?: string;
  lesson: string;
  cursor_actions?: ConsoleCursorAction[];
  correct_action_after?: ConsoleCursorAction[];
};

export type ConsoleSegment =
  | DemonstrateSegment
  | TeachSegment
  | PracticeSegment
  | AskSegment
  | RenNavigatesSegment
  | RenAsksSegment
  | StudentNavigatesSegment
  | ConsequenceDemoSegment;

export type ProfessionalWhiteboardIntro = {
  duration_seconds: number;
  board_text: string;
  ren_voice: string;
};

/** Spoken + board welcome before whiteboard / console segments. */
export type ProfessionalLessonIntro = {
  heading?: string;
  board_text: string;
  ren_voice: string;
};

export type ProfessionalSessionClose = {
  ren_voice: string;
  summary_points?: string[];
  doubt_session?: {
    ren_opening: string;
    wait_for_response: boolean;
    ren_closing: string;
    ren_response_template?: string;
  };
};

export type ProfessionalLessonFile = {
  session: string;
  lesson: string;
  title: string;
  duration_minutes: number;
  language: ProfessionalLanguage;
  schema_version: 1 | 2;
  environment:
    | "aws_iam_console"
    | "aws_vpc_console"
    | "aws_ec2_console"
    | "aws_s3_console"
    | "aws_cloudwatch_console"
    | "aws_billing_console";
  account?: {
    account_id: string;
    account_name: string;
    region?: string;
  };
  company?: {
    name: string;
    your_role?: string;
    current_account?: string;
  };
  whiteboard_intro: ProfessionalWhiteboardIntro | null;
  /** Welcome + session overview before whiteboard / console. */
  lesson_intro: ProfessionalLessonIntro | null;
  /** Normalized segments (v2 preferred). Alias of console_segments. */
  segments: ConsoleSegment[];
  /** @deprecated use segments — kept for older call sites */
  console_segments: ConsoleSegment[];
  session_close: ProfessionalSessionClose;
};

export type ProfessionalCurriculumLesson = {
  id: string;
  title: string;
  duration_minutes: number;
  available: boolean;
};

export type ProfessionalCurriculumTopic = {
  session: string;
  title: string;
  description: string;
  lessons: ProfessionalCurriculumLesson[];
};

export type ProfessionalCurriculum = {
  mode: "professional";
  topics: ProfessionalCurriculumTopic[];
};
