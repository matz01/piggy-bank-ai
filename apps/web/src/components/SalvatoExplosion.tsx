import { useEffect, useRef } from 'react';

interface Props {
  onDone: () => void;
}

export function SalvatoExplosion({ onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '500 18px Inter, sans-serif';
    ctx.fillStyle = '#c9a84c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0.15em';
    ctx.fillText('SALVATO', cx, cy);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const buf = imageData.data;

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      timeFade: number;
      r: number; g: number; b: number;
    };

    const particles: Particle[] = [];
    const step = 3;
    for (let y = 0; y < imageData.height; y += step) {
      for (let x = 0; x < imageData.width; x += step) {
        const idx = (y * imageData.width + x) * 4;
        if (buf[idx + 3] > 128) {
          const speed = Math.random() * 5 + 2;
          const angle = Math.random() * Math.PI * 2;
          particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 2.5 + 1,
            timeFade: 1,
            r: buf[idx], g: buf[idx + 1], b: buf[idx + 2],
          });
        }
      }
    }

    const maxRadius = Math.min(canvas.width, canvas.height) * 0.42;

    let rafId: number;

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      let anyAlive = false;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.timeFade -= 0.016;

        const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
        const distFade = Math.max(0, 1 - dist / maxRadius);
        const alpha = Math.min(distFade, Math.max(0, p.timeFade));

        if (alpha > 0) {
          anyAlive = true;
          ctx!.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
          ctx!.fillRect(p.x, p.y, p.size, p.size);
        }
      }

      if (anyAlive) {
        rafId = requestAnimationFrame(animate);
      } else {
        onDone();
      }
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  );
}
