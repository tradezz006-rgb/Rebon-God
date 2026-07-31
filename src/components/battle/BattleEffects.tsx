import { motion, AnimatePresence } from "framer-motion";

interface ScreenShakeProps {
  active: boolean;
  children: React.ReactNode;
}

export const ScreenShake = ({ active, children }: ScreenShakeProps) => (
  <motion.div
    animate={active ? {
      x: [0, -15, 10, -10, 15, -15, 10, -10, 15, 0],
      y: [0, 10, -15, 15, -10, -15, 10, -10, 0, 0],
      transition: { duration: 0.8, ease: "easeInOut" },
    } : { x: 0, y: 0 }}
  >
    {children}
  </motion.div>
);

interface RedFlashProps {
  active: boolean;
}

export const RedFlash = ({ active }: RedFlashProps) => (
  <AnimatePresence>
    {active && (
      <motion.div
        initial={{ opacity: 0.45 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[1000] pointer-events-none"
        style={{ backgroundColor: "rgba(255, 0, 0, 0.35)" }}
      />
    )}
  </AnimatePresence>
);

interface GreenFlashProps {
  active: boolean;
}

export const GreenFlash = ({ active }: GreenFlashProps) => (
  <AnimatePresence>
    {active && (
      <motion.div
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[1000] pointer-events-none"
        style={{ backgroundColor: "rgba(0, 255, 100, 0.2)" }}
      />
    )}
  </AnimatePresence>
);

interface ScorePopupProps {
  show: boolean;
  text: string;
  x?: number;
  y?: number;
}

export const ScorePopup = ({ show, text }: ScorePopupProps) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 1, y: 0, scale: 1 }}
        animate={{ opacity: 0, y: -60, scale: 1.3 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        <span className="text-3xl font-black text-primary drop-shadow-lg">{text}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

interface DamagePopupProps {
  show: boolean;
  amount: number;
}

export const DamagePopup = ({ show, amount }: DamagePopupProps) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: -40 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute -top-4 right-0 z-50 pointer-events-none"
      >
        <span className="text-xl font-black text-primary">-{amount}</span>
      </motion.div>
    )}
  </AnimatePresence>
);
