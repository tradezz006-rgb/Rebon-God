const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <div>
            <p className="font-display text-3xl md:text-4xl font-extrabold text-foreground tracking-[0.06em] mb-4">
              REBON
            </p>
            <p className="text-muted-foreground max-w-sm leading-relaxed text-sm">
              <span className="text-amber-brand">Choose your path.</span>{" "}
              <span className="text-violet-brand">Do the work.</span>{" "}
              <span className="text-emerald-brand">Earn your offer.</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#for-whom" className="hover:text-foreground transition-colors">
              Who it's for
            </a>
            <a href="#proof" className="hover:text-foreground transition-colors">
              Proof
            </a>
          </div>
        </div>
        <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row justify-between gap-3 text-sm text-muted-foreground font-mono-data">
          <p>© {currentYear} REBON</p>
          <p>Not edtech. A path with proof.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
