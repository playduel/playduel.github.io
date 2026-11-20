import { Rng } from "../../core/rng";

export const COLORS = ["red", "blue", "green", "yellow"] as const;
export type ColorName = (typeof COLORS)[number];
export interface Card { word: ColorName; ink: ColorName }

/** 4 in 5 cards are a clash (word and ink differ); the rest match, so you can't just pick "not the word". */
export function createClashPuzzle(seed: number): Card[] {
  const rng = new Rng(seed);
  return Array.from({ length: 200 }, () => {
    const word = rng.pick(COLORS);
    const clash = rng.next() < 0.8;
    const ink = clash ? rng.pick(COLORS.filter((c) => c !== word)) : word;
    return { word, ink };
  });
}

export const clashScore = (right: number, wrong: number) => right - wrong;
