import { useEffect, useRef, useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { type Dir, GRID, START_LENGTH, type SnakePuzzle, TICK_MS, createSnakePuzzle, startState, tick } from "./puzzle";
import "./style.css";

const KEY_DIR: Record<string, Dir> = { arrowup: "up", arrowdown: "down", arrowleft: "left", arrowright: "right", w: "up", s: "down", a: "left", d: "right" };

function SnakeSprint({ puzzle, onFinish, onProgress }: GameProps<SnakePuzzle>) {
  const finish = useFinishOnce(onFinish);
  const [state, setState] = useState(() => startState(puzzle));
  const live = useRef(state);
  /** Turns pressed between ticks, applied one per tick so quick double-turns work. */
  const turns = useRef<Dir[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  useTimeUp(snakeGame.durationMs, () => finish(live.current.body.length));

  useReportProgress(onProgress, {
    fraction: Math.min(1, (state.body.length - START_LENGTH) / 30),
    headline: String(state.body.length),
    unit: "long",
    detail: state.alive ? "Alive" : "Crashed",
  });

  // Fixed-rate game loop.
  useEffect(() => {
    const id = setInterval(() => {
      const before = live.current;
      if (!before.alive) return;
      const next = tick(puzzle, before, turns.current.shift());
      if (next.body.length > before.body.length) sfx("pop");
      if (!next.alive) {
        sfx("roundLose");
        setTimeout(() => finish(next.body.length), 700);
      }
      live.current = next;
      setState(next);
    }, TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const turn = (d: Dir) => {
    if (turns.current.length < 3) turns.current.push(d);
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const d = KEY_DIR[e.key.toLowerCase()];
      if (!d) return;
      e.preventDefault();
      turn(d);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  // Draw.
  useEffect(() => {
    const c = canvas.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    const size = c.clientWidth;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== Math.round(size * dpr)) {
      c.width = Math.round(size * dpr);
      c.height = Math.round(size * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cell = size / GRID;
    g.fillStyle = "#06020f";
    g.fillRect(0, 0, size, size);
    g.strokeStyle = "rgba(45, 226, 230, 0.08)";
    for (let i = 1; i < GRID; i++) {
      g.beginPath(); g.moveTo(i * cell, 0); g.lineTo(i * cell, size); g.stroke();
      g.beginPath(); g.moveTo(0, i * cell); g.lineTo(size, i * cell); g.stroke();
    }
    const at = (i: number) => [(i % GRID) * cell, Math.floor(i / GRID) * cell] as const;
    const [fx, fy] = at(state.food);
    g.fillStyle = "#f9c80e";
    g.shadowColor = "#f9c80e";
    g.shadowBlur = 12;
    g.beginPath();
    g.arc(fx + cell / 2, fy + cell / 2, cell * 0.34, 0, Math.PI * 2);
    g.fill();
    g.shadowColor = state.alive ? "#2de2e6" : "#ff3864";
    state.body.forEach((b, i) => {
      const [x, y] = at(b);
      g.fillStyle = !state.alive ? "#ff3864" : i === 0 ? "#b9fdff" : "#2de2e6";
      g.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    });
    g.shadowBlur = 0;
  }, [state]);

  const swipe = useRef<{ x: number; y: number } | null>(null);
  return (
    <div className="snake">
      <p className="snake__len">Length {state.body.length}{state.alive ? "" : ", crashed"}</p>
      <canvas
        ref={canvas}
        className="snake__board"
        data-testid="snake-board"
        onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
        onPointerMove={(e) => {
          const s = swipe.current;
          if (!s) return;
          const dx = e.clientX - s.x, dy = e.clientY - s.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
          turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
          swipe.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (swipe.current = null)}
      />
      <div className="dpad" aria-label="Steer">
        {(["up", "left", "right", "down"] as const).map((d) => (
          <button key={d} className={`dpad__btn dpad__btn--${d}`} aria-label={d} onPointerDown={(e) => { e.preventDefault(); turn(d); }}>
            {{ up: "▲", down: "▼", left: "◀", right: "▶" }[d]}
          </button>
        ))}
      </div>
    </div>
  );
}

export const snakeGame = defineGame<SnakePuzzle>({
  id: "snake",
  name: "Snake Sprint",
  emoji: "🐍",
  instructions: "Eat the gold dots to grow. Don't hit the walls or yourself. You both get the same food in the same order. Longest snake after 60 seconds, or when you crash, wins.",
  keyHint: "Arrow keys or WASD",
  durationMs: 60_000,
  better: "higher",
  formatScore: (n) => `length ${n}`,
  formatMargin: (d) => `${d} longer`,
  createPuzzle: createSnakePuzzle,
  Component: SnakeSprint,
});
