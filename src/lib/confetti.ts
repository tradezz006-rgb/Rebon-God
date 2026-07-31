// Simple canvas confetti effect
const confetti = () => {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces: { x: number; y: number; w: number; h: number; vx: number; vy: number; color: string; rot: number; vr: number }[] = [];
  const colors = ["hsl(174,100%,42%)", "hsl(0,0%,78%)", "hsl(174,80%,55%)", "hsl(0,0%,60%)", "hsl(174,60%,35%)"];

  for (let i = 0; i < 120; i++) {
    pieces.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      vx: (Math.random() - 0.5) * 15,
      vy: Math.random() * -18 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
    });
  }

  let frame = 0;
  const animate = () => {
    if (frame > 120) {
      canvas.remove();
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.rot += p.vr;
      p.vx *= 0.99;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / 120);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    frame++;
    requestAnimationFrame(animate);
  };
  animate();
};

export default confetti;
