import { supabase } from "@/integrations/supabase/client";

// ============================================
// ENGINE 5: Adaptation Engine (Struggling Detection)
// ============================================

export interface AdaptationResult {
  isStruggling: boolean;
  strugglingTopics: string[];
  recommendedDifficulty: string;
  flags: string[];
  suggestedActions: string[];
}

export async function detectStruggling(userId: string, domain: "communication" | "fullstack"): Promise<AdaptationResult> {
  const table = domain === "communication" ? "scenario_progress" : "fullstack_scenario_progress";
  
  const { data: recentProgress } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(10);

  const entries = recentProgress || [];
  if (entries.length < 2) {
    return { isStruggling: false, strugglingTopics: [], recommendedDifficulty: "Beginner", flags: [], suggestedActions: [] };
  }

  const scores = entries.map(e => (e as any).overall_score || 0);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  const flags: string[] = [];
  const suggestedActions: string[] = [];
  const strugglingTopics: string[] = [];

  // Check for consecutive low scores
  const lastTwo = scores.slice(0, 2);
  if (lastTwo.every(s => s < 4)) {
    flags.push("consecutive_low_scores");
    suggestedActions.push("Lower difficulty for next scenario");
    suggestedActions.push("Watch a short refresher video");
  }

  // Check for high filler words (communication only)
  if (domain === "communication") {
    const fillerScores = entries.map(e => (e as any).filler_words_score || 10);
    const avgFiller = fillerScores.reduce((a, b) => a + b, 0) / fillerScores.length;
    if (avgFiller < 5) {
      flags.push("high_filler_words");
      strugglingTopics.push("Fluency");
      suggestedActions.push("Practice reducing filler words");
    }

    // Find weakest metric
    const metricNames = ["fluency_score", "clarity_score", "confidence_score", "tone_score", "structure_score", "grammar_score"];
    const metricAvgs = metricNames.map(m => ({
      name: m.replace("_score", ""),
      avg: entries.reduce((sum, e) => sum + ((e as any)[m] || 0), 0) / entries.length
    }));
    const weakest = metricAvgs.sort((a, b) => a.avg - b.avg).slice(0, 2);
    weakest.forEach(w => {
      if (w.avg < 5) strugglingTopics.push(w.name.charAt(0).toUpperCase() + w.name.slice(1));
    });
  }

  // Determine recommended difficulty
  let recommendedDifficulty = "Intermediate";
  if (avgScore < 4) recommendedDifficulty = "Beginner";
  else if (avgScore < 6) recommendedDifficulty = "Intermediate";
  else if (avgScore < 8) recommendedDifficulty = "Advanced";
  else recommendedDifficulty = "Expert";

  if (flags.length > 0 && recommendedDifficulty !== "Beginner") {
    // Drop one level
    const levels = ["Beginner", "Intermediate", "Advanced", "Expert"];
    const idx = levels.indexOf(recommendedDifficulty);
    recommendedDifficulty = levels[Math.max(0, idx - 1)];
  }

  return {
    isStruggling: flags.length > 0 || avgScore < 4,
    strugglingTopics,
    recommendedDifficulty,
    flags,
    suggestedActions,
  };
}

// ============================================
// ENGINE 8: Recommendation Engine
// ============================================

export interface ScenarioRecommendation {
  scenarioId: string;
  reason: string;
  priority: number; // 1 = highest
}

