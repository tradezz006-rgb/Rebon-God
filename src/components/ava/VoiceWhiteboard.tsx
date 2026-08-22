import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface WhiteboardProps {
  history: any[];
  lessonTitle?: string;
  isFullscreen?: boolean;
  onClose?: () => void;
}

// Handwriting-style fonts — like a teacher writing on a dark smart board
const HANDWRITING_FONTS = "'Caveat', 'Kalam', cursive";

// ─── Typewriter effect ──────────────────────────────────────────────────────
const TypewriterText = ({ text, speed = 36, className = "", animate = true }: { text: string; speed?: number; className?: string; animate?: boolean }) => {
  const [displayed, setDisplayed] = useState(animate ? '' : text);
  const done = useRef(!animate);

  useEffect(() => {
    if (!animate) {
      setDisplayed(text);
      done.current = true;
      return;
    }
    setDisplayed('');
    done.current = false;
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        setDisplayed(text.substring(0, i + 1));
        i++;
        const char = text[i - 1];
        const delay = char === '.' || char === ',' ? speed + 80 : speed + Math.random() * 15;
        setTimeout(tick, Math.max(8, delay));
      } else {
        done.current = true;
      }
    };
    const id = setTimeout(tick, 30);
    return () => clearTimeout(id);
  }, [text, animate]);

  return <span className={className}>{displayed}</span>;
};

// ─── SVG Drawn underline (chalky white/yellow) ──────────────────────────────
const GlowUnderline = ({ delay = 0, color = "rgba(255,255,255,0.4)", animate = true }: { delay?: number; color?: string; animate?: boolean }) => (
  <svg className="absolute -bottom-1 left-0 h-2 overflow-visible" style={{ width: '100%' }} preserveAspectRatio="none">
    <motion.path
      d="M 2 5 Q 30 2 55 4 T 98 5"
      vectorEffect="non-scaling-stroke"
      fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
      initial={animate ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={animate ? { duration: 0.5, delay, ease: "easeInOut" } : { duration: 0 }}
    />
  </svg>
);

// ─── SVG Drawn circle (chalky) ────────────────────────────────────────────
const GlowCircle = ({ delay = 0, children, color = "rgba(254,240,138,0.7)", animate = true }: { delay?: number; children: React.ReactNode; color?: string; animate?: boolean }) => (
  <span className="relative inline-block px-1">
    {children}
    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" style={{ top: '-15%', left: '-8%', width: '116%', height: '130%' }}>
      <motion.path
        d="M 50,5 C 85,0 95,25 95,50 C 95,78 80,95 50,95 C 20,95 5,78 5,50 C 5,22 18,5 50,5"
        vectorEffect="non-scaling-stroke"
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : { pathLength: 1.05, opacity: 1 }}
        animate={{ pathLength: 1.05, opacity: 1 }}
        transition={animate ? { duration: 0.7, delay, ease: "easeOut" } : { duration: 0 }}
      />
    </svg>
  </span>
);

