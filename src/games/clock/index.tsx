import { useEffect, useRef, useState } from "react";
import { sfx } from "../../audio/sfx";
import { useFinishOnce, useKeys, useReportProgress, useTimeUp } from "../hooks";
import { type GameProps, defineGame } from "../types";
import { type ClockPuzzle, TRIES, VISIBLE_MS, averageOff, createClockPuzzle, offBy } from "./puzzle";
import "./style.css";

type Stage = "ready" | "running" | "result";
const GIVE_UP_AFTER_MS = 4000;

function StopTheClock({ puzzle, onFinish, onProgress }: GameProps<ClockPuzzle>) {
  const finish = useFinishOnce(onFinish);
  const [tryIndex, setTryIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("ready");
  const [offs, setOffs] = useState<number[]>([]);
  const [shown, setShown] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  const startedAt = useRef(0);
  const target = puzzle.targetsMs[tryIndex]!;
  useTimeUp(stopTheClockGame.durationMs, () => finish(averageOff([...offs, ...puzzle.targetsMs.slice(offs.length)])));

  useReportProgress(onProgress, {
    fraction: offs.length / TRIES,
    headline: offs.length ? String(averageOff(offs)) : "-",
    unit: "ms off avg",
    detail: offs.length === TRIES ? "All tries done" : `Try ${offs.length + 1} of ${TRIES}`,
  });

  // While running: tick the display, hide it after 2 s, give up if way past.
  useEffect(() => {
    if (stage !== "running") return;
    let raf = 0;
    const loop = () => {
      const t = performance.now() - startedAt.current;
      setShown(t);
      if (t > target + GIVE_UP_AFTER_MS) return stop(null);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, target]);

  const stop = (stoppedMs: number | null) => {
    const off = offBy(target, stoppedMs);
    sfx(off < 100 ? "correct" : off < 400 ? "tap" : "wrong", off < 50 ? 3 : 1);
    setLast(stoppedMs);
    const next = [...offs, off];
    setOffs(next);
    setStage("result");
    setTimeout(() => {
      if (next.length === TRIES) finish(averageOff(next));
      else {
        setTryIndex((i) => i + 1);
        setStage("ready");
      }
    }, 1400);
  };

  const press = (timeStamp: number) => {
    if (stage === "ready") {
      startedAt.current = timeStamp;
      setShown(0);
      setStage("running");
      sfx("select");
    } else if (stage === "running") stop(timeStamp - startedAt.current);
  };

  useKeys((e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      press(e.timeStamp);
    }
  });

  const hidden = stage === "running" && shown > VISIBLE_MS;
  const display = stage === "result" ? (last === null ? "--.---" : (last / 1000).toFixed(3)) : hidden ? "?.???" : (shown / 1000).toFixed(3);

  return (
    <div className="stopclock">
      <p className="stopclock__goal">Stop at exactly <b>{(target / 1000).toFixed(3)} s</b></p>
      <div className={`stopclock__face ${hidden ? "is-hidden" : ""}`} data-testid="stopclock-face">{display}</div>
      <p className="stopclock__result" key={`${tryIndex}${stage}`}>
        {stage === "result" ? `${offs.at(-1)} ms off` : stage === "running" ? (hidden ? "Count in your head…" : "Watch the start…") : `Try ${tryIndex + 1} of ${TRIES}`}
      </p>
      <button
        className={`stopclock__button stopclock__button--${stage}`}
        onPointerDown={(e) => { e.preventDefault(); press(e.timeStamp); }}
        disabled={stage === "result"}
        data-testid="stopclock-button"
      >
        {stage === "running" ? "Stop" : "Start"}
      </button>
    </div>
  );
}

export const stopTheClockGame = defineGame<ClockPuzzle>({
  id: "clock",
  name: "Stop the Clock",
  emoji: "⏱",
  instructions: "Start the clock, then stop it as close to the target time as you can. The clock hides after 2 seconds. 3 tries.",
  keyHint: "Space to start and stop",
  durationMs: 45_000,
  better: "lower",
  formatScore: (n) => `${n} ms off`,
  formatMargin: (d) => `${d} ms closer`,
  createPuzzle: createClockPuzzle,
  Component: StopTheClock,
});
