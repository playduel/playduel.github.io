import { useEffect, useRef } from "react";
import type { Side } from "../types";
import type { Dir } from "./grid";
import { alpha, lighten, palette } from "../../ui/palette";

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
    const pal = palette();
    g.fillStyle = pal.well;
    g.fillRect(0, 0, size, cell * h);
    g.fillStyle = alpha(pal.p1, 0.06);
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
      <div className="gridboard__pads">
        {(me ? [me] : (["host", "guest"] as const)).map((side) => (
          <div key={side} className={`dpad dpad--${side}`} aria-label="Steer">
            {(["up", "left", "right", "down"] as const).map((d) => (
              <button key={d} className={`dpad__btn dpad__btn--${d}`} aria-label={d} onPointerDown={(e) => { e.preventDefault(); steer(d, me ? undefined : side); }}>
                {{ up: "▲", down: "▼", left: "◀", right: "▶" }[d]}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Read live from the theme, so a theme change recolours the board. */
export const SIDE_COLORS: Record<Side, { body: string; head: string }> = {
  get host() { const { p1 } = palette(); return { body: alpha(p1, 0.75), head: lighten(p1, 0.65) }; },
  get guest() { const { p2 } = palette(); return { body: alpha(p2, 0.75), head: lighten(p2, 0.65) }; },
};
