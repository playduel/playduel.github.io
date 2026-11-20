import { useEffect, useRef, useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useKeys, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { BOARD, START_WIDTH, type StackPuzzle, createStackPuzzle, drop, positionAt } from "./puzzle";
import "./style.css";

interface Layer { x: number; w: number; perfect: boolean }
const VISIBLE = 12;

function Stacker({ puzzle, onFinish, onProgress }: GameProps<StackPuzzle>) {
  const finish = useFinishOnce(onFinish);
  const [tower, setTower] = useState<Layer[]>([{ x: (BOARD - START_WIDTH) / 2, w: START_WIDTH, perfect: true }]);
  const [x, setX] = useState(0);
  const [over, setOver] = useState(false);
  const levelStart = useRef(performance.now());
  const height = tower.length - 1;
  // Perfect drops in a row, counted from the top of the tower.
  let streak = 0;
  for (let i = tower.length - 1; i > 0 && tower[i]!.perfect; i--) streak++;
  const top = tower[tower.length - 1]!;
  const level = puzzle.levels[Math.min(height, puzzle.levels.length - 1)]!;
  useTimeUp(stackerGame.durationMs, () => finish(height));

  useReportProgress(onProgress, {
    fraction: Math.min(1, height / 20),
    headline: String(height),
    unit: "high",
    detail: over ? "Tower finished" : `Block ${top.w.toFixed(1)} wide`,
  });

  // Animate the moving block.
  useEffect(() => {
    if (over) return;
    levelStart.current = performance.now();
    let raf = 0;
    const loop = () => {
      setX(positionAt(level, top.w, (performance.now() - levelStart.current) / 1000));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [height, over, level, top.w]);

  const place = () => {
    if (over) return;
    const now = positionAt(level, top.w, (performance.now() - levelStart.current) / 1000);
    const layer = drop(now, top.w, top.x, top.w);
    if (!layer) {
      sfx("roundLose");
      setOver(true);
      setTimeout(() => finish(height), 900);
      return;
    }
    sfx(layer.perfect ? "correct" : "tap", 3);
    setTower([...tower, layer]);
  };

  useKeys((e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      place();
    }
  });

  const shown = tower.slice(-VISIBLE);
  const pct = (u: number) => `${(u / BOARD) * 100}%`;
  return (
    <div className="stacker" onPointerDown={(e) => { e.preventDefault(); place(); }} data-testid="stacker">
      <p className="stacker__height">{height} high{streak >= 2 && <span className="stacker__streak" key={streak}> perfect x{streak}</span>}</p>
      <div className="stacker__shaft">
        {/* Guides from the top block's edges: line the moving block up with these. */}
        {!over && <div className="stacker__guide" style={{ left: pct(top.x), width: pct(top.w) }} />}
        {!over && <div className="stacker__block is-moving" style={{ left: pct(x), width: pct(top.w), bottom: `${(shown.length / (VISIBLE + 1)) * 100}%` }} />}
        {shown.map((l, i) => (
          <div key={tower.length - shown.length + i} className={`stacker__block ${l.perfect ? "is-perfect" : ""}`} style={{ left: pct(l.x), width: pct(l.w), bottom: `${(i / (VISIBLE + 1)) * 100}%` }} />
        ))}
      </div>
      <p className="muted">{over ? "Missed! Tower finished." : "Tap anywhere to drop"}</p>
    </div>
  );
}

export const stackerGame = defineGame<StackPuzzle>({
  id: "stacker",
  name: "Stacker",
  emoji: "🏗",
  instructions: "A block slides back and forth. Tap to drop it on the tower; whatever hangs over the edge is cut off. Miss completely and your tower is done. Tallest tower wins.",
  keyHint: "Space to drop",
  durationMs: 60_000,
  better: "higher",
  formatScore: (n) => `${n} high`,
  formatMargin: (d) => `${d} higher`,
  createPuzzle: createStackPuzzle,
  Component: Stacker,
});
