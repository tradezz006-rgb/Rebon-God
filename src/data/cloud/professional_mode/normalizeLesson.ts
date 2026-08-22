import type {
  AskSegment,
  ConsoleCursorAction,
  ConsoleSegment,
  DemonstrateSegment,
  LessonStep,
  PracticeSegment,
  ProfessionalLessonFile,
  SegmentCheck,
  TeachSegment,
} from "@/types/professionalMode";

/**
 * Map author-friendly / schema-v2 target IDs → data-console-target IDs
 * used by TeachableAwsConsole.
 */
export function mapConsoleTarget(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (!t) return raw;

  const aliases: Record<string, string> = {
    "account-switcher": "account-badge",
    "region-option-us-east-1": "region-us-east-1",
    "region-option-ap-south-1": "region-ap-south-1",
    "ec2-instances-sidebar": "service-ec2",
    "ec2-instances-list-mumbai": "ec2-instances-list",
    "ec2-instances-empty-state": "ec2-instances-empty",
    "ec2-dashboard": "service-ec2",
    "iam-service-result": "search-result-iam",
    "search-result-iam-users": "nav-users",
    "region-dropdown-list": "region-dropdown",
    "services-menu-security-category": "services-menu",
    "region-selector-global-indicator": "region-selector",
  };
  if (aliases[t]) return aliases[t];

  if (
    /^(aws-logo|services-menu|search-bar|search-bar-input|search-result-iam|search-result-ec2|service-iam|service-ec2|service-s3|service-vpc|region-selector|region-ap-south-1|region-us-east-1|account-badge|account-id-display|ec2-instances-list|ec2-instances-empty|region-dropdown|nav-dashboard|nav-users|nav-groups|nav-roles|nav-policies|create-user)$/.test(
      t
    )
  ) {
    return t;
  }

  if (t.includes("services menu") || t === "services") return "services-menu";
  if (t.includes("search bar") || (t.includes("search") && !t.includes("iam") && !t.includes("ec2")))
    return "search-bar";
  if (t.includes("iam") && (t.includes("result") || t.includes("service")))
    return "search-result-iam";
  if (t.includes("ec2")) return "service-ec2";
  if (t.includes("us-east-1") || t.includes("virginia")) return "region-us-east-1";
  if (t.includes("ap-south-1") || t.includes("mumbai")) {
    if (t.includes("selector")) return "region-selector";
    return "region-ap-south-1";
  }
  if (t.includes("region selector") || t.includes("region dropdown"))
    return t.includes("dropdown") || t.includes("list")
      ? "region-dropdown"
      : "region-selector";
  if (t.includes("account id")) return "account-id-display";
  if (t.includes("account")) return "account-badge";

  return raw;
}

function mapCursor(
  raw: Record<string, unknown> | null | undefined
): ConsoleCursorAction | null {
  if (!raw || typeof raw !== "object") return null;
  const actionRaw = String(raw.action || "click");
  let action = actionRaw as ConsoleCursorAction["action"];
  if (action === "navigate_to_url") action = "navigate";
  const target = mapConsoleTarget(String(raw.target || ""));
  if (!target && action !== "key") return null;
  return {
    action,
    target: target || "Escape",
    value: raw.value != null ? String(raw.value) : undefined,
    pause_ms: raw.pause_ms != null ? Number(raw.pause_ms) : undefined,
    voice: raw.voice != null ? String(raw.voice) : undefined,
  };
}

function asSteps(raw: unknown): LessonStep[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    const x = s as Record<string, unknown>;
    const voice =
      x.voice === null || x.voice === undefined
        ? null
        : String(x.voice).trim() || null;
    return {
      voice,
      cursor: mapCursor(x.cursor as Record<string, unknown> | null),
      pause_ms: Number(x.pause_ms ?? 500),
    };
  });
}

function asCheck(raw: unknown): SegmentCheck | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  if (!c.voice && !c.question) return undefined;
  return {
    voice: String(c.voice || c.question || ""),
    wait_for_input: c.wait_for_input !== false,
    response_if_correct: String(
      c.response_if_correct || c.ren_response_if_correct || ""
    ),
    response_if_incorrect: String(
      c.response_if_incorrect || c.ren_response_if_incorrect || ""
    ),
    accept_keywords: Array.isArray(c.accept_keywords)
      ? (c.accept_keywords as string[])
      : defaultAskKeywords(String(c.voice || c.question || "")),
  };
}

