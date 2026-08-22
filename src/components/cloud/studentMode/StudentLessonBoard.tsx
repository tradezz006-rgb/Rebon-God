import { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceWhiteboard } from "@/components/ava/VoiceWhiteboard";
import type { StudentLessonFile } from "@/types/studentMode";
import { useAvaVoice } from "@/hooks/useAvaVoice";

interface Props {
  lesson: StudentLessonFile;
  blockIndex: number;
  onBlockIndex: (i: number) => void;
  onFinished: () => void;
}

/**
 * Student Mode lesson surface — same Ren board look as InteractiveLesson
 * (VoiceWhiteboard + handwriting). No avatar. Voice only.
 */
export function StudentLessonBoard({
  lesson,
  blockIndex,
  onBlockIndex,
  onFinished,
}: Props) {
  const { speak, stop } = useAvaVoice();
  const block = lesson.blocks[blockIndex];
  const isLast = blockIndex >= lesson.blocks.length - 1;

  const history = useMemo(() => {
    if (!block) return [];
    const lines = String(block.board_text || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const actions: Record<string, unknown>[] = [
      { type: "write_title", lines: [lesson.title] },
      { type: "write_heading", text: block.heading },
    ];

    if (block.type === "summary" || lines.some((l) => l.startsWith("•") || l.startsWith("-"))) {
      actions.push({
        type: "write_points",
        points: lines.map((l) => l.replace(/^[•\-]\s*/, "")),
      });
    } else if (lines.length === 1) {
      actions.push({ type: "write_definition_box", text: lines[0] });
    } else {
      for (const line of lines) {
        actions.push({ type: "write_points", points: [line.replace(/^[•\-]\s*/, "")] });
      }
    }
    return actions;
  }, [block, lesson.title]);

  useEffect(() => {
    if (!block?.ren_voice) return;
    void speak(block.ren_voice);
    return () => stop();
  }, [blockIndex, lesson.language, lesson.title, block?.ren_voice]);

  if (!block) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        No blocks in this lesson file yet.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#020609]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-cyan-500/10 px-4 py-3 md:px-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400/80">
            Day {lesson.day}
            {lesson.part ? ` · Part ${lesson.part}` : ""} · Ren board
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Block {blockIndex + 1} / {lesson.blocks.length} · voice only, no avatar
          </p>
        </div>
        <button
          type="button"
          onClick={() => block.ren_voice && speak(block.ren_voice)}
          className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-[#020609]/80 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyan-300 hover:border-cyan-400/50"
          title="Replay Ren"
        >
          <Volume2 className="h-3.5 w-3.5" /> Replay Ren
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <VoiceWhiteboard
          key={`${lesson.day}-${lesson.language}-${blockIndex}`}
          history={history}
          lessonTitle={lesson.title}
        />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-cyan-500/10 bg-[#030914] px-4 py-3 md:px-6">
        <Button
          type="button"
          variant="outline"
          disabled={blockIndex === 0}
          onClick={() => onBlockIndex(Math.max(0, blockIndex - 1))}
          className="border-cyan-500/20 text-cyan-200"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {!isLast ? (
          <Button
            type="button"
            onClick={() => onBlockIndex(blockIndex + 1)}
            className="bg-cyan-600 font-semibold text-white hover:bg-cyan-500"
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onFinished}
            className="bg-amber-500 font-semibold text-black hover:bg-amber-400"
          >
            Start workspace
          </Button>
        )}
      </div>
    </div>
  );
}
