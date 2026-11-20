import { useState } from "react";
import { sfx } from "../audio/sfx";
import { randomSeed } from "../core/rng";
import { getGame } from "../games/registry";
import { GamePlayer } from "./GamePlayer";
import { QuitButton } from "./QuitButton";
import { earn } from "./profile";
import { Screen } from "./Menu";
import { TopList, useTopScores } from "./Records";
import { cpuRecords, records, saveResult } from "./results";
import { LivePlayer } from "./LivePlayer";
import { makeBot } from "../games/live/bots";
import { Legend } from "../games/live/LightCycles";
import { loadName } from "./hooks";

/**
 * Solo play of one game: warm-up, chase your personal best.
 * Layout: the game card (rules, last score, Play) and a side column with your
 * best, this session's tries and the world top 5. On phones they stack; on
 * desktop they sit side by side so a wide screen isn't one thin column.
 */
export function Practice({ gameId }: { gameId: string }) {
  const game = getGame(gameId);
  const name = loadName();
  const [seed, setSeed] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; isBest: boolean; previous?: number } | null>(null);
  /** Scores from this visit, newest first, so you can see yourself improving. */
  const [tries, setTries] = useState<number[]>([]);
  const best = records.bests(name)[gameId];
  const top = useTopScores(gameId, 5);

  if (game.live) return <CpuPractice gameId={gameId} />;

  if (seed !== null && result === null) {
    return (
      <div className="arena arena--solo">
        <main className="stage">
          <GamePlayer
            game={game}
            seed={seed}
            quit={<QuitButton warning="This run won't count." onQuit={() => setSeed(null)} />}
            onFinish={(score) => {
              const r = saveResult(gameId, score);
              sfx(r.isBest ? "ko" : "roundWin");
              if (r.isBest && r.previous !== undefined) earn("practiceRun", "newBest");
              else earn("practiceRun");
              setResult({ score, ...r });
              setTries((t) => [score, ...t].slice(0, 6));
            }}
          />
        </main>
      </div>
    );
  }

  const play = () => { sfx("select"); setResult(null); setSeed(randomSeed()); };
  return (
    <Screen title={game.name} back="/practice">
      <div className="practice">
        <section className="practice__main">
          <div className="practice__emoji" aria-hidden="true">{game.emoji}</div>
          {result ? (
            <div className="practice__result">
              {result.isBest && <p className="new-best">New best!</p>}
              <p className="big-score" data-testid="practice-score">{game.formatScore(result.score)}</p>
              {!result.isBest && result.previous !== undefined && <p className="muted">Your best: {game.formatScore(result.previous)}</p>}
              {result.isBest && result.previous !== undefined && <p className="muted">Old best: {game.formatScore(result.previous)}</p>}
            </div>
          ) : (
            <p className="intro__text">{game.instructions}</p>
          )}
          <p className="intro__rule">{game.better === "lower" ? "Lowest wins" : "Highest wins"}</p>
          <button className="trigger trigger--huge" onClick={play}>{result ? "Play again" : "Play"}</button>
          <p className="kbd-hint">Keyboard: {game.keyHint}</p>
          {result && <p className="practice__rules muted">{game.instructions}</p>}
        </section>

        <aside className="practice__side">
          <section className="board board--mine" aria-label="Your best">
            <h2 className="board__title">Your best</h2>
            <p className="board__big">{best ? game.formatScore(best.score) : "None yet"}</p>
            {tries.length > 0 && (
              <ol className="practice__tries" aria-label="This session">
                {tries.map((t, i) => <li key={tries.length - i} className={best && t === best.score ? "is-best" : ""}>{game.formatScore(t)}</li>)}
              </ol>
            )}
          </section>
          <section className="board" aria-label="World top 5">
            <h2 className="board__title">World top 5</h2>
            <TopList gameId={gameId} load={top} name={name} />
          </section>
        </aside>
      </div>
    </Screen>
  );
}

/** A live (head-to-head) game against a CPU bot. You're P1 on the left. */
function CpuPractice({ gameId }: { gameId: string }) {
  const game = getGame(gameId);
  const [seed, setSeed] = useState<number | null>(null);
  const [last, setLast] = useState<"w" | "l" | "d" | null>(null);
  const [tally, setTally] = useState(() => cpuRecords.get(gameId));

  if (seed !== null) {
    return (
      <div className="arena arena--solo">
        <main className="stage">
          <GamePlayer
            key={seed}
            game={game}
            seed={seed}
            onFinish={() => {}}
            quit={<QuitButton warning="This game won't count." onQuit={() => setSeed(null)} />}
            live={
              <LivePlayer
                game={game}
                seed={seed}
                link={{ role: "cpu", bot: makeBot(gameId) }}
                onDone={([h, g]) => {
                  const o = h > g ? "w" : g > h ? "l" : "d";
                  setTally(cpuRecords.add(gameId, o));
                  earn(o === "w" ? "cpuWin" : "cpuLoss");
                  setLast(o);
                  sfx(o === "w" ? "ko" : o === "l" ? "koLose" : "tie");
                  setSeed(null);
                }}
              />
            }
          />
        </main>
      </div>
    );
  }
  const play = () => { sfx("select"); setSeed(randomSeed()); };
  return (
    <Screen title={game.name} back="/practice">
      <div className="practice">
        <section className="practice__main">
          <div className="practice__emoji" aria-hidden="true">{game.emoji}</div>
          {last ? (
            <div className="practice__result">
              <p className="big-score" data-testid="practice-score">{last === "w" ? "You win" : last === "l" ? "CPU wins" : "Draw"}</p>
            </div>
          ) : (
            <p className="intro__text">{game.instructions}</p>
          )}
          <Legend me="host" left="You" right="CPU" />
          <button className="trigger trigger--huge" onClick={play}>{last ? "Rematch" : "Play the CPU"}</button>
          <p className="kbd-hint">Keyboard: {game.keyHint}</p>
          {last && <p className="practice__rules muted">{game.instructions}</p>}
        </section>
        <aside className="practice__side">
          <section className="board board--mine" aria-label="Your record against the CPU">
            <h2 className="board__title">You vs CPU</h2>
            <p className="board__big">{tally.w} – {tally.l}</p>
            <p className="muted">{tally.d ? `${tally.d} draw${tally.d === 1 ? "" : "s"}. ` : ""}The CPU plays the right side and makes mistakes on purpose. Beat it, then beat a friend.</p>
          </section>
        </aside>
      </div>
    </Screen>
  );
}
