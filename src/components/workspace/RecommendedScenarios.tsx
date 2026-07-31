import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getRecommendedScenarios, type ScenarioRecommendation } from "@/lib/engines";
import { scenarios } from "@/data/workspaceScenarios";


interface RecommendedScenariosProps {
  domain: "communication" | "fullstack";
  onScenarioClick: (scenarioId: string) => void;
}

const RecommendedScenarios = ({ domain, onScenarioClick }: RecommendedScenariosProps) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<ScenarioRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const allScenarios = scenarios;

  useEffect(() => {
    if (user) loadRecommendations();
  }, [user, domain]);

  const loadRecommendations = async () => {
    if (!user) return;
    setLoading(true);
    const recs = await getRecommendedScenarios(
      user.id,
      domain,
      allScenarios.map(s => s.id)
    );
    setRecommendations(recs);
    setLoading(false);
  };

  const getScenario = (id: string) => allScenarios.find(s => s.id === id);

  if (loading || recommendations.length === 0) return null;

  const difficultyColor: Record<string, string> = {
    Beginner: "bg-success/20 text-success",
    Intermediate: "bg-info/20 text-info",
    Advanced: "bg-coral/20 text-coral",
    Expert: "bg-primary/20 text-primary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="glass rounded-2xl p-6 border border-primary/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Recommended For You</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={loadRecommendations} className="text-xs gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {recommendations.slice(0, 5).map((rec, i) => {
            const scenario = getScenario(rec.scenarioId);
            if (!scenario) return null;
            return (
              <motion.div
                key={rec.scenarioId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onScenarioClick(rec.scenarioId)}
                className="cursor-pointer rounded-xl p-4 bg-secondary/30 border border-border/50 hover:border-primary/30 hover:bg-secondary/50 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={`text-[10px] ${difficultyColor[scenario.difficulty] || ""}`}>
                    {scenario.difficulty}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-1">{scenario.name}</h4>
                <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{scenario.context}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {rec.reason}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default RecommendedScenarios;
