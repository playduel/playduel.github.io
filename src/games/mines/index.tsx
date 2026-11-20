import { useRef, useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { H, MINES, MINE_PENALTY_MS, type MinesPuzzle, W, createMinesPuzzle, open, safeLeft } from "./puzzle";
import "./style.css";

const LIMIT_MS = 120_000;
const LONG_PRESS_MS = 380;

function MinesweeperRace({ puzzle, onFinish, onProgress }: GameProps<MinesPuzzle>) {
  const finish = useFinishOnce(onFinish);
  const [revealed, setRevealed] = useState(() => open(puzzle, new Array(W * H).fill(false), puzzle.start));
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [hits, setHits] = useState(0);
  const [flagMode, setFlagMode] = useState(false);
  const started = useRef(performance.now());
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const total = W * H - MINES;
  const left = safeLeft(puzzle, revealed);
  useTimeUp(LIMIT_MS, () => finish(LIMIT_MS + hits * MINE_PENALTY_MS + left * 2000));

  useReportProgress(onProgress, {
    fraction: 1 - left / total,
    headline: String(left),
    unit: "safe cells left",
    detail: hits ? `${hits} mine${hits > 1 ? "s" : ""} hit (+${hits * 10}s)` : "No mines hit",
  });

  const toggleFlag = (i: number) => {
    if (revealed[i]) return;
    sfx("key");
    const f = new Set(flags);
    if (f.has(i)) f.delete(i);
    else f.add(i);
    setFlags(f);
  };

  const dig = (i: number) => {
    if (revealed[i] || flags.has(i)) return;
    const next = open(puzzle, revealed, i);
    let h = hits;
    if (puzzle.mines[i]) {
      h++;
      setHits(h);
      sfx("error");
    } else sfx(puzzle.counts[i] === 0 ? "pop" : "key");
    setRevealed(next);
    if (safeLeft(puzzle, next) === 0) {
      sfx("correct", 4);
      finish(Math.round(performance.now() - started.current) + h * MINE_PENALTY_MS);
    }
  };

  const down = (i: number) => {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      toggleFlag(i);
    }, LONG_PRESS_MS);
  };
  const up = (i: number) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (longPressed.current) return;
    if (flagMode) toggleFlag(i);
    else dig(i);
  };

  return (
    <div className="mines">
      <div className="mines__bar">
        <span>{left} safe left</span>
        <span>{flags.size}/{MINES} flags</span>
        <button className={flagMode ? "toggle is-on" : "toggle"} onClick={() => setFlagMode(!flagMode)} aria-pressed={flagMode}>Flag</button>
      </div>
      <div className="mines__grid" data-testid="mines-grid" onContextMenu={(e) => e.preventDefault()}>
        {puzzle.mines.map((mine, i) => {
          const r = revealed[i];
          const label = r ? (mine ? "✹" : puzzle.counts[i] || "") : flags.has(i) ? "⚑" : "";
          return (
            <button
              key={i}
              className={`mines__cell ${r ? "is-open" : ""} ${r && mine ? "is-mine" : ""} n${r && !mine ? puzzle.counts[i] : ""}`}
              onPointerDown={(e) => { if (e.button === 0) down(i); }}
              onPointerUp={(e) => { if (e.button === 0) up(i); }}
              onPointerLeave={() => pressTimer.current && clearTimeout(pressTimer.current)}
              onContextMenu={(e) => { e.preventDefault(); toggleFlag(i); }}
              data-testid={`mine-${i}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="muted">Hold or right-click to flag. A mine costs 10 seconds.</p>
    </div>
  );
}

export const minesGame = defineGame<MinesPuzzle>({
  id: "mines",
  name: "Minesweeper Race",
  emoji: "💣",
  instructions: "Open every safe square. Numbers say how many mines touch that square. Hitting a mine adds 10 seconds but you keep going. Fastest clear wins.",
  keyHint: "Click to open, right-click to flag",
  durationMs: LIMIT_MS,
  better: "lower",
  formatScore: (n) => `${(n / 1000).toFixed(1)} s`,
  formatMargin: (d) => `${(d / 1000).toFixed(1)} s faster`,
  createPuzzle: createMinesPuzzle,
  Component: MinesweeperRace,
});
