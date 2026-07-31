import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Mic, MicOff, Volume2, Loader2, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { SpeechRecognition } from "@/types/speech-recognition.d";

interface VoiceAssessmentProps {
  onComplete: () => void;
}

const assessmentQuestions = [
  "Hi! I'm Ren, your communication mentor. Let's get to know each other. Tell me about yourself - your name, what you're studying, and what you enjoy doing.",
  "That's great! Now, can you tell me about a memorable experience from your college life? It could be anything - a project, an event, or a challenge you faced.",
  "Wonderful! One last question - what kind of job or career are you aiming for after graduation, and why does it interest you?",
];

const VoiceAssessment = ({ onComplete }: VoiceAssessmentProps) => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAvaSpeaking, setIsAvaSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [avaResponse, setAvaResponse] = useState("");
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Text-to-speech for Ren
  const speakAva = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        setIsAvaSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.2; // Higher pitch for female voice

        const getFemaleVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          return voices.find(v => 
            v.lang.startsWith('en') && (
              v.name.includes('Female') || 
              v.name.includes('Zira') || 
              v.name.includes('Samantha') ||
              v.name.includes('Victoria') ||
              (v.name.includes('Google') && v.name.includes('English'))
            )
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        };

        utterance.onend = () => {
          setIsAvaSpeaking(false);
          resolve();
        };

        utterance.onerror = () => {
          setIsAvaSpeaking(false);
          resolve();
        };

        const speak = () => {
          const femaleVoice = getFemaleVoice();
          if (femaleVoice) {
            utterance.voice = femaleVoice;
          }
          window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.addEventListener('voiceschanged', speak, { once: true });
        } else {
          speak();
        }
      } else {
        resolve();
      }
    });
  }, []);

  // Initial greeting
  useEffect(() => {
    const greet = async () => {
      await speakAva(assessmentQuestions[0]);
      setAvaResponse(assessmentQuestions[0]);
    };
    greet();
  }, [speakAva]);

  const startRecording = async () => {
    try {
      // Use Web Speech API for recognition
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
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }
        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== 'no-speech') {
          toast({
            variant: "destructive",
            title: "Recognition Error",
            description: `Error: ${event.error}. Please try again.`,
          });
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      setTranscript("");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Microphone Access Required",
        description: "Please allow microphone access to continue with the voice assessment.",
      });
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      // Wait a moment for final transcript
      setTimeout(() => {
        processTranscript();
      }, 500);
    }
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast({
        variant: "destructive",
        title: "No Speech Detected",
        description: "Please speak clearly into your microphone and try again.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Call edge function for analysis
      const { data, error } = await supabase.functions.invoke("voice-assessment", {
        body: {
          transcript: transcript.trim(),
          question: assessmentQuestions[currentQuestion],
          questionNumber: currentQuestion + 1,
        },
      });

      if (error) throw error;

      // Save voice session
      if (user) {
        await supabase.from("voice_sessions").insert({
          user_id: user.id,
          session_type: "assessment",
          transcript: transcript.trim(),
          ava_feedback: data.feedback,
          fluency_score: data.scores?.fluency || 5,
          clarity_score: data.scores?.clarity || 5,
          confidence_score: data.scores?.confidence || 5,
          tone_score: data.scores?.tone || 5,
          structure_score: data.scores?.structure || 5,
          grammar_score: data.scores?.grammar || 5,
        });
      }

      // Move to next question or complete
      if (currentQuestion < assessmentQuestions.length - 1) {
        const nextQuestion = assessmentQuestions[currentQuestion + 1];
        setAvaResponse(nextQuestion);
        await speakAva(nextQuestion);
        setCurrentQuestion((prev) => prev + 1);
        setTranscript("");
      } else {
        setAssessmentComplete(true);
        const completionMessage = "Excellent! You've completed the voice assessment. Based on our conversation, I've analyzed your communication style and created a personalized learning roadmap for you. Let's see your results!";
        setAvaResponse(completionMessage);
        await speakAva(completionMessage);
      }

      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing transcript:", error);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: "There was an error analyzing your response. Please try again.",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
          Voice Assessment with <span className="text-gradient">Ren</span>
        </h1>
        <p className="text-muted-foreground">
          Have a conversation with Ren to assess your communication skills
        </p>
      </div>

      {/* Ren Interface */}
      <div className="glass rounded-2xl p-6 md:p-8">
        {/* Ren Header */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center ${isAvaSpeaking ? "animate-pulse" : ""}`}>
            <span className="text-2xl font-bold text-primary-foreground">R</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Ren</h3>
            <p className="text-sm text-muted-foreground">
              {isAvaSpeaking ? "Speaking..." : isProcessing ? "Thinking..." : "Listening..."}
            </p>
          </div>
          {isAvaSpeaking && (
            <div className="ml-auto flex items-center gap-2 text-primary">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
          )}
        </div>

        {/* Conversation Area */}
        <div className="space-y-4 mb-6 min-h-[200px]">
          {/* Ren Message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-hero flex-shrink-0 flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">R</span>
              </div>
              <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 max-w-md">
                <p className="text-sm text-foreground">{avaResponse}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* User Response */}
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-end"
            >
              <div className="bg-primary/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-md">
                <p className="text-sm text-foreground">{transcript}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Recording Controls */}
        {!assessmentComplete ? (
          <div className="flex flex-col items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || isAvaSpeaking}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-destructive animate-pulse"
                  : isProcessing
                  ? "bg-secondary"
                  : "bg-gradient-hero shadow-glow"
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-8 h-8 text-destructive-foreground" />
              ) : (
                <Mic className="w-8 h-8 text-primary-foreground" />
              )}
            </motion.button>
            <p className="text-sm text-muted-foreground">
              {isRecording
                ? "Tap to stop recording"
                : isProcessing
                ? "Analyzing your response..."
                : isAvaSpeaking
                ? "Listen to Ren..."
                : "Tap to start speaking"}
            </p>
            <p className="text-xs text-muted-foreground">
              Question {currentQuestion + 1} of {assessmentQuestions.length}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-success" />
            </motion.div>
            <h3 className="text-xl font-bold text-foreground mb-2">Assessment Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Ren has analyzed your communication style and prepared your personalized roadmap.
            </p>
            <Button variant="hero" onClick={onComplete}>
              View My Roadmap
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssessment;
