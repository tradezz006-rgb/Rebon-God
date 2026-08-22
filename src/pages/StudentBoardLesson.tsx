import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, HandMetal, Loader2, Mic, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceWhiteboard } from "@/components/ava/VoiceWhiteboard";
import { useAvaVoice } from "@/hooks/useAvaVoice";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { getStudentLessonsForDay } from "@/data/cloud/student_mode";
import {
  getStudentLanguage,
  setStudentLanguage,
} from "@/data/cloud/studentModeProgress";
import { StudentLanguageToggle } from "@/components/cloud/studentMode/StudentLanguageToggle";
import type {
  StudentCheckQuestion,
  StudentLanguage,
  StudentLessonBlock,
  StudentLessonFile,
} from "@/types/studentMode";
import {
  isCheckQuizBlock,
  isDoubtPromptBlock,
  isTeachBlock,
  keywordsFromCheck,
} from "@/types/studentMode";
import {
  answerDoubtWithGroq,
  saveDoubtToMasterDatas,
} from "@/lib/studentDoubtStore";

type Phase =
  | "idle"
  | "teaching"
  | "check_listening"
  | "check_feedback"
  | "summary"
  | "mid_doubt_listening"
  | "mid_doubt_answering"
  | "mid_doubt_followup"
  | "doubt_prompt"
  | "doubt_listening"
  | "doubt_answering"
  | "done";

type BoardAction = Record<string, unknown>;

function expandBoardSteps(block: {
  heading?: string;
  board_text?: string;
  type?: string;
}): BoardAction[] {
  const steps: BoardAction[] = [];
  if (block.heading) {
    steps.push({ type: "write_heading", text: block.heading });
  }
  const raw = String(block.board_text || "").trim();
  if (!raw) return steps;

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const clean = line.replace(/^[•\-→]\s*/, "").trim();
    if (!clean) continue;
    if (/:$/.test(clean) && clean.length < 48) {
      steps.push({ type: "write_heading", text: clean });
    } else if (clean.length < 150 && lines.length === 1) {
      steps.push({ type: "write_definition_box", text: clean });
    } else if (clean.length > 140) {
      const parts = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
      let buf = "";
      for (const s of parts) {
        const next = (buf + " " + s).trim();
        if (next.length > 120 && buf) {
          steps.push({ type: "write_points", points: [buf] });
          buf = s.trim();
        } else buf = next;
      }
      if (buf) steps.push({ type: "write_points", points: [buf] });
    } else {
      steps.push({ type: "write_points", points: [clean] });
    }
  }
  return steps;
}

function estimateSpeechMs(voice: string) {
  return Math.min(95_000, Math.max(3_500, voice.length * 52));
}

