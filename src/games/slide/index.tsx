import { useRef, useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useKeys, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { SIZE, type SlidePuzzle, createSlidePuzzle, isSolved, misplaced, slide } from "./puzzle";
import "./style.css";

const LIMIT_MS = 90_000;
const PER_MISPLACED_MS = 5000;

function SlidingTiles({ puzzle, onFinish, onProgress }: GameProps<SlidePuzzle>) {
  const finish = useFinishOnce(onFinish);
  const [tiles, setTiles] = useState(puzzle.tiles);
  const [moves, setMoves] = useState(0);
  const started = useRef(performance.now());
  useTimeUp(LIMIT_MS, () => finish(LIMIT_MS + misplaced(tiles) * PER_MISPLACED_MS));

  const placed = 8 - misplaced(tiles);
  useReportProgress(onProgress, { fraction: placed / 8, headline: String(placed), unit: "of 8 in place", detail: `${moves} moves` });

  const move = (i: number) => {
    const next = slide(tiles, i);
    if (!next) return sfx("wrong");
    sfx("key");
    setTiles(next);
    setMoves((m) => m + 1);
    if (isSolved(next)) {
      sfx("correct", 4);
      finish(Math.round(performance.now() - started.current));
    }
  };

  // Arrow keys move the tile that is on that side of the gap, into it.
  useKeys((e) => {
    const gap = tiles.indexOf(0);
    const r = Math.floor(gap / SIZE), c = gap % SIZE;
    const from: Record<string, [number, number]> = { ArrowUp: [r + 1, c], ArrowDown: [r - 1, c], ArrowLeft: [r, c + 1], ArrowRight: [r, c - 1] };
    const t = from[e.key];
    if (!t) return;
    e.preventDefault();
    const [y, x] = t;
    if (y >= 0 && y < SIZE && x >= 0 && x < SIZE) move(y * SIZE + x);
  });

  return (
    <div className="slide">
      <p className="slide__status">{placed} of 8 in place, {moves} moves</p>
      <div className="slide__board" data-testid="slide-board">
        {tiles.map((t, i) =>
          t === 0 ? <span key="gap" className="slide__gap" /> : (
            <button
              key={t}
              className={`slide__tile ${t === i + 1 ? "is-home" : ""}`}
              style={{ gridRow: Math.floor(i / SIZE) + 1, gridColumn: (i % SIZE) + 1 }}
              onPointerDown={(e) => { e.preventDefault(); move(i); }}
              data-testid={`slide-${t}`}
            >
              {t}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

export const slidingTilesGame = defineGame<SlidePuzzle>({
  id: "slide",
  name: "Sliding Tiles",
  emoji: "🧩",
  instructions: "Slide the tiles into order, 1 to 8, with the gap last. Tap a tile next to the gap to move it. Fastest wins.",
  keyHint: "Arrow keys slide a tile into the gap",
  durationMs: LIMIT_MS,
  better: "lower",
  formatScore: (n) => `${(n / 1000).toFixed(1)} s`,
  formatMargin: (d) => `${(d / 1000).toFixed(1)} s faster`,
  createPuzzle: createSlidePuzzle,
  Component: SlidingTiles,
});
