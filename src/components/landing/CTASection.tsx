import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useUniverseGate } from "./UniverseGate";

const CTASection = () => {
  const { open: openUniverse } = useUniverseGate();

  return (
    <section id="proof" className="py-28 md:py-36 border-t border-border relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 100%, hsl(160 84% 39% / 0.08), transparent 60%)",
        }}
      />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-brand mb-6">
            Proof
          </p>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.08] mb-6">
            No more resumes.
            <br />
            No more reputation.
            <br />
            <span className="text-emerald-brand">Just proof.</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            One student getting hired because REBON showed what they can do —
            that is how the story starts.
          </p>
          <Button variant="hero" size="xl" className="group" onClick={openUniverse}>
            Choose your path
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
