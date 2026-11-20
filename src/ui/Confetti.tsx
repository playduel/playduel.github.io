import { useEffect, useRef } from "react";
import { cssVar } from "./palette";

/**
 * One burst of confetti for a match win: a few hundred paper rectangles in
 * the winner's colour and gold, thrown up from the bottom corners, falling
 * with drag and flutter. Plain canvas, ~2.5 s, then it removes itself.
 * Skipped entirely for people who prefer reduced motion.
 */
export function Confetti({ side }: { side: "p1" | "p2" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    const W = (c.width = window.innerWidth);
    const H = (c.height = window.innerHeight);
    const colors = [cssVar(side === "p1" ? "--p1" : "--p2", "#3d8bff"), cssVar("--coin", "#ffc83d"), cssVar("--fg", "#fff1d8")];
    const bits = Array.from({ length: 220 }, (_, i) => {
      const left = i % 2 === 0;
      return {
        x: left ? W * 0.05 : W * 0.95,
        y: H + 10,
        vx: (left ? 1 : -1) * (3 + Math.random() * 9),
        vy: -(11 + Math.random() * 13),
        w: 6 + Math.random() * 6,
        h: 3 + Math.random() * 4,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        color: colors[i % colors.length]!,
      };
    });
    const start = performance.now();
    let raf = 0;
    const frame = (t: number) => {
      const age = t - start;
      g.clearRect(0, 0, W, H);
      g.globalAlpha = Math.max(0, 1 - Math.max(0, age - 1800) / 700);
      for (const b of bits) {
        b.vy += 0.38;
        b.vx *= 0.985;
        b.vy *= 0.985;
        b.x += b.vx + Math.sin((t + b.w * 100) / 180) * 0.6;
        b.y += b.vy;
        b.r += b.vr;
        g.save();
        g.translate(b.x, b.y);
        g.rotate(b.r);
        g.scale(1, Math.cos(t / 120 + b.w)); // flutter: the paper turns over
        g.fillStyle = b.color;
        g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        g.restore();
      }
      if (age < 2500) raf = requestAnimationFrame(frame);
      else g.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [side]);
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}
