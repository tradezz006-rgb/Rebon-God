import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import DomainConstellation from "./DomainConstellation";
import { useUniverseGate } from "./UniverseGate";

const LINES = [
  { text: "Choose your path.", color: "#F59E0B" },
  { text: "Do the work.", color: "#7C3AED" },
  { text: "Earn your offer.", color: "#10B981" },
] as const;

const HeroSection = () => {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showBrand, setShowBrand] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const { open: openUniverse, isOpen: universeOpen } = useUniverseGate();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);

    if (mq.matches) {
      setVisibleLines(LINES.length);
      setShowBrand(true);
      setShowCta(true);
      return;
    }

    const timers = [
      setTimeout(() => setVisibleLines(1), 400),
      setTimeout(() => setVisibleLines(2), 1200),
      setTimeout(() => setVisibleLines(3), 2000),
      setTimeout(() => setShowBrand(true), 3000),
      setTimeout(() => setShowCta(true), 3600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#09090B]">
      <div className="absolute inset-0 lg:left-[42%]">
        <DomainConstellation
          className="min-h-[45vh] lg:min-h-full opacity-90 lg:opacity-100"
          paused={universeOpen}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-28 pb-16 lg:pb-24 min-h-[100svh] flex flex-col justify-center">
        <div className="max-w-xl">
          <div className="min-h-[140px] md:min-h-[168px] mb-6 md:mb-8">
            {LINES.map((line, i) => (
              <AnimatePresence key={line.text}>
                {visibleLines > i && (
                  <motion.p
                    initial={reducedMotion ? false : { opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display text-[clamp(1.75rem,5vw,3rem)] font-bold leading-[1.15] tracking-[0.04em] uppercase mb-1 md:mb-2"
                    style={{ color: line.color }}
                  >
                    {line.text}
                  </motion.p>
                )}
              </AnimatePresence>
            ))}
          </div>

          <AnimatePresence>
            {showBrand && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="font-display text-[clamp(4rem,12vw,7.5rem)] font-extrabold leading-[0.88] tracking-[0.06em] text-[#FAFAFA] mb-6 md:mb-8">
                  REBON
                </h1>
                <p className="text-[#A1A1AA] text-base md:text-lg leading-relaxed max-w-md mb-10">
                  Not a course platform. A place where you choose your path —
                  and someone skilled meets you on it.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showCta && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
              >
                <Button
                  variant="hero"
                  size="xl"
                  className="group min-w-[180px]"
                  onClick={openUniverse}
                >
                  Choose your path
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <a
                  href="#how-it-works"
                  className="group text-sm text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors tracking-wide py-3"
                >
                  The freedom we mean
                  <span className="text-primary group-hover:translate-x-0.5 inline-block transition-transform">
                    {" "}↓
                  </span>
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
