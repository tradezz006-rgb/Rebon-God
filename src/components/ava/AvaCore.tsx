import React, { useEffect, useRef, useCallback } from 'react';

export type AvaCoreState = 'passive' | 'listening' | 'thinking' | 'speaking' | 'alert';

interface AvaCoreProps {
  state: AvaCoreState;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  className?: string;
}

// State-driven color palette
const STATE_CONFIG: Record<AvaCoreState, {
  primary: string;
  secondary: string;
  glow: string;
  particleColor: string;
  ringSpeed: number;
  particleSpeed: number;
  glowIntensity: number;
}> = {
  passive: {
    primary: 'rgba(180,192,210,0.6)',
    secondary: 'rgba(120,140,160,0.3)',
    glow: 'rgba(150,170,200,0.15)',
    particleColor: 'rgba(180,200,220,0.5)',
    ringSpeed: 1,
    particleSpeed: 0.3,
    glowIntensity: 0.15,
  },
  listening: {
    primary: 'rgba(0,200,255,0.8)',
    secondary: 'rgba(0,150,220,0.4)',
    glow: 'rgba(0,180,255,0.3)',
    particleColor: 'rgba(0,220,255,0.7)',
    ringSpeed: 0.6,
    particleSpeed: 0.8,
    glowIntensity: 0.35,
  },
  thinking: {
    primary: 'rgba(160,100,255,0.75)',
    secondary: 'rgba(120,60,220,0.35)',
    glow: 'rgba(140,80,255,0.3)',
    particleColor: 'rgba(180,120,255,0.7)',
    ringSpeed: 2.2,
    particleSpeed: 1.2,
    glowIntensity: 0.4,
  },
  speaking: {
    primary: 'rgba(220,235,255,0.9)',
    secondary: 'rgba(180,210,255,0.4)',
    glow: 'rgba(200,225,255,0.35)',
    particleColor: 'rgba(230,240,255,0.8)',
    ringSpeed: 1.5,
    particleSpeed: 1.6,
    glowIntensity: 0.5,
  },
  alert: {
    primary: 'rgba(255,180,0,0.85)',
    secondary: 'rgba(200,120,0,0.4)',
    glow: 'rgba(255,160,0,0.35)',
    particleColor: 'rgba(255,200,50,0.75)',
    ringSpeed: 2.5,
    particleSpeed: 2.0,
    glowIntensity: 0.45,
  },
};

const SIZE_MAP = {
  sm: { canvas: 80, outer: 80 },
  md: { canvas: 180, outer: 180 },
  lg: { canvas: 320, outer: 320 },
  fullscreen: { canvas: 420, outer: 420 },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
}