// ─── Render each board action ───────────────────────────────────────────────
const renderBoardAction = (action: any, idx: number, isLatest: boolean) => {
  const d = isLatest ? 0.1 : 0;

  // Legacy fallback: plain text object
  if (!action.type) {
    return (
      <motion.div key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: d }}
        className="mb-4">
        <TypewriterText text={action.text || ''} animate={isLatest} className="text-[26px] text-white/90" />
      </motion.div>
    );
  }

  switch (action.type) {
    // ── TITLE ───────────────────────────────────────────────────────────────
    case 'write_title':
      return (
        <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d }}
          className="mb-8 text-center">
          {action.lines?.map((line: string, i: number) => (
            <div key={i} className="relative inline-block mb-3 w-full text-center">
              <TypewriterText text={line} animate={isLatest}
                className={`text-[36px] font-bold tracking-wide ${i === 0 ? 'text-yellow-100' : 'text-white/80'}`} />
              <GlowUnderline delay={d + 0.4 + i * 0.2} animate={isLatest} color={i === 0 ? "rgba(254,240,138,0.8)" : "rgba(255,255,255,0.4)"} />
            </div>
          ))}
        </motion.div>
      );

    // ── HEADING ─────────────────────────────────────────────────────────────
    case 'write_heading':
      return (
        <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d }}
          className="mt-7 mb-4">
          <span className="relative inline-block">
            <TypewriterText text={action.text} animate={isLatest} className="text-[30px] font-bold text-yellow-100" />
            <GlowUnderline delay={d + 0.5} animate={isLatest} color="rgba(254,240,138,0.7)" />
          </span>
        </motion.div>
      );

    // ── DEFINITION BOX ──────────────────────────────────────────────────────
    case 'write_definition_box':
      return (
        <motion.div key={idx} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: d }}
          className="my-6 p-5 border border-dashed border-white/20 rounded-xl bg-white/5 relative">
          <div className="absolute -top-2.5 left-4 px-2 bg-[#12161a] text-[11px] font-sans font-bold text-white/50 tracking-widest uppercase">Definition</div>
          <TypewriterText text={action.text} animate={isLatest} className="text-[24px] text-white/85 leading-relaxed" />
        </motion.div>
      );

    // ── BULLET POINTS ────────────────────────────────────────────────────────
    case 'write_points':
    case 'write_stats':
    case 'write_summary': {
      const items: string[] = action.points || action.items || [];
      return (
        <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d }}
          className="my-5 pl-2">
          {action.title && (
            <span className="relative inline-block mb-3">
              <TypewriterText text={action.title} animate={isLatest} className="text-[26px] font-bold text-yellow-100" />
              <GlowUnderline delay={d + 0.3} animate={isLatest} color="rgba(254,240,138,0.6)" />
            </span>
          )}
          <ul className="space-y-3 mt-2">
            {items.map((item: string, i: number) => (
              <motion.li key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: d + 0.1 + i * 0.1 }} className="flex items-start gap-3">
                <span className="text-white/50 text-[26px] leading-none mt-0.5">→</span>
                <TypewriterText text={item} speed={26} animate={isLatest} className="text-[24px] text-white/85 leading-relaxed" />
              </motion.li>
            ))}
          </ul>
        </motion.div>
      );
    }

    // ── CIRCLE + ANNOTATE ───────────────────────────────────────────────────
    case 'underline_and_circle':
      return (
        <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d }}
          className="my-5 ml-4 flex items-center gap-4 flex-wrap">
          <GlowCircle delay={d + 0.2} animate={isLatest}>
            <span className="text-[26px] font-bold text-yellow-100">{action.text}</span>
          </GlowCircle>
          {action.annotation && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d + 0.5 }}
              className="text-[22px] text-white/60">← {action.annotation}</motion.span>
          )}
        </motion.div>
      );

    // ── CODE BLOCK ───────────────────────────────────────────────────────────
    case 'write_code':
      return (
        <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d }}
          className="my-6 rounded-xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
          {action.title && (
            <div className="px-4 py-1.5 bg-white/5 border-b border-white/10 text-[12px] font-sans font-semibold text-white/50 tracking-wider">
              {action.title}
            </div>
          )}
          <div className="p-4 bg-black/20">
            <pre className="font-mono text-[17px] text-yellow-50/90 leading-snug overflow-x-auto">
              <TypewriterText text={Array.isArray(action.code) ? action.code.join('\n') : (action.code || '')} speed={8} animate={isLatest} />
            </pre>
          </div>
          {action.annotations && action.annotations.length > 0 && (
            <div className="px-4 py-2 bg-white/5 border-t border-white/10">
              {action.annotations.map((ann: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: d + 0.5 + i * 0.2 }}
                  className="text-[15px] font-sans text-white/40 py-0.5">
                  // {ann.note}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      );

    // ── DIAGRAM ──────────────────────────────────────────────────────────────
    case 'draw_diagram':
      return (
        <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d }}
          className="my-8 text-center">
          {action.title && (
            <div className="text-[24px] font-bold text-yellow-100 mb-4">{action.title}</div>
          )}
          <pre className="inline-block text-left font-mono text-[18px] text-white/70 whitespace-pre leading-relaxed">
            <TypewriterText text={action.diagram?.ascii?.join('\n') || action.text || ''} speed={5} animate={isLatest} />
          </pre>
        </motion.div>
      );

    // ── QUESTION PANEL ───────────────────────────────────────────────────────
    case 'write_question':
      return (
        <motion.div key={idx} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: d }}
          className="my-8 p-6 rounded-2xl border border-white/20 bg-white/5 relative">
          <div className="absolute -top-4 -left-3 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-sans font-black text-sm shadow-[0_0_15px_rgba(255,255,255,0.15)]">?</div>
          <TypewriterText text={action.panel?.question || action.text || ''} animate={isLatest} className="text-[26px] font-bold text-yellow-100 block mb-5" />
          {action.panel?.options && (
            <ul className="space-y-3 ml-2">
              {action.panel.options.map((opt: string, i: number) => (
                <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: d + 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 text-[22px] text-white/80">
                  <div className="w-6 h-6 rounded-full border-2 border-white/30 shrink-0" />
                  {opt}
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      );

    // ── FEEDBACK PANEL (correct / wrong) ────────────────────────────────────
    case 'write_feedback':
      return (
        <motion.div key={idx}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: d }}
          className="my-6 p-5 rounded-xl border border-white/10 bg-white/5">
          <div className={`text-[13px] font-sans font-bold tracking-widest mb-2 ${action.isCorrect ? 'text-white/60' : 'text-yellow-100/60'}`}>
            {action.isCorrect ? '✓ CORRECT' : '✗ NEEDS ATTENTION'}
          </div>
          <TypewriterText text={action.text} animate={isLatest} className={`text-[24px] leading-relaxed ${action.isCorrect ? 'text-white/95' : 'text-yellow-50/90'}`} />
          {!action.isCorrect && action.correction && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d + 0.4 }}
              className="mt-3 pt-3 border-t border-white/10">
              <span className="text-[13px] text-white/40 font-sans font-bold tracking-widest block mb-1">CORRECT ANSWER</span>
              <TypewriterText text={action.correction} animate={isLatest} className="text-[22px] text-white/80" />
            </motion.div>
          )}
        </motion.div>
      );

    default:
      return (
        <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d }}
          className="mb-4">
          <TypewriterText text={action.text || ''} animate={isLatest} className="text-[24px] text-white/85" />
        </motion.div>
      );
  }
};

