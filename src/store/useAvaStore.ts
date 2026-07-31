import { create } from 'zustand';

interface AvaContext {
  level: string;
  domain: string;
  currentLesson: string;
  weakAreas: string[];
}

interface AvaStore {
  isVisible: boolean;
  isTalking: boolean;
  message: string | null;
  context: AvaContext;
  showAva: () => void;
  hideAva: () => void;
  setTalking: (talking: boolean) => void;
  setMessage: (msg: string | null) => void;
  setContext: (context: Partial<AvaContext>) => void;
  askQuestion: (question?: string) => Promise<void>;
  triggerFirstTimeIntro: () => void;
}

export const useAvaStore = create<AvaStore>((set, get) => ({
  isVisible: false,
  isTalking: false,
  message: null,
  context: {
    level: 'Beginner',
    domain: 'General',
    currentLesson: 'Introduction',
    weakAreas: [],
  },
  showAva: () => set({ isVisible: true }),
  hideAva: () => set({ isVisible: false, isTalking: false, message: null }),
  setTalking: (talking) => set({ isTalking: talking }),
  setMessage: (msg) => set({ message: msg }),
  setContext: (context) => set((state) => ({ context: { ...state.context, ...context } })),
  triggerFirstTimeIntro: () => {
    set({
      isVisible: true,
      isTalking: true,
      message: "I've analyzed your performance and prepared your learning path. This will continuously adapt as you improve."
    });
    setTimeout(() => {
      set({ isTalking: false });
      setTimeout(() => {
        set({ isVisible: false, message: null });
      }, 4000);
    }, 5000);
  },
  askQuestion: async (question) => {
    const { context } = get();
    set({ isVisible: true, isTalking: true, message: null });
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const response = await supabase.functions.invoke('ask-ava', {
        body: {
          context,
          question: question || "Can you give me a hint on this?"
        }
      });
      
      if (response.error) throw response.error;
      
      set({ message: response.data.answer || "I'm here to help! Let's figure this out.", isTalking: true });
      
      // Stop speaking animation after reading message
      setTimeout(() => {
        set({ isTalking: false });
        // Hide message panel after 5 seconds
        setTimeout(() => {
          set({ message: null });
        }, 5000);
      }, Math.max(2000, (response.data.answer?.length || 0) * 50)); // Crude length-based talking duration
      
    } catch (e) {
      console.error('Failed to ask AVA:', e);
      set({ message: "Hm, I'm having trouble connecting to my knowledge base.", isTalking: true });
      setTimeout(() => set({ isTalking: false }), 3000);
    }
  }
}));
