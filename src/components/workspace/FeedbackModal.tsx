import { motion } from "framer-motion";
import { X, TrendingUp, Target, MessageSquare, Award, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FeedbackModalProps {
  feedback: {
    overallScore: number;
    fluencyScore: number;
    clarityScore: number;
    confidenceScore: number;
    toneScore: number;
    structureScore: number;
    grammarScore: number;
    fillerWordsCount: number;
    strengths: string[];
    improvements: string[];
    detailedFeedback: string;
  };
  scenarioName: string;
  onClose: () => void;
}

const FeedbackModal = ({ feedback, scenarioName, onClose }: FeedbackModalProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  const metrics = [
    { label: "Fluency", value: feedback.fluencyScore },
    { label: "Clarity", value: feedback.clarityScore },
    { label: "Confidence", value: feedback.confidenceScore },
    { label: "Tone", value: feedback.toneScore },
    { label: "Structure", value: feedback.structureScore },
    { label: "Grammar", value: feedback.grammarScore },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-secondary to-background rounded-2xl border border-border"
      >
        {/* Header */}
        <div className="sticky top-0 bg-secondary/90 backdrop-blur-sm p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Session Complete</h2>
            <p className="text-muted-foreground text-sm">{scenarioName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getScoreGradient(feedback.overallScore)}`}>
              <div className="w-28 h-28 rounded-full bg-background flex items-center justify-center">
                <div>
                  <span className={`text-4xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                    {feedback.overallScore}
                  </span>
                  <span className="text-muted-foreground text-sm">/100</span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-foreground font-medium">Overall Performance</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-background/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">{metric.label}</span>
                  <span className={`font-bold ${getScoreColor(metric.value)}`}>{metric.value}</span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            ))}
          </div>

          {/* Filler Words */}
          <div className="bg-background/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-foreground">Filler Words Detected</span>
            </div>
            <span className={`text-2xl font-bold ${feedback.fillerWordsCount > 5 ? 'text-orange-400' : 'text-green-400'}`}>
              {feedback.fillerWordsCount}
            </span>
          </div>

          {/* Strengths */}
          <div className="bg-green-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-foreground">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-muted-foreground">
                  <ChevronRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-primary/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Areas to Improve</h3>
            </div>
            <ul className="space-y-2">
              {feedback.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2 text-muted-foreground">
                  <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Feedback */}
          <div className="bg-background/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Detailed Feedback</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">{feedback.detailedFeedback}</p>
          </div>

          {/* Action Button */}
          <Button className="w-full" size="lg" onClick={onClose}>
            Continue Practicing
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FeedbackModal;
