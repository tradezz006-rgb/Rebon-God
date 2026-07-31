import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  Server,
  Database,
  Shield,
  Network,
  Activity,
  HardDrive,
  Cpu,
  Boxes,
  Lock,
  Gauge,
  BarChart3,
  Bell,
  Globe,
  Container,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

interface WorldEntryTransitionProps {
  /** Accent color of the world being entered */
  color: string;
  label: string;
  onComplete: () => void;
}

type Token = { icon: LucideIcon; text: string };

/** Cloud-domain artefacts that stream past the camera during the dive. */
const CLOUD_TOKENS: Token[] = [
  { icon: Server, text: "EC2" },
  { icon: HardDrive, text: "S3" },
  { icon: KeyRound, text: "IAM" },
  { icon: Network, text: "VPC" },
  { icon: Activity, text: "CloudWatch" },
  { icon: Cpu, text: "Lambda" },
  { icon: Database, text: "RDS" },
  { icon: Boxes, text: "DynamoDB" },
  { icon: Gauge, text: "Auto Scaling" },
  { icon: Globe, text: "Region" },
  { icon: BarChart3, text: "Dashboard" },
  { icon: Bell, text: "Alarm" },
  { icon: Shield, text: "Security Group" },
  { icon: Container, text: "Bucket" },
  { icon: Lock, text: "Least Privilege" },
  { icon: Cloud, text: "Elasticity" },
];

const GENERIC_TOKENS: Token[] = [
  { icon: Cpu, text: "Compute" },
  { icon: Database, text: "Data" },
  { icon: Network, text: "Network" },
  { icon: Shield, text: "Security" },
  { icon: Activity, text: "Signals" },
  { icon: Boxes, text: "Systems" },
];

/**
 * Interstellar-style dive into a domain world.
 * A hyperspace star tunnel accelerates forward while wormhole gates rush at
 * the camera and domain artefacts (cloud tools/icons/symbols) streak past —
 * then space folds into a light burst and hands off to the next screen.
 */
