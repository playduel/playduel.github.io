import type { GameRule } from "../core/match";
import type { MiniGame } from "./types";
import { quickMathGame } from "./math";
import { reactionGame } from "./reaction";
import { anagramsGame } from "./anagrams";
import { memoryGame } from "./memory";
import { targetTapGame } from "./targets";
import { stopTheClockGame } from "./clock";
import { countFlashGame } from "./countflash";
import { colorClashGame } from "./colorclash";
import { typingGame } from "./typing";
import { pairFlipGame } from "./pairs";
import { slidingTilesGame } from "./slide";
import { stackerGame } from "./stacker";
import { mazeGame } from "./maze";
import { minesGame } from "./mines";
import { fiveLettersGame } from "./fiveletters";
import { snakeGame } from "./snake";
import { wordGridGame } from "./wordgrid";
import { lightCyclesGame } from "./live/LightCycles";
import { snakeDuelGame } from "./live/SnakeDuel";
import { tugOfWarGame } from "./live/TugOfWar";
import { connectFourGame } from "./live/ConnectFour";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAMES: MiniGame<any>[] = [reactionGame, quickMathGame, targetTapGame, anagramsGame, memoryGame, stopTheClockGame, countFlashGame, colorClashGame, typingGame, pairFlipGame, slidingTilesGame, stackerGame, mazeGame, minesGame, fiveLettersGame, snakeGame, wordGridGame, lightCyclesGame, snakeDuelGame, tugOfWarGame, connectFourGame];

export const getGame = (id: string) => {
  const g = GAMES.find((x) => x.id === id);
  if (!g) throw new Error(`unknown game ${id}`);
  return g;
};

/** Games you can play alone (practice, personal bests, leaderboards). Live games need two players. */
export const SOLO_GAMES = GAMES.filter((g) => !g.live);
export const LIVE_GAMES = GAMES.filter((g) => g.live);

/** The only part of a game the match reducer needs. */
export const GAME_RULES: GameRule[] = GAMES.map(({ id, better }) => ({ id, better }));

/**
 * Games a new match may pick from. `?games=reaction,math` in the URL limits
 * the pool (handy for testing one game, and used by the e2e test).
 */
export function matchGameRules(search = typeof location === "undefined" ? "" : location.search): GameRule[] {
  const only = new URLSearchParams(search).get("games")?.split(",").filter(Boolean);
  const picked = only ? GAME_RULES.filter((g) => only.includes(g.id)) : GAME_RULES;
  return picked.length ? picked : GAME_RULES;
}
