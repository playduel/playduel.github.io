import { useState } from "react";
import { sfx } from "../audio/sfx";
import { randomSeed } from "../core/rng";
import { getGame } from "../games/registry";
import { GamePlayer } from "./GamePlayer";
import { Screen } from "./Menu";
import { TopList, useTopScores } from "./Records";
import { records, saveResult } from "./results";
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

  if (seed !== null && result === null) {
    return (
      <div className="arena arena--solo">
        <main className="stage">
          <GamePlayer
            game={game}
            seed={seed}
            onFinish={(score) => {
              const r = saveResult(gameId, score);
              sfx(r.isBest ? "ko" : "roundWin");
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
