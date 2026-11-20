import { Rng } from "../../core/rng";
import WORDS_RAW from "../anagrams/words.txt?raw";
import ANSWERS_RAW from "./answers.txt?raw";

export const ANSWERS = ANSWERS_RAW.split(" ");
/** Accepted guesses: any 5-letter word in the shared word list, plus all answers. */
export const GUESSES: ReadonlySet<string> = new Set([...WORDS_RAW.split(" ").filter((w) => w.length === 5), ...ANSWERS]);
export const MAX_GUESSES = 6;
/** A failed game scores as if it took this many guesses. */
export const FAIL_GUESSES = 7;

export interface FivePuzzle {
  answer: string;
  /** Everyone's first guess is the same, so nobody gets a lucky opener. */
  opener: string;
}

export function createFivePuzzle(seed: number): FivePuzzle {
  const rng = new Rng(seed);
  const answer = rng.pick(ANSWERS);
  // The opener always lights up at least one yellow, so round one is never a blank wall.
  let opener = rng.pick(ANSWERS);
  while (opener === answer || !score(opener, answer).includes("near")) opener = rng.pick(ANSWERS);
  return { answer, opener };
}

export type Mark = "hit" | "near" | "miss";

/**
 * Colours a guess. Handles repeated letters properly: exact matches are
 * claimed first, then "near" marks only use letters still unclaimed.
 */
export function score(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(5).fill("miss");
  const left: Record<string, number> = {};
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) marks[i] = "hit";
    else left[answer[i]!] = (left[answer[i]!] ?? 0) + 1;
  }
  for (let i = 0; i < 5; i++) {
    const ch = guess[i]!;
    if (marks[i] !== "hit" && left[ch]) {
      marks[i] = "near";
      left[ch]!--;
    }
  }
  return marks;
}

/** Fewest guesses wins; time breaks ties. Lower is better. */
export const encodeScore = (guesses: number, ms: number) => guesses * 1_000_000 + Math.min(999_999, Math.round(ms));
export const decodeScore = (s: number) => ({ guesses: Math.floor(s / 1_000_000), ms: s % 1_000_000 });
