import { useEffect, useMemo, useState } from "react";
import {
  getReadinessCheck,
  getStudentCurriculum,
  getStudentLessonsForDay,
  getStudentWorkspace,
} from "@/data/cloud/student_mode";
import {
  getCompletedItemIds,
  getStudentLanguage,
  isDayUnlocked,
  isDayWorkspaceComplete,
  isProfessionalUnlocked,
  isReadinessAvailable,
  setStudentLanguage,
} from "@/data/cloud/studentModeProgress";
import type { StudentLanguage } from "@/types/studentMode";
import { StudentDayNav } from "./StudentDayNav";
import { StudentLanguageToggle } from "./StudentLanguageToggle";
import { StudentLessonBoard } from "./StudentLessonBoard";
import { StudentWorkspacePanel } from "./StudentWorkspacePanel";
import { StudentReadinessCheck } from "./StudentReadinessCheck";
import { Button } from "@/components/ui/button";

type Phase = "lesson" | "workspace" | "readiness";

/**
 * Student Mode shell — orientation only.
 * Full-screen board, Ren voice only (no avatar), EN/Tanglish files.
 */
export default function StudentModeShell() {
  const curriculum = useMemo(() => getStudentCurriculum(), []);
  const [language, setLanguage] = useState<StudentLanguage>(() =>
    getStudentLanguage()
  );
  const [activeDay, setActiveDay] = useState(1);
  const [phase, setPhase] = useState<Phase>("lesson");
  const [blockIndex, setBlockIndex] = useState(0);
  const [partIndex, setPartIndex] = useState(0);
  const [tick, setTick] = useState(0);

  const lessons = useMemo(
    () => getStudentLessonsForDay(activeDay, language),
    [activeDay, language]
  );
  const lesson = lessons[partIndex] || lessons[0];
  const workspace = getStudentWorkspace(activeDay);
  const readiness = getReadinessCheck();

  useEffect(() => {
    setStudentLanguage(language);
  }, [language]);

  useEffect(() => {
    setPartIndex(0);
    setBlockIndex(0);
    setPhase("lesson");
  }, [activeDay, language]);

  const dayProgress = useMemo(() => {
    void tick;
    const map: Record<
      number,
      { done: number; total: number; unlocked: boolean; complete: boolean }
    > = {};
    for (const d of curriculum.days) {
      const ws = getStudentWorkspace(d.day);
      const total = ws?.items.length || 0;
      const done = getCompletedItemIds(d.day).length;
      map[d.day] = {
        done: Math.min(done, total),
        total,
        unlocked: isDayUnlocked(d.day),
        complete: isDayWorkspaceComplete(d.day),
      };
    }
    return map;
  }, [curriculum.days, tick]);

  const bump = () => setTick((n) => n + 1);

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col rounded-2xl border border-white/10 bg-[#05080d] text-slate-100 overflow-hidden">
      {/* Top chrome: day nav + language — no avatar */}
      <div className="shrink-0 space-y-3 border-b border-white/10 px-4 py-4 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400/90">
              Student Mode · {curriculum.hours_ceiling}h ceiling
            </p>
            <h1 className="mt-1 text-lg font-semibold text-white">
              Cloud orientation
            </h1>
          </div>
          <StudentLanguageToggle
            language={language}
            onChange={(lang) => setLanguage(lang)}
          />
        </div>
        <StudentDayNav
          days={curriculum.days}
          activeDay={activeDay}
          progress={dayProgress}
          onSelectDay={(d) => {
            setActiveDay(d);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={phase === "lesson" ? "default" : "outline"}
            className={
              phase === "lesson"
                ? "bg-amber-500 text-black hover:bg-amber-400"
                : "border-white/15"
            }
            onClick={() => {
              setPhase("lesson");
              setBlockIndex(0);
            }}
          >
            Lesson board
          </Button>
          <Button
            size="sm"
            variant={phase === "workspace" ? "default" : "outline"}
            className={
              phase === "workspace"
                ? "bg-amber-500 text-black hover:bg-amber-400"
                : "border-white/15"
            }
            onClick={() => setPhase("workspace")}
          >
            Workspace
          </Button>
          {activeDay === 5 && (
            <Button
              size="sm"
              variant={phase === "readiness" ? "default" : "outline"}
              disabled={!isReadinessAvailable() && !isProfessionalUnlocked()}
              className={
                phase === "readiness"
                  ? "bg-violet-500 text-white hover:bg-violet-400"
                  : "border-violet-400/30 text-violet-200"
              }
              onClick={() => setPhase("readiness")}
            >
              Readiness Check
            </Button>
          )}
          {isProfessionalUnlocked() && (
            <span className="self-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-wider text-emerald-200">
              Professional Mode unlocked
            </span>
          )}
        </div>
      </div>

      {/* Main surface */}
      <div className="min-h-0 flex-1">
        {phase === "lesson" && lesson && (
          <StudentLessonBoard
            key={`${lesson.day}-${lesson.language}-${partIndex}`}
            lesson={lesson}
            blockIndex={blockIndex}
            onBlockIndex={setBlockIndex}
            onFinished={() => {
              if (partIndex < lessons.length - 1) {
                setPartIndex(partIndex + 1);
                setBlockIndex(0);
                return;
              }
              setPhase("workspace");
            }}
          />
        )}
        {phase === "lesson" && !lesson && (
          <div className="flex h-full items-center justify-center p-8 text-slate-400">
            Lesson file missing for Day {activeDay} ({language}). Drop content
            into student_mode when ready.
          </div>
        )}
        {phase === "workspace" && workspace && (
          <StudentWorkspacePanel
            key={`ws-${activeDay}-${tick}`}
            day={activeDay}
            workspace={workspace}
            language={language}
            onComplete={() => {
              bump();
              if (activeDay < 5 && isDayUnlocked(activeDay + 1)) {
                /* unlock reflected via bump */
              }
              if (activeDay === 5) {
                setPhase("readiness");
              }
            }}
          />
        )}
        {phase === "workspace" && !workspace && (
          <div className="flex h-full items-center justify-center p-8 text-slate-400">
            Workspace file missing for Day {activeDay}.
          </div>
        )}
        {phase === "readiness" && (
          <StudentReadinessCheck
            check={readiness}
            language={language}
            onClose={() => {
              bump();
              setPhase("lesson");
            }}
            onRevisitDay={(day) => {
              setActiveDay(day);
              setPhase("lesson");
              bump();
            }}
          />
        )}
      </div>
    </div>
  );
}
