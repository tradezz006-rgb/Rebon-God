import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, HandMetal, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceWhiteboard } from "@/components/ava/VoiceWhiteboard";
import { useAvaVoice } from "@/hooks/useAvaVoice";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { getProfessionalLesson } from "@/data/cloud/professional_mode";
import { useSettings } from "@/contexts/SettingsContext";
import { RenCursor } from "@/components/cloud/professionalMode/RenCursor";
import {
  TeachableAwsConsole,
  type TeachableConsoleHandle,
} from "@/components/cloud/professionalMode/TeachableAwsConsole";
import { ConsoleLessonErrorBoundary } from "@/components/cloud/professionalMode/ConsoleLessonErrorBoundary";
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

type Phase =
  | "idle"
  | "intro"
  | "whiteboard"
  | "running"
  | "asking"
  | "student"
  | "closing"
  | "doubt"
  | "done";

type BoardAction = Record<string, unknown>;

function sleep(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function boardLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[•\-]\s*/, "").trim())
    .filter(Boolean);
}

function keywordsHit(transcript: string, keywords: string[] = []) {
  const t = transcript.toLowerCase();
  if (!keywords.length) return t.trim().split(/\s+/).length >= 2;
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

function typewriterMs(text: string) {
  return Math.min(12_000, Math.max(800, text.length * 38));
}

function lessonConsoleBoot(lessonId: string) {
  const id = lessonId.toUpperCase();
  if (id.startsWith("PM-0") || id.startsWith("PM-2") || id.startsWith("PM-3")) {
    return { initialView: "ec2" as const, initialPage: "instances" };
  }
  if (id.startsWith("PM-1")) {
    return { initialView: "iam" as const, initialPage: "users" };
  }
  if (id.startsWith("PM-4")) {
    return { initialView: "s3" as const, initialPage: "buckets" };
  }
  if (id.startsWith("PM-5")) {
    return { initialView: "cloudwatch" as const, initialPage: "overview" };
  }
  if (id.startsWith("PM-6")) {
    return { initialView: "billing" as const, initialPage: "cost-explorer" };
  }
  return { initialView: "home" as const, initialPage: undefined };
}

async function waitForPaint() {
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

/**
 * Professional Mode Learn — schema v2:
 * each step runs voice ‖ cursor, then pause_ms.
 * Whiteboard: write line ‖ speak sentence, synced.
 */
export default function ProfessionalConsoleLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { teachLanguage } = useSettings();
  const lessonId = String(id || "").toUpperCase();
  const lesson = useMemo(
    () =>
      getProfessionalLesson(
        lessonId,
        teachLanguage === "tanglish" ? "tanglish" : "english"
      ),
    [lessonId, teachLanguage]
  );

  const { speak, stop } = useAvaVoice();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const consoleRef = useRef<TeachableConsoleHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const runIdRef = useRef(0);
  const segmentIndexRef = useRef(0);
  const studentTrailRef = useRef<string[]>([]);
  const hintTimerRef = useRef<number | null>(null);
  const runningSegRef = useRef(false);
  const activeCheckRef = useRef<SegmentCheck | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [history, setHistory] = useState<BoardAction[]>([]);
  const [showBoard, setShowBoard] = useState(false);
  const [subtitles, setSubtitles] = useState("");
  const [studentControl, setStudentControl] = useState(false);
  const [highlightTarget, setHighlightTarget] = useState<string | null>(null);
  const [cursor, setCursor] = useState({
    x: 80,
    y: 80,
    visible: false,
    clicking: false,
    label: "",
  });
  const [hintVisible, setHintVisible] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [askTries, setAskTries] = useState(0);
  const [consoleEpoch, setConsoleEpoch] = useState(0);

  const segments = lesson?.segments || lesson?.console_segments || [];
  const consoleBoot = useMemo(
    () => lessonConsoleBoot(lessonId),
    [lessonId]
  );

  const account = lesson?.account || {
    account_id: "847291635028",
    account_name: "finova-dev",
    region: "ap-south-1",
  };

  const clearHintTimer = () => {
    if (hintTimerRef.current != null) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
  };

  const speakAndWait = useCallback(
    (text: string, runId: number) =>
      new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(safety);
          resolve();
        };
        if (!text.trim()) {
          done();
          return;
        }
        if (runId !== runIdRef.current) {
          done();
          return;
        }
        stop();
        setSubtitles(text);
        const est = Math.min(60_000, Math.max(2_500, text.length * 55));
        const safety = window.setTimeout(done, est);
        void speak(text, {
          onEnd: () => done(),
        });
      }),
    [speak, stop]
  );

  const moveCursorToTarget = useCallback(async (targetId: string) => {
    const el = consoleRef.current?.resolveTarget(targetId);
    const stage = stageRef.current;
    if (!el || !stage) {
      setCursor((c) => ({ ...c, visible: true, label: targetId }));
      await sleep(200);
      return;
    }
    const sr = stage.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    setHighlightTarget((prev) => (prev === targetId ? prev : targetId));
    setCursor({
      x: er.left - sr.left + er.width / 2,
      y: er.top - sr.top + er.height / 2,
      visible: true,
      clicking: false,
      label: "",
    });
    await sleep(280);
  }, []);

  const playOneCursor = useCallback(
    async (action: ConsoleCursorAction, runId: number) => {
      if (runId !== runIdRef.current) return;
      try {
        if (action.action === "key") {
          await consoleRef.current?.performAction({ ...action, pause_ms: 0 });
          return;
        }

        const isPointerOnly =
          action.action === "highlight" || action.action === "hover";
        const isNavigate =
          action.action === "navigate" || action.action === "navigate_to_url";

        const targetReady = !!consoleRef.current?.resolveTarget(action.target);

        if (!targetReady) {
          const mountAction = isNavigate
            ? { ...action, action: "click" as const }
            : isPointerOnly
              ? { ...action, action: "hover" as const }
              : action;
          await consoleRef.current?.performAction({
            ...mountAction,
            pause_ms: 0,
          });
          await sleep(100);
        }

        await moveCursorToTarget(action.target);
        if (runId !== runIdRef.current) return;

        if (isPointerOnly) {
          if (!targetReady) return;
          await consoleRef.current?.performAction({
            ...action,
            action: "hover",
            pause_ms: 0,
          });
          return;
        }

        if (isNavigate && targetReady) return;

        setCursor((c) => ({ ...c, clicking: true }));
        await sleep(90);
        const asPerform = isNavigate ? ("click" as const) : action.action;
        await consoleRef.current?.performAction({
          ...action,
          action: asPerform,
          pause_ms: 0,
        });
        setCursor((c) => ({ ...c, clicking: false }));
      } catch (err) {
        console.warn("[PM lesson] cursor step failed", action.target, err);
        setCursor((c) => ({ ...c, clicking: false }));
      }
    },
    [moveCursorToTarget]
  );

  /** Core timing: voice ‖ cursor, then pause_ms */
  const playStep = useCallback(
    async (step: LessonStep, runId: number) => {
      if (runId !== runIdRef.current) return;
      const voiceP = step.voice
        ? speakAndWait(step.voice, runId)
        : Promise.resolve();
      const cursorP = step.cursor
        ? playOneCursor(step.cursor, runId)
        : Promise.resolve();
      await Promise.all([voiceP, cursorP]);
      if (runId !== runIdRef.current) return;
      await sleep(Math.max(0, step.pause_ms ?? 280));
    },
    [speakAndWait, playOneCursor]
  );

  const playSteps = useCallback(
    async (steps: LessonStep[], runId: number) => {
      for (const step of steps) {
        if (runId !== runIdRef.current) return;
        await playStep(step, runId);
      }
      setHighlightTarget(null);
    },
    [playStep]
  );

  /** Board sync helper — write line ‖ speak sentence */
  const playBoardSynced = useCallback(
    async (
      intro: { board_text: string; ren_voice: string; heading?: string },
      runId: number,
      headingText: string
    ) => {
      setHistory([{ type: "write_heading", text: headingText }]);
      await sleep(250);

      const lines = boardLines(intro.board_text);
      const sentences = splitSentences(intro.ren_voice);
      const n = Math.max(lines.length, sentences.length);

      for (let i = 0; i < n; i++) {
        if (runId !== runIdRef.current) return;
        const line = lines[i];
        const sentence = sentences[i];

        if (line) {
          setHistory((h) => [
            ...h,
            { type: "write_points", points: [line] },
          ]);
        }

        const writeWait = line ? sleep(typewriterMs(line)) : Promise.resolve();
        const voiceWait = sentence
          ? speakAndWait(sentence, runId)
          : Promise.resolve();

        await Promise.all([writeWait, voiceWait]);
        if (runId !== runIdRef.current) return;
        await sleep(200);
      }
    },
    [speakAndWait]
  );

  const playLessonIntro = useCallback(
    async (
      intro: { board_text: string; ren_voice: string; heading?: string },
      runId: number
    ) => {
      setPhase("intro");
      setShowBoard(true);
      await playBoardSynced(
        intro,
        runId,
        intro.heading || "Welcome"
      );
    },
    [playBoardSynced]
  );

  /** Board: write line ‖ speak sentence — same clock */
  const playWhiteboardSynced = useCallback(
    async (
      intro: { board_text: string; ren_voice: string },
      runId: number
    ) => {
      setPhase("whiteboard");
      setShowBoard(true);
      await playBoardSynced(intro, runId, "Before you touch the console");
    },
    [playBoardSynced]
  );

  const finishLesson = useCallback(() => {
    clearHintTimer();
    stop();
    stopListening();
    setPhase("done");
    setStudentControl(false);
    setCursor((c) => ({ ...c, visible: false }));
    navigate("/learning");
  }, [stop, stopListening, navigate]);

  const goToSegment = useCallback((index: number) => {
    segmentIndexRef.current = index;
    setSegmentIndex(index);
  }, []);

  const playClosing = useCallback(
    (lessonFile: ProfessionalLessonFile, runId: number) => {
      setPhase("closing");
      setSubtitles("Session close");
      setCursor((c) => ({ ...c, visible: false }));
      setStudentControl(false);
      setShowBoard(false);
      void speak(lessonFile.session_close.ren_voice, {
        onEnd: () => {
          if (runId !== runIdRef.current) return;
          const doubt = lessonFile.session_close.doubt_session;
          if (!doubt) {
            finishLesson();
            return;
          }
          setPhase("doubt");
          setSubtitles(doubt.ren_opening);
          void speak(doubt.ren_opening, {
            onEnd: () => {
              if (runId !== runIdRef.current) return;
              resetTranscript();
              startListening("doubt");
            },
          });
        },
      });
    },
    [speak, finishLesson, resetTranscript, startListening]
  );

  const advanceAfter = useCallback(
    (lessonFile: ProfessionalLessonFile, fromIndex: number, runId: number) => {
      const list = lessonFile.segments || lessonFile.console_segments;
      const next = fromIndex + 1;
      if (next >= list.length) {
        playClosing(lessonFile, runId);
        return;
      }
      runningSegRef.current = false;
      goToSegment(next);
    },
    [playClosing, goToSegment]
  );

  const runCheck = useCallback(
    async (
      check: SegmentCheck,
      lessonFile: ProfessionalLessonFile,
      index: number,
      runId: number
    ) => {
      activeCheckRef.current = check;
      setPhase("asking");
      setStudentControl(false);
      setCursor((c) => ({ ...c, visible: false }));
      setAskTries(0);
      setTextAnswer("");
      await speakAndWait(check.voice, runId);
      if (runId !== runIdRef.current) return;
      runningSegRef.current = false;
      resetTranscript();
      startListening("doubt");
    },
    [speakAndWait, resetTranscript, startListening]
  );

  const runSegment = useCallback(
    async (
      segment: ConsoleSegment,
      lessonFile: ProfessionalLessonFile,
      index: number,
      runId: number
    ) => {
      if (runId !== runIdRef.current) return;
      if (runningSegRef.current) return;
      runningSegRef.current = true;

      clearHintTimer();
      setHintVisible(false);
      setAskTries(0);
      setTextAnswer("");
      activeCheckRef.current = null;
      consoleRef.current?.clearTrail();
      studentTrailRef.current = [];
      setShowBoard(false);

      const unlock = () => {
        if (runId === runIdRef.current) runningSegRef.current = false;
      };

      try {
        // ── demonstrate ──────────────────────────────────────────────
        if (segment.type === "demonstrate") {
          const seg = segment as DemonstrateSegment;
          setPhase("running");
          setStudentControl(false);
          setSubtitles(seg.title || "Demonstrate");
          if (seg.setup_voice) {
            await speakAndWait(seg.setup_voice, runId);
            if (runId !== runIdRef.current) return;
          }
          await playSteps(seg.steps, runId);
          if (runId !== runIdRef.current) return;
          if (seg.lesson_voice) {
            await speakAndWait(seg.lesson_voice, runId);
            if (runId !== runIdRef.current) return;
          }
          if (seg.check) {
            await runCheck(seg.check, lessonFile, index, runId);
            return;
          }
          unlock();
          advanceAfter(lessonFile, index, runId);
          return;
        }

        // ── teach ────────────────────────────────────────────────────
        if (segment.type === "teach") {
          const seg = segment as TeachSegment;
          setPhase("running");
          setStudentControl(false);
          setSubtitles(seg.title || "Teach");
          await playSteps(seg.steps, runId);
          if (runId !== runIdRef.current) return;
          if (seg.check) {
            await runCheck(seg.check, lessonFile, index, runId);
            return;
          }
          unlock();
          advanceAfter(lessonFile, index, runId);
          return;
        }

        // ── practice ─────────────────────────────────────────────────
        if (segment.type === "practice") {
          const seg = segment as PracticeSegment;
          setPhase("student");
          setStudentControl(true);
          setCursor((c) => ({ ...c, visible: false }));
          setSubtitles(seg.instruction_voice);
          await speakAndWait(seg.instruction_voice, runId);
          if (runId !== runIdRef.current) return;
          unlock();
          if (seg.hint_after_seconds > 0) {
            hintTimerRef.current = window.setTimeout(() => {
              setHintVisible(true);
              void speak(seg.hint_voice);
            }, seg.hint_after_seconds * 1000);
          }
          return;
        }

        // ── ask ──────────────────────────────────────────────────────
        if (segment.type === "ask") {
          const seg = segment as AskSegment;
          const check: SegmentCheck = {
            voice: [seg.voice, seg.question].filter(Boolean).join(" "),
            wait_for_input: true,
            response_if_correct: seg.response_if_correct,
            response_if_incorrect: seg.response_if_incorrect,
            accept_keywords: seg.accept_keywords,
          };
          await runCheck(check, lessonFile, index, runId);
          return;
        }

        unlock();
        advanceAfter(lessonFile, index, runId);
      } catch (err) {
        console.warn("[PM lesson] segment failed", segment.type, err);
        unlock();
        setPhase("running");
        setSubtitles("Ren hit a console snag — continuing.");
        await sleep(600);
        advanceAfter(lessonFile, index, runId);
      } finally {
        // If we bailed due to runId change, clear a stale lock so the next boot can run.
        if (runId !== runIdRef.current) runningSegRef.current = false;
      }
    },
    [speakAndWait, playSteps, runCheck, advanceAfter, speak]
  );

  // Boot lesson
  useEffect(() => {
    if (!lesson) return;
    runIdRef.current += 1;
    const runId = runIdRef.current;
    runningSegRef.current = false;
    stop();
    stopListening();
    goToSegment(0);
    setStudentControl(false);
    setShowBoard(false);
    setHistory([]);

    let cancelled = false;
    const boot = async () => {
      if (lesson.lesson_intro?.ren_voice || lesson.lesson_intro?.board_text) {
        await playLessonIntro(lesson.lesson_intro, runId);
        if (cancelled || runId !== runIdRef.current) return;
        await sleep(350);
      }
      const intro = lesson.whiteboard_intro;
      if (intro && (intro.ren_voice || intro.board_text)) {
        await playWhiteboardSynced(intro, runId);
        if (cancelled || runId !== runIdRef.current) return;
      }
      await waitForPaint();
      setShowBoard(false);
      setPhase("running");
      await waitForPaint();
      const list = lesson.segments || lesson.console_segments;
      if (list[0]) {
        void runSegment(list[0], lesson, 0, runId);
      }
    };
    void boot();

    return () => {
      cancelled = true;
      runIdRef.current += 1;
      stop();
      stopListening();
      clearHintTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson]);

  // Next segment index → run
  useEffect(() => {
    if (!lesson || segmentIndex === 0) return;
    if (
      phase === "intro" ||
      phase === "whiteboard" ||
      phase === "idle" ||
      phase === "done" ||
      phase === "closing" ||
      phase === "doubt"
    )
      return;
    const list = lesson.segments || lesson.console_segments;
    void runSegment(list[segmentIndex], lesson, segmentIndex, runIdRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentIndex]);

  const handleAskAnswer = useCallback(
    (text: string) => {
      if (!lesson) return;
      const check = activeCheckRef.current;
      if (!check || phase !== "asking") return;
      stopListening();
      const ok = keywordsHit(text, check.accept_keywords);
      const finish = () => {
        activeCheckRef.current = null;
        advanceAfter(lesson, segmentIndexRef.current, runIdRef.current);
      };

      if (ok) {
        void speak(check.response_if_correct, { onEnd: finish });
        return;
      }
      const tries = askTries + 1;
      setAskTries(tries);
      if (tries >= 2) {
        void speak(check.response_if_incorrect, { onEnd: finish });
      } else {
        void speak(check.response_if_incorrect, {
          onEnd: () => {
            resetTranscript();
            startListening("doubt");
          },
        });
      }
    },
    [
      lesson,
      phase,
      askTries,
      speak,
      stopListening,
      advanceAfter,
      resetTranscript,
      startListening,
    ]
  );

  useEffect(() => {
    if (isListening || !transcript.trim() || !lesson) return;
    const text = transcript.trim();
    if (phase === "asking") {
      handleAskAnswer(text);
      return;
    }
    if (phase === "doubt") {
      const lower = text.toLowerCase();
      if (
        lower.includes("no doubt") ||
        lower.includes("no questions") ||
        lower.includes("nothing") ||
        /\billa\b/.test(lower)
      ) {
        const closing =
          lesson.session_close.doubt_session?.ren_closing ||
          "Good. See you next session.";
        void speak(closing, () => finishLesson());
        return;
      }
      void speak(
        "We'll go deeper on that in the next lessons. Any other doubts, or say no doubts?",
        () => {
          resetTranscript();
          startListening("doubt");
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const onStudentClick = useCallback(
    (targetId: string) => {
      if (phase !== "student" || !lesson) return;
      studentTrailRef.current = [...studentTrailRef.current, targetId];
      const seg = (lesson.segments || lesson.console_segments)[
        segmentIndexRef.current
      ];
      if (!seg || seg.type !== "practice") return;
      const needed = seg.success_targets || [seg.target];
      const hit = needed.some((n) => studentTrailRef.current.includes(n));
      if (!hit) return;

      clearHintTimer();
      setHintVisible(false);
      setStudentControl(false);
      const line =
        seg.completion_voice || "Nice — that's the path. Let's keep going.";
      void speak(line, {
        onEnd: () =>
          advanceAfter(lesson, segmentIndexRef.current, runIdRef.current),
      });
    },
    [phase, lesson, speak, advanceAfter]
  );

  if (!lesson) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0b1220] text-slate-300">
        <p>Lesson {lessonId} is not available yet.</p>
        <Button onClick={() => navigate("/learning")}>Back to Learn</Button>
      </div>
    );
  }

  const seg = segments[segmentIndex];
  const phaseLabel =
    phase === "intro"
      ? "Welcome"
      : phase === "whiteboard"
        ? "Framing"
        : phase === "asking"
          ? "Your call"
          : phase === "student"
            ? "Your turn — console"
            : phase === "doubt"
              ? "Doubts"
              : "Ren teaching";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b1220] text-slate-100">
      <header className="flex shrink-0 items-center gap-3 border-b border-violet-500/25 px-4 py-2.5">
        <button
          type="button"
          onClick={() => {
            runIdRef.current += 1;
            stop();
            stopListening();
            clearHintTimer();
            navigate("/learning");
          }}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-violet-300">
            {lesson.lesson} · {lesson.company?.name || "Professional"} · Screen
            share
          </p>
          <h1 className="truncate text-sm font-semibold text-white">
            {lesson.title}
          </h1>
        </div>
        <span className="rounded border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-violet-200">
          {phaseLabel}
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={stageRef}
          className={`absolute inset-0 h-full w-full min-h-0 ${
            showBoard
              ? phase === "intro"
                ? "opacity-0"
                : "opacity-30"
              : "opacity-100"
          } transition-opacity`}
        >
          <div className="flex h-full min-h-0 w-full flex-col bg-[#f2f3f3]">
            <ConsoleLessonErrorBoundary
              onRetry={() => {
                setConsoleEpoch((n) => n + 1);
                consoleRef.current?.resetView();
              }}
            >
              <TeachableAwsConsole
                key={`${lesson.lesson}-${consoleEpoch}`}
                ref={consoleRef}
                mode="learn"
                accountId={account.account_id}
                accountName={account.account_name}
                region={account.region || "ap-south-1"}
                initialView={consoleBoot.initialView}
                initialPage={consoleBoot.initialPage}
                studentControl={studentControl}
                highlightTarget={highlightTarget}
                onStudentClick={onStudentClick}
              />
            </ConsoleLessonErrorBoundary>
          </div>
          <RenCursor
            x={cursor.x}
            y={cursor.y}
            visible={cursor.visible && !showBoard}
            clicking={cursor.clicking}
            label={cursor.label}
          />
        </div>

        {showBoard && (
          <div className="absolute inset-0 z-40 bg-[#020609]/95">
            <VoiceWhiteboard history={history} lessonTitle={lesson.title} />
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-slate-500">
              Ren writing + speaking together
            </p>
          </div>
        )}

        <div className="pointer-events-none absolute left-4 top-4 z-50 max-w-md rounded-lg border border-white/10 bg-[#0b1220]/90 px-3 py-2 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">
            {phaseLabel}
          </p>
          <p className="mt-0.5 text-xs text-slate-200">{subtitles}</p>
          {isListening && (
            <p className="mt-1 flex items-center gap-1.5 text-xs italic text-violet-200/90">
              <Mic className="h-3 w-3 animate-pulse" />
              {transcript ? `"${transcript}"` : "Listening…"}
            </p>
          )}
          {hintVisible && phase === "student" && seg?.type === "practice" && (
            <p className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-100">
              Hint: {seg.hint_voice}
            </p>
          )}
        </div>

        <div className="absolute bottom-5 right-5 z-50 flex flex-wrap items-center justify-end gap-2">
          {phase === "asking" && (
            <>
              {!isListening && (
                <Button
                  size="sm"
                  className="bg-violet-600 text-white hover:bg-violet-500"
                  onClick={() => {
                    resetTranscript();
                    startListening("doubt");
                  }}
                >
                  <Mic className="mr-2 h-4 w-4" /> Answer on mic
                </Button>
              )}
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b1220]/90 p-1">
                <input
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Or type your answer…"
                  className="h-8 w-44 bg-transparent px-2 text-xs text-white outline-none placeholder:text-slate-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && textAnswer.trim()) {
                      handleAskAnswer(textAnswer.trim());
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-white/15"
                  disabled={!textAnswer.trim()}
                  onClick={() => handleAskAnswer(textAnswer.trim())}
                >
                  Send
                </Button>
              </div>
            </>
          )}

          {phase === "student" && seg?.type === "practice" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="border-white/15 text-slate-300"
                onClick={() => {
                  clearHintTimer();
                  setHintVisible(true);
                  void speak(seg.hint_voice);
                }}
              >
                Need a hint
              </Button>
              <Button
                size="sm"
                className="bg-violet-600 text-white hover:bg-violet-500"
                onClick={() => {
                  clearHintTimer();
                  setHintVisible(false);
                  setStudentControl(false);
                  const line =
                    seg.completion_voice || "Good. Let's keep going.";
                  void speak(line, {
                    onEnd: () =>
                      advanceAfter(
                        lesson,
                        segmentIndexRef.current,
                        runIdRef.current
                      ),
                  });
                }}
              >
                Continue
              </Button>
            </>
          )}

          {phase === "doubt" && (
            <>
              {!isListening && (
                <Button
                  size="sm"
                  className="bg-violet-600 text-white hover:bg-violet-500"
                  onClick={() => {
                    resetTranscript();
                    startListening("doubt");
                  }}
                >
                  <Mic className="mr-2 h-4 w-4" /> Start mic
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="border-white/15"
                onClick={() => {
                  const closing =
                    lesson.session_close.doubt_session?.ren_closing ||
                    "Good. See you next session.";
                  void speak(closing, () => finishLesson());
                }}
              >
                <HandMetal className="mr-2 h-3.5 w-3.5" /> No doubts
              </Button>
            </>
          )}

          {(phase === "running" || phase === "intro" || phase === "whiteboard") && (
            <p className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-[#0b1220]/90 px-3 py-2 text-[10px] uppercase tracking-widest text-violet-200">
              <Loader2 className="h-3 w-3 animate-spin" /> Ren teaching
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-violet-500/15 px-4 py-2 text-center text-[10px] uppercase tracking-widest text-slate-500">
        Segment {Math.min(segmentIndex + 1, segments.length)} / {segments.length}
        {seg ? ` · ${seg.type}` : ""}
      </div>
    </div>
  );
}
