import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [pathType, setPathType] = useState<"student" | "professional">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/learning");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: error.message,
          });
        } else {
          toast({
            title: "Welcome back",
            description: "Continue your path.",
          });
          navigate("/learning");
        }
      } else {
        if (!fullName.trim()) {
          toast({
            variant: "destructive",
            title: "Name required",
            description: "Please enter your full name.",
          });
          setIsLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.message,
          });
        } else {
          toast({
            title: "Account created",
            description: "Welcome to REBON.",
          });
          navigate("/learning");
        }
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `
            radial-gradient(ellipse 70% 40% at 50% 100%, hsl(262 83% 58% / 0.12), transparent 55%),
            linear-gradient(180deg, #09090B 0%, hsl(240 6% 5%) 100%)
          `,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 w-full max-w-sm"
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </button>

        <div className="mb-12">
          <p className="font-display text-2xl font-extrabold tracking-[0.08em] text-foreground mb-8">
            REBON
          </p>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome back" : "Choose your path"}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isLogin
              ? "Continue with Ren."
              : "Not a course. A path — and proof at the end."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Full name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-transparent border-0 border-b border-white/15 rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-primary"
              />
            </div>
          )}

          {!isLogin && (
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">I am</p>
              <div className="flex gap-6">
                {(["student", "professional"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPathType(type)}
                    className={`text-sm capitalize transition-colors ${
                      pathType === type ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-transparent border-0 border-b border-white/15 rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-transparent border-0 border-b border-white/15 rounded-none px-0 h-11 pr-10 focus-visible:ring-0 focus-visible:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="hero" className="w-full mt-4" disabled={isLoading}>
            {isLoading ? "Please wait…" : isLogin ? "Continue" : "Create account"}
          </Button>
        </form>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Begin free" : "Log in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
