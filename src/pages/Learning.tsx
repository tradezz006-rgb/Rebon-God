import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDomain } from "@/contexts/DomainContext";
import { useAva } from "@/contexts/AvaContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import DomainNavbar from "@/components/app/DomainNavbar";
import LevelSelection from "@/components/learning/LevelSelection";
import InitialQuiz from "@/components/learning/InitialQuiz";
import VoiceAssessment from "@/components/learning/VoiceAssessment";
import LearningDashboard from "@/components/learning/LearningDashboard";
import { useRebonMode } from "@/components/cloud/RebonModeSwitcher";
import { StudentLessonCatalog } from "@/components/cloud/studentMode/StudentLessonCatalog";
import { ProfessionalLessonCatalog } from "@/components/cloud/professionalMode/ProfessionalLessonCatalog";
import { ModePlaceholder } from "@/components/cloud/ModePlaceholder";
import { BookOpen, Mic, ClipboardCheck, Route } from "lucide-react";
import { AUTH_REQUIRED } from "@/lib/authGate";

type LearningStep = "level" | "quiz" | "voice" | "dashboard";

/**
 * Cloud Learn → mode switcher (Student / Professional / AI Professional).
 * Student: lesson list → board only (no workspace in Learn).
 * Communication domain keeps assessment → roadmap.
 */
const Learning = () => {
  const { user, loading } = useAuth();
  const { domain, setSection } = useDomain();
  const { triggerAva } = useAva();
  const navigate = useNavigate();
  const [mode] = useRebonMode();
  const [step, setStep] = useState<LearningStep>("level");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [isGeneratingRoadmap] = useState(false);
  const firstVisitTriggered = useRef(false);

  useEffect(() => {
    setSection("learning");
  }, [setSection]);

  useEffect(() => {
    if (AUTH_REQUIRED && !loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkAssessment = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("assessment_completed, communication_level")
          .eq("user_id", user.id)
          .single();

        if (data?.assessment_completed) {
          setAssessmentCompleted(true);
          setSelectedLevel(data.communication_level);
          setStep("dashboard");
        } else if (!firstVisitTriggered.current) {
          firstVisitTriggered.current = true;
          triggerAva("first_visit", { level: "Beginner", domain });
        }
      }
    };
    checkAssessment();
  }, [user, domain]);

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
    setStep("quiz");
  };

  const handleQuizComplete = async (score: number, maxScore: number) => {
    if (user) {
      await supabase.from("quiz_results").insert({
        user_id: user.id,
        quiz_type: "initial",
        score,
        max_score: maxScore,
      });
    }
    setStep("voice");
  };

  const handleVoiceComplete = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({
          assessment_completed: true,
          communication_level: selectedLevel,
        })
        .eq("user_id", user.id);
    }
    setAssessmentCompleted(true);
    setStep("dashboard");
    toast({
      title: "Assessment Complete!",
      description: "Your personalized learning roadmap is ready.",
    });
  };

  if ((AUTH_REQUIRED && loading) || isGeneratingRoadmap) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        {isGeneratingRoadmap && (
          <p className="text-muted-foreground animate-pulse">
            Internal AI is building your personalized roadmap...
          </p>
        )}
      </div>
    );
  }

  const communicationSteps = [
    { id: "level", label: "Select Level", icon: Route },
    { id: "quiz", label: "English Quiz", icon: ClipboardCheck },
    { id: "voice", label: "Voice Assessment", icon: Mic },
    { id: "dashboard", label: "Your Roadmap", icon: BookOpen },
  ];

  const currentStepIndex = communicationSteps.findIndex((s) => s.id === step);

  const renderCloudLearn = () => {
    if (mode === "student") return <StudentLessonCatalog />;
    if (mode === "professional") return <ProfessionalLessonCatalog />;
    return <ModePlaceholder mode="ai_professional" section="learn" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <DomainNavbar />

      <main
        className={
          domain === "fullstack"
            ? "mx-auto w-full max-w-4xl px-4 pt-28 pb-10 md:px-6"
            : "container mx-auto px-4 pt-32 pb-12"
        }
      >
        {domain === "communication" ? (
          <>
            {!assessmentCompleted && (
              <div className="mb-16 flex items-center justify-center gap-3">
                {communicationSteps.slice(0, -1).map((s, index) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span
                      className={`text-[11px] uppercase tracking-[0.2em] ${
                        index <= currentStepIndex
                          ? "text-amber-brand"
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {s.label}
                    </span>
                    {index < communicationSteps.length - 2 && (
                      <span
                        className={`w-8 h-px ${
                          index < currentStepIndex
                            ? "bg-[#F59E0B]/50"
                            : "bg-white/10"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === "level" && (
                <motion.div
                  key="level"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <LevelSelection onSelect={handleLevelSelect} />
                </motion.div>
              )}

              {step === "quiz" && selectedLevel && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <InitialQuiz
                    level={selectedLevel}
                    onComplete={handleQuizComplete}
                  />
                </motion.div>
              )}

              {step === "voice" && (
                <motion.div
                  key="voice"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <VoiceAssessment onComplete={handleVoiceComplete} />
                </motion.div>
              )}

              {step === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <LearningDashboard />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          renderCloudLearn()
        )}
      </main>
    </div>
  );
};

export default Learning;
