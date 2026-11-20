import { useEffect, useRef, useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useKeys, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { BASKET, LIMIT_MS, SWISH, type Shot, createHoopsPuzzle, meterAt, shoot } from "./puzzle";
import "./style.css";

const FLIGHT_MS = 650;
type Flight = { at: number; points: number; v: number };

/**
 * Ball position during a shot. The first 75% is a lob (quadratic curve) up
 * to the rim; a made shot then drops through the net, a miss clanks off the
 * near side of the rim and falls away.
 */
function ballAt(f: Flight, ms: number) {
  const k = Math.min(1, ms / FLIGHT_MS);
  const rimX = f.points > 0 ? 50 : f.v < 50 ? 41 : 59; // under-hit clanks the front, over-hit the back
  if (k < 0.75) {
    const u = k / 0.75;
    const x = 50 + (rimX - 50) * u;
    const y = (1 - u) ** 2 * 122 + 2 * u * (1 - u) * -12 + u * u * 38;
    return { x, y, s: 1 - 0.35 * u };
  }
  const u = (k - 0.75) / 0.25;
  if (f.points > 0) return { x: 50, y: 38 + 20 * u, s: 0.65 };
  const away = rimX < 50 ? -1 : 1;
  return { x: rimX + away * 22 * u, y: 38 - 10 * u + 40 * u * u, s: 0.65 };
}

function HoopShot({ puzzle, onFinish, onProgress }: GameProps<Shot[]>) {
  const finish = useFinishOnce(onFinish);
  const [i, setI] = useState(0);
  const [points, setPoints] = useState(0);
  const [made, setMade] = useState(0);
  const [streak, setStreak] = useState(0);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [now, setNow] = useState(() => performance.now());
  const readyAt = useRef(performance.now());
  const pts = useRef(0);
  useTimeUp(LIMIT_MS, () => finish(pts.current));

  useEffect(() => {
    let raf = 0;
    const loop = () => { setNow(performance.now()); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Land the shot, then bring out the next ball.
  useEffect(() => {
    if (!flight) return;
    const id = setTimeout(() => {
      setFlight(null);
      setI((n) => Math.min(n + 1, puzzle.length - 1));
      readyAt.current = performance.now();
    }, FLIGHT_MS + 120);
    return () => clearTimeout(id);
  }, [flight, puzzle.length]);

  useReportProgress(onProgress, {
    fraction: Math.min(1, points / 50),
    headline: String(points),
    unit: "pts",
    detail: `${made} of ${i + (flight ? 1 : 0)} in`,
  });

  const shot = puzzle[i]!;
  const v = flight ? flight.v : meterAt(shot, now - readyAt.current);
  const fire = () => {
    if (flight) return;
    const at = performance.now();
    const val = meterAt(shot, at - readyAt.current);
    const p = shoot(shot, val);
    setFlight({ at, points: p, v: val });
    if (p) {
      pts.current += p;
      setPoints(pts.current);
      setMade((m) => m + 1);
      setStreak((s) => s + 1);
      setTimeout(() => sfx(p === SWISH ? "correct" : "tap", 3), FLIGHT_MS * 0.8);
    } else {
      setStreak(0);
      setTimeout(() => sfx("wrong"), FLIGHT_MS * 0.7);
    }
  };

  useKeys((e) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); fire(); }
  });

  const ball = flight ? ballAt(flight, now - flight.at) : { x: 50, y: 122, s: 1 };
  const lo = shot.center - shot.width / 2;
  const landed = flight && now - flight.at > FLIGHT_MS * 0.8;
  return (
    <div className="hoops" onPointerDown={(e) => { e.preventDefault(); fire(); }} data-testid="hoops">
      <p className="hoops__score"><b key={points}>{points}</b> pts{streak >= 3 && <span className="hoops__fire" key={streak}> {streak} in a row</span>}</p>
      <div className="hoops__court">
        <svg viewBox="0 0 100 140" className="hoops__svg">
          <rect x={28} y={8} width={44} height={30} rx={2} className="hoops__board" />
          <rect x={42} y={18} width={16} height={14} className="hoops__square" />
          <line x1={38} y1={40} x2={62} y2={40} className="hoops__rim" />
          <path d="M39 40 L43 56 L57 56 L61 40" className="hoops__net" />
          <circle cx={ball.x} cy={ball.y} r={7 * ball.s} className="hoops__ball" />
          {landed && <text x={50} y={74} className={`hoops__call ${flight.points ? "is-in" : "is-out"}`}>{flight.points === SWISH ? "SWISH +3" : flight.points === BASKET ? "+2" : "CLANK"}</text>}
        </svg>
        <div className="hoops__meter" aria-hidden="true">
          <i className="hoops__zone" style={{ bottom: `${lo}%`, height: `${shot.width}%` }} />
          <i className="hoops__sweet" style={{ bottom: `${shot.center - 3}%` }} />
          <i className="hoops__needle" style={{ bottom: `${v}%` }} />
        </div>
      </div>
      <p className="muted">Tap when the bar is in the green. Centre line = swish.</p>
    </div>
  );
}

export const hoopShotGame = defineGame<Shot[]>({
  id: "hoops",
  name: "Hoop Shot",
  emoji: "🏀",
  instructions: "Arcade basketball. A power bar sweeps up and down; tap when it's in the green zone to score 2, or right on the centre line for a 3-point swish. The zone shrinks and the bar speeds up. Same balls for both of you. 40 seconds.",
  keyHint: "Space to shoot",
  durationMs: LIMIT_MS,
  better: "higher",
  formatScore: (n) => `${n} pts`,
  formatMargin: (d) => `${d} pts ahead`,
  createPuzzle: createHoopsPuzzle,
  Component: HoopShot,
});
