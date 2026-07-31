import { forwardRef } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Sprout, Compass, Wrench, Crown } from "lucide-react";

interface LevelSelectionProps {
  onSelect: (level: string) => void;
}

const levels = [
  {
    id: "beginner",
    name: "Starting out",
    icon: Sprout,
    color: "#F59E0B",
    description:
      "You're building confidence. Simple words, clear structure, patient pace.",
    promise: "You'll never feel lost.",
  },
  {
    id: "moderate",
    name: "Getting fluent",
    icon: Compass,
    color: "#A78BFA",
    description:
      "You can hold a conversation. You want smoother flow and stronger presence.",
    promise: "Real conversations start here.",
  },
  {
    id: "pro",
    name: "Professional",
    icon: Wrench,
    color: "#7C3AED",
    description:
      "You're solid in meetings. You want polish that sounds executive-ready.",
    promise: "Company-grade presence.",
  },
  {
    id: "ultra_pro",
    name: "Executive craft",
    icon: Crown,
    color: "#10B981",
    description:
      "You lead rooms. You want nuance, persuasion, and command under pressure.",
    promise: "Prove mastery, not effort.",
  },
];

const LevelSelection = forwardRef<HTMLDivElement, LevelSelectionProps>(
  ({ onSelect }, ref) => {
    return (
      <div ref={ref} className="max-w-4xl mx-auto pt-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <p className="font-mono-data text-[11px] uppercase tracking-[0.3em] text-amber-brand mb-5">
            Your path · Communication
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-[1.1] mb-4">
            Tell us your pace.
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mx-auto">
            Ren adapts to you — not a fixed course speed. Pick the level that
            feels honest today.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          {levels.map((level, index) => {
            const Icon = level.icon;
            return (
              <motion.button
                key={level.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.45 }}
                whileHover={{ y: -4 }}
                onClick={() => onSelect(level.id)}
                className="group relative brand-card rounded-lg p-7 text-left overflow-hidden transition-shadow duration-300"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 90% 70% at 50% 0%, ${level.color}1F, transparent 65%)`,
                  }}
                />
                <div
                  className="absolute top-0 left-7 right-7 h-px opacity-40 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${level.color}, transparent)`,
                  }}
                />

                <div className="relative flex items-start justify-between mb-5">
                  <span
                    className="w-11 h-11 rounded-md flex items-center justify-center"
                    style={{
                      background: `${level.color}1A`,
                      border: `1px solid ${level.color}40`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: level.color }} />
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground/40 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>

                <h3 className="relative font-display text-xl md:text-2xl font-semibold text-foreground mb-2">
                  {level.name}
                </h3>
                <p className="relative text-sm text-muted-foreground leading-relaxed mb-5">
                  {level.description}
                </p>
                <p
                  className="relative font-mono-data text-[11px] uppercase tracking-[0.16em]"
                  style={{ color: level.color }}
                >
                  {level.promise}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }
);

LevelSelection.displayName = "LevelSelection";

export default LevelSelection;
