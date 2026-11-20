import { useEffect, useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useKeys, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { type CountPuzzle, FLASH_MS, ROUNDS, createCountPuzzle, totalError } from "./puzzle";
import "./style.css";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "OK"];

function CountFlash({ puzzle, onFinish, onProgress }: GameProps<CountPuzzle>) {
  const finish = useFinishOnce(onFinish);
  const [round, setRound] = useState(0);
  const [stage, setStage] = useState<"ready" | "flash" | "answer" | "reveal">("ready");
  const [input, setInput] = useState("");
  const [guesses, setGuesses] = useState<number[]>([]);
  const dots = puzzle.rounds[round]!;
  useTimeUp(countFlashGame.durationMs, () => finish(totalError(puzzle.rounds, guesses)));

  const err = totalError(puzzle.rounds.slice(0, guesses.length), guesses);
  useReportProgress(onProgress, {
    fraction: guesses.length / ROUNDS,
    headline: String(err),
    unit: "off total",
    detail: `Round ${Math.min(guesses.length + 1, ROUNDS)} of ${ROUNDS}`,
  });

  useEffect(() => {
    const ms = stage === "ready" ? 900 : stage === "flash" ? FLASH_MS : stage === "reveal" ? 1300 : 0;
    if (!ms) return;
    const id = setTimeout(() => {
      if (stage === "ready") setStage("flash");
      else if (stage === "flash") setStage("answer");
      else if (stage === "reveal") {
        if (guesses.length === ROUNDS) finish(totalError(puzzle.rounds, guesses));
        else {
          setRound((r) => r + 1);
          setInput("");
          setStage("ready");
        }
      }
    }, ms);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const press = (k: string) => {
    if (stage !== "answer") return;
    if (k === "⌫") return setInput((s) => s.slice(0, -1));
    if (k === "OK") {
      if (!input) return;
      const g = Number(input);
      const off = Math.abs(g - dots.length);
      sfx(off === 0 ? "correct" : off <= 2 ? "tap" : "wrong", 3);
      setGuesses([...guesses, g]);
      setStage("reveal");
      return;
    }
    sfx("key");
    setInput((s) => (s.length < 2 ? s + k : s));
  };

  useKeys((e) => {
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === "Backspace") press("⌫");
    else if (e.key === "Enter") press("OK");
    else return;
    e.preventDefault();
  });

  const last = guesses[round];
  return (
    <div className="countflash">
      <div className="countflash__field" data-testid="countflash-field">
        {(stage === "flash" || stage === "reveal") && (
          <svg viewBox="0 0 100 100" className={stage === "reveal" ? "is-reveal" : ""}>
            {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} />)}
          </svg>
        )}
        {stage === "ready" && <p className="countflash__msg">Round {round + 1} of {ROUNDS}. Get ready…</p>}
        {stage === "answer" && <p className="countflash__msg">How many dots?</p>}
        {stage === "reveal" && (
          <p className="countflash__answer">
            {dots.length} dots, you said {last}
            {last === dots.length ? " Perfect!" : ` (${Math.abs(last! - dots.length)} ${last! > dots.length ? "over" : "under"})`}
          </p>
        )}
      </div>
      <div className="countflash__input" data-testid="countflash-input">{input || "?"}</div>
      <div className="countflash__history">
        {Array.from({ length: ROUNDS }, (_, i) => {
          const g = guesses[i];
          if (g === undefined) return <span key={i}>·</span>;
          const d = g - puzzle.rounds[i]!.length;
          return <span key={i} className={d === 0 ? "is-perfect" : "is-done"}>{d === 0 ? "✓" : `${d > 0 ? "+" : ""}${d}`}</span>;
        })}
      </div>
      <div className="numpad">
        {KEYS.map((k) => (
          <button key={k} className="numpad__key" disabled={stage !== "answer"} onPointerDown={(e) => { e.preventDefault(); press(k); }} data-testid={`count-key-${k}`}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

export const countFlashGame = defineGame<CountPuzzle>({
  id: "countflash",
  name: "Count Flash",
  emoji: "✨",
  instructions: "A cloud of dots flashes for one second. How many were there? 5 rounds, each a bit harder. Closest total wins.",
  keyHint: "Number keys, Enter to answer",
  durationMs: 45_000,
  better: "lower",
  formatScore: (n) => `${n} off`,
  formatMargin: (d) => `${d} closer`,
  createPuzzle: createCountPuzzle,
  Component: CountFlash,
});
