import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { X, Mic, MicOff, Loader2, Target, CheckCircle, RotateCcw } from "lucide-react";
import type { SpeechRecognition } from "@/types/speech-recognition.d";

interface ScenarioModalProps {
  scenario: {
    id: string;
    type: string;
    name: string;
    context: string;
    goal: string;
  };
  onClose: () => void;
}

type ScenarioState = "intro" | "recording" | "processing" | "feedback" | "complete";

const ScenarioModal = ({ scenario, onClose }: ScenarioModalProps) => {
  const { user } = useAuth();
  const [state, setState] = useState<ScenarioState>("intro");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<{
    score: number;
    strengths: string[];
    improvements: string[];
    metrics: Record<string, number>;
  } | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startScenario = () => {
    setState("recording");
    // Ren speaks the scenario context
    if ('speechSynthesis' in window) {
      const intro = `${scenario.context} Your goal is: ${scenario.goal}. When you're ready, start speaking.`;
      const utterance = new SpeechSynthesisUtterance(intro);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        toast({
          variant: "destructive",
          title: "Speech Recognition Not Supported",
          description: "Your browser doesn't support speech recognition. Please use Chrome or Edge.",
        });
        return;
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscript = "";

      recognition.onresult = (event) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += text + " ";
          } else {
            interimTranscript += text;
          }
        }
        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      setTranscript("");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Microphone Required",
        description: "Please allow microphone access to practice scenarios.",
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setState("processing");
      
      setTimeout(() => {
        processRecording();
      }, 500);
    }
  };

  const processRecording = async () => {
    if (!transcript.trim()) {
      toast({
        variant: "destructive",
        title: "No Speech Detected",
        description: "Please speak into your microphone and try again.",
      });
      setState("recording");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("scenario-feedback", {
        body: {
          transcript: transcript.trim(),
          scenario: scenario,
        },
      });

      if (error) throw error;

      setFeedback({
        score: data.score || 7,
        strengths: data.strengths || ["Good pace", "Clear voice"],
        improvements: data.improvements || ["Add more structure", "Reduce filler words"],
        metrics: data.metrics || {
          clarity: 7,
          confidence: 6,
          structure: 7,
          tone: 8,
        },
      });

      // Save to database
      if (user) {
        await supabase.from("corporate_scenarios").insert({
          user_id: user.id,
          scenario_type: scenario.type,
          scenario_name: scenario.name,
          context: scenario.context,
          goal: scenario.goal,
          completed: true,
          score: data.score || 7,
          feedback: JSON.stringify(data),
        });
      }

      setState("feedback");
    } catch (error) {
      console.error("Error processing recording:", error);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: "Failed to analyze your response. Please try again.",
      });
      setState("recording");
    }
  };

  const retry = () => {
    setTranscript("");
    setFeedback(null);
    setState("recording");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">{scenario.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Intro State */}
          {state === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-primary" />
              </div>
              
              <h3 className="text-lg font-semibold mb-4 text-foreground">Scenario Context</h3>
              <p className="text-muted-foreground mb-6">{scenario.context}</p>
              
              <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-semibold text-foreground mb-2">Your Goal</h4>
                <p className="text-sm text-muted-foreground">{scenario.goal}</p>
              </div>

              <Button variant="hero" onClick={startScenario}>
                Start Scenario
              </Button>
            </motion.div>
          )}

          {/* Recording State */}
          {state === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-6">
                <p className="text-muted-foreground mb-4">Ren is playing the other party. Respond naturally.</p>
                {transcript && (
                  <div className="bg-secondary/50 rounded-xl p-4 text-left max-h-32 overflow-y-auto">
                    <p className="text-sm text-foreground">{transcript}</p>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${
                  isRecording ? "bg-destructive animate-pulse" : "bg-gradient-hero shadow-glow"
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-10 h-10 text-destructive-foreground" />
                ) : (
                  <Mic className="w-10 h-10 text-primary-foreground" />
                )}
              </motion.button>

              <p className="text-sm text-muted-foreground">
                {isRecording ? "Tap to stop (30-90 seconds recommended)" : "Tap to start speaking"}
              </p>
            </motion.div>
          )}

          {/* Processing State */}
          {state === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Ren is analyzing your response...</p>
            </motion.div>
          )}

          {/* Feedback State */}
          {state === "feedback" && feedback && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Score */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-hero flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary-foreground">{feedback.score}/10</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Your Performance</h3>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {Object.entries(feedback.metrics).map(([key, value]) => (
                  <div key={key} className="bg-secondary/50 rounded-xl p-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground capitalize">{key}</span>
                      <span className="text-sm font-semibold text-foreground">{value}/10</span>
                    </div>
                    <Progress value={value * 10} className="h-2" />
                  </div>
                ))}
              </div>

              {/* Strengths & Improvements */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-success/10 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-success mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-success" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-info/10 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-info mb-2">Improvements</h4>
                  <ul className="space-y-1">
                    {feedback.improvements.map((i, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {i}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={retry}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="hero" onClick={onClose}>
                  Complete
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ScenarioModal;
