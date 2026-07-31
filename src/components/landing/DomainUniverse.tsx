/**
 * Domain Universe — solar system overlay.
 * Choose your path → inspect worlds → Cloud confirm → camera dive →
 * parent mounts WorldEntryTransition (kept alive outside this overlay).
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Eye } from "lucide-react";
import {
  DOMAIN_WORLDS,
  GHOST_NODES,
  STATUS_COLOR,
  STATUS_LABEL,
  type DomainWorld,
} from "@/data/domains";

interface DomainUniverseProps {
  open: boolean;
  onClose: () => void;
  /** Called after the camera dive — parent starts interstellar travel */
  onSelect: (world: DomainWorld) => void;
}

/**
 * Deep space backdrop: stars + exactly three distant features
 * (spiral galaxy, black hole, wormhole) placed at the frame edges so the
 * REBON system stays the subject — not decorative clutter.
 */
const DeepSpace = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    type Star = {
      x: number;
      y: number;
      r: number;
      a: number;
      tw: number;
      ph: number;
      tint: string;
    };
    let stars: Star[] = [];
    let w = 0;
    let h = 0;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round((w * h) / 3200);
      stars = Array.from({ length: count }, () => {
        const roll = Math.random();
        // Mostly cool white; rare warm/blue like real stellar populations
        const tint =
          roll > 0.97
            ? "#FFE4C4"
            : roll > 0.93
              ? "#B8D4FF"
              : roll > 0.9
                ? "#FFF8E7"
                : "#FFFFFF";
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.35 + 0.2,
          a: Math.random() * 0.55 + 0.12,
          tw: Math.random() * 0.55 + 0.15,
          ph: Math.random() * Math.PI * 2,
          tint,
        };
      });
    };

    build();
    window.addEventListener("resize", build);

    /** Soft milky dust band — atmosphere only, no neon nebula blobs */
    const drawDust = () => {
      ctx.save();
      ctx.translate(w * 0.5, h * 0.48);
      ctx.rotate(-0.35);
      const band = ctx.createLinearGradient(0, -h * 0.12, 0, h * 0.12);
      band.addColorStop(0, "transparent");
      band.addColorStop(0.45, "rgba(180,195,220,0.035)");
      band.addColorStop(0.55, "rgba(200,185,160,0.028)");
      band.addColorStop(1, "transparent");
      ctx.fillStyle = band;
      ctx.fillRect(-w, -h * 0.14, w * 2, h * 0.28);
      ctx.restore();
    };

    /**
     * Distant face-on spiral — upper-right periphery.
     * Soft core + two arms; very low alpha so it reads as background space.
     */
    const drawGalaxy = (t: number) => {
      const gx = w * 0.86;
      const gy = h * 0.16;
      const rot = reduced ? 0.4 : 0.4 + t * 0.000018;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(rot);
      ctx.scale(1, 0.62);

      // Halo of unresolved light
      const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 95);
      halo.addColorStop(0, "rgba(255,236,210,0.14)");
      halo.addColorStop(0.35, "rgba(210,200,230,0.06)");
      halo.addColorStop(1, "transparent");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 95, 0, Math.PI * 2);
      ctx.fill();

      for (let arm = 0; arm < 2; arm++) {
        for (let i = 0; i < 110; i++) {
          const ang = arm * Math.PI + i * 0.065;
          const rad = 10 + i * 0.72;
          const spread = Math.sin(i * 0.37 + arm) * 0.28 * (i / 110);
          const x = Math.cos(ang) * rad * (1 + spread * 0.15);
          const y = Math.sin(ang) * rad;
          const fade = 1 - i / 110;
          const a = 0.04 + fade * 0.14;
          ctx.fillStyle =
            i < 18
              ? `rgba(255,245,230,${a * 1.4})`
              : i % 7 === 0
                ? `rgba(180,200,255,${a * 0.7})`
                : `rgba(230,225,240,${a})`;
          ctx.beginPath();
          ctx.arc(x, y, i < 25 ? 1.1 : 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
      core.addColorStop(0, "rgba(255,248,235,0.42)");
      core.addColorStop(0.45, "rgba(255,220,180,0.16)");
      core.addColorStop(1, "transparent");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    /**
     * Schwarzschild-style silhouette — lower-left periphery.
     * Tilted accretion disk with hot inner rim; no purple glow gimmicks.
     */
    const drawBlackHole = (t: number) => {
      const bx = w * 0.11;
      const by = h * 0.78;
      const spin = reduced ? 0.15 : t * 0.00022;
      ctx.save();
      ctx.translate(bx, by);

      // Soft gravitational haze
      const haze = ctx.createRadialGradient(0, 0, 8, 0, 0, 70);
      haze.addColorStop(0, "transparent");
      haze.addColorStop(0.55, "rgba(255,160,60,0.04)");
      haze.addColorStop(1, "transparent");
      ctx.fillStyle = haze;
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.fill();

      // Accretion disk (ellipse)
      ctx.save();
      ctx.rotate(-0.35);
      ctx.scale(1, 0.28);
      for (let i = 0; i < 4; i++) {
        const r0 = 20 + i * 7;
        const r1 = 28 + i * 9;
        const ring = ctx.createRadialGradient(0, 0, r0, 0, 0, r1);
        const hot = i === 0;
        ring.addColorStop(0, "transparent");
        ring.addColorStop(
          0.5,
          hot ? "rgba(255,210,140,0.28)" : `rgba(255,140,50,${0.14 - i * 0.025})`
        );
        ring.addColorStop(1, "transparent");
        ctx.fillStyle = ring;
        ctx.beginPath();
        ctx.arc(0, 0, r1, 0, Math.PI * 2);
        ctx.fill();
      }
      // Bright Doppler-boosted crescent on the approaching side
      ctx.rotate(spin);
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "rgba(255,230,180,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 26, -0.6, 0.9);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();

      // Photon ring
      ctx.beginPath();
      ctx.arc(0, 0, 15.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,200,120,0.35)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Event horizon
      const hole = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
      hole.addColorStop(0, "#000000");
      hole.addColorStop(0.85, "#010104");
      hole.addColorStop(1, "rgba(20,12,8,0.9)");
      ctx.fillStyle = hole;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    /**
     * Single distant wormhole — right edge mid-height, away from solar system.
     * Nested warped rings into a dark throat — reads as a real space feature.
     */
    const drawWormhole = (t: number) => {
      const cx = w * 0.93;
      const cy = h * 0.52;
      const spin = reduced ? 0 : t * 0.00028;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.2);

      for (let i = 0; i < 6; i++) {
        const r = 12 + i * 9;
        const squash = 0.42 + i * 0.04;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * squash, spin + i * 0.35, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(160,210,255,${0.22 - i * 0.028})`;
        ctx.lineWidth = i === 0 ? 1.8 : 1.1;
        ctx.stroke();
      }

      const throat = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
      throat.addColorStop(0, "rgba(4,8,18,0.95)");
      throat.addColorStop(0.45, "rgba(40,90,140,0.25)");
      throat.addColorStop(0.75, "rgba(120,180,255,0.12)");
      throat.addColorStop(1, "transparent");
      ctx.fillStyle = throat;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 11, spin, 0, Math.PI * 2);
      ctx.fill();

      // Rim highlight
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 8.5, spin + 0.4, -0.8, 1.2);
      ctx.strokeStyle = "rgba(200,230,255,0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      drawDust();
      // Celestial features behind the denser starfield so they feel distant
      drawGalaxy(t);
      drawBlackHole(t);
      drawWormhole(t);

      for (const s of stars) {
        const twinkle = reduced
          ? s.a
          : s.a + Math.sin(t * 0.0008 * s.tw + s.ph) * 0.22;
        ctx.globalAlpha = Math.max(0.04, Math.min(1, twinkle));
        ctx.fillStyle = s.tint;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    />
  );
};

const Meteors = () => {
  // Rare streaks only — space feels empty, not a light show
  const meteors = [
    { top: "6%", left: "18%", dx: "28vw", dy: "22vh", dur: 3.4, delay: 2, rot: "24deg" },
    { top: "12%", left: "70%", dx: "18vw", dy: "28vh", dur: 4.1, delay: 14, rot: "38deg" },
    { top: "40%", left: "4%", dx: "22vw", dy: "14vh", dur: 3.8, delay: 26, rot: "16deg" },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {meteors.map((m, i) => (
        <span
          key={i}
          className="universe-meteor"
          style={
            {
              top: m.top,
              left: m.left,
              animationDuration: `${m.dur}s`,
              animationDelay: `${m.delay}s`,
              animationIterationCount: "infinite",
              "--m-dx": m.dx,
              "--m-dy": m.dy,
              "--m-rot": m.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

const Planet = ({
  world,
  onSelect,
}: {
  world: DomainWorld;
  onSelect: (w: DomainWorld, x: number, y: number) => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const color = STATUS_COLOR[world.status];
  const canEnter = world.route !== null;
  const d = 2 * world.orbit;
  const delay = -(world.phase / 360) * world.period;
  const base = 44 * world.size;

  const planetStyle: React.CSSProperties =
    world.status === "live"
      ? {
          background: `radial-gradient(circle at 32% 28%, #FCD98A, ${color} 55%, #7a4d05 100%)`,
        }
      : world.status === "launching"
        ? {
            background: `radial-gradient(circle at 32% 28%, #C4A9FF, ${color} 58%, #3b1e7a 100%)`,
          }
        : {
            background: `radial-gradient(circle at 32% 28%, #3a3a42, #26262c 60%, #17171b 100%)`,
          };

  return (
    <div
      className="orbit-holder absolute"
      style={{
        width: d,
        height: d,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="universe-spin"
        style={{ animationDuration: `${world.period}s`, animationDelay: `${delay}s` }}
      >
        <div
          className="absolute"
          style={{ top: 0, left: "50%", transform: "translate(-50%, -50%)" }}
        >
          <div
            className="universe-counterspin inline-flex flex-col items-center"
            style={{
              animationDuration: `${world.period}s`,
              animationDelay: `${delay}s`,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <span
              className="mb-2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]"
              style={{
                color: world.status === "soon" ? "#9b9ba3" : color,
                background:
                  world.status === "soon" ? "transparent" : `${color}1F`,
                border: `1px solid ${
                  world.status === "soon" ? "#3a3a42" : `${color}66`
                }`,
              }}
            >
              {STATUS_LABEL[world.status]}
            </span>

            <button
              type="button"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                onSelect(world, r.left + r.width / 2, r.top + r.height / 2);
              }}
              className="relative rounded-full transition-transform duration-300"
              style={{
                width: base,
                height: base,
                cursor: "pointer",
                transform: hovered ? "scale(1.18)" : "scale(1)",
                ...planetStyle,
                border:
                  world.status === "launching"
                    ? `1.5px solid ${color}`
                    : world.status === "soon"
                      ? "1px solid #33333b"
                      : "none",
                opacity: world.status === "soon" ? 0.78 : 1,
                boxShadow:
                  world.status === "launching"
                    ? `0 0 22px -4px ${color}aa`
                    : world.status === "soon"
                      ? "none"
                      : undefined,
                animation:
                  world.status === "live"
                    ? "live-pulse 2s ease-out infinite"
                    : undefined,
              }}
              aria-label={`View ${world.label} world`}
            >
              <span
                className="absolute rounded-full"
                style={{
                  inset: "14% 40% 55% 20%",
                  background: "rgba(255,255,255,0.35)",
                  filter: "blur(3px)",
                }}
              />
              {!canEnter && (
                <span className="absolute inset-0 grid place-items-center rounded-full bg-black/25">
                  <Eye className="h-3.5 w-3.5 text-white/80" />
                </span>
              )}
            </button>

            <span
              className="mt-2 whitespace-nowrap font-display text-[12px] tracking-wide"
              style={{ color: world.status === "soon" ? "#8b8b94" : "#FAFAFA" }}
            >
              {world.label}
            </span>

            <AnimatePresence>
              {hovered && (
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-1 max-w-[170px] text-center text-[10px] leading-snug text-[#A1A1AA]"
                >
                  {world.glimpse}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const GhostNode = ({
  orbit,
  period,
  phase,
  size,
}: (typeof GHOST_NODES)[number]) => {
  const d = 2 * orbit;
  const delay = -(phase / 360) * period;
  return (
    <div
      className="orbit-holder absolute"
      style={{
        width: d,
        height: d,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="universe-spin"
        style={{ animationDuration: `${period}s`, animationDelay: `${delay}s` }}
      >
        <div
          className="absolute rounded-full"
          style={{
            top: 0,
            left: "50%",
            width: 10 * size + 4,
            height: 10 * size + 4,
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle at 35% 30%, #55555f, #2a2a30)",
            opacity: 0.22,
          }}
        />
      </div>
    </div>
  );
};

const DomainUniverse = ({ open, onClose, onSelect }: DomainUniverseProps) => {
  const [scale, setScale] = useState(0.88);
  const [confirmWorld, setConfirmWorld] = useState<DomainWorld | null>(null);
  const [planetPos, setPlanetPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [phase, setPhase] = useState<"idle" | "confirm" | "flying" | "fold">(
    "idle"
  );
  const handedOff = useRef(false);

  useEffect(() => {
    if (open) {
      handedOff.current = false;
      setConfirmWorld(null);
      setPlanetPos(null);
      setPhase("idle");
    }
  }, [open]);

  const cancelConfirm = () => {
    setConfirmWorld(null);
    setPlanetPos(null);
    setPhase("idle");
  };

  const handlePlanetSelect = (world: DomainWorld, x: number, y: number) => {
    if (phase !== "idle") return;
    setConfirmWorld(world);
    setPlanetPos({ x, y });
    setPhase("confirm");
  };

  const beginFlight = () => {
    if (!confirmWorld?.route) return;
    setPhase("flying");
  };

  // Camera dive finishes → parent owns the interstellar corridor (won't unmount with this overlay)
  useEffect(() => {
    if (phase !== "flying" || !confirmWorld) return;
    const t = window.setTimeout(() => {
      if (handedOff.current) return;
      handedOff.current = true;
      setPhase("fold");
      onSelect(confirmWorld);
    }, 1350);
    return () => window.clearTimeout(t);
  }, [phase, confirmWorld, onSelect]);

  const frozen = phase !== "idle";
  const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  const cy = typeof window !== "undefined" ? window.innerHeight / 2 : 0;
  const canEnterSelected = Boolean(confirmWorld?.route);

  useLayoutEffect(() => {
    const fit = () => {
      const minSide = Math.min(window.innerWidth, window.innerHeight);
      // Comfortable on-screen system — not tiny, not filling the whole viewport
      const target = minSide * 0.78;
      setScale(Math.max(0.72, Math.min(1.05, target / (2 * 420))));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (phase === "confirm") cancelConfirm();
        else if (phase === "idle") onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, phase]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="domain-universe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
          className="fixed inset-0 z-[100] overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at center, #0b0b14 0%, #030308 55%, #000 100%)",
          }}
        >
          <DeepSpace />
          <Meteors />

          {phase === "idle" && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 right-6 z-20 flex items-center gap-2 text-xs tracking-wide text-[#8b8b94] transition-colors hover:text-white"
            >
              Back <X className="w-4 h-4" />
            </button>
          )}

          <motion.div
            className="absolute inset-0 z-10"
            style={{ pointerEvents: "none" }}
            animate={
              phase === "flying" || phase === "fold"
                ? {
                    x: planetPos ? cx - planetPos.x : 0,
                    y: planetPos ? cy - planetPos.y : 0,
                  }
                : { x: 0, y: 0 }
            }
            transition={{ duration: 1.25, ease: [0.6, 0, 0.4, 1] }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ transformOrigin: "50% 50%" }}
              animate={
                phase === "flying" || phase === "fold"
                  ? { scale: 10, opacity: phase === "fold" ? 0 : 1 }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 1.25, ease: [0.7, 0, 0.85, 0.2] }}
            >
              <motion.div
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute inset-0 ${frozen ? "universe-frozen" : ""}`}
              >
                <div
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(-50%, -50%) scale(${scale})`,
                  }}
                >
                  {DOMAIN_WORLDS.map((w) => (
                    <div
                      key={`ring-${w.id}`}
                      className="universe-orbit-ring"
                      style={{ width: 2 * w.orbit, height: 2 * w.orbit }}
                    />
                  ))}

                  {GHOST_NODES.map((g, i) => (
                    <GhostNode key={`ghost-${i}`} {...g} />
                  ))}

                  {DOMAIN_WORLDS.map((w) => (
                    <Planet
                      key={w.id}
                      world={w}
                      onSelect={handlePlanetSelect}
                    />
                  ))}

                  <div
                    className="absolute left-1/2 top-1/2 flex items-center justify-center"
                    style={{ transform: "translate(-50%, -50%)" }}
                  >
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: 200,
                        height: 200,
                        background:
                          "radial-gradient(circle, rgba(124,58,237,0.34) 0%, rgba(124,58,237,0.12) 40%, transparent 72%)",
                        animation:
                          "universe-sun-breathe 6s ease-in-out infinite",
                      }}
                    />
                    <span
                      className="relative font-display font-extrabold text-white"
                      style={{
                        fontSize: 32,
                        letterSpacing: "0.14em",
                        textShadow: "0 0 28px rgba(167,139,250,0.65)",
                      }}
                    >
                      REBON
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {phase === "idle" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="absolute bottom-7 left-1/2 -translate-x-1/2 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-[#6b6b73]"
              >
                Explore every world · enter Cloud when ready
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {confirmWorld && phase === "confirm" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-30 flex items-center justify-center px-6"
                style={{
                  background: "rgba(3,3,6,0.72)",
                  backdropFilter: "blur(6px)",
                }}
                onClick={cancelConfirm}
              >
                <motion.div
                  initial={{ scale: 0.92, y: 12, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-md rounded-xl p-8 text-center"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(20,20,26,0.96), rgba(10,10,14,0.96))",
                    border: `1px solid ${STATUS_COLOR[confirmWorld.status]}55`,
                    boxShadow: `0 0 60px -12px ${STATUS_COLOR[confirmWorld.status]}66`,
                  }}
                >
                  <p
                    className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: STATUS_COLOR[confirmWorld.status] }}
                  >
                    {STATUS_LABEL[confirmWorld.status]} · {confirmWorld.label}
                  </p>
                  <h3 className="mb-3 font-display text-2xl font-bold leading-snug text-white">
                    {canEnterSelected ? (
                      <>
                        Ready to begin your journey
                        <br />
                        to the {confirmWorld.label} world?
                      </>
                    ) : (
                      <>
                        {confirmWorld.label} world
                        <br />
                        <span className="text-lg font-medium text-[#A1A1AA]">
                          on the roadmap
                        </span>
                      </>
                    )}
                  </h3>
                  <p className="mx-auto mb-8 max-w-xs text-sm leading-relaxed text-[#A1A1AA]">
                    {canEnterSelected
                      ? "You'll travel through the cloud corridor. Ren meets you on the other side and places you at the right phase."
                      : confirmWorld.glimpse +
                        " You can look around the system — enter when this world goes live."}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={cancelConfirm}
                      className="rounded-md border border-white/15 px-6 py-3 text-sm text-[#A1A1AA] transition-colors hover:border-white/30 hover:text-white"
                    >
                      {canEnterSelected ? "Not yet" : "Back to space"}
                    </button>
                    {canEnterSelected && (
                      <button
                        type="button"
                        onClick={beginFlight}
                        className="group flex items-center gap-2 rounded-md px-7 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
                        style={{
                          background: STATUS_COLOR[confirmWorld.status],
                          boxShadow: `0 0 28px -6px ${STATUS_COLOR[confirmWorld.status]}`,
                        }}
                      >
                        Yes, take me in
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DomainUniverse;
