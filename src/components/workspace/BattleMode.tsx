import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Heart, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroCharacter from "@/components/battle/HeroCharacter";
import VillainCharacter from "@/components/battle/VillainCharacter";
import { ScreenShake, RedFlash, GreenFlash, ScorePopup, DamagePopup } from "@/components/battle/BattleEffects";
import { playAttackWhoosh, playImpactClang, playErrorBuzz, playVillainLaugh, playVictoryChime } from "@/lib/battleSounds";

interface BattleModeProps {
  question: string;
  options: string[];
  correctIndex: number;
  enemyName: string;
  enemyTaunt: string;
  onAnswer: (correct: boolean) => void;
  onClose: () => void;
  currentHP: number;
  maxHP: number;
  playerMode: "student" | "professional";
  questionNumber: number;
  totalQuestions: number;
}

const BattleMode = ({
  question, options, correctIndex, enemyName, enemyTaunt,
  onAnswer, onClose, currentHP, maxHP, playerMode, questionNumber, totalQuestions
}: BattleModeProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [heroState, setHeroState] = useState<"idle" | "attacking" | "damaged" | "celebrating">("idle");
  const [villainState, setVillainState] = useState<"idle" | "taunting" | "hit" | "laughing" | "exploding">("idle");
  const [shakeActive, setShakeActive] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [greenFlash, setGreenFlash] = useState(false);
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [showDamage, setShowDamage] = useState(false);

  const damagePerHit = Math.ceil(maxHP / totalQuestions);

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const correct = index === correctIndex;
    setIsCorrect(correct);

    if (correct) {
      // Victory sequence
      playAttackWhoosh();
      setHeroState("attacking");
      
      setTimeout(() => {
        playImpactClang();
        setGreenFlash(true);
        setVillainState("hit");
        setShowDamage(true);
        setShowScorePopup(true);
        setTimeout(() => setGreenFlash(false), 400);
      }, 400);

      setTimeout(() => {
        playVictoryChime();
        setShowDamage(false);
        setShowScorePopup(false);
        setHeroState("idle");
        setVillainState("idle");
        onAnswer(true);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 1200);
    } else {
      // Error sequence
      playErrorBuzz();
      setHeroState("damaged");
      setShakeActive(true);
      setRedFlash(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

      setTimeout(() => {
        playVillainLaugh();
        setVillainState("laughing");
      }, 200);

      setTimeout(() => {
        setRedFlash(false);
        setShakeActive(false);
        setHeroState("idle");
        setVillainState("idle");
        onAnswer(false);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 1000);
    }
  }, [selectedAnswer, correctIndex, onAnswer, damagePerHit]);

  const hpPercent = (currentHP / maxHP) * 100;
  const hpColor = hpPercent > 60 ? "bg-destructive" : hpPercent > 30 ? "bg-[hsl(40,80%,50%)]" : "bg-primary";

  return (
    <>
      <RedFlash active={redFlash} />
      <GreenFlash active={greenFlash} />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <ScreenShake active={shakeActive}>
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sword className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  Battle {questionNumber}/{totalQuestions}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Battle Arena */}
            <div className="glass rounded-2xl p-6 border border-primary/20 overflow-hidden">
              {/* Characters Row */}
              <div className="flex items-center justify-between mb-6">
                {/* Enemy */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <VillainCharacter state={villainState} size={100} name={enemyName} />
                    <DamagePopup show={showDamage} amount={damagePerHit} />
                  </div>
                  <div className="w-28">
                    <div className="flex items-center gap-1 mb-1">
                      <Heart className="w-3 h-3 text-destructive" />
                      <span className="text-[10px] text-muted-foreground">{currentHP}/{maxHP}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${hpColor}`}
                        animate={{ width: `${hpPercent}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>

                {/* VS */}
                <div className="text-2xl font-black text-muted-foreground/30">VS</div>

                {/* Hero */}
                <div className="flex flex-col items-center gap-2 relative">
                  <HeroCharacter state={heroState} mode={playerMode} size={100} />
                  <ScorePopup show={showScorePopup} text="CRITICAL HIT!" />
                </div>
              </div>

              {/* Taunt / Feedback */}
              <AnimatePresence mode="wait">
                {isCorrect === null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <p className="text-xs text-destructive italic">"{enemyTaunt}"</p>
                  </motion.div>
                )}
                {isCorrect === true && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <p className="text-xs text-primary font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Critical Hit! The enemy takes damage!
                    </p>
                  </motion.div>
                )}
                {isCorrect === false && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <p className="text-xs text-destructive font-bold">💀 The enemy laughs at your mistake!</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Question */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground">{question}</p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2">
                {options.map((option, index) => {
                  let optionClass = "bg-secondary/50 border-border/50 hover:border-primary/50 hover:bg-secondary";
                  if (selectedAnswer !== null) {
                    if (index === correctIndex) optionClass = "bg-primary/20 border-primary/50";
                    else if (index === selectedAnswer && !isCorrect) optionClass = "bg-destructive/20 border-destructive/50";
                  }
                  return (
                    <motion.button
                      key={index}
                      whileHover={selectedAnswer === null ? { scale: 1.01 } : {}}
                      whileTap={selectedAnswer === null ? { scale: 0.99 } : {}}
                      onClick={() => handleAnswer(index)}
                      disabled={selectedAnswer !== null}
                      className={`p-3 rounded-lg border text-left text-sm transition-all ${optionClass}`}
                    >
                      <span className="text-xs font-bold text-muted-foreground mr-2">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="text-foreground">{option}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </ScreenShake>
      </motion.div>
    </>
  );
};

export default BattleMode;
