import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DOMAINS = [
  {
    id: "cloud",
    label: "Cloud",
    glimpse: "Architectures, incidents, and the console on day one.",
    open: true,
  },
  {
    id: "fullstack",
    label: "Full stack",
    glimpse: "Ship features end to end — frontend, backend, production.",
    open: false,
  },
  {
    id: "ml",
    label: "Machine learning",
    glimpse: "Models, data pipelines, and decisions that scale.",
    open: false,
  },
  {
    id: "security",
    label: "Cybersecurity",
    glimpse: "Threats, hardening, and the posture companies trust.",
    open: false,
  },
  {
    id: "devops",
    label: "DevOps",
    glimpse: "Pipelines, infra, and systems that never sleep.",
    open: false,
  },
] as const;

type DomainId = (typeof DOMAINS)[number]["id"];

interface NodeState {
  id: DomainId;
  label: string;
  glimpse: string;
  open: boolean;
  angle: number;
  orbitRadius: number;
  speed: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const SKY = "#09090B";
const AMBER = "#F59E0B";
const VIOLET = "#7C3AED";
const VIOLET_LIGHT = "#A78BFA";

interface DomainConstellationProps {
  className?: string;
  onDomainSelect?: (id: DomainId) => void;
  /** Freeze the ambient orbit while the full universe overlay is open */
  paused?: boolean;
}

const DomainConstellation = ({
  className = "",
  onDomainSelect,
  paused = false,
}: DomainConstellationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const nodesRef = useRef<NodeState[]>([]);
  const breatheRef = useRef(1);
  const selectedRef = useRef<DomainId | null>(null);
  const frameRef = useRef<number>(0);
  const pausedRef = useRef(paused);
  const reducedMotionRef = useRef(false);

  const [selected, setSelected] = useState<DomainId | null>(null);
  const hoveredRef = useRef<DomainId | null>(null);

  const initNodes = useCallback((width: number, height: number): NodeState[] => {
    const cx = width * 0.5;
    const cy = height * 0.5;
    const baseOrbit = Math.min(width, height) * 0.28;

    return DOMAINS.map((d, i) => {
      const angle = (i / DOMAINS.length) * Math.PI * 2 - Math.PI / 2;
      const orbitRadius = baseOrbit + (i % 2 === 0 ? 0 : baseOrbit * 0.18);
      return {
        id: d.id,
        label: d.label,
        glimpse: d.glimpse,
        open: d.open,
        angle,
        orbitRadius,
        speed: 0.00035 + i * 0.00004,
        x: cx + Math.cos(angle) * orbitRadius,
        y: cy + Math.sin(angle) * orbitRadius,
        vx: 0,
        vy: 0,
      };
    });
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodesRef.current = initNodes(rect.width, rect.height);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const draw = (time: number) => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const breathe = breatheRef.current;
      const selectedId = selectedRef.current;
      const mouse = mouseRef.current;
      const reduced = reducedMotionRef.current;

      ctx.clearRect(0, 0, w, h);

      // Subtle center glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.45 * breathe);
      glow.addColorStop(0, `${VIOLET}18`);
      glow.addColorStop(0.5, `${VIOLET}08`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const nodes = nodesRef.current;

      nodes.forEach((node, i) => {
        if (!reduced && !pausedRef.current) {
          node.angle += node.speed;
        }

        const targetRadius = node.orbitRadius * breathe;
        let tx = cx + Math.cos(node.angle) * targetRadius;
        let ty = cy + Math.sin(node.angle) * targetRadius;

        if (selectedId === node.id) {
          tx = cx + (tx - cx) * 0.35;
          ty = cy + (ty - cy) * 0.35;
        } else if (selectedId) {
          tx = cx + (tx - cx) * 1.15;
          ty = cy + (ty - cy) * 1.15;
        }

        if (mouse.active && !selectedId) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const pull = Math.max(0, 1 - dist / 220) * 28;
          tx += (dx / dist) * pull;
          ty += (dy / dist) * pull;
        }

        node.vx += (tx - node.x) * 0.06;
        node.vy += (ty - node.y) * 0.06;
        node.vx *= 0.82;
        node.vy *= 0.82;
        node.x += node.vx;
        node.y += node.vy;

        const isSelected = selectedId === node.id;
        const isHovered = hoveredRef.current === node.id;
        const radius = isSelected ? 14 : isHovered ? 11 : 9;

        // Orbit trail
        ctx.beginPath();
        ctx.strokeStyle = `${AMBER}${isSelected ? "40" : "18"}`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 6]);
        ctx.arc(cx, cy, targetRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Connection to center when selected
        if (isSelected) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = `${VIOLET_LIGHT}55`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Node glow
        const nodeGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 4);
        nodeGlow.addColorStop(0, isSelected ? `${VIOLET}90` : `${AMBER}${isHovered ? "cc" : "88"}`);
        nodeGlow.addColorStop(1, "transparent");
        ctx.fillStyle = nodeGlow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? VIOLET : AMBER;
        ctx.fill();

        // Label
        ctx.font = "600 11px 'DM Sans', sans-serif";
        ctx.fillStyle = isSelected ? "#FAFAFA" : "#A1A1AA";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + radius + 16);

        if (!node.open) {
          ctx.font = "500 9px 'JetBrains Mono', monospace";
          ctx.fillStyle = "#52525B";
          ctx.fillText("soon", node.x, node.y + radius + 28);
        }
      });

      // Center pulse
      const pulse = 0.5 + Math.sin(time * 0.002) * 0.15;
      ctx.beginPath();
      ctx.arc(cx, cy, 3 + pulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = VIOLET_LIGHT;
      ctx.fill();

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [initNodes]);

  useEffect(() => {
    const target = selected ? 0.72 : 1;
    let start = breatheRef.current;
    let startTime: number | null = null;
    const duration = 700;

    const animateBreathe = (now: number) => {
      if (startTime === null) startTime = now;
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      breatheRef.current = start + (target - start) * eased;
      if (t < 1) requestAnimationFrame(animateBreathe);
    };
    requestAnimationFrame(animateBreathe);
  }, [selected]);

  const hitTest = (clientX: number, clientY: number): DomainId | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (const node of nodesRef.current) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) < 24) return node.id;
    }
    return null;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
    hoveredRef.current = hitTest(e.clientX, e.clientY);
  };

  const handlePointerLeave = () => {
    mouseRef.current.active = false;
    hoveredRef.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (!hit) {
      setSelected(null);
      selectedRef.current = null;
      return;
    }
    setSelected(hit);
    selectedRef.current = hit;
    onDomainSelect?.(hit);
  };

  const selectedDomain = DOMAINS.find((d) => d.id === selected);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
      style={{ background: SKY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      role="presentation"
      aria-hidden={!selectedDomain}
    >
      <canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair" />

      <AnimatePresence>
        {selectedDomain && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-[12%] flex flex-col items-center text-center px-6 pointer-events-none"
          >
            <p className="font-display text-lg md:text-xl text-[#FAFAFA] mb-2 tracking-wide">
              {selectedDomain.label}
            </p>
            <p className="text-sm text-[#A1A1AA] max-w-xs leading-relaxed mb-4">
              {selectedDomain.glimpse}
            </p>
            <p className="font-display text-base md:text-lg text-[#A78BFA] tracking-[0.12em]">
              Ren will meet you there.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DomainConstellation;
export { DOMAINS };
export type { DomainId };
