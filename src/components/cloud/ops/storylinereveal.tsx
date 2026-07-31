/**
 * Visual-novel style: break a paragraph into 2–4 short lines,
 * reveal one at a time (click or auto-advance).
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

const clean = (t?: string) => (t ? t.replace(/\[cite:\s*\d+\]/g, "").trim() : "");

/** Split a paragraph into short story-game lines (2–4). */
export function splitStoryLines(text?: string, maxLines = 4): string[] {
  const raw = clean(text);
  if (!raw) return [];

  // Prefer sentence boundaries
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length >= 2 && sentences.length <= maxLines) {
    return sentences;
  }

  if (sentences.length > maxLines) {
    // Merge extras into the last line
    const head = sentences.slice(0, maxLines - 1);
    const tail = sentences.slice(maxLines - 1).join(" ");
    return [...head, tail];
  }

  // Single long sentence — split on em-dash / comma / colon clauses
  const clauses = raw
    .split(/\s*[—–:;]\s+|,\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  if (clauses.length >= 2) {
    return clauses.slice(0, maxLines);
  }

  // Hard wrap by ~90 chars
  if (raw.length > 110) {
    const words = raw.split(/\s+/);
    const lines: string[] = [];
    let buf = "";
    for (const w of words) {
      const next = buf ? `${buf} ${w}` : w;
      if (next.length > 88 && buf) {
        lines.push(buf);
        buf = w;
        if (lines.length >= maxLines - 1) {
          const rest = [buf, ...words.slice(words.indexOf(w) + 1)].join(" ");
          lines.push(rest);
          return lines;
        }
      } else {
        buf = next;
      }
    }
    if (buf) lines.push(buf);
    return lines.slice(0, maxLines);
  }

  return [raw];
}

type Props = {
  text?: string;
  /** Auto-advance delay ms; 0 = click only */
  autoMs?: number;
  className?: string;
  lineClassName?: string;
  onComplete?: () => void;
  /** Prefix like Ren: */
  speaker?: string;
};

export function StoryLineReveal({
  text,
  autoMs = 2200,
  className = "",
  lineClassName = "text-sm leading-relaxed text-slate-300",
  onComplete,
  speaker,
}: Props) {
  const lines = useMemo(() => splitStoryLines(text), [text]);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setIndex(0);
    setDone(false);
  }, [text]);

  useEffect(() => {
    if (!lines.length || done) return;
    if (autoMs <= 0) return;
    if (index >= lines.length - 1) {
      setDone(true);
      onComplete?.();
      return;
    }
    const t = window.setTimeout(() => setIndex((i) => i + 1), autoMs);
    return () => window.clearTimeout(t);
  }, [index, lines.length, autoMs, done, onComplete]);

  if (!lines.length) return null;

  const advance = () => {
    if (index < lines.length - 1) {
      setIndex((i) => i + 1);
    } else if (!done) {
      setDone(true);
      onComplete?.();
    }
  };

  return (
    <button
      type="button"
      onClick={advance}
      className={`block w-full text-left ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={`${index}-${lines[index]}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.28 }}
          className={lineClassName}
        >
          {speaker && (
            <span className="mr-1 font-medium text-amber-300/90">{speaker} </span>
          )}
          {lines[index]}
        </motion.p>
      </AnimatePresence>
      <span className="mt-2 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-slate-600">
        {index + 1}/{lines.length}
        {!done && (
          <>
            <ChevronRight className="h-3 w-3" /> tap
          </>
        )}
      </span>
    </button>
  );
}
