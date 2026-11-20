import { useEffect, useRef } from "react";
import type { Side } from "../types";
import type { Dir } from "./grid";

export interface Paint {
  /** Cell index -> colour, drawn as a filled square. */
  cells: Array<[number, string]>;
  /** Highlighted cells (heads, food), drawn with a glow. */
  glow: Array<[number, string, "square" | "dot"]>;
}

/**
 * Canvas board for grid live games, with touch steering: swipe on the board
 * or use the D-pad. `steer` sends a direction for this screen's player.
 */
export function GridBoard({ w, h, paint, steer, me }: { w: number; h: number; paint: Paint; steer: (d: Dir, side?: Side) => void; me: Side | null }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    const size = c.clientWidth;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== Math.round(size * dpr)) {
      c.width = Math.round(size * dpr);
      c.height = Math.round(((size * h) / w) * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cell = size / w;
    g.fillStyle = "#06020f";
    g.fillRect(0, 0, size, cell * h);
    g.fillStyle = "rgba(45, 226, 230, 0.06)";
    for (let i = 1; i < w; i++) g.fillRect(i * cell, 0, 1, cell * h);
    for (let i = 1; i < h; i++) g.fillRect(0, i * cell, size, 1);
    for (const [i, col] of paint.cells) {
      g.fillStyle = col;
      g.fillRect((i % w) * cell, Math.floor(i / w) * cell, cell, cell);
    }
    for (const [i, col, shape] of paint.glow) {
      g.fillStyle = col;
      g.shadowColor = col;
      g.shadowBlur = 14;
      const x = (i % w) * cell, y = Math.floor(i / w) * cell;
      if (shape === "dot") {
        g.beginPath();
        g.arc(x + cell / 2, y + cell / 2, cell * 0.4, 0, Math.PI * 2);
        g.fill();
      } else g.fillRect(x - 1, y - 1, cell + 2, cell + 2);
      g.shadowBlur = 0;
    }
  }, [paint, w, h]);

  const swipe = useRef<{ x: number; y: number } | null>(null);
  return (
    <div className="gridboard">
      <canvas
        ref={canvas}
        className="gridboard__canvas"
        style={{ aspectRatio: `${w} / ${h}` }}
        onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
        onPointerMove={(e) => {
          const s = swipe.current;
          if (!s || !me) return;
          const dx = e.clientX - s.x, dy = e.clientY - s.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
          steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
          swipe.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (swipe.current = null)}
      />
      {me && (
        <div className="dpad" aria-label="Steer">
          {(["up", "left", "right", "down"] as const).map((d) => (
            <button key={d} className={`dpad__btn dpad__btn--${d}`} aria-label={d} onPointerDown={(e) => { e.preventDefault(); steer(d); }}>
              {{ up: "▲", down: "▼", left: "◀", right: "▶" }[d]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const SIDE_COLORS: Record<Side, { body: string; head: string }> = {
  host: { body: "rgba(45, 226, 230, 0.75)", head: "#b9fdff" },
  guest: { body: "rgba(255, 56, 100, 0.75)", head: "#ffc2d1" },
};
