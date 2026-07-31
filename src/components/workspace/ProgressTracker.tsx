import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Trophy, TrendingUp, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDomain } from "@/contexts/DomainContext";
import { scenarios } from "@/data/workspaceScenarios";

import { Progress } from "@/components/ui/progress";

interface ProgressEntry {
  id: string;
  scenario_id: string;
  completed_at: string;
  overall_score: number;
  duration_seconds: number;
}

const ProgressTracker = () => {
  const { user } = useAuth();
  const { domain } = useDomain();
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user, domain]);

  const fetchProgress = async () => {
    try {
      const table = domain === "communication" ? "scenario_progress" : "fullstack_scenario_progress";
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setProgressData(data || []);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const allScenarios = scenarios;
  const completedScenarios = new Set(progressData.map(p => p.scenario_id));
  const totalScenarios = allScenarios.length;
  const completionPercentage = (completedScenarios.size / totalScenarios) * 100;

  const averageScore = progressData.length > 0
    ? progressData.reduce((sum, p) => sum + (p.overall_score || 0), 0) / progressData.length
    : 0;

  const recentAttempts = progressData.slice(0, 5);

  const getScenarioName = (scenarioId: string) => {
    const scenario = allScenarios.find(s => s.id === scenarioId);
    return scenario?.name || scenarioId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    if (score >= 4) return "text-orange-400";
    return "text-red-400";
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-secondary/50 rounded w-1/3 mb-4" />
        <div className="h-20 bg-secondary/50 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6 mb-8"
    >
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Your Progress</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {completedScenarios.size}<span className="text-sm text-muted-foreground">/{totalScenarios}</span>
          </p>
        </div>

        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Avg Score</span>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
            {averageScore.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span>
          </p>
        </div>

        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground">Total Sessions</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{progressData.length}</p>
        </div>

        <div className="bg-secondary/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-muted-foreground">Progress</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{Math.round(completionPercentage)}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Scenario Completion</span>
          <span className="text-foreground font-medium">{completedScenarios.size} of {totalScenarios}</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Recent Attempts */}
      {recentAttempts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Sessions</h3>
          <div className="space-y-2">
            {recentAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {getScenarioName(attempt.scenario_id)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(attempt.completed_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {attempt.duration_seconds && (
                    <span className="text-xs text-muted-foreground">
                      {Math.floor(attempt.duration_seconds / 60)}m
                    </span>
                  )}
                  <span className={`text-lg font-bold ${getScoreColor(attempt.overall_score)}`}>
                    {attempt.overall_score?.toFixed(1) || '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {progressData.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p>No completed scenarios yet.</p>
          <p className="text-sm">Start practicing to track your progress!</p>
        </div>
      )}
    </motion.div>
  );
};

export default ProgressTracker;
