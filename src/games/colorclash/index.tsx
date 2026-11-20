import { useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useKeys, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { COLORS, type Card, type ColorName, clashScore, createClashPuzzle } from "./puzzle";
import "./style.css";

/** Keys 1-4 match the buttons left to right. */
const KEYS: Record<string, ColorName> = { "1": "red", "2": "blue", "3": "green", "4": "yellow" };

function ColorClash({ puzzle, onFinish, onProgress }: GameProps<Card[]>) {
  const finish = useFinishOnce(onFinish);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const score = clashScore(right, wrong);
  useTimeUp(colorClashGame.durationMs, () => finish(score));

  useReportProgress(onProgress, {
    fraction: Math.max(0, Math.min(1, score / 40)),
    headline: String(score),
    unit: "points",
    detail: wrong ? `${wrong} wrong` : "No mistakes",
  });

  const card = puzzle[i % puzzle.length]!;
  const answer = (c: ColorName) => {
    const ok = c === card.ink;
    sfx(ok ? "correct" : "wrong", 1);
    if (ok) setRight((n) => n + 1);
    else setWrong((n) => n + 1);
    setFlash(ok ? "good" : "bad");
    setI((n) => n + 1);
  };

  useKeys((e) => {
    const c = KEYS[e.key];
    if (c) {
      e.preventDefault();
      answer(c);
    }
  });

  return (
    <div className="clash">
      <p className="clash__rule">Tap the <b>ink colour</b>, not the word</p>
      <div className={`clash__card ${flash ? `is-${flash}` : ""}`} key={i} data-testid="clash-card" data-ink={card.ink}>
        <span className={`clash__word ink-${card.ink}`}>{card.word.toUpperCase()}</span>
      </div>
      <p className="clash__score">{score} points{wrong ? `, ${wrong} wrong` : ""}</p>
      <div className="clash__buttons">
        {COLORS.map((c, k) => (
          <button key={c} className={`clash__btn ink-bg-${c}`} onPointerDown={(e) => { e.preventDefault(); answer(c); }} data-testid={`clash-${c}`} aria-label={c}>
            <span className="kbd-hint">{k + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export const colorClashGame = defineGame<Card[]>({
  id: "colorclash",
  name: "Color Clash",
  emoji: "🎨",
  instructions: "A colour word appears in a different colour of ink. Tap the ink colour, not what the word says. 30 seconds. Wrong taps cost a point.",
  keyHint: "Keys 1 to 4 pick red, blue, green, yellow",
  durationMs: 30_000,
  better: "higher",
  formatScore: (n) => `${n} pts`,
  formatMargin: (d) => `${d} pts ahead`,
  createPuzzle: createClashPuzzle,
  Component: ColorClash,
});
