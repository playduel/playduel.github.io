import { useRef, useState } from "react";
import { sfx } from "../../audio/sfx";
import { DICT } from "../anagrams/puzzle";
import { useFinishOnce, useKeys, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { type GridPuzzle, POINTS, createGridPuzzle, isPath, neighbours, pathFor } from "./puzzle";
import "./style.css";

function WordGrid({ puzzle, onFinish, onProgress }: GameProps<GridPuzzle>) {
  const finish = useFinishOnce(onFinish);
  const [path, setPath] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [points, setPoints] = useState(0);
  const [typed, setTyped] = useState("");
  const [flash, setFlash] = useState<{ id: number; text: string; good: boolean } | null>(null);
  const dragging = useRef(false);
  useTimeUp(wordGridGame.durationMs, () => finish(points));

  useReportProgress(onProgress, {
    fraction: Math.min(1, points / 8000),
    headline: String(points),
    unit: "pts",
    detail: `${found.length} word${found.length === 1 ? "" : "s"}`,
  });

  const word = path.map((i) => puzzle.letters[i]).join("");
  const submit = (w: string, p: number[]) => {
    setPath([]);
    setTyped("");
    if (w.length < 3) return;
    const say = (text: string, good: boolean) => setFlash({ id: Date.now(), text, good });
    if (!isPath(p)) return say("Letters must touch", false);
    if (found.includes(w)) return sfx("wrong"), say("Already found", false);
    if (!DICT.has(w)) return sfx("wrong"), say("Not a word", false);
    const pts = POINTS[w.length]!;
    sfx("correct", w.length - 2);
    setFound([w, ...found]);
    setPoints(points + pts);
    say(`${w.toUpperCase()} +${pts}`, true);
  };

  // Drag across letters. Hit-testing uses the cell's inner circle so diagonals are easy.
  const cellAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const hit = el?.closest<HTMLElement>("[data-cell]");
    return hit ? Number(hit.dataset.cell) : null;
  };
  const extend = (i: number | null) => {
    if (i === null) return;
    setPath((p) => {
      if (p.includes(i)) return p.length > 1 && p[p.length - 2] === i ? p.slice(0, -1) : p; // back up
      if (p.length && !neighbours(p[p.length - 1]!).includes(i)) return p;
      sfx("key");
      return [...p, i];
    });
  };

  useKeys((e) => {
    const k = e.key.toLowerCase();
    if (k === "enter") {
      const p = pathFor(puzzle.letters, typed);
      submit(typed, p ?? []);
    } else if (k === "backspace") setTyped((t) => t.slice(0, -1));
    else if (/^[a-z]$/.test(k) && typed.length < 6) setTyped(typed + k);
    else return;
    e.preventDefault();
  });

  const highlight = typed ? pathFor(puzzle.letters, typed) ?? [] : path;
  return (
    <div className="wordgrid">
      <div className="wordgrid__top">
        <span className="wordgrid__points" key={points}>{points}</span>
        <span>pts, {found.length} words</span>
      </div>
      <div className="wordgrid__word">
        {(typed || word).toUpperCase() || " "}
        {flash && <span key={flash.id} className={flash.good ? "anagrams__flash is-good" : "anagrams__flash is-bad"}>{flash.text}</span>}
      </div>
      <div
        className="wordgrid__grid"
        data-testid="wordgrid"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
          extend(cellAt(e.clientX, e.clientY));
        }}
        onPointerMove={(e) => dragging.current && extend(cellAt(e.clientX, e.clientY))}
        onPointerUp={() => {
          dragging.current = false;
          submit(word, path);
        }}
        onPointerLeave={() => {
          if (dragging.current) submit(word, path);
          dragging.current = false;
        }}
      >
        {puzzle.letters.map((l, i) => (
          <div key={i} className={`wordgrid__cell ${highlight.includes(i) ? "is-on" : ""}`} data-letter={l}>
            <span className="wordgrid__hit" data-cell={i}>{l}</span>
          </div>
        ))}
      </div>
      <ul className="anagrams__found" aria-label="Words found">
        {found.map((w) => <li key={w} className={`len-${w.length}`}>{w}<small>{POINTS[w.length]}</small></li>)}
      </ul>
    </div>
  );
}

export const wordGridGame = defineGame<GridPuzzle>({
  id: "wordgrid",
  name: "Word Grid",
  emoji: "🔠",
  instructions: "Drag across touching letters (sideways and diagonally too) to make words. Each letter once per word. Longer words score more: 3 letters 100, 4 letters 400, 5 letters 800, 6 letters 1400.",
  keyHint: "Or type a word and press Enter",
  durationMs: 60_000,
  better: "higher",
  formatScore: (n) => `${n} pts`,
  formatMargin: (d) => `${d} pts ahead`,
  createPuzzle: createGridPuzzle,
  Component: WordGrid,
});
