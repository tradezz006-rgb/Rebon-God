import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AvaContext {
  isVisible: boolean;
  isExpanded: boolean;
  isTalking: boolean;
  message: string | null;
  isLoading: boolean;
  askAva: (question: string, context?: AvaRequestContext) => Promise<void>;
  triggerAva: (trigger: string, context?: AvaRequestContext) => Promise<void>;
  showAva: () => void;
  hideAva: () => void;
  dismissMessage: () => void;
}

export interface AvaRequestContext {
  level?: string;
  domain?: string;
  currentLesson?: string;
  weakAreas?: string[];
  trigger?: string;
}

const AvaContext = createContext<AvaContext | undefined>(undefined);

export const AvaProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleHide = (delay = 8000) => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
      setTimeout(() => {
        setMessage(null);
        setIsVisible(false);
      }, 1000);
    }, delay);
  };

  const callAva = useCallback(async (question: string, context?: AvaRequestContext) => {
    if (!user) return;
    setIsLoading(true);
    setIsVisible(true);
    setIsExpanded(true);
    clearHideTimer();

    try {
      const { data, error } = await supabase.functions.invoke("ask-ava", {
        body: { question, context: { ...context, trigger: context?.trigger || "help_requested" } },
      });

      if (error) throw error;
      
      setIsTalking(true);
      setMessage(data.message || "I'm here to help.");
      
      // Simulate talking duration based on message length
      const talkDuration = Math.min(Math.max((data.message?.length || 50) * 40, 2000), 6000);
      setTimeout(() => setIsTalking(false), talkDuration);
      
      scheduleHide(talkDuration + 5000);
    } catch (e) {
      console.error("AVA error:", e);
      setMessage("I'm having trouble connecting. Try again in a moment.");
      setIsTalking(false);
      scheduleHide(4000);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const askAva = useCallback(async (question: string, context?: AvaRequestContext) => {
    await callAva(question, { ...context, trigger: "help_requested" });
  }, [callAva]);

  const triggerAva = useCallback(async (trigger: string, context?: AvaRequestContext) => {
    const triggerScenarios: Record<string, string> = {
      struggling: "The student is struggling to complete the current assessment or is spending too much time. Give them a brief, encouraging hint to help them solve it without giving the direct answer.",
      first_visit: "The student has just entered the learning path. Give a welcoming 2-line introduction confirming you are their AI Mentor, that you've analyzed their level, and prepared an adaptive learning path. Keep it short and supportive.",
      task_complete: "The student successfully completed the task. Give them a brief 2-line positive reinforcement message.",
      scenario_complete: "The student finished the learning scenario. Give a short congratulatory message based on the context.",
    };
    
    const question = triggerScenarios[trigger] || "The student needs guidance. Please provide a brief hint.";
    await callAva(question, { ...context, trigger });
  }, [callAva]);

  const showAva = useCallback(() => {
    setIsVisible(true);
    setIsExpanded(true);
    clearHideTimer();
  }, []);

  const hideAva = useCallback(() => {
    clearHideTimer();
    setIsExpanded(false);
    setIsTalking(false);
    setTimeout(() => {
      setMessage(null);
      setIsVisible(false);
    }, 500);
  }, []);

  const dismissMessage = useCallback(() => {
    clearHideTimer();
    setMessage(null);
    setIsExpanded(false);
    setIsTalking(false);
  }, []);

  return (
    <AvaContext.Provider value={{
      isVisible, isExpanded, isTalking, message, isLoading,
      askAva, triggerAva, showAva, hideAva, dismissMessage,
    }}>
      {children}
    </AvaContext.Provider>
  );
};

export const useAva = () => {
  const context = useContext(AvaContext);
  if (!context) throw new Error("useAva must be used within AvaProvider");
  return context;
};
