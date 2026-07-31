import { motion } from "framer-motion";

type VillainState = "idle" | "taunting" | "hit" | "laughing" | "exploding";

interface VillainCharacterProps {
  state: VillainState;
  size?: number;
  name?: string;
}

const VillainCharacter = ({ state, size = 120, name = "Bug Monster" }: VillainCharacterProps) => {
  const variants = {
    idle: {
      y: [0, -4, 0],
      scale: [1, 1.02, 1],
      rotate: [0, 1, -1, 0],
      opacity: 1,
      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" as const },
    },
    taunting: {
      y: [0, -8, 0],
      rotate: [0, -5, 5, 0],
      scale: [1, 1.08, 1.05, 1],
      transition: { duration: 1.2 },
    },
    hit: {
      x: [0, 20, 15, 25, 10, 0],
      rotate: [0, -8, 5, -3, 0],
      scale: [1, 0.85, 0.9, 0.88, 1],
      transition: { duration: 0.8 },
    },
    laughing: {
      y: [0, -5, 0, -5, 0],
      scale: [1, 1.06, 1, 1.06, 1],
      rotate: [0, 3, -3, 3, 0],
      transition: { duration: 1 },
    },
    exploding: {
      scale: [1, 1.3, 1.5, 0],
      rotate: [0, 10, -20, 45],
      opacity: [1, 1, 0.5, 0],
      transition: { duration: 1 },
    },
  };

  return (
    <motion.div
      animate={state}
      variants={variants}
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 140" width={size} height={size} className="drop-shadow-lg">
        <defs>
          <radialGradient id="villainAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(0 84% 60%)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity="0" />
          </radialGradient>
          <filter id="villainGlow">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="hsl(0 84% 40%)" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Aura */}
        <circle cx="60" cy="70" r="58" fill="url(#villainAura)" />

        {/* Body - bulky, menacing */}
        <rect x="35" y="55" width="50" height="48" rx="10" fill="#5C1010" filter="url(#villainGlow)" />
        {/* Torn shirt detail */}
        <path d="M38 65 L45 60 L42 70 Z" fill="#7A1818" />
        <path d="M82 65 L75 60 L78 70 Z" fill="#7A1818" />
        
        {/* Spiky head */}
        <circle cx="60" cy="38" r="24" fill="#8B1A1A" />
        {/* Spikes */}
        <polygon points="60,8 56,18 64,18" fill="#6B0F0F" />
        <polygon points="42,14 42,24 50,20" fill="#6B0F0F" />
        <polygon points="78,14 78,24 70,20" fill="#6B0F0F" />
        <polygon points="36,28 38,38 44,32" fill="#6B0F0F" />
        <polygon points="84,28 82,38 76,32" fill="#6B0F0F" />
        
        {/* Face */}
        {/* Eyes - asymmetric, menacing */}
        <ellipse cx="50" cy="35" rx="5" ry="4" fill="#FF4444" />
        <ellipse cx="70" cy="34" rx="6" ry="5" fill="#FF4444" />
        <circle cx="50" cy="35" r="2.5" fill="#220000" />
        <circle cx="70" cy="34" r="3" fill="#220000" />
        {/* Evil grin */}
        <path d="M44 48 Q52 56 60 48 Q68 56 76 48" stroke="#FF4444" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Teeth */}
        <polygon points="50,48 53,53 56,48" fill="#FFF" opacity="0.9" />
        <polygon points="60,48 63,53 66,48" fill="#FFF" opacity="0.9" />
        
        {/* Scar */}
        <path d="M72 26 L78 38" stroke="#FF6666" strokeWidth="2" strokeLinecap="round" />
        
        {/* Arms - clawed */}
        <rect x="18" y="58" width="18" height="10" rx="5" fill="#5C1010" />
        <rect x="84" y="58" width="18" height="10" rx="5" fill="#5C1010" />
        {/* Claws */}
        <polygon points="14,58 10,55 14,62" fill="#333" />
        <polygon points="14,63 8,62 14,68" fill="#333" />
        <polygon points="106,58 110,55 106,62" fill="#333" />
        <polygon points="106,63 112,62 106,68" fill="#333" />

        {/* Legs */}
        <rect x="40" y="100" width="16" height="22" rx="6" fill="#4A0E0E" />
        <rect x="64" y="100" width="16" height="22" rx="6" fill="#4A0E0E" />
        
        {/* Boots */}
        <rect x="37" y="118" width="22" height="8" rx="4" fill="#222" />
        <rect x="61" y="118" width="22" height="8" rx="4" fill="#222" />

        {/* Virus symbols on body */}
        <circle cx="50" cy="75" r="4" fill="none" stroke="#00FF44" strokeWidth="1" opacity="0.5" />
        <circle cx="70" cy="80" r="3" fill="none" stroke="#00FF44" strokeWidth="1" opacity="0.4" />
      </svg>

      {/* Label */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[10px] font-bold text-destructive">{name}</span>
      </div>
    </motion.div>
  );
};

export default VillainCharacter;
