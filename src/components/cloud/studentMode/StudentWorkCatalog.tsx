import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import {
  getStudentCurriculum,
  getStudentWorkspace,
} from "@/data/cloud/student_mode";
import {
  getStudentLanguage,
  setStudentLanguage,
} from "@/data/cloud/studentModeProgress";
import { StudentLanguageToggle } from "@/components/cloud/studentMode/StudentLanguageToggle";
import { StudentWorkspacePanel } from "@/components/cloud/studentMode/StudentWorkspacePanel";
import {
  CloudDeskShell,
  CloudLessonRow,
  CloudPhaseBlock,
} from "@/components/cloud/CloudDeskShell";
import type { StudentLanguage } from "@/types/studentMode";

/** Student Work — violet Work theme, same expandable path UX as Learn. */
export function StudentWorkCatalog() {
  const curriculum = useMemo(() => getStudentCurriculum(), []);
  const [language, setLanguage] = useState<StudentLanguage>(() =>
    getStudentLanguage()
  );
  const [activeDay, setActiveDay] = useState<number | null>(
    () => curriculum.days[0]?.day ?? 1
  );
  const [solvingDay, setSolvingDay] = useState<number | null>(null);

  const workspace =
    solvingDay != null ? getStudentWorkspace(solvingDay) : null;
  const dayMeta = curriculum.days.find((d) => d.day === solvingDay);

  if (solvingDay != null && workspace) {
    return (
      <CloudDeskShell
        section="work"
        title={dayMeta?.title || `Day ${solvingDay}`}
        subtitle="Solve the problems for this day. Language follows your Learn preference."
        actions={
          <>
            <button
              type="button"
              onClick={() => setSolvingDay(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3.5 py-2 text-[12px] font-semibold text-muted-foreground transition hover:border-[#7C3AED]/50 hover:text-violet-brand"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All problems
            </button>
            <StudentLanguageToggle
              language={language}
              onChange={(lang) => {
                setLanguage(lang);
                setStudentLanguage(lang);
              }}
              section="work"
            />
          </>
        }
      >
        <div className="border-b border-white/[0.08] py-8">
          <StudentWorkspacePanel
            day={solvingDay}
            workspace={workspace}
            language={language}
            onComplete={() => setSolvingDay(null)}
          />
        </div>
      </CloudDeskShell>
    );
  }

  return (
    <CloudDeskShell
      section="work"
      title="Your problems"
      subtitle="Practice what Ren taught. Problem sets stay open — not locked behind Learn."
      actions={
        <StudentLanguageToggle
          language={language}
          onChange={(lang) => {
            setLanguage(lang);
            setStudentLanguage(lang);
          }}
          section="work"
        />
      }
      progress={{
        done: 0,
        total: curriculum.days.filter((d) => (getStudentWorkspace(d.day)?.items.length ?? 0) > 0)
          .length,
      }}
    >
      {curriculum.days.map((d, pIndex) => {
        const ws = getStudentWorkspace(d.day);
        const count = ws?.items?.length ?? 0;
        const isOpen = activeDay === d.day;

        return (
          <CloudPhaseBlock
            key={d.day}
            section="work"
            index={pIndex + 1}
            title={d.title}
            description={
              count > 0
                ? "Quizzes and scenarios for this day."
                : "Problems coming soon for this day."
            }
            meta={`Day ${d.day} · ${count} problems`}
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
                    section="work"
                    title={`${d.title} · problems`}
                    description={
                      count > 0
                        ? "Open the problem set for this day"
                        : "No problems yet"
                    }
                    meta={`${count} items`}
                    disabled={count === 0}
                    onClick={() => setSolvingDay(d.day)}
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
