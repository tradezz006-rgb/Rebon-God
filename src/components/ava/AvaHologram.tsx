import React from 'react';
import { useAva } from '@/contexts/AvaContext';
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import AvaCore from "@/components/ava/AvaCore";
import type { AvaCoreState } from "@/components/ava/AvaCore";

const AvaHologram: React.FC = () => {
  const { isVisible, isTalking, message, hideAva, isLoading } = useAva();
  const { user } = useAuth();
  const location = useLocation();

  if (!user || !isVisible || location.pathname.includes("/lesson/")) return null;

  const avaState: AvaCoreState = isLoading ? 'thinking' : isTalking ? 'speaking' : 'passive';

  return (
    <AnimatePresence>
      <motion.div
        key="ava-hologram"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="fixed bottom-6 right-6 z-50 flex items-end gap-3 pointer-events-none"
      >
        {/* Message bubble */}
        <AnimatePresence>
          {message && (
            <motion.div
              key="msg"
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto max-w-xs"
              style={{
                background: 'rgba(2,8,18,0.92)',
                border: '1px solid rgba(0,200,255,0.18)',
                borderRadius: 10,
                padding: '14px 18px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 30px rgba(0,180,255,0.08)',
              }}
            >
              {/* Corner accents */}
              <div style={{ position: 'absolute', top: 6, left: 6, width: 8, height: 8, borderTop: '1px solid rgba(0,200,255,0.5)', borderLeft: '1px solid rgba(0,200,255,0.5)' }} />
              <div style={{ position: 'absolute', bottom: 6, right: 6, width: 8, height: 8, borderBottom: '1px solid rgba(0,200,255,0.5)', borderRight: '1px solid rgba(0,200,255,0.5)' }} />
              <p className="text-slate-200 text-sm leading-relaxed font-light">{message}</p>
              <span className="text-[9px] font-mono tracking-widest text-cyan-500/40 mt-2 block">REN INTELLIGENCE</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ren Core (small) */}
        <div
          className="pointer-events-auto cursor-pointer flex-shrink-0"
          onClick={hideAva}
          title="Dismiss Ren"
        >
          <AvaCore state={avaState} size="sm" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AvaHologram;
