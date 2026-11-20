import { useEffect, useRef, useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { type TypingPuzzle, createTypingPuzzle, typingScore } from "./puzzle";
import "./style.css";

/**
 * Strict mode: a wrong key doesn't move you forward, it just counts as a
 * mistake. The input box only ever holds the correct prefix, which also
 * makes phone keyboards (no reliable keydown events) work the same way.
 */
function TypingRace({ puzzle, onFinish, onProgress }: GameProps<TypingPuzzle>) {
  const finish = useFinishOnce(onFinish);
  const [typed, setTyped] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [bad, setBad] = useState(0);
  const start = useRef<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const elapsed = () => (start.current === null ? 0 : performance.now() - start.current);
  useTimeUp(typingGame.durationMs, () => finish(typingScore(typed, mistakes, elapsed() || 1)));
  useEffect(() => input.current?.focus(), []);

  const wpm = typingScore(typed, mistakes, elapsed());
  useReportProgress(onProgress, {
    fraction: typed / puzzle.text.length,
    headline: String(Math.round((typed / puzzle.text.length) * 100)),
    unit: "% typed",
    detail: mistakes ? `${mistakes} mistakes` : "No mistakes",
  });

  const onChange = (value: string) => {
    if (value.length <= typed) return; // deletes do nothing: you only keep correct text
    if (start.current === null) start.current = performance.now();
    let n = typed;
    let errs = 0;
    for (const ch of value.slice(typed)) {
      if (ch === puzzle.text[n]) n++;
      else errs++;
    }
    if (errs) {
      sfx("wrong");
      setMistakes((m) => m + errs);
      setBad((b) => b + 1);
    } else sfx("key");
    setTyped(n);
    if (n === puzzle.text.length) finish(typingScore(n, mistakes + errs, elapsed()));
  };

  const done = puzzle.text.slice(0, typed);
  const next = puzzle.text[typed] ?? "";
  const rest = puzzle.text.slice(typed + 1);
  return (
    <div className="typing" onPointerDown={() => input.current?.focus()}>
      <div className="typing__stats">
        <span>{wpm} wpm</span>
        <span>{mistakes} mistakes</span>
      </div>
      <p className="typing__text" data-testid="typing-text">
        <span className="typing__done">{done}</span>
        <span className={bad ? "typing__next is-bad" : "typing__next"} key={bad}>{next === " " ? "␣" : next}</span>
        <span className="typing__rest">{rest}</span>
      </p>
      <input
        ref={input}
        className="typing__input"
        value={done}
        onChange={(e) => onChange(e.target.value)}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        aria-label="Type the text here"
        data-testid="typing-input"
      />
      <p className="muted">Tap here and type. Wrong keys don't move you forward.</p>
    </div>
  );
}

export const typingGame = defineGame<TypingPuzzle>({
  id: "typing",
  name: "Typing Race",
  emoji: "⌨",
  instructions: "Type the text as fast as you can. A wrong key counts as a mistake and you stay on that letter. Score is words per minute, cut by mistakes.",
  keyHint: "Just type",
  durationMs: 60_000,
  better: "higher",
  formatScore: (n) => `${n} wpm`,
  formatMargin: (d) => `${d} wpm faster`,
  createPuzzle: createTypingPuzzle,
  Component: TypingRace,
});
