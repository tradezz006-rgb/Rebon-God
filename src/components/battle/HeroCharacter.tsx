import { motion } from "framer-motion";

type HeroState = "idle" | "attacking" | "damaged" | "celebrating";

interface HeroCharacterProps {
  state: HeroState;
  mode: "student" | "professional";
  size?: number;
}

const HeroCharacter = ({ state, mode, size = 120 }: HeroCharacterProps) => {
  const variants = {
    idle: {
      y: [0, -6, 0],
      rotate: 0,
      scale: 1,
      transition: { y: { repeat: Infinity, duration: 2, ease: "easeInOut" as const } },
    },
    attacking: {
      x: [0, -30, -60, -30, 0],
      y: [0, -40, -20, 0, 0],
      rotate: [0, -15, 25, 0, 0],
      scale: [1, 1.15, 1.25, 1.1, 1],
      transition: { duration: 0.8, ease: "easeOut" as const },
    },
    damaged: {
      x: [0, 20, 10, 15, 0],
      rotate: [0, 5, -3, 2, 0],
      scale: [1, 0.9, 0.95, 0.92, 1],
      transition: { duration: 0.6 },
    },
    celebrating: {
      y: [0, -50, -30, -50, 0],
      rotate: [0, -10, 10, -5, 0],
      scale: [1, 1.2, 1.15, 1.2, 1],
      transition: { duration: 1.5, ease: "easeInOut" as const },
    },
  };

  const isStudent = mode === "student";
  const bodyColor = "hsl(var(--primary))";
  const skinColor = "#FFD5A8";

  return (
    <motion.div
      animate={state}
      variants={variants}
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 140" width={size} height={size} className="drop-shadow-lg">
        {/* Glow effect */}
        <defs>
          <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(174 100% 42%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(174 100% 42%)" stopOpacity="0" />
          </radialGradient>
          <filter id="heroDrop">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="hsl(174 100% 42%)" floodOpacity="0.3" />
          </filter>
        </defs>
        
        <circle cx="60" cy="70" r="55" fill="url(#heroGlow)" />

        {/* Body */}
        <rect x="40" y="55" width="40" height="45" rx="8" fill={bodyColor} filter="url(#heroDrop)" />
        
        {/* Head */}
        <circle cx="60" cy="38" r="22" fill={skinColor} />
        <circle cx="52" cy="34" r="3" fill="#333" />
        <circle cx="68" cy="34" r="3" fill="#333" />
        {/* Smile */}
        <path d="M52 44 Q60 50 68 44" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Hair */}
        {isStudent ? (
          <path d="M38 32 Q45 15 60 14 Q75 15 82 32" fill="#4A3728" />
        ) : (
          <path d="M38 30 Q42 18 60 16 Q78 18 82 30" fill="#2A2A2A" />
        )}

        {/* Arms */}
        <rect x="24" y="58" width="16" height="8" rx="4" fill={skinColor} />
        <rect x="80" y="58" width="16" height="8" rx="4" fill={skinColor} />

        {/* Legs */}
        <rect x="43" y="98" width="14" height="22" rx="5" fill="#2A5F6A" />
        <rect x="63" y="98" width="14" height="22" rx="5" fill="#2A5F6A" />
        
        {/* Shoes */}
        <rect x="41" y="116" width="18" height="8" rx="4" fill="#333" />
        <rect x="61" y="116" width="18" height="8" rx="4" fill="#333" />

        {/* Weapon - Hammer for student, Blaster for professional */}
        {isStudent ? (
          <g>
            {/* Hammer handle */}
            <rect x="12" y="42" width="5" height="35" rx="2" fill="#8B6914" transform="rotate(-30 14 55)" />
            {/* Hammer head */}
            <rect x="0" y="30" width="22" height="14" rx="3" fill="#888" transform="rotate(-30 11 37)" />
            <rect x="2" y="32" width="18" height="10" rx="2" fill="#AAA" transform="rotate(-30 11 37)" />
          </g>
        ) : (
          <g>
            {/* Blaster */}
            <rect x="6" y="52" width="28" height="10" rx="3" fill="#555" />
            <rect x="2" y="54" width="8" height="6" rx="2" fill={bodyColor} />
            <circle cx="34" cy="57" r="3" fill={bodyColor} />
            {/* Glow tip */}
            <circle cx="36" cy="57" r="2" fill="hsl(174 100% 60%)" opacity="0.8" />
          </g>
        )}

        {/* Badge */}
        {isStudent && (
          <text x="60" y="82" textAnchor="middle" fontSize="8" fill="hsl(var(--primary-foreground))" fontWeight="bold">⚒️</text>
        )}
        {!isStudent && (
          <text x="60" y="82" textAnchor="middle" fontSize="8" fill="hsl(var(--primary-foreground))" fontWeight="bold">🔫</text>
        )}
      </svg>

      {/* Label */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[10px] font-bold text-primary">
          {isStudent ? "⚒️ Code Hammer" : "🔫 Code Blaster"}
        </span>
      </div>
    </motion.div>
  );
};

export default HeroCharacter;
