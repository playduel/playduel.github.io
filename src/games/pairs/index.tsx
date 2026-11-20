import { useRef, useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { PAIRS, type PairsPuzzle, createPairsPuzzle, timeoutScore } from "./puzzle";
import "./style.css";

const LIMIT_MS = 60_000;

function PairFlip({ puzzle, onFinish, onProgress }: GameProps<PairsPuzzle>) {
  const finish = useFinishOnce(onFinish);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const busy = useRef(false);
  const started = useRef(performance.now());
  const pairsDone = matched.size / 2;
  useTimeUp(LIMIT_MS, () => finish(timeoutScore(LIMIT_MS, PAIRS - pairsDone)));

  useReportProgress(onProgress, {
    fraction: pairsDone / PAIRS,
    headline: String(pairsDone),
    unit: `of ${PAIRS} pairs`,
    detail: `${moves} flips`,
  });

  const flip = (i: number) => {
    if (busy.current || open.includes(i) || matched.has(i)) return;
    sfx("key");
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next as [number, number];
    if (puzzle.cards[a] === puzzle.cards[b]) {
      sfx("correct", 2);
      const m = new Set(matched).add(a).add(b);
      setMatched(m);
      setOpen([]);
      if (m.size === puzzle.cards.length) finish(Math.round(performance.now() - started.current));
    } else {
      busy.current = true;
      setTimeout(() => {
        sfx("wrong");
        setOpen([]);
        busy.current = false;
      }, 650);
    }
  };

  return (
    <div className="pairs">
      <p className="pairs__status">{pairsDone} of {PAIRS} pairs, {moves} flips</p>
      <div className="pairs__grid" data-testid="pairs-grid">
        {puzzle.cards.map((c, i) => {
          const up = open.includes(i) || matched.has(i);
          return (
            <button
              key={i}
              className={`pairs__card ${up ? "is-up" : ""} ${matched.has(i) ? "is-matched" : ""}`}
              onPointerDown={(e) => { e.preventDefault(); flip(i); }}
              aria-label={up ? c : "Hidden card"}
              data-testid={`pair-${i}`}
              data-symbol={c}
            >
              <span className="pairs__face">{up ? c : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const pairFlipGame = defineGame<PairsPuzzle>({
  id: "pairs",
  name: "Pair Flip",
  emoji: "🃏",
  instructions: "Flip two cards at a time to find the 8 matching pairs. Fastest to clear the board wins.",
  keyHint: "Click the cards",
  durationMs: LIMIT_MS,
  better: "lower",
  formatScore: (n) => `${(n / 1000).toFixed(1)} s`,
  formatMargin: (d) => `${(d / 1000).toFixed(1)} s faster`,
  createPuzzle: createPairsPuzzle,
  Component: PairFlip,
});
