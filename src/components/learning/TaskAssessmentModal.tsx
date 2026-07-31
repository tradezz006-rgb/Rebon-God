import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TaskAssessment } from "@/data/learningContent";
import { Mic, MicOff, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TaskAssessmentModalProps {
  assessment: TaskAssessment;
  videoId: string;
  onComplete: (score: number, feedback: string) => void;
  onSkip: () => void;
}

const TaskAssessmentModal = ({ assessment, videoId, onComplete, onSkip }: TaskAssessmentModalProps) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(assessment.timeLimit);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState<{
    score: number;
    strengths: string[];
    improvements: string[];
    overall: string;
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isRecording && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        toast.error("Speech recognition error");
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (transcript.trim()) {
      await analyzeResponse();
    }
  };

  const analyzeResponse = async () => {
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('voice-assessment', {
        body: {
          transcript,
          assessmentType: 'task',
          prompt: assessment.prompt,
          evaluationCriteria: assessment.evaluationCriteria
        }
      });

      if (error) throw error;

      const analysisResult = {
        score: data?.analysis?.overallScore || 6,
        strengths: data?.analysis?.strengths || ["Good attempt at addressing the prompt"],
        improvements: data?.analysis?.improvements || ["Continue practicing for better fluency"],
        overall: data?.feedback || "Good effort! Keep practicing to improve your communication skills."
      };

      setFeedback(analysisResult);
      setCompleted(true);

      // Save to database
      if (user) {
        await supabase.from('voice_sessions').insert({
          user_id: user.id,
          session_type: 'task_assessment',
          scenario_id: videoId,
          transcript: transcript,
          duration_seconds: assessment.timeLimit - timeLeft,
          fluency_score: data?.analysis?.fluency || 6,
          clarity_score: data?.analysis?.clarity || 6,
          confidence_score: data?.analysis?.confidence || 6,
          ava_feedback: analysisResult.overall
        });
      }

    } catch (error) {
      console.error('Analysis error:', error);
      // Provide default feedback on error
      const defaultFeedback = {
        score: 6,
        strengths: ["You completed the task"],
        improvements: ["Keep practicing"],
        overall: "Good effort! Continue working on your communication skills."
      };
      setFeedback(defaultFeedback);
      setCompleted(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleComplete = () => {
    if (feedback) {
      onComplete(feedback.score, feedback.overall);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
        <h3 className="text-xl font-bold text-foreground mb-2">Analyzing Your Response</h3>
        <p className="text-muted-foreground">Ren is evaluating your communication skills...</p>
      </motion.div>
    );
  }

  if (completed && feedback) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        {/* Score */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
              feedback.score >= 7 ? "bg-success/20" : feedback.score >= 5 ? "bg-amber-500/20" : "bg-destructive/20"
            }`}
          >
            <span className={`text-3xl font-bold ${
              feedback.score >= 7 ? "text-success" : feedback.score >= 5 ? "text-amber-500" : "text-destructive"
            }`}>
              {feedback.score}
            </span>
          </motion.div>
          <h3 className="text-xl font-bold text-foreground mb-1">Task Complete!</h3>
          <p className="text-muted-foreground text-sm">Score: {feedback.score}/10</p>
        </div>

        {/* Feedback */}
        <div className="space-y-4">
          {/* Strengths */}
          <div className="p-4 rounded-xl bg-success/10 border border-success/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="font-semibold text-success">Strengths</span>
            </div>
            <ul className="space-y-1">
              {feedback.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {strength}</li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-amber-500">Areas to Improve</span>
            </div>
            <ul className="space-y-1">
              {feedback.improvements.map((improvement, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {improvement}</li>
              ))}
            </ul>
          </div>

          {/* Overall */}
          <div className="p-4 rounded-xl bg-secondary/50">
            <p className="text-sm text-muted-foreground">{feedback.overall}</p>
          </div>
        </div>

        <Button onClick={handleComplete} variant="hero" className="w-full">
          Continue
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">{assessment.title}</h3>
        <p className="text-muted-foreground">{assessment.prompt}</p>
      </div>

      {/* Evaluation Criteria */}
      <div className="p-4 rounded-xl bg-secondary/50">
        <p className="text-sm font-medium text-foreground mb-2">You'll be evaluated on:</p>
        <div className="flex flex-wrap gap-2">
          {assessment.evaluationCriteria.map((criteria, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs">
              {criteria}
            </span>
          ))}
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center justify-center gap-2">
        <Clock className={`w-5 h-5 ${timeLeft < 15 ? "text-destructive" : "text-muted-foreground"}`} />
        <span className={`text-2xl font-mono font-bold ${
          timeLeft < 15 ? "text-destructive" : "text-foreground"
        }`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Transcript Preview */}
      {transcript && (
        <div className="p-3 rounded-lg bg-secondary/30 max-h-32 overflow-y-auto">
          <p className="text-sm text-muted-foreground">{transcript}</p>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex flex-col items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? "bg-destructive shadow-lg shadow-destructive/30"
              : "bg-primary shadow-lg shadow-primary/30"
          }`}
        >
          {isRecording ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </motion.button>
        
        <p className="text-sm text-muted-foreground">
          {isRecording ? "Click to stop recording" : "Click to start speaking"}
        </p>
      </div>

      {/* Skip Option */}
      {!isRecording && !transcript && (
        <Button variant="ghost" onClick={onSkip} className="w-full">
          Skip Assessment
        </Button>
      )}
    </div>
  );
};

export default TaskAssessmentModal;