// ─── Main Whiteboard Component ──────────────────────────────────────────────
export const VoiceWhiteboard: React.FC<WhiteboardProps> = ({ history, lessonTitle, isFullscreen = false, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 120);
    }
  }, [history]);

  return (
    <div
      className={`relative flex flex-col overflow-hidden transition-all duration-500
        ${isFullscreen
          ? 'fixed inset-4 z-50 rounded-2xl'
          : 'w-full h-full rounded-2xl'
        }`}
      style={{
        fontFamily: HANDWRITING_FONTS,
        background: '#12161a',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 0 40px rgba(0,0,0,0.7), inset 0 0 80px rgba(255,255,255,0.01)',
      }}
    >
      {/* Header bar */}
      <div className="shrink-0 h-10 flex items-center justify-between px-5 border-b border-white/5"
        style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          <span className="font-sans text-[11px] font-bold text-white/50 tracking-[0.25em] uppercase">
            {lessonTitle || "Ren's Board"}
          </span>
        </div>
        {isFullscreen && onClose && (
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        )}
      </div>

      {/* Board content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth px-8 py-6"
        style={{
          // Ruled chalk board lines in faint gray
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(255,255,255,0.02) 47px, rgba(255,255,255,0.02) 48px)',
        }}
      >
        <AnimatePresence>
          {history.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center text-white/30 font-sans text-base tracking-widest">
              BOARD READY
            </motion.div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-2 pb-24">
              {history.map((action, idx) => renderBoardAction(action, idx, idx === history.length - 1))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom tray — marker effect */}
      <div className="shrink-0 h-8 border-t border-white/5 flex items-center px-6 gap-3"
        style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="w-10 h-3 rounded-sm bg-white/20 rotate-[-8deg] shadow-sm" />
        <div className="w-10 h-3 rounded-sm bg-white/10 rotate-[5deg] shadow-sm" />
        <div className="w-14 h-5 rounded-sm bg-white/5 ml-auto shadow border border-white/5" />
      </div>
    </div>
  );
};