const AvaCore: React.FC<AvaCoreProps> = ({ state, size = 'lg', className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const { canvas: canvasSize } = SIZE_MAP[size];

  const initParticles = useCallback((count: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const orbitRadius = 20 + Math.random() * (canvasSize * 0.3);
      particles.push({
        x: canvasSize / 2 + Math.cos(angle) * orbitRadius,
        y: canvasSize / 2 + Math.sin(angle) * orbitRadius,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: Math.random() * 100,
        maxLife: 80 + Math.random() * 120,
        radius: 0.8 + Math.random() * 1.8,
        angle,
        orbitRadius,
        orbitSpeed: (Math.random() - 0.5) * 0.008,
      });
    }
    return particles;
  }, [canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const cx = canvasSize / 2;
    const cy = canvasSize / 2;

    particlesRef.current = initParticles(60);

    const drawRing = (
      radius: number,
      thickness: number,
      color: string,
      dashPattern: number[],
      rotation: number,
      segments: number = 6,
      segmentGap: number = 0.15
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      const segmentAngle = (Math.PI * 2) / segments;
      for (let i = 0; i < segments; i++) {
        const start = i * segmentAngle + segmentGap;
        const end = (i + 1) * segmentAngle - segmentGap;
        ctx.beginPath();
        ctx.arc(0, 0, radius, start, end);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.setLineDash(dashPattern);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawCore = (time: number, cfg: typeof STATE_CONFIG[AvaCoreState]) => {
      const breathe = 1 + Math.sin(time * 0.8) * 0.03;
      const innerRadius = (canvasSize * 0.12) * breathe;
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius * 2.5);
      coreGlow.addColorStop(0, cfg.primary.replace(/[\d.]+\)$/, '0.9)'));
      coreGlow.addColorStop(0.3, cfg.secondary);
      coreGlow.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = coreGlow;
      ctx.fill();

      // Inner crystal hexagon shape
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.3);
      const sides = 6;
      const r = innerRadius * 0.9;
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.strokeStyle = cfg.primary;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = cfg.glow;
      ctx.stroke();
      ctx.restore();

      // Inner dot
      const dotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius * 0.35);
      dotGrad.addColorStop(0, cfg.primary);
      dotGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = dotGrad;
      ctx.fill();
      ctx.restore();
    };

    const drawParticles = (cfg: typeof STATE_CONFIG[AvaCoreState]) => {
      const particles = particlesRef.current;
      particles.forEach((p, i) => {
        p.angle += p.orbitSpeed * cfg.ringSpeed;

        // In listening state, pull particles inward
        if (stateRef.current === 'listening') {
          p.orbitRadius = Math.max(canvasSize * 0.05, p.orbitRadius * 0.995);
          p.orbitSpeed *= 0.999;
        } else if (stateRef.current === 'speaking') {
          // In speaking, push particles outward in waves
          p.orbitRadius = Math.min(canvasSize * 0.38, p.orbitRadius + 0.15);
        } else {
          // Default: drift slowly
          p.orbitRadius += Math.sin(timeRef.current * 0.5 + i) * 0.1;
        }

        p.x = cx + Math.cos(p.angle) * p.orbitRadius;
        p.y = cy + Math.sin(p.angle) * p.orbitRadius;
        p.life += cfg.particleSpeed;

        if (p.life > p.maxLife) {
          p.life = 0;
          p.angle = Math.random() * Math.PI * 2;
          p.orbitRadius = 20 + Math.random() * (canvasSize * 0.28);
        }

        const alpha = Math.sin((p.life / p.maxLife) * Math.PI);
        const pColor = cfg.particleColor.replace(/[\d.]+\)$/, `${alpha * 0.85})`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
        ctx.fillStyle = pColor;
        ctx.shadowBlur = 8;
        ctx.shadowColor = cfg.glow;
        ctx.fill();
      });
    };

    const drawSpeakingWaves = (time: number, cfg: typeof STATE_CONFIG[AvaCoreState]) => {
      if (stateRef.current !== 'speaking') return;
      for (let w = 0; w < 3; w++) {
        const wavePhase = (time * 1.5 + w * 1.2) % 3;
        const waveRadius = (canvasSize * 0.15) + wavePhase * (canvasSize * 0.16);
        const waveAlpha = Math.max(0, 0.45 - wavePhase * 0.15);
        ctx.beginPath();
        ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = cfg.primary.replace(/[\d.]+\)$/, `${waveAlpha})`);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const drawScanLine = (time: number, cfg: typeof STATE_CONFIG[AvaCoreState]) => {
      if (stateRef.current !== 'thinking') return;
      const scanAngle = time * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(scanAngle);
      const grad = ctx.createLinearGradient(0, 0, canvasSize * 0.42, 0);
      grad.addColorStop(0, cfg.primary.replace(/[\d.]+\)$/, '0.6)'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvasSize * 0.42, 0);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };

    const animate = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const cfg = STATE_CONFIG[stateRef.current];

      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Outer ambient glow
      const ambientGrad = ctx.createRadialGradient(cx, cy, canvasSize * 0.2, cx, cy, canvasSize * 0.5);
      ambientGrad.addColorStop(0, cfg.glow.replace(/[\d.]+\)$/, `${cfg.glowIntensity})`));
      ambientGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, canvasSize * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = ambientGrad;
      ctx.fill();

      // Speaking waves (behind everything)
      drawSpeakingWaves(t, cfg);

      // Outer ring (slow counter-rotate)
      drawRing(canvasSize * 0.44, 1, cfg.secondary, [4, 6], -t * 0.1 * cfg.ringSpeed, 8, 0.1);

      // Middle ring (segments, medium speed)
      drawRing(canvasSize * 0.33, 1.5, cfg.primary, [2, 4], t * 0.18 * cfg.ringSpeed, 6, 0.2);

      // Inner ring (solid arcs, faster)
      drawRing(canvasSize * 0.22, 2, cfg.primary, [], t * 0.32 * cfg.ringSpeed, 4, 0.25);

      // Scan line (thinking only)
      drawScanLine(t, cfg);

      // Neural particles
      ctx.save();
      ctx.shadowBlur = 4;
      drawParticles(cfg);
      ctx.restore();

      // Core center
      drawCore(t, cfg);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [canvasSize, initParticles]);

  const { outer } = SIZE_MAP[size];

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: outer, height: outer }}
    >
      {/* Outer ambient CSS glow ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'transparent',
          boxShadow: state === 'passive'
            ? '0 0 60px 10px rgba(150,170,200,0.08)'
            : state === 'listening'
              ? '0 0 80px 20px rgba(0,200,255,0.15)'
              : state === 'thinking'
                ? '0 0 80px 20px rgba(140,80,255,0.15)'
                : state === 'speaking'
                  ? '0 0 100px 30px rgba(200,225,255,0.18)'
                  : '0 0 80px 20px rgba(255,160,0,0.18)',
          transition: 'box-shadow 1.2s ease',
          borderRadius: '50%',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          width: canvasSize,
          height: canvasSize,
          display: 'block',
        }}
      />
    </div>
  );
};

export default AvaCore;
