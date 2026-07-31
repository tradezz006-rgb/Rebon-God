import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, Phone, MessageSquare, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Scenario, Participant } from "@/data/workspaceScenarios";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ImmersiveMeetingProps {
  scenario: Scenario;
  onClose: () => void;
  onComplete: (feedback: any) => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

// Voice configurations - slightly faster rates for natural flow
const voiceConfigs: Record<string, { pitch: number; rate: number; voiceIndex: number }> = {
  analytical: { pitch: 0.9, rate: 0.95, voiceIndex: 0 },
  strategic: { pitch: 1.1, rate: 1.0, voiceIndex: 1 },
  "detail-oriented": { pitch: 0.95, rate: 0.92, voiceIndex: 2 },
  creative: { pitch: 1.15, rate: 1.0, voiceIndex: 3 },
  technical: { pitch: 0.85, rate: 0.95, voiceIndex: 4 },
  empathetic: { pitch: 1.2, rate: 0.98, voiceIndex: 5 },
  visionary: { pitch: 1.0, rate: 1.0, voiceIndex: 6 },
  persuasive: { pitch: 1.05, rate: 1.02, voiceIndex: 7 },
  pragmatic: { pitch: 0.88, rate: 0.95, voiceIndex: 0 },
  organized: { pitch: 0.92, rate: 0.98, voiceIndex: 1 },
  charismatic: { pitch: 1.1, rate: 1.05, voiceIndex: 2 },
  cautious: { pitch: 0.9, rate: 0.9, voiceIndex: 3 },
};

// Pre-cached quick responses with natural human speech patterns
const quickResponses = {
  acknowledgments: [
    "Mm-hmm, I see what you mean.",
    "Right, that's a fair point actually.",
    "Yeah, I follow you there.",
    "Okay, okay, I get it.",
    "Hmm, interesting. Go on.",
    "Sure, that makes sense.",
    "Got it, got it.",
    "Yeah, I hear you.",
  ],
  clarifications: [
    "Wait, can you elaborate on that a bit?",
    "Hmm, what do you mean exactly?",
    "Sorry, could you give me an example?",
    "Hold on, how so?",
    "I'm not sure I follow—in what way?",
    "Just to clarify, you're saying...?",
  ],
  challenges: [
    "Hmm, but have you considered the risks here?",
    "I don't know... what's the evidence for that?",
    "Okay but—how would you handle pushback on this?",
    "What if that doesn't work though?",
    "I'm not totally convinced, honestly.",
    "That's... interesting. But what about the downsides?",
    "Wait, let me push back on that a bit.",
  ],
  encouragements: [
    "Yeah, that's solid thinking actually.",
    "I like that approach, honestly.",
    "Okay, I'm on board with that direction.",
    "Makes total sense to me.",
    "Good point, good point.",
    "Hmm, yeah I think you're onto something there.",
  ],
  thinking: [
    "Let me think about that for a sec...",
    "Hmm, that's an interesting angle...",
    "So basically what you're saying is...",
    "Okay, so if I understand correctly...",
  ],
  professional: [
    "From a business perspective, that's sound.",
    "Strategically, I can see the merit there.",
    "That aligns with what we discussed earlier.",
    "Good, that addresses the key concern.",
  ],
};

const ImmersiveMeeting = ({ scenario, onClose, onComplete }: ImmersiveMeetingProps) => {
  const { user } = useAuth();
  const [isUserMicOn, setIsUserMicOn] = useState(false);
  const [isUserCameraOn, setIsUserCameraOn] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [messages, setMessages] = useState<{ speaker: string; text: string; isAI: boolean }[]>([]);
  const [showChat, setShowChat] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [interactionCount, setInteractionCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const pauseCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordCountRef = useRef<number>(0);
  const pendingResponseRef = useRef<boolean>(false);
  const lastUserTextRef = useRef<string>("");
  const responseQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Track conversation history for intelligent responses
  const conversationHistoryRef = useRef<string>("");

  // Get random quick response for immediate feedback
  const getQuickResponse = useCallback((type: keyof typeof quickResponses) => {
    const responses = quickResponses[type];
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  // Speak message without blocking - optimized for natural flow
  const speakMessage = useCallback((message: string, participant: Participant, onDone?: () => void) => {
    // Cancel any ongoing speech to prevent overlap
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(message);
    const config = voiceConfigs[participant.personality] || voiceConfigs.analytical;
    
    const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
    const voicePool = englishVoices.length > 0 ? englishVoices : availableVoices;
    const voice = voicePool[config.voiceIndex % Math.max(voicePool.length, 1)];
    
    if (voice) utterance.voice = voice;
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    
    isSpeakingRef.current = true;
    
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setCurrentSpeaker(null);
      setAiMessage("");
      onDone?.();
    };
    
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setCurrentSpeaker(null);
      setAiMessage("");
      onDone?.();
    };
    
    window.speechSynthesis.speak(utterance);
  }, [availableVoices]);

  // Instant response - uses local responses for immediate human-like interaction
  const triggerInstantResponse = useCallback((participant: Participant, responseType: keyof typeof quickResponses = 'acknowledgments') => {
    if (isSpeakingRef.current || currentSpeaker) return;
    
    const response = getQuickResponse(responseType);
    setCurrentSpeaker(participant.id);
    setAiMessage(response);
    setMessages(prev => [...prev, { speaker: participant.name, text: response, isAI: true }]);
    conversationHistoryRef.current += `\n${participant.name}: ${response}`;
    setInteractionCount(prev => prev + 1);
    
    // Slight random delay (100-300ms) for natural feel
    const naturalDelay = 100 + Math.random() * 200;
    setTimeout(() => speakMessage(response, participant), naturalDelay);
  }, [currentSpeaker, getQuickResponse, speakMessage]);

  // Smart AI response - fetches contextual response but doesn't block
  const triggerSmartResponse = useCallback(async (participant: Participant, userText: string) => {
    if (isSpeakingRef.current || currentSpeaker) return;
    
    setCurrentSpeaker(participant.id);
    pendingResponseRef.current = true;

    try {
      const { data } = await supabase.functions.invoke('scenario-feedback', {
        body: {
          transcript: userText.slice(-300), // Keep context short for speed
          scenarioType: scenario.type,
          context: scenario.context,
          goal: scenario.goal,
          participantRole: participant.role,
          participantPersonality: participant.personality,
          intelligentResponse: true,
          conversationHistory: conversationHistoryRef.current.slice(-800)
        }
      });

      const responseMessage = data?.response || data?.followUpQuestion;
      
      if (responseMessage && pendingResponseRef.current) {
        setAiMessage(responseMessage);
        setMessages(prev => [...prev, { speaker: participant.name, text: responseMessage, isAI: true }]);
        conversationHistoryRef.current += `\n${participant.name}: ${responseMessage}`;
        setInteractionCount(prev => prev + 1);
        speakMessage(responseMessage, participant);
      } else {
        setCurrentSpeaker(null);
      }
    } catch (error) {
      console.error('Smart response error:', error);
      // Fallback to quick response on error
      const fallback = getQuickResponse('clarifications');
      setAiMessage(fallback);
      setMessages(prev => [...prev, { speaker: participant.name, text: fallback, isAI: true }]);
      speakMessage(fallback, participant);
    }
    
    pendingResponseRef.current = false;
  }, [currentSpeaker, scenario, speakMessage, getQuickResponse]);

  // Optimized pause detection - triggers responses faster with natural timing
  useEffect(() => {
    if (!sessionStarted || !isUserMicOn || currentSpeaker || isSpeakingRef.current) return;

    const checkPause = setInterval(() => {
      const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
      const wordCount = wordCountRef.current;
      
      // Quick thinking/acknowledgment after short pause (1s) - feels like active listening
      if (timeSinceLastSpeech > 1000 && timeSinceLastSpeech < 1800 && wordCount > 3 && !pendingResponseRef.current) {
        const randomParticipant = scenario.participants[Math.floor(Math.random() * scenario.participants.length)];
        
        // 35% chance for quick acknowledgment - more frequent for natural flow
        if (Math.random() < 0.35) {
          const responseTypes: (keyof typeof quickResponses)[] = ['acknowledgments', 'thinking', 'professional'];
          const randomType = responseTypes[Math.floor(Math.random() * responseTypes.length)];
          triggerInstantResponse(randomParticipant, randomType);
          wordCountRef.current = 0;
        }
      }
      
      // Intelligent response after natural pause (1.8s+) - faster engagement
      if (timeSinceLastSpeech > 1800 && wordCount > 5 && !pendingResponseRef.current) {
        const randomParticipant = scenario.participants[Math.floor(Math.random() * scenario.participants.length)];
        
        // 55% smart contextual response, 25% challenge, 20% encouragement
        const roll = Math.random();
        if (roll < 0.55) {
          triggerSmartResponse(randomParticipant, lastUserTextRef.current);
        } else if (roll < 0.80) {
          triggerInstantResponse(randomParticipant, 'challenges');
        } else {
          triggerInstantResponse(randomParticipant, 'encouragements');
        }
        wordCountRef.current = 0;
      }
    }, 400); // Check every 400ms for snappier response

    return () => clearInterval(checkPause);
  }, [sessionStarted, isUserMicOn, currentSpeaker, scenario.participants, triggerInstantResponse, triggerSmartResponse]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (sessionStarted) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsUserCameraOn(true);
    } catch (error) {
      toast.error("Unable to access camera");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsUserCameraOn(false);
  };

  const startRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      if (finalTranscript) {
        // Update last speech time and word count
        lastSpeechTimeRef.current = Date.now();
        wordCountRef.current += finalTranscript.split(' ').length;
        
        setTranscript(prev => prev + ' ' + finalTranscript);
        setMessages(prev => [...prev, { speaker: "You", text: finalTranscript, isAI: false }]);
        conversationHistoryRef.current += `\nUser: ${finalTranscript}`;

        // Store last user text for smart responses
        lastUserTextRef.current = finalTranscript;
        
        // Check if user asked a question - trigger immediate response
        const isQuestion = finalTranscript.includes('?') || 
          finalTranscript.toLowerCase().includes('what do you think') ||
          finalTranscript.toLowerCase().includes('is it okay') ||
          finalTranscript.toLowerCase().includes('right') ||
          finalTranscript.toLowerCase().includes('correct');
        
        if (isQuestion && !currentSpeaker && !isSpeakingRef.current) {
          // Respond to questions quickly with smart response
          const randomParticipant = scenario.participants[Math.floor(Math.random() * scenario.participants.length)];
          setTimeout(() => triggerSmartResponse(randomParticipant, finalTranscript), 500);
        }
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
    setIsUserMicOn(true);
    if (!sessionStarted) {
      setSessionStarted(true);
      // Initial AI greeting - more natural and professional
      const openingGreetings = [
        `Alright, let's get started. So, ${scenario.context.split('.')[0]}. What are your thoughts?`,
        `Okay everyone, thanks for joining. ${scenario.context.split('.')[0]}. Go ahead whenever you're ready.`,
        `Good, we're all here. ${scenario.context.split('.')[0]}. Take it away.`,
      ];
      const greeting = openingGreetings[Math.floor(Math.random() * openingGreetings.length)];
      simulateAIResponse(scenario.participants[0], greeting);
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsUserMicOn(false);
  };

  // Get unique voice for participant based on personality
  const getVoiceForParticipant = (participant: Participant): SpeechSynthesisVoice | null => {
    const config = voiceConfigs[participant.personality] || voiceConfigs.analytical;
    if (availableVoices.length === 0) return null;
    
    // Try to get a variety of voices
    const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
    const voicePool = englishVoices.length > 0 ? englishVoices : availableVoices;
    
    return voicePool[config.voiceIndex % voicePool.length];
  };

  const simulateAIResponse = useCallback(async (participant: Participant, customMessage?: string) => {
    setCurrentSpeaker(participant.id);

    let responseMessage = customMessage;
    
    if (!customMessage) {
      // Get AI response based on what user actually said
      const recentUserSpeech = lastUserTextRef.current || messages.filter(m => !m.isAI).slice(-1)[0]?.text || "";
      
      if (recentUserSpeech && recentUserSpeech.trim().length > 5) {
        try {
          const { data } = await supabase.functions.invoke('scenario-feedback', {
            body: {
              transcript: recentUserSpeech,
              scenarioType: scenario.type,
              context: scenario.context,
              goal: scenario.goal,
              participantRole: participant.role,
              participantPersonality: participant.personality,
              intelligentResponse: true,
              conversationHistory: conversationHistoryRef.current.slice(-800)
            }
          });

          responseMessage = data?.response || data?.followUpQuestion;
        } catch (error) {
          console.error('AI response error:', error);
          responseMessage = getQuickResponse('clarifications');
        }
      }
    }

    if (responseMessage) {
      setAiMessage(responseMessage);
      setMessages(prev => [...prev, { speaker: participant.name, text: responseMessage!, isAI: true }]);
      conversationHistoryRef.current += `\n${participant.name}: ${responseMessage}`;
      speakMessage(responseMessage, participant);
    } else {
      setCurrentSpeaker(null);
    }
  }, [scenario, messages, speakMessage, getQuickResponse]);

  const getDefaultQuestion = (participant: Participant): string => {
    const questions: Record<string, string[]> = {
      analytical: [
        "Can you walk me through the technical details?",
        "What metrics are you tracking for this?",
        "How does this compare to our baseline?",
      ],
      strategic: [
        "How does this align with our quarterly goals?",
        "What's the impact on our roadmap?",
        "Have you considered the competitive landscape?",
      ],
      "detail-oriented": [
        "Have you accounted for edge cases?",
        "What's the testing strategy here?",
        "Can you clarify the acceptance criteria?",
      ],
      creative: [
        "How does this affect the user experience?",
        "Could we explore alternative approaches?",
        "What's the visual impact of this change?",
      ],
      technical: [
        "What's the architectural approach?",
        "Are there any scalability concerns?",
        "How does this integrate with existing systems?",
      ],
      empathetic: [
        "How is the team feeling about this?",
        "What support do you need from us?",
        "Have you discussed this with stakeholders?",
      ],
      visionary: [
        "How does this fit our long-term vision?",
        "What opportunities does this open up?",
        "Where do you see this in 2 years?",
      ],
      persuasive: [
        "How would you pitch this to customers?",
        "What's the key message here?",
        "How do we differentiate this?",
      ],
      pragmatic: [
        "What's the ROI on this?",
        "Can we do this within budget?",
        "What are the cost implications?",
      ],
      organized: [
        "What's the timeline for this?",
        "Who are the key stakeholders?",
        "What are the dependencies?",
      ],
      charismatic: [
        "How excited is the client about this?",
        "What's the value proposition?",
        "How do we close this deal?",
      ],
      cautious: [
        "Have we reviewed the legal implications?",
        "What are the compliance requirements?",
        "Are there any risks we should address?",
      ],
    };

    const personalityQuestions = questions[participant.personality] || questions.analytical;
    return personalityQuestions[Math.floor(Math.random() * personalityQuestions.length)];
  };

  const handleParticipantClick = (participant: Participant) => {
    if (!currentSpeaker && sessionStarted && !isProcessing) {
      simulateAIResponse(participant);
    }
  };

  const endSession = async () => {
    stopRecognition();
    stopCamera();
    window.speechSynthesis.cancel();

    if (transcript.trim() && user) {
      setIsProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke('scenario-feedback', {
          body: {
            transcript: transcript,
            scenarioType: scenario.type,
            context: scenario.context,
            goal: scenario.goal,
          }
        });

        if (error) throw error;

        // Edge function returns flat keys with 0-100 scores, convert to 0-10
        const toTen = (v: number | undefined) => v != null ? Math.round((v / 10) * 10) / 10 : null;
        const fluency = toTen(data?.fluencyScore);
        const clarity = toTen(data?.clarityScore);
        const confidence = toTen(data?.confidenceScore);
        const tone = toTen(data?.toneScore);
        const structure = toTen(data?.structureScore);
        const grammar = toTen(data?.grammarScore);
        const fillerWords = toTen(data?.fillerWordsCount != null ? Math.max(0, 100 - data.fillerWordsCount * 10) : undefined);
        const scores = [fluency, clarity, confidence, tone, structure, grammar, fillerWords].filter(s => s != null) as number[];
        const overallScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;

        await supabase.from('scenario_progress').insert({
          user_id: user.id,
          scenario_id: scenario.id,
          duration_seconds: elapsedTime,
          overall_score: overallScore,
          fluency_score: fluency,
          clarity_score: clarity,
          confidence_score: confidence,
          tone_score: tone,
          filler_words_score: fillerWords,
          structure_score: structure,
          grammar_score: grammar,
          feedback_summary: data?.detailedFeedback || data?.feedback,
        });

        // Use centralized engine for XP and streak
        const { updateUserXpAndStreak, calculateXpFromScore } = await import("@/lib/engines");
        const xpEarned = calculateXpFromScore(overallScore || 5, scenario.difficulty);
        await updateUserXpAndStreak(user.id, xpEarned);

        onComplete({ ...data, xpEarned, overallScore: overallScore ? overallScore * 10 : data?.overallScore });
      } catch (error) {
        console.error('Error saving progress:', error);
        toast.error("Failed to get feedback");
        onClose();
      }
    } else {
      onClose();
    }
  };

  useEffect(() => {
    return () => {
      stopRecognition();
      stopCamera();
      window.speechSynthesis.cancel();
      if (pauseCheckIntervalRef.current) {
        clearInterval(pauseCheckIntervalRef.current);
      }
    };
  }, []);

  const getSettingBackground = () => {
    switch (scenario.setting) {
      case "boardroom":
        return "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900";
      case "interview":
        return "bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900";
      case "presentation":
        return "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900";
      default:
        return "bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 ${getSettingBackground()}`}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white/90 font-medium">{formatTime(elapsedTime)}</span>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <span className="text-white/80">{scenario.name}</span>
          {interactionCount > 0 && (
            <>
              <div className="h-6 w-px bg-white/20" />
              <span className="text-green-400 text-sm flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {interactionCount} interactions
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">{scenario.participants.length + 1} participants</span>
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="h-full pt-16 pb-24 px-4">
        <div className={`h-full grid gap-3 ${
          scenario.participants.length === 1 ? 'grid-cols-2' :
          scenario.participants.length <= 3 ? 'grid-cols-2 md:grid-cols-3' :
          'grid-cols-2 md:grid-cols-3'
        }`}>
          {/* User's video */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border-2 ${
              isUserMicOn ? 'border-green-500' : 'border-white/10'
            }`}
          >
            {isUserCameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/30 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">You</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">You (Host)</span>
              <div className="flex items-center gap-1">
                {isUserMicOn && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                  >
                    <Mic className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* AI Participants */}
          {scenario.participants.map((participant, index) => (
            <motion.div
              key={participant.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleParticipantClick(participant)}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                currentSpeaker === participant.id
                  ? 'border-2 border-green-500 ring-4 ring-green-500/30'
                  : 'border-2 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="w-full h-full bg-gradient-to-br from-secondary/50 to-secondary/20 flex items-center justify-center">
                <div className="relative">
                  <img
                    src={participant.avatar}
                    alt={participant.name}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white/20"
                  />
                  {currentSpeaker === participant.id && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <Mic className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                  <p className="text-white text-sm font-medium truncate">{participant.name}</p>
                  <p className="text-white/60 text-xs truncate">{participant.role}</p>
                </div>
              </div>
              {currentSpeaker === participant.id && aiMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-3 left-3 right-3 bg-black/80 backdrop-blur-sm rounded-lg p-3"
                >
                  <p className="text-white text-sm">{aiMessage}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Compact Chat Panel (small overlay box) */}
      <AnimatePresence>
        {messages.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className={`absolute bottom-28 left-4 ${showChat ? 'w-72' : 'w-48'} bg-black/70 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden transition-all duration-300`}
          >
            <div 
              className="p-2 border-b border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/5"
              onClick={() => setShowChat(!showChat)}
            >
              <h3 className="text-white text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-3 h-3" />
                Conversation
              </h3>
              {showChat ? <ChevronDown className="w-4 h-4 text-white/60" /> : <ChevronUp className="w-4 h-4 text-white/60" />}
            </div>
            {showChat && (
              <div className="p-2 space-y-2 overflow-y-auto max-h-40">
                {messages.slice(-4).map((msg, index) => (
                  <div key={index} className={`${msg.isAI ? 'text-left' : 'text-right'}`}>
                    <span className={`text-xs ${msg.isAI ? 'text-blue-400' : 'text-green-400'}`}>
                      {msg.speaker}
                    </span>
                    <p className={`text-xs mt-0.5 p-1.5 rounded-lg ${
                      msg.isAI ? 'bg-blue-500/20 text-white' : 'bg-green-500/20 text-white'
                    }`}>
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isUserMicOn ? "default" : "secondary"}
            size="lg"
            className={`rounded-full w-14 h-14 ${isUserMicOn ? 'bg-green-500 hover:bg-green-600' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={isUserMicOn ? stopRecognition : startRecognition}
          >
            {isUserMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>
          
          <Button
            variant={isUserCameraOn ? "default" : "secondary"}
            size="lg"
            className={`rounded-full w-14 h-14 ${isUserCameraOn ? 'bg-green-500 hover:bg-green-600' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={isUserCameraOn ? stopCamera : startCamera}
          >
            {isUserCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={endSession}
          >
            <Phone className="w-6 h-6 rotate-[135deg]" />
          </Button>
        </div>

        {!sessionStarted && (
          <p className="text-center text-white/60 text-sm mt-4">
            Click the microphone to start the session
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ImmersiveMeeting;
