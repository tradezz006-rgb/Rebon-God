import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getProfessionalCurriculum } from "@/data/cloud/professional_mode";
import { useSettings } from "@/contexts/SettingsContext";
import {
  CloudDeskShell,
  CloudLessonRow,
  CloudPhaseBlock,
} from "@/components/cloud/CloudDeskShell";

/**
 * Professional Learn — topic sessions → console screen-share lessons with Ren.
 */
export function ProfessionalLessonCatalog() {
  const navigate = useNavigate();
  const curriculum = useMemo(() => getProfessionalCurriculum(), []);
  const { teachLanguage, setTeachLanguage } = useSettings();
  const [activeSession, setActiveSession] = useState<string | null>(
    () => curriculum.topics[0]?.session ?? "PM-0"
  );

  const availableCount = curriculum.topics.reduce(
    (n, t) => n + t.lessons.filter((l) => l.available).length,
    0
  );
  const totalCount = curriculum.topics.reduce(
    (n, t) => n + t.lessons.length,
    0
  );

  return (
    <CloudDeskShell
      section="learn"
      title="Console path"
      subtitle="Ren screen-shares AWS. You watch, answer, then take the console. Work tickets come after."
      progress={{ done: availableCount, total: totalCount }}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          Lesson language
        </span>
        {(["english", "tanglish"] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setTeachLanguage(lang)}
            className={`rounded-md px-2.5 py-1 text-xs capitalize ${
              teachLanguage === lang
                ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
      {curriculum.topics.map((topic, pIndex) => {
        const isOpen = activeSession === topic.session;
        const ready = topic.lessons.filter((l) => l.available).length;

        return (
          <CloudPhaseBlock
            key={topic.session}
            section="learn"
            index={pIndex + 1}
            title={topic.title}
            description={topic.description}
            meta={`${topic.session} · ${ready}/${topic.lessons.length} live`}
            open={isOpen}
            onToggle={() =>
              setActiveSession(isOpen ? null : topic.session)
            }
          >
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  {topic.lessons.map((lesson) => (
                    <CloudLessonRow
                      key={lesson.id}
                      section="learn"
                      title={`${lesson.id} · ${lesson.title}`}
                      description={
                        lesson.available
                          ? `Console screen share · ${teachLanguage}`
                          : "Content coming — engine ready for this slot"
                      }
                      meta={
                        lesson.available
                          ? `${lesson.duration_minutes} min`
                          : "Soon"
                      }
                      disabled={!lesson.available}
                      onClick={() => {
                        if (!lesson.available) return;
                        navigate(`/lesson/${lesson.id}`);
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CloudPhaseBlock>
        );
      })}
    </CloudDeskShell>
  );
}
