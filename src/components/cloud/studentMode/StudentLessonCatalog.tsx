import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  getStudentCurriculum,
  getStudentLessonsForDay,
} from "@/data/cloud/student_mode";
import {
  getStudentLanguage as getLang,
  setStudentLanguage,
} from "@/data/cloud/studentModeProgress";
import { StudentLanguageToggle } from "@/components/cloud/studentMode/StudentLanguageToggle";
import {
  CloudDeskShell,
  CloudLessonRow,
  CloudPhaseBlock,
} from "@/components/cloud/CloudDeskShell";
import type { StudentLanguage } from "@/types/studentMode";

/**
 * Student Learn — same UX language as the old CloudLearningDashboard:
 * gold Learn theme, expandable day sections, lesson rows → board.
 */
export function StudentLessonCatalog() {
  const navigate = useNavigate();
  const curriculum = useMemo(() => getStudentCurriculum(), []);
  const [language, setLanguage] = useState<StudentLanguage>(() => getLang());
  const [activeDay, setActiveDay] = useState<number | null>(
    () => curriculum.days[0]?.day ?? 1
  );

  useEffect(() => {
    setStudentLanguage(language);
  }, [language]);

  return (
    <CloudDeskShell
      section="learn"
      title="Your path"
      subtitle="Learn with Ren. Open a lesson, follow the board, ask doubts when you finish."
      actions={
        <StudentLanguageToggle
          language={language}
          onChange={setLanguage}
          section="learn"
        />
      }
      progress={{ done: 0, total: curriculum.days.length }}
    >
      {curriculum.days.map((d, pIndex) => {
        const lesson = getStudentLessonsForDay(d.day, language)[0];
        const title = lesson?.title || d.title;
        const mins = lesson?.duration_minutes;
        const isOpen = activeDay === d.day;

        return (
          <CloudPhaseBlock
            key={d.day}
            section="learn"
            index={pIndex + 1}
            title={title}
            description={
              d.has_readiness_badge
                ? "Ends with Console Readiness after this week’s concepts."
                : "Core foundations with Ren on the board."
            }
            meta={`Day ${d.day}${mins ? ` · ${mins} min` : ""}${
              d.has_readiness_badge ? " · Readiness" : ""
            }`}
            open={isOpen}
            onToggle={() => setActiveDay(isOpen ? null : d.day)}
          >
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <CloudLessonRow
                    section="learn"
                    title={title}
                    description="Board session with Ren · doubt check at the end"
                    meta={mins ? `${mins} min` : "Lesson"}
                    onClick={() => navigate(`/lesson/SM-D${d.day}`)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </CloudPhaseBlock>
        );
      })}
    </CloudDeskShell>
  );
}
