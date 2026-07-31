import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAva } from "@/contexts/AvaContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AvaWelcome from "@/components/ava/AvaWelcome";
import {
  CheckCircle, Lock, BookOpen, Clock, Trophy,
  ChevronRight, Target, BarChart, GraduationCap, HelpCircle, ChevronDown
} from "lucide-react";
import { sessions, getAllLessons } from '@/data/sessions';

interface VideoProgress {
  video_id: string;
  marked_understood: boolean;
  quiz_passed: boolean;
  watched_seconds: number;
}

const LearningDashboard = () => {
  const { user } = useAuth();
  const { askAva } = useAva();
  const [userLevel, setUserLevel] = useState<string>("beginner");
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const navigate = useNavigate();
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [levelProgress, setLevelProgress] = useState(0);
  const [showAvaWelcome, setShowAvaWelcome] = useState(false);
  
  // New System Variables
  const [groupedLessons, setGroupedLessons] = useState<Record<string, any[]>>({});
  const [expandedWeek, setExpandedWeek] = useState<string>("W1");
  const [totalLessons, setTotalLessons] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("communication_level, overall_score")
          .eq("user_id", user.id)
          .single();

        const currentLevel = profile?.communication_level || "beginner";
        setUserLevel(currentLevel);
        if (profile) {
          setTotalScore(profile.overall_score || 0);
        }

        const { data: progress } = await supabase
          .from("learning_progress")
          .select("*")
          .eq("user_id", user.id);

        if (progress) {
          setVideoProgress(progress);
        }

        // Fetch offline generated JSON to prevent DB synchronization failures
        const rawLessons = getAllLessons();
        
        let activeLessons = rawLessons
            .map((l: any) => {
                const lid = l.id || l.lesson_id || "lesson_W1_D1";
                const parts = lid.split('_');
                const weekParam = parts[1] || `W${l.week || 1}`;
                const dayParam = parseInt(parts[2]?.replace('D', '') || String(l.day || 1));
                return {
                    id: lid,
                    title: l.lesson_title || l.title || "Lesson",
                    description: (l.lesson_purpose || l.concept_explanation?.what_is_this || "").substring(0, 100) + '...',
                    duration: `${l.estimated_duration_minutes || l.duration_estimate || 15} min`,
                    quizLength: l.questions?.length || l.quizzes?.[0]?.questions?.length || 0,
                    weekParam,
                    dayParam
                };
            });

        // Sort by Day logically
        activeLessons.sort((a, b) => a.dayParam - b.dayParam);
        
        // Group by Week
        const grouped: Record<string, any[]> = {};
        activeLessons.forEach(lesson => {
            if (!grouped[lesson.weekParam]) grouped[lesson.weekParam] = [];
            grouped[lesson.weekParam].push(lesson);
        });
        
        // Sort Weeks logically (W1, W2, etc.)
        const sortedGrouped: Record<string, any[]> = {};
        Object.keys(grouped).sort((a, b) => parseInt(a.replace('W','')) - parseInt(b.replace('W',''))).forEach(k => {
            sortedGrouped[k] = grouped[k];
        });

        setGroupedLessons(sortedGrouped);
        setTotalLessons(activeLessons.length);

        const completedCount = progress?.filter(p => p.marked_understood && p.quiz_passed).length || 0;
        setOverallProgress((completedCount / (activeLessons.length || 1)) * 100);
        setLevelProgress(Math.min((completedCount / (activeLessons.length || 1)) * 100, 100));

        // Show AVA welcome if no progress yet
        if (!progress || progress.length === 0) {
          setShowAvaWelcome(true);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // To linearly check unlocks across weeks, we flatten it out again simply.
  const flatLessons = Object.values(groupedLessons).flat();

  const isVideoUnlocked = (videoId: string): boolean => {
    const flatIndex = flatLessons.findIndex(l => l.id === videoId);
    if (flatIndex === 0) return true;
    
    const previousVideo = flatLessons[flatIndex - 1];
    if (!previousVideo) return false;
    
    const previousProgress = videoProgress.find(p => p.video_id === previousVideo.id);
    return previousProgress?.marked_understood && previousProgress?.quiz_passed || false;
  };

  const isVideoCompleted = (videoId: string): boolean => {
    const progress = videoProgress.find(p => p.video_id === videoId);
    return progress?.marked_understood && progress?.quiz_passed || false;
  };

  const handleVideoClick = (videoId: string) => {
    if (isVideoUnlocked(videoId)) {
      navigate(`/lesson/${videoId}`);
    }
  };

  const currentLevelInfo = (() => {
    const levels = [
      { id: "beginner", name: "Beginner", color: "from-info to-primary" },
      { id: "moderate", name: "Moderate", color: "from-success to-primary" },
      { id: "pro", name: "Pro", color: "from-primary to-accent" },
      { id: "ultra_pro", name: "Ultra Pro", color: "from-primary to-coral" },
    ];
    return levels.find(l => l.id === userLevel) || levels[0];
  })();

  const completedCount = videoProgress.filter(p => p.marked_understood && p.quiz_passed).length;

  return (
    <div className="max-w-5xl mx-auto">
      <AnimatePresence>
        {showAvaWelcome && (
          <AvaWelcome
            userLevel={userLevel}
            lessonCount={totalLessons}
            onComplete={() => setShowAvaWelcome(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-emerald-400 tracking-widest font-mono">STUDENT ENGINE ACTIVE</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-2 text-white tracking-widest uppercase">
          COMMUNICATION <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">CURRICULUM</span>
        </h1>
        <p className="text-sm text-blue-200/60 max-w-lg mx-auto font-mono">
          Strict progression logic. Voice instruction and generated scenarios loaded.
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#050B14] border border-blue-900/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.05)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-950/50 border border-blue-800/50 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white tracking-widest text-lg">PROGRESS</h3>
              <p className="text-xs font-mono text-blue-300/70">
                {completedCount} / {totalLessons} LESSONS
              </p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-2 bg-blue-950 [&>div]:bg-blue-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-[#050B14] border border-blue-900/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.05)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentLevelInfo.color} flex items-center justify-center shadow-lg`}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white tracking-widest text-lg uppercase">{currentLevelInfo.name}</h3>
              <p className="text-xs font-mono text-blue-300/70">ACTIVE TIER</p>
            </div>
          </div>
          <Progress value={levelProgress} className="h-2 bg-blue-950 [&>div]:bg-indigo-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-[#050B14] border border-blue-900/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.05)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-800/50 flex items-center justify-center">
              <BarChart className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white tracking-widest text-lg">{totalScore.toFixed(1)}/10</h3>
              <p className="text-xs font-mono text-blue-300/70">METRIC SCORE</p>
            </div>
          </div>
          <Progress value={totalScore * 10} className="h-2 bg-blue-950 [&>div]:bg-emerald-500" />
        </motion.div>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedLessons).map((weekKey, index) => {
          const weekNum = weekKey.replace('W', '');
          const lessons = groupedLessons[weekKey];
          const isExpanded = expandedWeek === weekKey;
          
          const completedInWeek = lessons.filter(l => isVideoCompleted(l.id)).length;
          const totalInWeek = lessons.length;
          const isWeekLocked = !isVideoUnlocked(lessons[0].id) && flatLessons.findIndex(l => l.id === lessons[0].id) !== 0;

          return (
            <div key={weekKey} className="rounded-xl overflow-hidden border border-blue-900/30 bg-[#050B14]/80 backdrop-blur-md shadow-lg">
                <button 
                  onClick={() => setExpandedWeek(isExpanded ? '' : weekKey)}
                  className={`w-full px-6 py-5 flex items-center justify-between transition-colors ${isExpanded ? 'bg-blue-900/20' : 'hover:bg-blue-900/10'}`}
                >
                   <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-sm border ${isWeekLocked ? 'bg-black/50 text-blue-900/50 border-blue-900/30' : 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border-transparent'}`}>
                           W{weekNum}
                       </div>
                       <div className="text-left">
                           <h2 className={`font-black tracking-widest text-lg ${isWeekLocked ? 'text-blue-900/50' : 'text-white'}`}>PHASE {weekNum}</h2>
                           <p className="text-xs font-mono text-blue-400/60 uppercase">{completedInWeek}/{totalInWeek} MODULES SECURED</p>
                       </div>
                   </div>
                   <ChevronDown className={`w-5 h-5 text-blue-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: "auto", opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-blue-900/30"
                        >
                            <div className="p-4 space-y-2 bg-black/40">
                                {lessons.map((video) => {
                                  const unlocked = isVideoUnlocked(video.id);
                                  const completed = isVideoCompleted(video.id);

                                  return (
                                    <div
                                      key={video.id}
                                      onClick={() => handleVideoClick(video.id)}
                                      className={`rounded-lg p-4 flex items-center gap-4 transition-all border ${
                                        !unlocked
                                          ? "opacity-40 cursor-not-allowed border-transparent bg-transparent"
                                          : completed
                                          ? "border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-950/20 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                                          : "border-blue-500/30 hover:border-blue-400/60 bg-blue-950/20 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                      }`}
                                    >
                                      <div
                                        className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono border ${
                                          completed
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                            : !unlocked
                                            ? "bg-white/5 text-white/30 border-transparent"
                                            : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                                        }`}
                                      >
                                        {completed ? (
                                          <CheckCircle className="w-5 h-5" />
                                        ) : !unlocked ? (
                                          <Lock className="w-4 h-4" />
                                        ) : (
                                          `D${video.dayParam}`
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <h4 className={`font-bold uppercase tracking-wider text-sm mb-1 truncate ${completed ? 'text-emerald-100' : !unlocked ? 'text-blue-100/30' : 'text-blue-100'}`}>
                                            {video.title}
                                        </h4>
                                        <p className="text-xs font-mono text-blue-300/50 truncate pr-4">{video.description}</p>
                                      </div>

                                      <div className="flex items-center gap-4 text-xs flex-shrink-0 text-blue-400/80 font-mono">
                                        <div className="flex items-center gap-1.5 hidden sm:flex">
                                          <Clock className="w-3.5 h-3.5" />
                                          <span>{video.duration}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 hidden sm:flex">
                                          <Target className="w-3.5 h-3.5" />
                                          <span>{video.quizLength}Q</span>
                                        </div>
                                        {unlocked && !completed && (
                                          <ChevronRight className="w-5 h-5 text-blue-400 ml-2 animate-pulse" />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default LearningDashboard;