function keywordsHit(transcript: string, keywords: string[]) {
  const t = transcript.toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

function getCheck(block: StudentLessonBlock): StudentCheckQuestion | null {
  if (block.check_question) return block.check_question;
  if (block.type === "check_voice" && block.question) {
    return {
      question: block.question,
      expected_response_type: "open",
      ren_response_if_correct: block.ren_correct || "",
      ren_response_if_incorrect: block.ren_wrong || "",
      accept_keywords: block.accept_keywords,
    };
  }
  if (isCheckQuizBlock(block) && block.question) {
    return {
      question: block.question,
      expected_response_type: "quiz",
      options: block.options,
      correct_index: block.correct_index,
      ren_response_if_correct: block.ren_correct || "",
      ren_response_if_incorrect: block.ren_wrong || "",
    };
  }
  return null;
}

/**
 * Live Ren classroom — 8-step architecture:
 * teach → in-between mic check → … → summary → doubt session.
 */
export default function StudentBoardLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dayNum = Number(String(id || "").replace(/^SM-D/i, "")) || 1;

  const [language, setLanguage] = useState<StudentLanguage>(() =>
    getStudentLanguage()
  );
  const lesson = useMemo(
    () => getStudentLessonsForDay(dayNum, language)[0] || null,
    [dayNum, language]
  );

  const [blockIndex, setBlockIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [history, setHistory] = useState<BoardAction[]>([]);
  const [subtitles, setSubtitles] = useState("");
  const [paused, setPaused] = useState(false);
  const runIdRef = useRef(0);
  const blockIndexRef = useRef(0);
  const pausedRef = useRef(false);
  const boardTimersRef = useRef<number[]>([]);
  const activeCheckRef = useRef<StudentCheckQuestion | null>(null);

  const { speak, stop } = useAvaVoice();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    blockIndexRef.current = blockIndex;
  }, [blockIndex]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const clearBoardTimers = useCallback(() => {
    boardTimersRef.current.forEach((id) => window.clearTimeout(id));
    boardTimersRef.current = [];
  }, []);

  const pushBoard = useCallback(
    (actions: BoardAction[], reset?: boolean, title?: string) => {
      setHistory((prev) => {
        if (reset) {
          const lead = title
            ? [{ type: "write_title", lines: [title] } as BoardAction]
            : [];
          return [...lead, ...actions];
        }
        return [...prev, ...actions];
      });
    },
    []
  );

  /**
   * Write heading now. Return a scheduler that reveals remaining strokes
   * across the *actual* spoken audio duration (starts when Ren's voice starts).
   */
  const beginBoardForBlock = useCallback(
    (
      lessonFile: StudentLessonFile,
      block: { heading?: string; board_text?: string; ren_voice?: string },
      resetBoard: boolean,
      runId: number
    ) => {
      clearBoardTimers();
      const steps = expandBoardSteps(block);
      if (!steps.length) {
        if (resetBoard) pushBoard([], true, lessonFile.title);
        return (_durationMs: number) => undefined;
      }

      const [first, ...rest] = steps;
      pushBoard([first], resetBoard, lessonFile.title);
      if (!rest.length) return (_durationMs: number) => undefined;

      return (durationMs: number) => {
        if (runId !== runIdRef.current || pausedRef.current) return;
        const voiceMs =
          durationMs > 800
            ? durationMs
            : estimateSpeechMs(block.ren_voice || "");
        const head = Math.min(1_800, voiceMs * 0.12);
        const tail = Math.min(2_200, voiceMs * 0.14);
        const usable = Math.max(2_400, voiceMs - head - tail);
        const gap = usable / rest.length;

        rest.forEach((step, i) => {
          const textLen = JSON.stringify(step).length;
          const weightBoost = Math.min(900, Math.floor(textLen * 2));
          const at = head + i * gap + weightBoost * 0.15;
          const tid = window.setTimeout(() => {
            if (runId !== runIdRef.current || pausedRef.current) return;
            pushBoard([step]);
          }, Math.round(at));
          boardTimersRef.current.push(tid);
        });
      };
    },
    [clearBoardTimers, pushBoard]
  );

  const flushBlockBoard = useCallback((block: StudentLessonBlock) => {
    const full = expandBoardSteps(block);
    setHistory((prev) => {
      const headingIdx = [...prev]
        .map((a, i) => ({ a, i }))
        .reverse()
        .find(
          ({ a }) => a.type === "write_heading" && a.text === block.heading
        )?.i;
      if (headingIdx == null) return [...prev, ...full];
      const after = prev.slice(headingIdx);
      if (after.length >= full.length) return prev;
      return [...prev, ...full.slice(after.length)];
    });
  }, []);

  const finishLesson = useCallback(() => {
    clearBoardTimers();
    stopListening();
    stop();
    setPhase("done");
    const bye =
      lesson?.doubt_session?.ren_closing ||
      (language === "tanglish"
        ? "Nalla irukku. Lesson complete. Learn-ku return aagalaam."
        : "Great. Lesson complete. Heading back to Learn.");
    void speak(bye, () => navigate("/learning"));
  }, [
    language,
    speak,
    stop,
    stopListening,
    navigate,
    clearBoardTimers,
    lesson,
  ]);

  const startDoubtListening = useCallback(() => {
    setPhase("doubt_listening");
    resetTranscript();
    startListening("doubt");
  }, [resetTranscript, startListening]);

  const playDoubtSession = useCallback(
    (lessonFile: StudentLessonFile, runId: number) => {
      const doubt = lessonFile.doubt_session;
      if (!doubt) {
        finishLesson();
        return;
      }
      setPhase("doubt_prompt");
      setSubtitles(
        language === "tanglish" ? "Doubt irukkaa?" : "Any doubts?"
      );
      pushBoard([
        {
          type: "write_heading",
          text:
            language === "tanglish"
              ? "DOUBT SESSION — ethavathu doubt irukkaa?"
              : "DOUBT SESSION — any questions?",
        },
      ]);
      void speak(doubt.ren_opening, () => {
        if (runId !== runIdRef.current || pausedRef.current) return;
        startDoubtListening();
      });
    },
    [finishLesson, language, pushBoard, speak, startDoubtListening]
  );

  const playSummaryThenDoubt = useCallback(
    (lessonFile: StudentLessonFile, runId: number) => {
      const summary = lessonFile.lesson_summary;
      if (!summary) {
        playDoubtSession(lessonFile, runId);
        return;
      }
      setPhase("summary");
      setSubtitles("SUMMARY");
      const scheduleRest = beginBoardForBlock(
        lessonFile,
        {
          heading: "SUMMARY",
          board_text: summary.board_text,
          ren_voice: summary.ren_voice,
        },
        false,
        runId
      );
      void speak(summary.ren_voice, {
        onStart: (durationMs) => {
          if (runId !== runIdRef.current || pausedRef.current) return;
          scheduleRest(durationMs);
        },
        onEnd: () => {
          if (runId !== runIdRef.current || pausedRef.current) return;
          clearBoardTimers();
          window.setTimeout(() => {
            if (runId !== runIdRef.current || pausedRef.current) return;
            playDoubtSession(lessonFile, runId);
          }, 500);
        },
      });
    },
    [beginBoardForBlock, speak, clearBoardTimers, playDoubtSession]
  );

  const advanceAfter = useCallback(
    (fromIndex: number, lessonFile: StudentLessonFile, runId: number) => {
      clearBoardTimers();
      const next = fromIndex + 1;
      if (next >= lessonFile.blocks.length) {
        playSummaryThenDoubt(lessonFile, runId);
        return;
      }
      setBlockIndex(next);
      setPhase("teaching");
    },
    [clearBoardTimers, playSummaryThenDoubt]
  );

  const startCheck = useCallback(
    (
      check: StudentCheckQuestion,
      lessonFile: StudentLessonFile,
      index: number,
      runId: number
    ) => {
      activeCheckRef.current = check;
      setPhase("check_listening");
      setSubtitles(check.question);
      pushBoard([
        { type: "write_heading", text: "QUICK CHECK" },
        { type: "write_question", text: check.question },
      ]);
      void speak(check.question, () => {
        if (runId !== runIdRef.current || pausedRef.current) return;
        resetTranscript();
        startListening("doubt");
      });
    },
    [pushBoard, speak, resetTranscript, startListening]
  );

  const gradeCheck = useCallback(
    (
      check: StudentCheckQuestion,
      text: string,
      lessonFile: StudentLessonFile,
      index: number,
      runId: number
    ) => {
      stopListening();
      setPhase("check_feedback");
      const keys = keywordsFromCheck(check);
      const ok =
        keywordsHit(text, keys) ||
        (text.trim().split(/\s+/).length >= 6 && keys.length === 0);
      setSubtitles(ok ? "Good" : "Let's lock it in");
      const line = ok
        ? check.ren_response_if_correct
        : check.ren_response_if_incorrect;
      void speak(line, () => {
        if (runId !== runIdRef.current || pausedRef.current) return;
        activeCheckRef.current = null;
        window.setTimeout(
          () => advanceAfter(index, lessonFile, runId),
          400
        );
      });
    },
    [speak, stopListening, advanceAfter]
  );

  const playBlock = useCallback(
    (index: number, lessonFile: StudentLessonFile, runId: number) => {
      if (runId !== runIdRef.current) return;
      const block = lessonFile.blocks[index];
      if (!block) return;

      setSubtitles(block.heading);

      // Legacy standalone check / doubt blocks
      if (isDoubtPromptBlock(block)) {
        playDoubtSession(lessonFile, runId);
        return;
      }
      const legacyCheck = getCheck(block);
      if (
        (block.type === "check_voice" || block.type === "check_quiz") &&
        legacyCheck
      ) {
        startCheck(legacyCheck, lessonFile, index, runId);
        return;
      }

      const scheduleRest = beginBoardForBlock(
        lessonFile,
        block,
        index === 0,
        runId
      );
      setPhase("teaching");
      void speak(block.ren_voice, {
        onStart: (durationMs) => {
          if (runId !== runIdRef.current || pausedRef.current) return;
          scheduleRest(durationMs);
        },
        onEnd: () => {
          if (runId !== runIdRef.current || pausedRef.current) return;
          clearBoardTimers();
          flushBlockBoard(block);

          const check = getCheck(block);
          if (check && isTeachBlock(block)) {
            window.setTimeout(() => {
              if (runId !== runIdRef.current || pausedRef.current) return;
              startCheck(check, lessonFile, index, runId);
            }, 450);
            return;
          }

          window.setTimeout(() => {
            if (runId !== runIdRef.current || pausedRef.current) return;
            advanceAfter(index, lessonFile, runId);
          }, 450);
        },
      });
    },
    [
      beginBoardForBlock,
      speak,
      clearBoardTimers,
      flushBlockBoard,
      startCheck,
      advanceAfter,
      playDoubtSession,
    ]
  );

  useEffect(() => {
    if (!lesson) return;
    setStudentLanguage(language);
    stop();
    stopListening();
    clearBoardTimers();
    runIdRef.current += 1;
    const runId = runIdRef.current;
    setHistory([]);
    setBlockIndex(0);
    setPaused(false);
    setPhase("teaching");
    const t = window.setTimeout(() => playBlock(0, lesson, runId), 350);
    return () => {
      window.clearTimeout(t);
      clearBoardTimers();
      stop();
      stopListening();
      runIdRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, language]);

  useEffect(() => {
    if (!lesson || blockIndex === 0) return;
    playBlock(blockIndex, lesson, runIdRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockIndex]);

  const resumeAfterMidDoubt = useCallback(() => {
    if (!lesson) return;
    const runId = runIdRef.current;
    const index = blockIndexRef.current;
    const block = lesson.blocks[index];
    if (!block) return;

    const bridge =
      language === "tanglish"
        ? "Sari — indha idathula irundhu continue panrom."
        : "Alright — let's continue from here.";

    setPhase("teaching");
    setSubtitles(block.heading);
    void speak(bridge, {
      onEnd: () => {
        if (runId !== runIdRef.current || pausedRef.current) return;
        // Voice-only resume of current step (board already has what was written)
        void speak(block.ren_voice, {
          onEnd: () => {
            if (runId !== runIdRef.current || pausedRef.current) return;
            clearBoardTimers();
            flushBlockBoard(block);
            const check = getCheck(block);
            if (check && isTeachBlock(block)) {
              window.setTimeout(() => {
                if (runId !== runIdRef.current || pausedRef.current) return;
                startCheck(check, lesson, index, runId);
              }, 400);
              return;
            }
            window.setTimeout(() => {
              if (runId !== runIdRef.current || pausedRef.current) return;
              advanceAfter(index, lesson, runId);
            }, 400);
          },
        });
      },
    });
  }, [
    lesson,
    language,
    speak,
    clearBoardTimers,
    flushBlockBoard,
    startCheck,
    advanceAfter,
  ]);

  /** User barges in while Ren is teaching — pause class and listen. */
  const interruptForDoubt = useCallback(() => {
    if (!lesson) return;
    if (
      phase !== "teaching" &&
      phase !== "summary" &&
      phase !== "check_feedback"
    ) {
      return;
    }
    // Kill in-flight teach timers / voice callbacks so the lesson does not auto-advance.
    clearBoardTimers();
    stop();
    stopListening();
    runIdRef.current += 1;
    setPaused(false);
    pausedRef.current = false;
    setPhase("mid_doubt_listening");
    setSubtitles(language === "tanglish" ? "Listening…" : "Listening…");
    pushBoard([
      {
        type: "write_heading",
        text:
          language === "tanglish"
            ? "HAND RAISED — doubt kekkuraanga"
            : "HAND RAISED — asking Ren",
      },
    ]);
    const ack =
      language === "tanglish" ? "Hmm, sollunga." : "Yes — tell me.";
    void speak(ack, {
      onEnd: () => {
        resetTranscript();
        startListening("doubt");
      },
    });
  }, [
    lesson,
    phase,
    clearBoardTimers,
    stop,
    stopListening,
    language,
    pushBoard,
    speak,
    resetTranscript,
    startListening,
  ]);

  const handleMidDoubt = useCallback(
    async (text: string) => {
      if (!lesson) return;
      const lower = text.toLowerCase();
      if (
        lower.includes("continue") ||
        lower.includes("go on") ||
        lower.includes("go ahead") ||
        lower.includes("resume") ||
        lower.includes("no doubt") ||
        lower.includes("nothing") ||
        lower.includes("continue pannu") ||
        lower.includes("continue panrom") ||
        lower.includes("podhum") ||
        /\billa\b/.test(lower)
      ) {
        resumeAfterMidDoubt();
        return;
      }

      setPhase("mid_doubt_answering");
      setSubtitles(
        language === "tanglish" ? "Ren answer panraanga..." : "Ren is answering..."
      );
      stopListening();

      const block = lesson.blocks[blockIndexRef.current];
      const context = [
        block ? `Current step: ${block.heading}\n${block.board_text}` : "",
        ...lesson.blocks.map((b) => `${b.heading}\n${b.board_text}`),
      ]
        .filter(Boolean)
        .join("\n\n");

      try {
        const result = await answerDoubtWithGroq({
          question: text,
          lessonTitle: lesson.title,
          lessonContext: context.slice(0, 4000),
          language,
        });
        const spoken =
          language === "tanglish"
            ? result.answer_tanglish || result.answer_english
            : result.answer_english || result.answer_tanglish;

        setHistory((prev) => [
          ...prev,
          {
            type: "write_points",
            points: String(result.whiteboard_summary)
              .split("\n")
              .map((l) => l.replace(/^[•\-]\s*/, "").trim())
              .filter(Boolean),
          },
        ]);

        await saveDoubtToMasterDatas({
          lesson_id: `SM-D${dayNum}`,
          source_language: language,
          question: {
            english: result.question_english,
            tanglish: result.question_tanglish,
          },
          answer: {
            english: result.answer_english,
            tanglish: result.answer_tanglish,
          },
          expected_intent: result.question_english.slice(0, 120).toLowerCase(),
          verified_response: result.answer_english,
          whiteboard_summary: result.whiteboard_summary,
          timestamp: new Date().toISOString(),
          context: "student_mode_mid_doubt",
        });

        const follow =
          language === "tanglish"
            ? `${spoken} Innum doubt irukkaa? Mic-la keelungka. Illaina 'continue' sollunga — naan teach continue panren.`
            : `${spoken} Any more doubts? Ask on the mic. Or say 'continue' and I'll keep teaching.`;

        setPhase("mid_doubt_followup");
        void speak(follow, {
          onEnd: () => {
            setPhase("mid_doubt_listening");
            resetTranscript();
            startListening("doubt");
          },
        });
      } catch (e) {
        console.error(e);
        setPhase("mid_doubt_followup");
        void speak(
          language === "tanglish"
            ? "Answer generate panna mudiyala. Marupadiyum try pannunga, illaina 'continue' sollunga."
            : "I couldn't answer just now. Try again, or say 'continue'.",
          {
            onEnd: () => {
              setPhase("mid_doubt_listening");
              resetTranscript();
              startListening("doubt");
            },
          }
        );
      }
    },
    [
      lesson,
      language,
      dayNum,
      speak,
      stopListening,
      resetTranscript,
      startListening,
      resumeAfterMidDoubt,
    ]
  );

  const handleDoubt = useCallback(
    async (text: string) => {
      if (!lesson) return;
      const lower = text.toLowerCase();
      if (
        lower.includes("no doubt") ||
        lower.includes("no doubts") ||
        lower.includes("all clear") ||
        lower.includes("nothing") ||
        lower.includes("illai") ||
        /\billa\b/.test(lower)
      ) {
        finishLesson();
        return;
      }

      setPhase("doubt_answering");
      setSubtitles(
        language === "tanglish" ? "Ren answer panraanga..." : "Ren is answering..."
      );
      stopListening();

      try {
        const context = lesson.blocks
          .map((b) => `${b.heading}\n${b.board_text}`)
          .join("\n\n");
        const result = await answerDoubtWithGroq({
          question: text,
          lessonTitle: lesson.title,
          lessonContext: context,
          language,
        });
        const spoken =
          language === "tanglish"
            ? result.answer_tanglish || result.answer_english
            : result.answer_english || result.answer_tanglish;

        setHistory((prev) => [
          ...prev,
          {
            type: "write_points",
            points: String(result.whiteboard_summary)
              .split("\n")
              .map((l) => l.replace(/^[•\-]\s*/, "").trim())
              .filter(Boolean),
          },
        ]);

        await saveDoubtToMasterDatas({
          lesson_id: `SM-D${dayNum}`,
          source_language: language,
          question: {
            english: result.question_english,
            tanglish: result.question_tanglish,
          },
          answer: {
            english: result.answer_english,
            tanglish: result.answer_tanglish,
          },
          expected_intent: result.question_english.slice(0, 120).toLowerCase(),
          verified_response: result.answer_english,
          whiteboard_summary: result.whiteboard_summary,
          timestamp: new Date().toISOString(),
          context: "student_mode_doubt",
        });

        const follow =
          language === "tanglish"
            ? `${spoken} Innum ethavathu doubt irukkaa? Mic-la keelungka, illaina 'no doubts' sollunga.`
            : `${spoken} Any other doubts? Ask on the mic, or say 'no doubts'.`;
        void speak(follow, () => startDoubtListening());
      } catch (e) {
        console.error(e);
        void speak(
          language === "tanglish"
            ? "Answer generate panna mudiyala. Marupadiyum try pannunga, illaina 'no doubts' sollunga."
            : "I couldn't answer just now. Try again, or say 'no doubts'.",
          () => startDoubtListening()
        );
      }
    },
    [
      lesson,
      language,
      dayNum,
      finishLesson,
      speak,
      stopListening,
      startDoubtListening,
    ]
  );

  useEffect(() => {
    if (isListening || !transcript.trim() || !lesson) return;
    const text = transcript.trim();
    const runId = runIdRef.current;

    if (phase === "check_listening" && activeCheckRef.current) {
      gradeCheck(
        activeCheckRef.current,
        text,
        lesson,
        blockIndexRef.current,
        runId
      );
      return;
    }

    if (phase === "mid_doubt_listening" || phase === "mid_doubt_followup") {
      void handleMidDoubt(text);
      return;
    }

    if (phase === "doubt_listening") {
      void handleDoubt(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const togglePause = () => {
    if (paused) {
      setPaused(false);
      pausedRef.current = false;
      if (lesson) playBlock(blockIndex, lesson, runIdRef.current);
    } else {
      setPaused(true);
      pausedRef.current = true;
      clearBoardTimers();
      stop();
      stopListening();
    }
  };

  if (!lesson) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#020609] text-slate-300">
        <p>Lesson SM-D{dayNum} not found.</p>
        <Button onClick={() => navigate("/learning")}>Back to Learn</Button>
      </div>
    );
  }

  const stepLabel =
    phase === "summary"
      ? "Summary"
      : phase.startsWith("mid_doubt")
        ? "Mid-class doubt"
        : phase.startsWith("doubt")
          ? "Doubt"
          : `Step ${Math.min(blockIndex + 1, lesson.blocks.length)} / ${lesson.blocks.length}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020609] text-slate-100">
      <header className="flex shrink-0 items-center gap-3 border-b border-amber-500/20 px-4 py-3">
        <button
          type="button"
          onClick={() => {
            stop();
            stopListening();
            clearBoardTimers();
            runIdRef.current += 1;
            navigate("/learning");
          }}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-brand">
            Day {dayNum} · Live class · 8-step
          </p>
          <h1 className="truncate text-sm font-semibold text-white">
            {lesson.title}
          </h1>
        </div>
        <StudentLanguageToggle
          language={language}
          onChange={(lang) => setLanguage(lang)}
          section="learn"
        />
      </header>

      <div className="relative min-h-0 flex-1">
        <VoiceWhiteboard history={history} lessonTitle={lesson.title} />

        <div className="absolute left-4 top-4 z-40 max-w-sm rounded-lg border border-white/10 bg-[#030914]/90 px-3 py-2 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-brand">
            {paused
              ? "Paused"
              : phase === "teaching"
                ? "Ren is teaching"
                : phase === "check_listening"
                  ? "Your turn — answer on mic"
                  : phase === "check_feedback"
                    ? "Feedback"
                    : phase === "summary"
                      ? "Summary"
                      : phase === "mid_doubt_listening" ||
                          phase === "mid_doubt_followup"
                        ? "Hand raised — your doubt"
                        : phase === "mid_doubt_answering"
                          ? "Ren clarifying"
                          : phase === "doubt_listening" || phase === "doubt_prompt"
                            ? "Doubt session"
                            : phase === "doubt_answering"
                              ? "Answering"
                              : "Live"}
          </p>
          <p className="mt-0.5 text-xs text-slate-300">{subtitles}</p>
          {isListening && (
            <p className="mt-1 flex items-center gap-1.5 text-xs italic text-amber-200/90">
              <Mic className="h-3 w-3 animate-pulse" />
              {transcript ? `"${transcript}"` : "Listening…"}
            </p>
          )}
        </div>

        <div className="absolute bottom-6 right-6 z-50 flex flex-wrap items-center justify-end gap-2">
          {(phase === "teaching" ||
            phase === "summary" ||
            phase === "check_feedback") &&
            !paused && (
              <Button
                size="sm"
                onClick={interruptForDoubt}
                className="bg-amber-500 font-semibold text-black hover:bg-amber-400"
              >
                <HandMetal className="mr-2 h-4 w-4" /> Ask Ren
              </Button>
            )}

          {(phase === "check_listening" ||
            phase === "doubt_listening" ||
            phase === "doubt_prompt" ||
            phase === "mid_doubt_listening" ||
            phase === "mid_doubt_followup") &&
            !isListening &&
            !paused && (
              <Button
                size="sm"
                onClick={() => {
                  resetTranscript();
                  startListening("doubt");
                  if (phase === "doubt_prompt") setPhase("doubt_listening");
                  if (phase === "mid_doubt_followup")
                    setPhase("mid_doubt_listening");
                }}
                className="bg-amber-500 font-semibold text-black hover:bg-amber-400"
              >
                <Mic className="mr-2 h-4 w-4" /> Start mic
              </Button>
            )}

          {(phase === "mid_doubt_listening" ||
            phase === "mid_doubt_followup") && (
            <Button
              size="sm"
              variant="outline"
              className="border-white/15 text-slate-300"
              onClick={resumeAfterMidDoubt}
            >
              <Play className="mr-2 h-3.5 w-3.5" /> Continue class
            </Button>
          )}

          {(phase === "doubt_listening" || phase === "doubt_prompt") && (
            <Button
              size="sm"
              variant="outline"
              className="border-white/15 text-slate-300"
              onClick={finishLesson}
            >
              <HandMetal className="mr-2 h-3.5 w-3.5" /> No doubts
            </Button>
          )}

          {(phase === "doubt_answering" || phase === "mid_doubt_answering") && (
            <p className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-[#030914]/90 px-3 py-2 text-[10px] uppercase tracking-widest text-amber-200">
              <Loader2 className="h-3 w-3 animate-spin" /> Groq answering
            </p>
          )}

          {!phase.startsWith("mid_doubt") && (
            <Button
              size="sm"
              variant="outline"
              className="border-white/15 bg-[#030914]/80 text-slate-200"
              onClick={togglePause}
            >
              {paused ? (
                <>
                  <Play className="mr-2 h-3.5 w-3.5" /> Resume
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-3.5 w-3.5" /> Pause
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-amber-500/10 px-4 py-2 text-center text-[10px] uppercase tracking-widest text-slate-500">
        Live · {stepLabel}
      </div>
    </div>
  );
}