const WorldEntryTransition = ({ color, label, onComplete }: WorldEntryTransitionProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flash, setFlash] = useState(false);
  const doneRef = useRef(false);
  const [vp, setVp] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1440,
    h: typeof window !== "undefined" ? window.innerHeight : 900,
  }));

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isCloud = /cloud/i.test(label);
  const baseTokens = isCloud ? CLOUD_TOKENS : GENERIC_TOKENS;

  // Build a staggered stream of artefacts flying past the camera.
  const stream = useMemo(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = reduced ? 8 : 34;
    return Array.from({ length: count }, (_, i) => {
      const tok = baseTokens[i % baseTokens.length];
      const angle = Math.random() * Math.PI * 2;
      // Fly out past the edges — but only after a readable hold near center.
      const dist = 60 + Math.random() * 75; // vw/vh travelled outward
      // Emerge from a spread near the vanishing point (fills more of the frame).
      const startAngle = Math.random() * Math.PI * 2;
      const startR = Math.random() * 20;
      return {
        id: i,
        icon: tok.icon,
        text: tok.text,
        sx: Math.cos(startAngle) * startR,
        sy: Math.sin(startAngle) * startR,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        rot: (Math.random() - 0.5) * 36,
        delay: Math.random() * 3.1,
        dur: 2.1 + Math.random() * 1.1,
        accent: Math.random() > 0.5,
      };
    });
  }, [baseTokens]);

  // Stable completion — do not depend on onComplete identity (avoids timer resets)
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    doneRef.current = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const TOTAL = reduced ? 1500 : 4700;

    const flashTimer = setTimeout(() => setFlash(true), TOTAL - 620);
    const doneTimer = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onCompleteRef.current();
      }
    }, TOTAL);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  // Hyperspace star tunnel — stars rush toward the viewer along +Z.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let start = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    const TINTS = ["#FFFFFF", "#FFFFFF", "#7DD3FC", "#22D3EE", color];

    type Star = { x: number; y: number; z: number; pz: number; tint: string };
    const maxZ = () => Math.max(W(), H());
    const spawn = (): Star => ({
      x: (Math.random() - 0.5) * W() * 1.6,
      y: (Math.random() - 0.5) * H() * 1.6,
      z: Math.random() * maxZ(),
      pz: 0,
      tint: TINTS[(Math.random() * TINTS.length) | 0],
    });
    const stars: Star[] = Array.from({ length: reduced ? 110 : 620 }, () => {
      const s = spawn();
      s.pz = s.z;
      return s;
    });

    const draw = (t: number) => {
      if (!start) start = t;
      const elapsed = (t - start) / 1000;
      const cx = W() / 2;
      const cy = H() / 2;
      const mz = maxZ();
      const focal = mz;

      // Motion-blur trail — lower alpha = longer streaks = smoother speed.
      ctx.fillStyle = "rgba(3,4,9,0.22)";
      ctx.fillRect(0, 0, W(), H());

      // Steady cruise from the first frame (no "stuck" start), easing into a
      // light-speed jump near the end.
      const speed = (mz / 150) * (1.2 + elapsed * 0.45 + elapsed * elapsed * 0.32);

      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed;
        if (s.z < 1) {
          const ns = spawn();
          ns.z = mz;
          ns.pz = mz;
          Object.assign(s, ns);
          continue;
        }
        const sx = (s.x / s.z) * focal + cx;
        const sy = (s.y / s.z) * focal + cy;
        const px = (s.x / s.pz) * focal + cx;
        const py = (s.y / s.pz) * focal + cy;

        const depth = 1 - s.z / mz;
        ctx.strokeStyle = s.tint;
        ctx.globalAlpha = Math.max(0, Math.min(1, depth * 1.2));
        ctx.lineWidth = Math.max(0.6, depth * 2.6);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Wormhole mouth glow at the vanishing point.
      const glowR = 30 + elapsed * 70;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      grad.addColorStop(0, `${color}cc`);
      grad.addColorStop(0.35, `${color}44`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [color]);

  // Wormhole gates — square frames that rush from the vanishing point outward.
  const gates = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[120] overflow-hidden bg-[#030409]"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Wormhole corridor — gates flying at the camera */}
      <div className="absolute inset-0 flex items-center justify-center [perspective:900px]">
        {gates.map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-[28px] border"
            style={{
              width: 220,
              height: 220,
              borderColor: `${color}${i % 2 === 0 ? "aa" : "55"}`,
              boxShadow: `0 0 30px -6px ${color}66`,
              willChange: "transform, opacity",
            }}
            initial={{ scale: 0.04, opacity: 0, rotate: i * 8 }}
            animate={{ scale: [0.04, 8], opacity: [0, 0.85, 0], rotate: i * 8 + 20 }}
            transition={{
              duration: 3.2,
              delay: i * 0.38,
              repeat: Infinity,
              ease: [0.3, 0, 0.7, 1],
            }}
          />
        ))}
      </div>

      {/* Domain artefacts streaking past the camera */}
      <div className="absolute inset-0 pointer-events-none">
        {stream.map((s) => {
          const Icon = s.icon;
          const tint = s.accent ? color : "#E5F6FF";
          const vw = vp.w / 100;
          const vh = vp.h / 100;
          return (
            <div
              key={s.id}
              className="absolute left-1/2 top-1/2"
              style={{ width: 0, height: 0 }}
            >
              <motion.div
                className="absolute"
                style={{ willChange: "transform, opacity" }}
                initial={{
                  x: s.sx * vw,
                  y: s.sy * vh,
                  scale: 0.2,
                  opacity: 0,
                }}
                animate={{
                  x: [s.sx * vw, s.dx * vw],
                  y: [s.sy * vh, s.dy * vh],
                  // Pop to a readable size, hold steady, then whoosh past big.
                  scale: [0.2, 1, 1.05, 2.8],
                  opacity: [0, 1, 1, 0],
                  rotate: s.rot,
                }}
                transition={{
                  duration: s.dur,
                  delay: s.delay,
                  ease: [0.3, 0, 0.8, 0.5],
                  times: [0, 0.22, 0.62, 1],
                }}
              >
              <div
                className="flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-xl px-4 py-2.5"
                style={{
                  background: "rgba(10,12,22,0.9)",
                  border: `1.5px solid ${tint}`,
                  boxShadow: `0 0 26px -6px ${tint}`,
                }}
              >
                <Icon
                  className="h-7 w-7 shrink-0"
                  style={{ color: tint, filter: `drop-shadow(0 0 6px ${tint})` }}
                />
                <span
                  className="font-mono-data text-[15px] font-bold uppercase tracking-[0.1em] whitespace-nowrap"
                  style={{ color: "#FFFFFF", textShadow: `0 0 10px ${tint}` }}
                >
                  {s.text}
                </span>
              </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: 0 }}
        transition={{ duration: 4.7, times: [0, 0.14, 0.78, 1] }}
        className="absolute bottom-[15%] left-1/2 -translate-x-1/2 text-center"
      >
        <p className="font-mono-data text-[10px] uppercase tracking-[0.4em] text-white/60 mb-2">
          Punching through the fold
        </p>
        <p
          className="font-display text-xl md:text-2xl font-bold tracking-[0.12em]"
          style={{ color, textShadow: `0 0 26px ${color}99` }}
        >
          Entering the {label} world
        </p>
      </motion.div>

      {/* Final white fold/flash */}
      {flash && (
        <motion.div
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: 1, scale: 3.2 }}
          transition={{ duration: 0.6, ease: "easeIn" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 300,
            height: 300,
            background: `radial-gradient(circle, #fff 0%, ${color} 45%, transparent 75%)`,
          }}
        />
      )}
    </motion.div>
  );
};

export default WorldEntryTransition;
