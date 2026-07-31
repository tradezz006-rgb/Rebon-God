import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Check, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cloudSessions } from "@/data/sessions";

const CloudLearningDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [activePhase, setActivePhase] = useState<string | null>("W1");

  const phasesData: any[] = cloudSessions.map((session) => ({
    section_id: session.session_id,
    section_name: session.session_name,
    section_description: session.session_description,
    phase_theme: session.session_name,
    lessons: session.lessons || [],
  }));

  let allLessons: any[] = [];
  phasesData.forEach((s: any) => {
    allLessons = [...allLessons, ...s.lessons];
  });

  useEffect(() => {
    if (phasesData.length > 0) {
      const firstId = phasesData[0].section_id || phasesData[0].phase_id;
      setActivePhase((prev) => (prev === "W1" ? firstId : prev));
    }
  }, [phasesData]);

  const getPhaseKey = (p: any) => p.section_id || p.phase_id;

  useEffect(() => {
    const fetchProgress = async () => {
      if (user) {
        const { data } = await supabase
          .from("learning_progress")
          .select("*")
          .eq("user_id", user.id);

        if (data) {
          const progressMap: Record<string, any> = {};
          data.forEach((p) => {
            progressMap[p.video_id] = p;
          });
          setProgress(progressMap);
        }
      }
    };
    fetchProgress();
  }, [user]);

  const completedVideos = allLessons.filter(
    (l: any) => progress[l.id || l.lesson_id]?.quiz_passed
  ).length;
  const totalVideos = allLessons.length;
  const progressPercentage =
    totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto pb-24 pt-2">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <p className="text-[11px] uppercase tracking-[0.28em] text-amber-brand mb-5">
          Your path
        </p>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-[1.1] mb-4">
          Engineering
        </h1>
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mb-10">
          Learn with Ren. Ship real work. Leave with proof — not a certificate.
        </p>

        <div className="flex items-end justify-between gap-6 border-b border-white/[0.08] pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
              Progress
            </p>
            <p className="font-display text-sm text-foreground">
              {completedVideos} of {totalVideos} lessons
            </p>
          </div>
          <p className="font-display text-3xl font-semibold text-amber-brand tabular-nums">
            {Math.round(progressPercentage)}%
          </p>
        </div>
        <div className="h-px w-full bg-white/[0.06] mt-0 overflow-hidden">
          <motion.div
            className="h-full bg-[#F59E0B]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>

      <div className="border-t border-white/[0.08]">
        {phasesData.map((phaseData: any, pIndex: number) => {
          const phaseKey = getPhaseKey(phaseData);
          const phaseLessons = phaseData.lessons || [];
          const isPhaseActive = activePhase === phaseKey;
          const phaseCompleted = phaseLessons.filter(
            (l: any) => progress[l.id || l.lesson_id]?.quiz_passed
          ).length;
          const isPhaseUnlocked = true;

          return (
            <motion.div
              key={phaseKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pIndex * 0.06 }}
              className="border-b border-white/[0.08]"
            >
              <button
                type="button"
                className="w-full grid grid-cols-[3.5rem_1fr_auto] gap-4 md:gap-6 items-start text-left py-7 hover:bg-white/[0.015] transition-colors"
                onClick={() => {
                  if (isPhaseUnlocked) {
                    setActivePhase(isPhaseActive ? null : phaseKey);
                  }
                }}
              >
                <span className="font-display text-sm text-amber-brand/80 pt-1 tracking-wider">
                  {String(pIndex + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-1">
                    {phaseData.section_name || phaseData.phase_name}
                  </h2>
                  {(phaseData.section_description || phaseData.phase_theme) && (
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-2">
                      {phaseData.section_description || phaseData.phase_theme}
                    </p>
                  )}
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    {phaseCompleted} / {phaseLessons.length} complete
                  </p>
                </div>
                <span className="font-display text-lg text-muted-foreground/50 mt-1">
                  {isPhaseActive ? "−" : "+"}
                </span>
              </button>

              <AnimatePresence>
                {isPhaseActive && isPhaseUnlocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-6 pl-0 md:pl-[3.5rem]">
                      {phaseLessons.map((lesson: any) => {
                        const videoProgress =
                          progress[lesson.id || lesson.lesson_id];
                        const isCompleted = videoProgress?.quiz_passed;
                        const isLessonUnlocked = true;
                        const mins =
                          lesson.estimated_duration_minutes ||
                          lesson.duration_estimate ||
                          15;

                        return (
                          <button
                            key={lesson.id || lesson.lesson_id}
                            type="button"
                            disabled={!isLessonUnlocked}
                            onClick={() => {
                              if (isLessonUnlocked) {
                                navigate(
                                  `/lesson/${lesson.id || lesson.lesson_id}`
                                );
                              }
                            }}
                            className={`group w-full flex items-start gap-4 py-5 border-t border-white/[0.06] text-left transition-colors ${
                              isLessonUnlocked
                                ? "hover:bg-white/[0.02]"
                                : "opacity-40 cursor-not-allowed"
                            }`}
                          >
                            <span className="mt-1 w-5 shrink-0 flex justify-center">
                              {isCompleted ? (
                                <Check className="w-4 h-4 text-amber-brand" />
                              ) : !isLessonUnlocked ? (
                                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-white/25 mt-1.5" />
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display text-base md:text-lg font-medium text-foreground group-hover:text-amber-brand transition-colors mb-1">
                                {lesson.title || lesson.lesson_title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                {lesson.lesson_purpose ||
                                  lesson.concept_explanation?.what_is_this ||
                                  "Core foundations with Ren."}
                              </p>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/60 mt-2">
                                {mins} min
                              </p>
                            </div>
                            {isLessonUnlocked && (
                              <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-amber-brand mt-1 shrink-0 transition-colors" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CloudLearningDashboard;
