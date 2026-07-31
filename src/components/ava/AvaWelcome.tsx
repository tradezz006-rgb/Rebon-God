import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ChevronRight, SkipForward } from "lucide-react";
import AvaCore from "@/components/ava/AvaCore";
import type { AvaCoreState } from "@/components/ava/AvaCore";

interface AvaWelcomeProps {
  userLevel: string;
  lessonCount: number;
  onComplete: () => void;
}

const avaDialogueSteps = [
  {
    id: "intro",
    getMessage: (name: string) =>
      `Hello${name ? `, ${name}` : ""}. I'm Ren — your intelligence layer on Rebon. I will guide your entire learning journey.`,
  },
  {
    id: "analysis",
    getMessage: (_: string, level: string) =>
      `I've processed your assessment. You've been placed at the ${level} level. This path will continuously adapt as your capabilities expand.`,
  },
  {
    id: "schedule",
    getMessage: (_: string, __: string, count: number) =>
      `${count} learning sessions have been prepared. Each session includes live teaching, real-time interaction, and applied assessment. They unlock sequentially.`,
  },
  {
    id: "encouragement",
    getMessage: () =>
      `If you need me during a session — interrupt and speak. I'll respond immediately. Your first mission begins on Lesson 1. Proceed when ready.`,
  },
];

const AvaWelcome = ({ userLevel, lessonCount, onComplete }: AvaWelcomeProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [userName, setUserName] = useState("");
  const [avaState, setAvaState] = useState<AvaCoreState>('passive');
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const fetchName = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();
        if (data?.full_name) setUserName(data.full_name.split(" ")[0]);
      }
    };
    fetchName();
  }, [user]);

  const currentMessage = avaDialogueSteps[currentStep]?.getMessage(
    userName,
    userLevel.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
    lessonCount
  );

  const speakAva = useCallback((text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.1;

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

    const run = () => {
      const voice = getFemaleVoice();
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setAvaState('speaking');
      utterance.onend = () => {
        setAvaState('passive');
        onEnd?.();
      };
      utterance.onerror = () => {
        setAvaState('passive');
        onEnd?.();
      };
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', run, { once: true });
    } else {
      run();
    }
  }, []);

  // Speak on step change
  useEffect(() => {
    if (currentMessage) {
      speakAva(currentMessage);
    }
    return () => window.speechSynthesis?.cancel();
  }, [currentStep]); // eslint-disable-line

  // Typewriter
  useEffect(() => {
    if (!currentMessage) return;
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < currentMessage.length) {
        setDisplayedText(currentMessage.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 22);
    return () => clearInterval(interval);
  }, [currentStep, currentMessage]);

  const handleNext = () => {
    window.speechSynthesis?.cancel();
    if (currentStep < avaDialogueSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: '#020609' }}
    >
      {/* Layered environment */}
      <div className="ava-grid" />
      <div className="ava-scanlines" />

      {/* Volumetric radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,255,0.06) 0%, rgba(0,0,0,0) 70%)',
          animation: 'ava-env-glow 5s ease-in-out infinite',
        }}
      />

      {/* HUD corners */}
      <div className="ava-corner-tl" /><div className="ava-corner-tr" />
      <div className="ava-corner-bl" /><div className="ava-corner-br" />

      {/* Top HUD bar */}
      <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-8 z-10" style={{ borderBottom: '1px solid rgba(0,200,255,0.08)' }}>
        <span className="text-[10px] font-mono tracking-[0.4em] text-cyan-500/50">REN // INTELLIGENCE LAYER v1</span>
        <span className="text-[10px] font-mono tracking-[0.3em] text-cyan-500/30">REBON COGNITIVE WORKSPACE</span>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 gap-8">

        {/* AVA Quantum Core */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 100, delay: 0.2 }}
          className="ava-intro-animate"
        >
          <AvaCore state={avaState} size="lg" />
        </motion.div>

        {/* AVA label */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[11px] font-mono tracking-[0.5em] text-cyan-400/60 uppercase">Quantum Intelligence Core</span>
          <span className="text-[9px] font-mono tracking-[0.3em] text-cyan-500/30">
            {avaState === 'speaking' ? '[ TRANSMITTING ]' : avaState === 'passive' ? '[ STANDBY ]' : '[ PROCESSING ]'}
          </span>
        </motion.div>

        {/* Dialogue panel */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-xl"
          style={{
            background: 'rgba(0,8,18,0.7)',
            border: '1px solid rgba(0,200,255,0.12)',
            borderRadius: 12,
            padding: '28px 32px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 0 40px rgba(0,180,255,0.06), inset 0 0 30px rgba(0,0,0,0.3)',
          }}
        >
          {/* Step indicators */}
          <div className="flex justify-center gap-3 mb-5">
            {avaDialogueSteps.map((_, i) => (
              <div
                key={i}
                className="transition-all duration-500"
                style={{
                  width: i === currentStep ? 20 : 6,
                  height: 2,
                  borderRadius: 2,
                  background: i === currentStep ? 'rgba(0,200,255,0.9)' : i < currentStep ? 'rgba(0,200,255,0.35)' : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>

          <p className="text-slate-200 text-[15px] leading-relaxed min-h-[72px] font-light tracking-wide">
            {displayedText}
            {isTyping && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-[2px] h-4 bg-cyan-400 ml-1 align-middle"
              />
            )}
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={onComplete}
            className="text-[11px] font-mono tracking-[0.3em] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2"
          >
            <SkipForward className="w-3 h-3" /> SKIP
          </button>
          <button
            onClick={handleNext}
            disabled={isTyping}
            className="flex items-center gap-2 text-[11px] font-mono tracking-[0.3em] transition-all duration-300"
            style={{
              padding: '10px 24px',
              border: '1px solid rgba(0,200,255,0.35)',
              borderRadius: 6,
              background: isTyping ? 'rgba(0,200,255,0.03)' : 'rgba(0,200,255,0.08)',
              color: isTyping ? 'rgba(0,200,255,0.3)' : 'rgba(0,200,255,0.9)',
              boxShadow: isTyping ? 'none' : '0 0 20px rgba(0,180,255,0.12)',
              cursor: isTyping ? 'not-allowed' : 'pointer',
            }}
          >
            {currentStep < avaDialogueSteps.length - 1 ? 'CONTINUE' : 'BEGIN MISSION'}
            <ChevronRight className="w-3 h-3" />
          </button>
        </motion.div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 right-0 h-10 flex items-center justify-center px-8 z-10" style={{ borderTop: '1px solid rgba(0,200,255,0.06)' }}>
        <span className="text-[9px] font-mono tracking-[0.3em] text-cyan-500/20">SECURE SESSION INITIALIZED — ALL SYSTEMS NOMINAL</span>
      </div>
    </motion.div>
  );
};

export default AvaWelcome;
