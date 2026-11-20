import { useEffect, useRef, useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useKeys, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { HOLES, LIMIT_MS, type Mole, POINTS, createWhackPuzzle, moleAt } from "./puzzle";
import "./style.css";

/** Keys laid out like the holes: Q W E / A S D / Z X C, or the number pad. */
const KEY_HOLE: Record<string, number> = { q: 0, w: 1, e: 2, a: 3, s: 4, d: 5, z: 6, x: 7, c: 8, "7": 0, "8": 1, "9": 2, "4": 3, "5": 4, "6": 5, "1": 6, "2": 7, "3": 8 };
const HOLE_KEY = ["Q", "W", "E", "A", "S", "D", "Z", "X", "C"];

function WhackAMole({ puzzle, onFinish, onProgress }: GameProps<Mole[]>) {
  const finish = useFinishOnce(onFinish);
  const start = useRef(performance.now());
  const [t, setT] = useState(0);
  const [hit, setHit] = useState<Set<number>>(new Set());
  const [points, setPoints] = useState(0);
  const [misses, setMisses] = useState(0);
  /** Last thing that happened in each hole, for the bonk / miss animation. */
  const [fx, setFx] = useState<Record<number, { id: number; kind: "bonk" | "gold" | "miss" }>>({});
  const pts = useRef(0);
  useTimeUp(LIMIT_MS, () => finish(pts.current));

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setT(performance.now() - start.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useReportProgress(onProgress, {
    fraction: Math.max(0, Math.min(1, points / 40)),
    headline: String(points),
    unit: "pts",
    detail: misses ? `${hit.size} hits, ${misses} misses` : `${hit.size} hits`,
  });

  const whack = (hole: number) => {
    const now = performance.now() - start.current;
    const i = moleAt(puzzle, hole, now, hit);
    let gain: number;
    if (i === null) {
      gain = POINTS.miss;
      setMisses((m) => m + 1);
      sfx("wrong");
      setFx((f) => ({ ...f, [hole]: { id: now, kind: "miss" } }));
    } else {
      const gold = puzzle[i]!.gold;
      gain = gold ? POINTS.gold : POINTS.mole;
      setHit((h) => new Set(h).add(i));
      sfx(gold ? "correct" : "pop", gold ? 3 : 1);
      setFx((f) => ({ ...f, [hole]: { id: now, kind: gold ? "gold" : "bonk" } }));
    }
    pts.current = Math.max(0, pts.current + gain);
    setPoints(pts.current);
  };

  useKeys((e) => {
    const h = KEY_HOLE[e.key.toLowerCase()];
    if (h === undefined) return;
    e.preventDefault();
    whack(h);
  });

  return (
    <div className="whack">
      <p className="whack__score"><b key={points}>{points}</b> pts</p>
      <div className="whack__grid" data-testid="whack-grid">
        {Array.from({ length: HOLES }, (_, h) => {
          const i = moleAt(puzzle, h, t, hit);
          const m = i === null ? null : puzzle[i]!;
          // Moles rise for their first 120 ms and sink for their last 120 ms.
          const rise = m ? Math.min(1, (t - m.at) / 120, (m.at + m.up - t) / 120) : 0;
          const f = fx[h];
          return (
            <button key={h} className="whack__hole" onPointerDown={(e) => { e.preventDefault(); whack(h); }} data-testid={`hole-${h}`} data-up={m ? (m.gold ? "gold" : "mole") : undefined} aria-label={`Hole ${h + 1}`}>
              <span className="whack__pit" />
              {m && <span className={`whack__mole ${m.gold ? "is-gold" : ""}`} style={{ transform: `translateY(${(1 - rise) * 100}%)` }} />}
              {f && t - f.id < 400 && <span key={f.id} className={`whack__fx is-${f.kind}`}>{f.kind === "miss" ? POINTS.miss : f.kind === "gold" ? `+${POINTS.gold}` : `+${POINTS.mole}`}</span>}
              <span className="kbd-hint whack__key">{HOLE_KEY[h]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const whackGame = defineGame<Mole[]>({
  id: "whack",
  name: "Whack-a-Mole",
  emoji: "🔨",
  instructions: "Moles pop up from the holes. Bonk them before they duck back down: +1, gold moles +3. Hitting an empty hole costs a point. Same moles at the same moments for both of you. 30 seconds.",
  keyHint: "Q W E / A S D / Z X C, or the number pad",
  durationMs: LIMIT_MS,
  better: "higher",
  formatScore: (n) => `${n} pts`,
  formatMargin: (d) => `${d} pts ahead`,
  createPuzzle: createWhackPuzzle,
  Component: WhackAMole,
});
