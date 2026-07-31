import { motion } from "framer-motion";

const steps = [
  {
    color: "#F59E0B",
    label: "Choose",
    title: "Pick the domain that fits who you want to become.",
    description:
      "Not a fixed syllabus. Not a one-size course. Cloud is open now — the same model grows for every path you choose.",
  },
  {
    color: "#7C3AED",
    label: "Work",
    title: "Ren meets you on the path. Real scenarios, not homework.",
    description:
      "One-to-one mentorship at your level and pace. You practice what companies live with — tickets, architecture, judgment under pressure.",
  },
  {
    color: "#10B981",
    label: "Proof",
    title: "Verified work becomes your profile. Offers follow.",
    description:
      "Months of evidence companies can trust. You earn the interview on what you built — not what you claimed on a resume.",
  },
];

const JourneySection = () => {
  return (
    <section id="how-it-works" className="py-24 md:py-32 border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-16 md:mb-20"
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent mb-4">
            How it works
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-[1.1]">
            Three moves.
            <br />
            One outcome.
          </h2>
        </motion.div>

        <div className="max-w-3xl space-y-0">
          {steps.map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="grid grid-cols-1 md:grid-cols-[6rem_1fr] gap-3 md:gap-10 py-10 border-t border-border"
            >
              <p
                className="font-display text-sm uppercase tracking-[0.2em] pt-1"
                style={{ color: step.color }}
              >
                {step.label}
              </p>
              <div>
                <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-3 leading-snug">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-xl">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
          <div className="border-t border-border" />
        </div>
      </div>
    </section>
  );
};

export default JourneySection;
