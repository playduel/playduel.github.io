import { useEffect, useRef, useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { DOWN, LEFT, type MazePuzzle, N, RIGHT, UP, createMazePuzzle, distanceToExit, run } from "./puzzle";
import "./style.css";

type Dir = "up" | "down" | "left" | "right";
const LIMIT_MS = 90_000;
const KEY_DIR: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };

function MazeRun({ puzzle, onFinish, onProgress }: GameProps<MazePuzzle>) {
  const finish = useFinishOnce(onFinish);
  const [cell, setCell] = useState(0);
  const total = useRef(distanceToExit(puzzle.walls, 0));
  const started = useRef(performance.now());
  const pos = useRef(0);
  const left = distanceToExit(puzzle.walls, cell);
  useTimeUp(LIMIT_MS, () => finish(LIMIT_MS + distanceToExit(puzzle.walls, pos.current) * 1000));

  useReportProgress(onProgress, {
    fraction: 1 - left / total.current,
    headline: String(left),
    unit: "steps to go",
    detail: left === 0 ? "Out!" : "Running",
  });

  // Every cell you've walked through, drawn as a trail so you can see where you've been.
  const [trail, setTrail] = useState<number[]>([0]);
  const move = (dir: Dir) => {
    if (pos.current === N * N - 1) return;
    const path = run(puzzle.walls, pos.current, dir);
    if (!path.length) return sfx("key");
    const next = path[path.length - 1]!;
    pos.current = next;
    setCell(next);
    setTrail((t) => [...t, ...path]);
    sfx("move");
    if (next === N * N - 1) {
      sfx("correct", 4);
      finish(Math.round(performance.now() - started.current));
    }
  };

  // One press runs the whole corridor, so held-key repeats are ignored.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.repeat) { if (KEY_DIR[e.key] ?? KEY_DIR[e.key.toLowerCase()]) e.preventDefault(); return; }
      const dir = KEY_DIR[e.key] ?? KEY_DIR[e.key.toLowerCase()];
      if (!dir) return;
      e.preventDefault();
      move(dir);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swipe on the maze: one run per swipe, in the swipe's main direction.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => (swipe.current = { x: e.clientX, y: e.clientY });
  const onUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  };


  const lines: string[] = [];
  puzzle.walls.forEach((w, i) => {
    const r = Math.floor(i / N), c = i % N;
    if (w & UP) lines.push(`M${c} ${r}h1`);
    if (w & LEFT) lines.push(`M${c} ${r}v1`);
    if (r === N - 1 && w & DOWN) lines.push(`M${c} ${r + 1}h1`);
    if (c === N - 1 && w & RIGHT) lines.push(`M${c + 1} ${r}v1`);
  });
  const pr = Math.floor(cell / N), pc = cell % N;

  return (
    <div className="maze">
      <p className="maze__status">{left === 0 ? "Out!" : `${left} steps to the exit`}</p>
      <svg className="maze__board" viewBox="-0.2 -0.2 10.4 10.4" onPointerDown={onDown} onPointerUp={onUp} data-testid="maze-board">
        <rect x={N - 1 + 0.15} y={N - 1 + 0.15} width={0.7} height={0.7} className="maze__exit" />
        <polyline className="maze__trail" points={trail.map((t) => `${(t % N) + 0.5},${Math.floor(t / N) + 0.5}`).join(" ")} />
        <path d={lines.join("")} className="maze__walls" />
        <circle cx={pc + 0.5} cy={pr + 0.5} r={0.32} className="maze__me" />
      </svg>
      <div className="dpad" aria-label="Move">
        {(["up", "left", "right", "down"] as const).map((d) => (
          <button key={d} className={`dpad__btn dpad__btn--${d}`} aria-label={d} onPointerDown={(e) => { e.preventDefault(); move(d); }}>
            {{ up: "▲", down: "▼", left: "◀", right: "▶" }[d]}
          </button>
        ))}
      </div>
    </div>
  );
}

export const mazeGame = defineGame<MazePuzzle>({
  id: "maze",
  name: "Maze Run",
  emoji: "🌀",
  instructions: "Get from the top-left corner to the glowing exit, bottom-right. Each move runs until you hit a wall or reach a turn. Same maze for both of you. Fastest out wins.",
  keyHint: "Arrow keys or WASD; one press runs to the next turn",
  durationMs: LIMIT_MS,
  better: "lower",
  formatScore: (n) => `${(n / 1000).toFixed(1)} s`,
  formatMargin: (d) => `${(d / 1000).toFixed(1)} s faster`,
  createPuzzle: createMazePuzzle,
  Component: MazeRun,
});
