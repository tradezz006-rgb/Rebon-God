import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Zap, CheckCircle, Clock, Target, BookOpen, Star, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import confetti from "@/lib/confetti";
import { generateAdaptiveChallenges, detectStruggling, type AdaptationResult } from "@/lib/engines";

interface Challenge {
  id: number;
  type: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  icon: typeof Flame;
  completed: boolean;
}

interface DailyChallengesProps {
  domain: "communication" | "fullstack";
  onStartChallenge?: (challenge: Challenge) => void;
}

const DailyChallenges = ({ domain, onStartChallenge }: DailyChallengesProps) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [streak, setStreak] = useState(0);
  const [streakBadge, setStreakBadge] = useState("none");
  const [adaptation, setAdaptation] = useState<AdaptationResult | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    loadDailyChallenges();
    loadStreak();
    loadAdaptation();
  }, [user, domain]);

  const loadAdaptation = async () => {
    if (!user) return;
    const result = await detectStruggling(user.id, domain);
    setAdaptation(result);
  };

  const loadStreak = async () => {
    if (!user) return;
    const { data: streakData } = await supabase.from("streaks").select("*").eq("user_id", user.id).maybeSingle();
    if (streakData) {
      setStreak(streakData.current_streak || 0);
      setStreakBadge(streakData.streak_badge || "none");
    }
  };

  const loadDailyChallenges = async () => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("user_id", user.id)
      .eq("challenge_date", today)
      .maybeSingle();

    if (existing) {
      const stored = (existing.challenges as any[]) || [];
      setChallenges(stored.map((c: any, i: number) => ({
        ...c,
        icon: [Target, BookOpen, Zap, Star, Flame][i] || Target,
        completed: (existing as any)[`problem_${i + 1}_completed`] || false,
      })));
    } else {
      // Use adaptive engine to generate challenges based on user's weakness
      const generated = await generateAdaptiveChallenges(user.id, domain);
      const withIcons = generated.map((c, i) => ({
        ...c,
        icon: [Target, BookOpen, Zap, Star, Flame][i] || Target,
        completed: false,
      }));
      setChallenges(withIcons);
      await supabase.from("daily_challenges").insert({
        user_id: user.id,
        challenge_date: today,
        challenges: generated.map(({ ...rest }) => rest),
      });
    }
  };

  const completeChallenge = async (index: number) => {
    if (!user) return;
    const updated = [...challenges];
    updated[index].completed = true;
    setChallenges(updated);

    const updateField = `problem_${index + 1}_completed`;
    await supabase
      .from("daily_challenges")
      .update({ [updateField]: true } as any)
      .eq("user_id", user.id)
      .eq("challenge_date", today);

    toast({ title: "Challenge complete!", description: `Finished: ${updated[index].title}` });

    // Check if all done
    if (updated.every(c => c.completed)) {
      confetti();
      // Update streak
      const { data: streakData } = await supabase.from("streaks").select("*").eq("user_id", user.id).maybeSingle();
      const newStreak = (streakData?.current_streak || 0) + 1;
      const badge = newStreak >= 30 ? "platinum" : newStreak >= 15 ? "gold" : newStreak >= 8 ? "silver" : newStreak >= 1 ? "bronze" : "none";
      if (streakData) {
        await supabase.from("streaks").update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streakData.longest_streak || 0),
          last_active_date: today,
          streak_badge: badge,
        }).eq("user_id", user.id);
      } else {
        await supabase.from("streaks").insert({
          user_id: user.id,
          current_streak: newStreak,
          longest_streak: newStreak,
          last_active_date: today,
          streak_badge: badge,
        });
      }
      setStreak(newStreak);
      setStreakBadge(badge);
      toast({ title: "🎉 All Challenges Complete!", description: "Come back tomorrow for new challenges!" });
    }
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const allDone = challenges.length > 0 && completedCount === challenges.length;
  const badgeEmoji: Record<string, string> = { none: "", bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💎" };

  const difficultyColor: Record<string, string> = {
    Easy: "text-success",
    Medium: "text-primary",
    Hard: "text-destructive",
    Variable: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="glass rounded-2xl p-6 border border-primary/20">
        {/* Struggling Alert */}
        {adaptation?.isStruggling && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 p-3 rounded-lg bg-coral/10 border border-coral/30 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-coral flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-coral">Adaptive Mode Active</p>
              <p className="text-[11px] text-muted-foreground">
                Today's challenges are adjusted to help you improve
                {adaptation.strugglingTopics.length > 0 ? ` in ${adaptation.strugglingTopics.join(", ")}` : ""}.
              </p>
            </div>
          </motion.div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Flame className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Daily Challenges
                {streak > 0 && (
                  <span className="text-sm font-normal text-primary">
                    🔥 {streak} day streak! {badgeEmoji[streakBadge]}
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                {allDone ? "All done! Come back tomorrow 🎉" : `${completedCount}/5 completed today`}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={(completedCount / 5) * 100} className="h-2 mb-5" />

        {/* Challenge cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {challenges.map((challenge, index) => {
            const Icon = challenge.icon;
            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative rounded-xl p-4 border transition-all ${
                  challenge.completed
                    ? "bg-primary/10 border-primary/30"
                    : "bg-secondary/30 border-border/50 hover:border-primary/30 hover:bg-secondary/50"
                }`}
              >
                {challenge.completed && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                )}
                <Icon className={`w-5 h-5 mb-2 ${challenge.completed ? "text-primary" : "text-muted-foreground"}`} />
                <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-1">{challenge.title}</h4>
                <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{challenge.description}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{challenge.duration}</span>
                  <span className={`font-bold ${difficultyColor[challenge.difficulty] || "text-muted-foreground"}`}>
                    {challenge.difficulty}
                  </span>
                </div>
                {!challenge.completed && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-[11px]"
                    onClick={() => completeChallenge(index)}
                  >
                    Complete
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default DailyChallenges;