export async function getRecommendedScenarios(
  userId: string,
  domain: "communication" | "fullstack",
  allScenarioIds: string[]
): Promise<ScenarioRecommendation[]> {
  const table = domain === "communication" ? "scenario_progress" : "fullstack_scenario_progress";
  
  const { data: completed } = await supabase
    .from(table)
    .select("scenario_id, overall_score")
    .eq("user_id", userId);

  const completedMap = new Map<string, number>();
  (completed || []).forEach(c => {
    const existing = completedMap.get(c.scenario_id) || 0;
    completedMap.set(c.scenario_id, Math.max(existing, c.overall_score || 0));
  });

  const adaptation = await detectStruggling(userId, domain);
  const recommendations: ScenarioRecommendation[] = [];

  // Priority 1: Uncompleted scenarios at recommended difficulty
  const uncompleted = allScenarioIds.filter(id => !completedMap.has(id));
  uncompleted.slice(0, 3).forEach((id, i) => {
    recommendations.push({ scenarioId: id, reason: "Next in your path", priority: 1 + i });
  });

  // Priority 2: Low-scoring completed scenarios for retry
  const lowScored = Array.from(completedMap.entries())
    .filter(([, score]) => score < 6)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2);
  
  lowScored.forEach(([id], i) => {
    recommendations.push({ scenarioId: id, reason: "Improve your score", priority: 10 + i });
  });

  // Priority 3: If struggling, suggest easier scenarios
  if (adaptation.isStruggling && adaptation.suggestedActions.length > 0) {
    const easyUncompleted = uncompleted.slice(0, 2);
    easyUncompleted.forEach((id, i) => {
      if (!recommendations.find(r => r.scenarioId === id)) {
        recommendations.push({ scenarioId: id, reason: "Practice fundamentals", priority: 5 + i });
      }
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

// ============================================
// ENGINE 6: Adaptive Daily Challenge Generator
// ============================================

export async function generateAdaptiveChallenges(
  userId: string,
  domain: "communication" | "fullstack"
) {
  const adaptation = await detectStruggling(userId, domain);
  
  if (domain === "communication") {
    const challenges = [
      { id: 1, type: "warmup", title: "Quick Vocab Check", description: "5 fill-in-the-blank vocabulary questions", duration: "2 min", difficulty: "Easy" },
      { id: 2, type: "scenario", title: "HR Interview Practice", description: "Practice introducing yourself professionally", duration: "7 min", difficulty: adaptation.recommendedDifficulty === "Beginner" ? "Easy" : "Medium" },
      { id: 3, type: "scenario", title: "Technical Explanation", description: "Explain a concept to a non-tech audience", duration: "7 min", difficulty: adaptation.recommendedDifficulty === "Beginner" ? "Easy" : "Medium" },
      { id: 4, type: "challenge", title: adaptation.isStruggling ? "Revision Round" : "Speed Round", description: adaptation.isStruggling ? `Focus on: ${adaptation.strugglingTopics[0] || "communication basics"}` : "Rapid-fire questions, 60 seconds each", duration: "5 min", difficulty: adaptation.isStruggling ? "Medium" : "Hard" },
      { id: 5, type: "revision", title: adaptation.strugglingTopics.length > 0 ? `${adaptation.strugglingTopics[0]} Practice` : "Weakest Area Review", description: adaptation.strugglingTopics.length > 0 ? `Extra practice on ${adaptation.strugglingTopics[0].toLowerCase()}` : "Practice your lowest-scoring skill", duration: "5 min", difficulty: "Variable" },
    ];
    return challenges;
  }
  
  return [
    { id: 1, type: "warmup", title: "Code Snippet Fix", description: "Fix a small bug in a code snippet", duration: "2 min", difficulty: "Easy" },
    { id: 2, type: "scenario", title: "Debug Challenge", description: "Find and fix the bug in a component", duration: "7 min", difficulty: adaptation.recommendedDifficulty === "Beginner" ? "Easy" : "Medium" },
    { id: 3, type: "scenario", title: "API Design", description: "Design a REST endpoint for a feature", duration: "7 min", difficulty: adaptation.recommendedDifficulty === "Beginner" ? "Easy" : "Medium" },
    { id: 4, type: "challenge", title: adaptation.isStruggling ? "Guided Practice" : "Speed Coding", description: adaptation.isStruggling ? "Step-by-step coding with hints" : "Solve 3 problems in under 5 minutes", duration: "5 min", difficulty: adaptation.isStruggling ? "Medium" : "Hard" },
    { id: 5, type: "revision", title: "Weakest Topic", description: "Review your lowest-performing area", duration: "5 min", difficulty: "Variable" },
  ];
}

// ============================================
// ENGINE 4: Scoring helpers
// ============================================

export function calculateXpFromScore(score: number, difficulty: string): number {
  const diffMultiplier: Record<string, number> = { Beginner: 10, Intermediate: 20, Advanced: 30, Expert: 40 };
  const base = diffMultiplier[difficulty] || 15;
  return Math.round(base * (score / 10));
}

export async function updateUserXpAndStreak(userId: string, xpEarned: number) {
  const today = new Date().toISOString().split("T")[0];
  
  // XP
  const { data: xpData } = await supabase.from("xp_levels").select("*").eq("user_id", userId).maybeSingle();
  if (xpData) {
    const newXp = (xpData.total_xp || 0) + xpEarned;
    const newLevel = newXp >= 500 ? "Master" : newXp >= 250 ? "Expert" : newXp >= 100 ? "Explorer" : "Novice";
    const newLevelNum = newXp >= 500 ? 4 : newXp >= 250 ? 3 : newXp >= 100 ? 2 : 1;
    await supabase.from("xp_levels").update({ total_xp: newXp, level_name: newLevel, level_number: newLevelNum, next_level_xp: [100, 250, 500, 1000][newLevelNum - 1] }).eq("user_id", userId);
  } else {
    await supabase.from("xp_levels").insert({ user_id: userId, total_xp: xpEarned, level_name: "Novice", level_number: 1, next_level_xp: 100 });
  }

  // Streak
  const { data: streakData } = await supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle();
  if (streakData) {
    const lastDate = streakData.last_active_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    let newStreak = streakData.current_streak || 0;
    if (lastDate !== today) {
      newStreak = lastDate === yesterday ? newStreak + 1 : 1;
    }
    const badge = newStreak >= 30 ? "platinum" : newStreak >= 15 ? "gold" : newStreak >= 8 ? "silver" : newStreak >= 3 ? "bronze" : "none";
    await supabase.from("streaks").update({ current_streak: newStreak, longest_streak: Math.max(newStreak, streakData.longest_streak || 0), last_active_date: today, streak_badge: badge }).eq("user_id", userId);
  } else {
    await supabase.from("streaks").insert({ user_id: userId, current_streak: 1, longest_streak: 1, last_active_date: today, streak_badge: "none" });
  }
}
