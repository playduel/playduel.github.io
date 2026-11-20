import { useRef, useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useKeys, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { FAIL_GUESSES, type FivePuzzle, GUESSES, MAX_GUESSES, type Mark, createFivePuzzle, decodeScore, encodeScore, score } from "./puzzle";
import "./style.css";

const LIMIT_MS = 120_000;
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const RANK: Record<Mark, number> = { miss: 0, near: 1, hit: 2 };

function FiveLetters({ puzzle, onFinish, onProgress }: GameProps<FivePuzzle>) {
  const finish = useFinishOnce(onFinish);
  const [guesses, setGuesses] = useState<string[]>([puzzle.opener]);
  const [draft, setDraft] = useState("");
  const [shake, setShake] = useState(0);
  const [note, setNote] = useState("");
  const started = useRef(performance.now());
  const elapsed = () => performance.now() - started.current;
  const solved = guesses.includes(puzzle.answer);
  useTimeUp(LIMIT_MS, () => finish(encodeScore(FAIL_GUESSES, LIMIT_MS)));

  const best = Math.max(...guesses.map((g) => score(g, puzzle.answer).filter((m) => m === "hit").length));
  useReportProgress(onProgress, {
    fraction: solved ? 1 : guesses.length / (MAX_GUESSES + 1),
    headline: String(guesses.length),
    unit: guesses.length === 1 ? "guess" : "guesses",
    detail: solved ? "Solved" : `Best row: ${best} green`,
  });

  // Best mark seen for each letter, to colour the keyboard.
  const keyMarks: Record<string, Mark> = {};
  for (const g of guesses)
    score(g, puzzle.answer).forEach((m, i) => {
      const ch = g[i]!;
      if (!keyMarks[ch] || RANK[m] > RANK[keyMarks[ch]!]) keyMarks[ch] = m;
    });

  const submit = () => {
    if (draft.length < 5) return;
    if (guesses.includes(draft)) {
      sfx("wrong");
      setNote("Already guessed");
      setShake((s) => s + 1);
      return;
    }
    if (!GUESSES.has(draft)) {
      sfx("wrong");
      setNote("Not in the word list");
      setShake((s) => s + 1);
      return;
    }
    const next = [...guesses, draft];
    setGuesses(next);
    setDraft("");
    setNote("");
    if (draft === puzzle.answer) {
      sfx("correct", 4);
      setTimeout(() => finish(encodeScore(next.length, elapsed())), 900);
    } else if (next.length >= MAX_GUESSES) {
      sfx("roundLose");
      setNote(`The word was ${puzzle.answer.toUpperCase()}`);
      setTimeout(() => finish(encodeScore(FAIL_GUESSES, elapsed())), 1600);
    } else sfx("tap");
  };

  const type = (k: string) => {
    if (solved || guesses.length >= MAX_GUESSES) return;
    if (k === "enter") return submit();
    if (k === "back") return setDraft((d) => d.slice(0, -1));
    if (draft.length < 5) {
      sfx("key");
      setDraft(draft + k);
    }
  };

  useKeys((e) => {
    const k = e.key.toLowerCase();
    if (k === "enter") type("enter");
    else if (k === "backspace") type("back");
    else if (/^[a-z]$/.test(k)) type(k);
    else return;
    e.preventDefault();
  });

  const rows = Array.from({ length: MAX_GUESSES }, (_, r) => {
    if (r < guesses.length) return { word: guesses[r]!, marks: score(guesses[r]!, puzzle.answer) };
    if (r === guesses.length) return { word: draft, marks: null };
    return { word: "", marks: null };
  });

  return (
    <div className="five">
      <p className="five__note" key={note}>{note || (guesses.length === 1 ? "Your first guess is picked for you" : " ")}</p>
      <div className="five__grid" data-testid="five-grid">
        {rows.map((row, r) => (
          <div key={r === guesses.length ? `${r}-${shake}` : r} className={`five__row ${r === guesses.length ? "is-current" : ""} ${r === guesses.length && shake ? "shake" : ""}`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`five__cell ${row.marks ? `is-${row.marks[i]}` : row.word[i] ? (keyMarks[row.word[i]!] === "miss" ? "is-typed is-dead" : "is-typed") : ""}`} style={row.marks ? { animationDelay: `${i * 0.08}s` } : undefined}>
                {row.word[i] ?? ""}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="five__keys">
        {ROWS.map((row, i) => (
          <div key={row} className="five__keyrow">
            {i === 2 && <button className="five__key five__key--wide" onPointerDown={(e) => { e.preventDefault(); type("enter"); }}>Enter</button>}
            {[...row].map((k) => (
              <button key={k} className={`five__key ${keyMarks[k] ? `is-${keyMarks[k]}` : ""}`} onPointerDown={(e) => { e.preventDefault(); type(k); }}>
                {k}
              </button>
            ))}
            {i === 2 && <button className="five__key five__key--wide" onPointerDown={(e) => { e.preventDefault(); type("back"); }} aria-label="Delete">⌫</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

export const fiveLettersGame = defineGame<FivePuzzle>({
  id: "five",
  name: "Five Letters",
  emoji: "🟩",
  instructions: "Find the hidden 5-letter word in 6 guesses. Green: right letter, right spot. Yellow: in the word, wrong spot. You both start with the same first guess. Fewest guesses wins; time breaks ties.",
  keyHint: "Type a word, Enter to guess",
  durationMs: LIMIT_MS,
  better: "lower",
  formatScore: (n) => {
    const { guesses, ms } = decodeScore(n);
    return guesses >= FAIL_GUESSES ? "Not solved" : `${guesses}/6 in ${(ms / 1000).toFixed(0)} s`;
  },
  formatMargin: (d) => (d >= 1_000_000 ? `${Math.floor(d / 1_000_000)} fewer guess${d >= 2_000_000 ? "es" : ""}` : `${(d / 1000).toFixed(1)} s faster`),
  createPuzzle: createFivePuzzle,
  Component: FiveLetters,
});