function defaultAskKeywords(question: string): string[] | undefined {
  const q = question.toLowerCase();
  if (
    q.includes("region") ||
    q.includes("virginia") ||
    q.includes("mumbai") ||
    q.includes("what you just saw")
  ) {
    return [
      "region",
      "view",
      "virginia",
      "mumbai",
      "disappear",
      "invisible",
      "empty",
      "still running",
      "billing",
      "not deleted",
      "selector",
      "ap-south",
      "us-east",
    ];
  }
  if (q.includes("account")) {
    return ["account", "12", "id", "click", "top right", "dev", "confirm"];
  }
  if (q.includes("services menu") || q.includes("search bar")) {
    return ["explor", "don't know", "discover", "browse", "category", "search"];
  }
  if (q.includes("lambda") || q.includes("global or regional")) {
    return ["regional", "region", "selector", "same as ec2"];
  }
  if (q.includes("ec2") && q.includes("disappeared")) {
    return ["region", "account", "selector", "same region", "same account"];
  }
  return undefined;
}

function normalizeV2Segment(s: Record<string, unknown>, i: number): ConsoleSegment {
  const type = String(s.type);
  const id = s.id ? String(s.id) : `S${i + 1}`;
  const title = s.title ? String(s.title) : undefined;

  if (type === "demonstrate") {
    const seg: DemonstrateSegment = {
      id,
      type: "demonstrate",
      title,
      setup_voice: s.setup_voice ? String(s.setup_voice) : undefined,
      steps: asSteps(s.steps),
      lesson_voice: s.lesson_voice ? String(s.lesson_voice) : undefined,
      check: asCheck(s.check),
    };
    return seg;
  }

  if (type === "teach") {
    const seg: TeachSegment = {
      id,
      type: "teach",
      title,
      steps: asSteps(s.steps),
      check: asCheck(s.check),
    };
    return seg;
  }

  if (type === "practice") {
    const target = mapConsoleTarget(String(s.target || "service-ec2"));
    const success = Array.isArray(s.success_targets)
      ? (s.success_targets as string[]).map(mapConsoleTarget)
      : [target, "search-result-ec2", "service-ec2"];
    const seg: PracticeSegment = {
      id,
      type: "practice",
      title,
      instruction_voice: String(
        s.instruction_voice || s.instruction || "Your turn."
      ),
      target,
      success_targets: [...new Set(success)],
      hint_after_seconds: Number(s.hint_after_seconds ?? 20),
      hint_voice: String(s.hint_voice || s.hint_text || ""),
      completion_voice: s.completion_voice
        ? String(s.completion_voice)
        : undefined,
    };
    return seg;
  }

  if (type === "ask") {
    const question = String(s.question || "");
    const seg: AskSegment = {
      id,
      type: "ask",
      title,
      voice: s.voice ? String(s.voice) : undefined,
      question,
      wait_for_input: s.wait_for_input !== false,
      response_if_correct: String(
        s.response_if_correct || s.ren_response_if_correct || ""
      ),
      response_if_incorrect: String(
        s.response_if_incorrect || s.ren_response_if_incorrect || ""
      ),
      accept_keywords: Array.isArray(s.accept_keywords)
        ? (s.accept_keywords as string[])
        : defaultAskKeywords(question),
    };
    return seg;
  }

  // Unknown → treat as teach with empty steps
  return {
    id,
    type: "teach",
    title,
    steps: asSteps(s.steps),
    check: asCheck(s.check),
  };
}

/** Convert legacy v1 segments into v2 shapes the player understands. */
function normalizeV1Segment(s: Record<string, unknown>, i: number): ConsoleSegment {
  const type = String(s.type);
  const id = s.id ? String(s.id) : `S${i + 1}`;

  if (type === "ren_asks") {
    return {
      id,
      type: "ask",
      voice: String(s.ren_voice || ""),
      question: String(s.question || ""),
      wait_for_input: true,
      response_if_correct: String(s.ren_response_if_correct || ""),
      response_if_incorrect: String(s.ren_response_if_incorrect || ""),
      accept_keywords: Array.isArray(s.accept_keywords)
        ? (s.accept_keywords as string[])
        : defaultAskKeywords(String(s.question || "")),
    };
  }

  if (type === "student_navigates") {
    const instruction = String(s.instruction || s.ren_voice || "Your turn.");
    return {
      id,
      type: "practice",
      instruction_voice: instruction,
      target: "service-ec2",
      success_targets: Array.isArray(s.success_targets)
        ? (s.success_targets as string[]).map(mapConsoleTarget)
        : ["service-ec2", "search-result-ec2"],
      hint_after_seconds: Number(s.hint_after_seconds ?? 25),
      hint_voice: String(s.hint_text || ""),
      completion_voice: s.ren_response_if_correct
        ? String(s.ren_response_if_correct)
        : undefined,
    };
  }

  if (type === "consequence_demo") {
    const actions = Array.isArray(s.cursor_actions)
      ? (s.cursor_actions as Record<string, unknown>[])
      : [];
    const steps: LessonStep[] = actions.map((a) => ({
      voice: a.voice != null ? String(a.voice) : null,
      cursor: mapCursor(a),
      pause_ms: Number(a.pause_ms ?? 500),
    }));
    return {
      id,
      type: "demonstrate",
      title: String(s.heading || s.scenario || ""),
      setup_voice: String(s.ren_voice || ""),
      steps,
      lesson_voice: String(s.lesson || ""),
    };
  }

  // ren_navigates → teach: one big voice then cursor steps, OR voice null on each click
  const actions = Array.isArray(s.cursor_actions)
    ? (s.cursor_actions as Record<string, unknown>[])
    : [];
  const steps: LessonStep[] = [];
  const bigVoice = String(s.ren_voice || "");
  if (bigVoice && actions.length) {
    // First step carries the voice; remaining steps are cursor-only
    steps.push({
      voice: bigVoice,
      cursor: mapCursor(actions[0]),
      pause_ms: Number(actions[0]?.pause_ms ?? 600),
    });
    for (let i = 1; i < actions.length; i++) {
      steps.push({
        voice: null,
        cursor: mapCursor(actions[i]),
        pause_ms: Number(actions[i]?.pause_ms ?? 500),
      });
    }
  } else if (bigVoice) {
    steps.push({ voice: bigVoice, cursor: null, pause_ms: 400 });
  }

  return {
    id,
    type: "teach",
    title: String(s.heading || s.console_path || ""),
    steps,
  };
}

