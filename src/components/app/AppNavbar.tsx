import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, BookOpen, Briefcase, User } from "lucide-react";

const AppNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: "Learning", href: "/learning", icon: BookOpen },
    { name: "Workspace", href: "/workspace", icon: Briefcase },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass shadow-card"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-silver to-primary flex items-center justify-center shadow-glow">
              <span className="text-primary-foreground font-bold text-xl">R</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-silver-light via-foreground to-primary bg-clip-text text-transparent">REBON</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive(link.href)
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <link.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{link.name}</span>
              </Link>
            ))}
          </div>

          {/* User Info */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground">Student</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">
                {user?.email?.[0].toUpperCase()}
              </span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-border"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(link.href)
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.name}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default AppNavbar;
