import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useDomain, Domain, Section } from "@/contexts/DomainContext";
import { Menu, X, LogOut, User, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { AUTH_REQUIRED } from "@/lib/authGate";

const DomainNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { domain, setDomain, section, setSection } = useDomain();
  const { teachLanguage, setTeachLanguage, theme, setTheme } = useSettings();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const domains: { id: Domain; label: string }[] = [
    { id: "communication", label: "Communication" },
    { id: "fullstack", label: "Cloud" },
  ];

  const sections: { id: Section; label: string; path: string; activeClass: string; lineClass: string }[] = [
    { id: "learning", label: "Learn", path: "/learning", activeClass: "text-amber-brand", lineClass: "bg-[#F59E0B]" },
    { id: "workspace", label: "Work", path: "/workspace", activeClass: "text-violet-brand", lineClass: "bg-primary" },
    { id: "profile", label: "Proof", path: "/profile", activeClass: "text-emerald-brand", lineClass: "bg-[#10B981]" },
  ];

  const handleSectionChange = (newSection: Section) => {
    setSection(newSection);
    const sectionData = sections.find((s) => s.id === newSection);
    if (sectionData) navigate(sectionData.path);
  };

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
    navigate(AUTH_REQUIRED ? "/auth" : "/");
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Guest";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/[0.06]"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-18">
          <Link to="/" className="font-display text-lg font-extrabold tracking-[0.08em] text-foreground">
            REBON
          </Link>

          <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSectionChange(s.id)}
                className={cn(
                  "relative text-[13px] tracking-wide transition-colors pb-1",
                  section === s.id ? s.activeClass : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
                {section === s.id && (
                  <motion.span
                    layoutId="nav-line"
                    className={cn("absolute left-0 right-0 -bottom-px h-px", s.lineClass)}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-6" ref={userMenuRef}>
            <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
              {domains.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDomain(d.id)}
                  className={cn(
                    "tracking-wide transition-colors",
                    domain === d.id ? "text-primary" : "hover:text-foreground"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-[10px] font-semibold tracking-wider text-foreground hover:border-primary/50 transition-colors"
            >
              {initials}
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute top-14 right-4 w-64 bg-card border border-white/[0.08] shadow-elevated overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user?.email || "Guest mode — auth coming later"}
                    </p>
                  </div>
                  <div className="px-5 py-4 border-b border-white/[0.06] space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Language</p>
                    <div className="flex gap-4 text-sm">
                      {(["english", "tanglish"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setTeachLanguage(lang)}
                          className={cn(
                            "capitalize transition-colors",
                            teachLanguage === lang ? "text-primary" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 py-3 border-b border-white/[0.06]">
                    <button
                      onClick={() => { navigate("/profile"); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <User className="w-3.5 h-3.5" /> Profile
                    </button>
                    <button
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="w-full flex items-center gap-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      Appearance
                    </button>
                  </div>
                  {AUTH_REQUIRED && (
                    <div className="px-5 py-3">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="md:hidden p-2 text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/[0.06] space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => { handleSectionChange(s.id); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full text-left px-2 py-3 text-sm",
                  section === s.id ? s.activeClass : "text-muted-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
            {AUTH_REQUIRED && (
              <button onClick={handleSignOut} className="w-full text-left px-2 py-3 text-sm text-muted-foreground">
                Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </motion.nav>
  );
};

export default DomainNavbar;