/** Author JSON → engine ProfessionalLessonFile */
export function normalizeProfessionalLesson(
  raw: Record<string, unknown>
): ProfessionalLessonFile {
  const company = (raw.company || {}) as Record<string, unknown>;
  const sessionClose = (raw.session_close || {}) as Record<string, unknown>;
  const doubt = (sessionClose.doubt_session || {}) as Record<string, unknown>;
  const accountRaw = (raw.account || {}) as Record<string, unknown>;

  const schemaVersion =
    Number(raw.schema_version) === 2 || Array.isArray(raw.segments) ? 2 : 1;

  const rawSegments = Array.isArray(raw.segments)
    ? (raw.segments as Record<string, unknown>[])
    : Array.isArray(raw.console_segments)
      ? (raw.console_segments as Record<string, unknown>[])
      : [];

  const segments: ConsoleSegment[] = rawSegments.map((s, i) =>
    schemaVersion === 2 ||
    ["demonstrate", "teach", "practice", "ask"].includes(String(s.type))
      ? normalizeV2Segment(s, i)
      : normalizeV1Segment(s, i)
  );

  const rawLessonId = String(raw.lesson_id || raw.lesson || "PM-1.1");
  const lessonId =
    rawLessonId.toLowerCase() === "pm_console_intro" ||
    rawLessonId.toLowerCase() === "pm-console-intro"
      ? "PM-0.1"
      : rawLessonId;

  const rawSession = String(raw.session_id || raw.session || raw.unit || "PM-0");
  const sessionId =
    /console intro/i.test(rawSession) || rawSession === "Console Intro"
      ? "PM-0"
      : rawSession;

  return {
    session: sessionId,
    lesson: lessonId,
    title: String(raw.lesson_title || raw.title || "Professional lesson"),
    duration_minutes: Number(raw.duration_minutes || 15),
    language: (raw.language as "english" | "tanglish") || "english",
    schema_version: schemaVersion === 2 ? 2 : 1,
    environment: "aws_iam_console",
    account: {
      account_id: String(accountRaw.account_id || "847291635028"),
      account_name: String(
        accountRaw.account_name || company.current_account || "finova-dev"
      ),
      region: String(accountRaw.region || "ap-south-1"),
    },
    company: {
      name: String(company.name || "Finova Technologies"),
      your_role: company.your_role
        ? String(company.your_role)
        : "Cloud Infrastructure Engineer",
      current_account: company.current_account
        ? String(company.current_account)
        : "finova-dev",
    },
    whiteboard_intro: raw.whiteboard_intro
      ? (raw.whiteboard_intro as ProfessionalLessonFile["whiteboard_intro"])
      : null,
    lesson_intro: raw.lesson_intro
      ? {
          heading: (raw.lesson_intro as Record<string, unknown>).heading
            ? String((raw.lesson_intro as Record<string, unknown>).heading)
            : undefined,
          board_text: String(
            (raw.lesson_intro as Record<string, unknown>).board_text || ""
          ),
          ren_voice: String(
            (raw.lesson_intro as Record<string, unknown>).ren_voice || ""
          ),
        }
      : null,
    segments,
    console_segments: segments,
    session_close: {
      ren_voice: String(sessionClose.ren_voice || ""),
      summary_points: Array.isArray(sessionClose.summary_points)
        ? (sessionClose.summary_points as string[])
        : undefined,
      doubt_session: doubt.ren_opening
        ? {
            ren_opening: String(doubt.ren_opening),
            wait_for_response: doubt.wait_for_response !== false,
            ren_closing: String(doubt.ren_closing || ""),
            ren_response_template: doubt.ren_response_template
              ? String(doubt.ren_response_template)
              : undefined,
          }
        : undefined,
    },
  };
}
