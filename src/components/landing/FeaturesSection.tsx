import { motion } from "framer-motion";

const audiences = [
  {
    tag: "Students",
    accent: "#F59E0B",
    title: "You choose. You grow. You earn it.",
    body: "Pick the domain that fits who you want to be. Ren mentors you personally. You build proof over months — so when companies look, they see the work.",
  },
  {
    tag: "Companies",
    accent: "#7C3AED",
    title: "Hire people you already understand.",
    body: "Skip the auditorium of 300. Meet the few whose verified journey matches what you need. Trust built before the interview.",
  },
  {
    tag: "Colleges",
    accent: "#10B981",
    title: "Placements without replacing your syllabus.",
    body: "REBON runs beside the degree — industry readiness your curriculum cannot move fast enough to cover.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="for-whom" className="py-24 md:py-32 border-t border-border bg-atmosphere">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 md:mb-20 max-w-2xl"
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent mb-4">
            Who it's for
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight">
            Built for everyone stuck in the same broken cycle.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 md:gap-10">
          {audiences.map((item, i) => (
            <motion.article
              key={item.tag}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="border-t pt-6"
              style={{ borderColor: `${item.accent}66` }}
            >
              <p
                className="font-mono-data text-[11px] uppercase tracking-[0.18em] mb-4"
                style={{ color: item.accent }}
              >
                {item.tag}
              </p>
              <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4 leading-snug">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">
                {item.body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
