import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDomain } from "@/contexts/DomainContext";
import { supabase } from "@/integrations/supabase/client";
import DomainNavbar from "@/components/app/DomainNavbar";
import SkillRadar from "@/components/profile/SkillRadar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  User, Trophy, TrendingUp, Target, Clock, Award, LogOut, 
  Calendar, Zap, Star, Activity, BarChart3, BookOpen, Code, Flame, Sparkles
} from "lucide-react";
import { AUTH_REQUIRED } from "@/lib/authGate";

interface ProfileData {
  full_name: string | null;
  communication_level: string;
  overall_score: number;
  fluency_score: number;
  clarity_score: number;
  confidence_score: number;
  tone_score: number;
  filler_words_score: number;
  structure_score: number;
  grammar_score: number;
  assessment_completed: boolean;
}

interface FullStackProfileData {
  fullstack_level: string;
  overall_score: number;
  frontend_score: number;
  backend_score: number;
  devops_score: number;
  system_design_score: number;
  code_quality_score: number;
  problem_solving_score: number;
  assessment_completed: boolean;
}

interface ScenarioProgress {
  scenario_id: string;
  overall_score: number;
  completed_at: string;
  duration_seconds: number | null;
}

// Calculate streak from an array of completion dates
function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniqueDays = [...new Set(dates.map(d => new Date(d).toISOString().slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  
  // Streak must include today or yesterday
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;
  
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const { domain, setSection } = useDomain();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fsProfile, setFsProfile] = useState<FullStackProfileData | null>(null);
  const [recentScenarios, setRecentScenarios] = useState<ScenarioProgress[]>([]);
  const [computedMetrics, setComputedMetrics] = useState({
    fluency: 0, clarity: 0, confidence: 0, tone: 0, 
    filler_words: 0, structure: 0, grammar: 0, overall: 0
  });
  const [stats, setStats] = useState({
    quizzesCompleted: 0,
    sessionsCompleted: 0,
    scenariosCompleted: 0,
    totalPracticeMinutes: 0,
    averageScore: 0,
    streakDays: 0,
    totalXp: 0,
    levelName: "Novice",
    streakBadge: "none",
  });

  useEffect(() => {
    setSection("profile");
  }, [setSection]);

  useEffect(() => {
    if (AUTH_REQUIRED && !loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) return;

      // Fetch profiles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (profileData) setProfile(profileData as ProfileData);

      const { data: fsData } = await supabase
        .from("fullstack_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (fsData) setFsProfile(fsData as FullStackProfileData);

      if (domain === "communication") {
        await fetchCommunicationStats(user.id);
      } else {
        await fetchFullStackStats(user.id);
      }
    };
    fetchAll();
  }, [user, domain]);

  const fetchCommunicationStats = async (userId: string) => {
    // Get ALL scenario progress to compute real averages
    const { data: scenarioData, count: scenarioCount } = await supabase
      .from("scenario_progress")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    const scenarios = scenarioData || [];
    setRecentScenarios(scenarios.slice(0, 5).map(s => ({
      scenario_id: s.scenario_id,
      overall_score: s.overall_score || 0,
      completed_at: s.completed_at,
      duration_seconds: s.duration_seconds,
    })));

    // Compute REAL average metrics from all completed scenarios that have scores
    const scored = scenarios.filter(s => s.overall_score != null && s.overall_score > 0);
    const avg = (field: string) => {
      const vals = scored.filter(s => (s as any)[field] != null && (s as any)[field] > 0);
      return vals.length > 0 ? vals.reduce((sum, s) => sum + ((s as any)[field] || 0), 0) / vals.length : 0;
    };

    const metrics = {
      fluency: avg("fluency_score"),
      clarity: avg("clarity_score"),
      confidence: avg("confidence_score"),
      tone: avg("tone_score"),
      filler_words: avg("filler_words_score"),
      structure: avg("structure_score"),
      grammar: avg("grammar_score"),
      overall: avg("overall_score"),
    };
    setComputedMetrics(metrics);

    // Update profile table with computed scores if we have scored scenarios
    if (scored.length > 0) {
      await supabase.from("profiles").update({
        overall_score: metrics.overall,
        fluency_score: metrics.fluency,
        clarity_score: metrics.clarity,
        confidence_score: metrics.confidence,
        tone_score: metrics.tone,
        filler_words_score: metrics.filler_words,
        structure_score: metrics.structure,
        grammar_score: metrics.grammar,
      }).eq("user_id", userId);
    }

    // Real practice time from duration_seconds
    const totalSeconds = scenarios.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

    // Voice sessions
    const { data: voiceSessions } = await supabase
      .from("voice_sessions")
      .select("duration_seconds, created_at")
      .eq("user_id", userId);
    const voiceSeconds = (voiceSessions || []).reduce((sum, v) => sum + (v.duration_seconds || 0), 0);

    // Quiz count
    const { count: quizCount } = await supabase
      .from("quiz_results")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("quiz_type", "fullstack_initial");

    // Real streak from streaks table
    const { data: streakData } = await supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle();
    const streak = streakData?.current_streak || 0;
    const streakBadge = streakData?.streak_badge || "none";

    // XP
    const { data: xpData } = await supabase.from("xp_levels").select("*").eq("user_id", userId).maybeSingle();

    setStats({
      quizzesCompleted: quizCount || 0,
      sessionsCompleted: (voiceSessions || []).length,
      scenariosCompleted: scenarioCount || 0,
      totalPracticeMinutes: Math.round((totalSeconds + voiceSeconds) / 60),
      averageScore: metrics.overall,
      streakDays: streak,
      totalXp: xpData?.total_xp || 0,
      levelName: xpData?.level_name || "Novice",
      streakBadge,
    });
  };

  const fetchFullStackStats = async (userId: string) => {
    const { data: fsScenarioData, count: fsScenarioCount } = await supabase
      .from("fullstack_scenario_progress")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    const scenarios = fsScenarioData || [];
    setRecentScenarios(scenarios.slice(0, 5).map(s => ({
      scenario_id: s.scenario_id,
      overall_score: s.overall_score || 0,
      completed_at: s.completed_at,
      duration_seconds: s.duration_seconds,
    })));

    const scored = scenarios.filter(s => s.overall_score != null && s.overall_score > 0);
    const avgScore = scored.length > 0 
      ? scored.reduce((sum, s) => sum + (s.overall_score || 0), 0) / scored.length 
      : 0;

    const { count: quizCount } = await supabase
      .from("quiz_results")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("quiz_type", "fullstack_initial");

    const { data: codeData, count: codeCount } = await supabase
      .from("code_submissions")
      .select("created_at", { count: "exact" })
      .eq("user_id", userId);

    const totalSeconds = scenarios.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

    // Real streak from streaks table
    const { data: streakData } = await supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle();
    const streak = streakData?.current_streak || 0;
    const streakBadge = streakData?.streak_badge || "none";

    // XP
    const { data: xpData } = await supabase.from("xp_levels").select("*").eq("user_id", userId).maybeSingle();

    setStats({
      quizzesCompleted: quizCount || 0,
      sessionsCompleted: codeCount || 0,
      scenariosCompleted: fsScenarioCount || 0,
      totalPracticeMinutes: Math.round(totalSeconds / 60),
      averageScore: avgScore,
      streakDays: streak,
      totalXp: xpData?.total_xp || 0,
      levelName: xpData?.level_name || "Novice",
      streakBadge,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const levelLabels: Record<string, string> = {
    beginner: "Beginner",
    moderate: "Moderate",
    pro: "Pro",
    ultra_pro: "Ultra Pro",
  };

  const levelColors: Record<string, string> = {
    beginner: "from-silver-dark to-silver",
    moderate: "from-success to-primary",
    pro: "from-primary to-coral-light",
    ultra_pro: "from-silver-light to-primary",
  };

  const communicationMetrics = [
    { name: "Fluency", score: computedMetrics.fluency, icon: Activity },
    { name: "Clarity", score: computedMetrics.clarity, icon: Target },
    { name: "Confidence", score: computedMetrics.confidence, icon: Zap },
    { name: "Tone", score: computedMetrics.tone, icon: Star },
    { name: "Structure", score: computedMetrics.structure, icon: BarChart3 },
    { name: "Grammar", score: computedMetrics.grammar, icon: BookOpen },
  ];

  const fullstackMetrics = [
    { name: "Frontend", score: fsProfile?.frontend_score || 0, icon: Code },
    { name: "Backend", score: fsProfile?.backend_score || 0, icon: Target },
    { name: "DevOps", score: fsProfile?.devops_score || 0, icon: Zap },
    { name: "System Design", score: fsProfile?.system_design_score || 0, icon: BarChart3 },
    { name: "Code Quality", score: fsProfile?.code_quality_score || 0, icon: Star },
    { name: "Problem Solving", score: fsProfile?.problem_solving_score || 0, icon: Activity },
  ];

  const currentLevel = domain === "communication" 
    ? profile?.communication_level || "beginner"
    : fsProfile?.fullstack_level || "beginner";
  const currentScore = domain === "communication"
    ? computedMetrics.overall
    : fsProfile?.overall_score || 0;
  const currentMetrics = domain === "communication" ? communicationMetrics : fullstackMetrics;

  return (
    <div className="min-h-screen bg-background">
      <DomainNavbar />
      
      <main className="container mx-auto px-4 pt-32 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Your {domain === "communication" ? "Communication" : "Cloud"} <span className="text-gradient">Profile</span>
          </h1>
          <p className="text-muted-foreground">Track your progress and improve your skills</p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="glass rounded-2xl p-6 sticky top-32">
              {/* Avatar */}
              <div className="text-center mb-6">
                <motion.div 
                  className="relative w-28 h-28 mx-auto mb-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${levelColors[currentLevel]} p-1`}>
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                      {domain === "communication" ? (
                        <User className="w-14 h-14 text-emerald-brand" />
                      ) : (
                        <Code className="w-14 h-14 text-emerald-brand" />
                      )}
                    </div>
                  </div>
                  {/* Level Badge */}
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${levelColors[currentLevel]} text-white shadow-lg`}>
                    {levelLabels[currentLevel]}
                  </div>
                </motion.div>
                <h2 className="text-xl font-bold text-foreground mt-4">
                  {profile?.full_name || user?.email?.split("@")[0] || "User"}
                </h2>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
              </div>

              {/* Overall Score */}
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                  <div className="text-4xl font-bold text-gradient">
                    {currentScore > 0 ? currentScore.toFixed(1) : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentScore > 0 ? "out of 10" : "Complete scenarios to get scored"}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-brand" />
                    <span className="text-sm text-muted-foreground">Practice Time</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {stats.totalPracticeMinutes > 60 
                      ? `${Math.floor(stats.totalPracticeMinutes / 60)}h ${stats.totalPracticeMinutes % 60}m`
                      : `${stats.totalPracticeMinutes}m`
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-emerald-brand" />
                    <span className="text-sm text-muted-foreground">Streak</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {stats.streakDays > 0 ? `${stats.streakDays} day${stats.streakDays > 1 ? 's' : ''} 🔥` : "No streak"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-emerald-brand" />
                    <span className="text-sm text-muted-foreground">Scenarios</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {stats.scenariosCompleted} completed
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </motion.div>

          {/* Center Column - Skill Radar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="glass rounded-2xl overflow-hidden" style={{ minHeight: 460 }}>
              {domain === "communication" ? (
                <SkillRadar 
                  data={{
                    fluency: computedMetrics.fluency,
                    clarity: computedMetrics.clarity,
                    confidence: computedMetrics.confidence,
                    tone: computedMetrics.tone,
                    structure: computedMetrics.structure,
                    grammar: computedMetrics.grammar,
                  }}
                />
              ) : (
                <SkillRadar 
                  type="fullstack"
                  data={{
                    frontend: fsProfile?.frontend_score || 0,
                    backend: fsProfile?.backend_score || 0,
                    devops: fsProfile?.devops_score || 0,
                    systemDesign: fsProfile?.system_design_score || 0,
                    codeQuality: fsProfile?.code_quality_score || 0,
                    problemSolving: fsProfile?.problem_solving_score || 0,
                  }}
                />
              )}
            </div>
          </motion.div>

          {/* Right Column - Stats & Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.quizzesCompleted}</p>
                    <p className="text-xs text-muted-foreground">Quizzes</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-brand" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.sessionsCompleted}</p>
                    <p className="text-xs text-muted-foreground">{domain === "communication" ? "Sessions" : "Submissions"}</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-emerald-brand" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.scenariosCompleted}</p>
                    <p className="text-xs text-muted-foreground">Scenarios</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-silver/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-silver" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {(domain === "communication" ? profile?.assessment_completed : fsProfile?.assessment_completed) ? "✓" : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Assessment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-brand" />
                Recent Activity
              </h3>
              {recentScenarios.length > 0 ? (
                <div className="space-y-3">
                  {recentScenarios.slice(0, 4).map((scenario, index) => (
                    <motion.div
                      key={scenario.scenario_id + index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Star className="w-4 h-4 text-emerald-brand" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground capitalize">
                            {scenario.scenario_id.replace(/-/g, " ").substring(0, 20)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(scenario.completed_at).toLocaleDateString()}</span>
                            {scenario.duration_seconds && (
                              <>
                                <span>·</span>
                                <span>{Math.floor(scenario.duration_seconds / 60)}m</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-emerald-brand">
                          {scenario.overall_score > 0 ? scenario.overall_score.toFixed(1) : "—"}
                        </span>
                        {scenario.overall_score > 0 && (
                          <p className="text-xs text-muted-foreground">/10</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No recent activity</p>
                  <p className="text-sm">Complete scenarios to see your progress</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Metrics - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-brand" />
              Detailed {domain === "communication" ? "Communication" : "Technical"} Metrics
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentMetrics.map((metric, index) => (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="p-4 rounded-xl bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <metric.icon className="w-5 h-5 text-emerald-brand" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{metric.name}</span>
                        <span className="text-lg font-bold text-emerald-brand">
                          {metric.score > 0 ? metric.score.toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Progress value={metric.score * 10} className="h-2" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
