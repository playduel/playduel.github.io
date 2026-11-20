import { Rng } from "../../core/rng";

/** Simple glyphs that read clearly at small sizes in the pixel font. */
export const SYMBOLS = ["★", "♥", "♦", "♣", "♠", "●", "▲", "■", "◆", "✚", "☾", "☀"] as const;
export const PAIRS = 8;
/** Per pair still hidden when time runs out. */
export const LEFTOVER_PENALTY_MS = 5000;

export interface PairsPuzzle { cards: string[] }

export function createPairsPuzzle(seed: number): PairsPuzzle {
  const rng = new Rng(seed);
  const symbols = rng.shuffle(SYMBOLS).slice(0, PAIRS);
  return { cards: rng.shuffle([...symbols, ...symbols]) };
}

export const timeoutScore = (limitMs: number, pairsLeft: number) => limitMs + pairsLeft * LEFTOVER_PENALTY_MS;
