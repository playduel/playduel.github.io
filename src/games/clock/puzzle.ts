import { Rng } from "../../core/rng";

export const TRIES = 3;
/** The clock disappears this long after you start: the rest is in your head. */
export const VISIBLE_MS = 2000;

export interface ClockPuzzle {
  /** Target time for each try, in ms (whole or half seconds, 3.0 to 7.0). */
  targetsMs: number[];
}

export function createClockPuzzle(seed: number): ClockPuzzle {
  const rng = new Rng(seed);
  return { targetsMs: Array.from({ length: TRIES }, () => rng.int(6, 14) * 500) };
}

/** How far off a stop was. Not stopping at all counts as the whole target. */
export const offBy = (targetMs: number, stoppedMs: number | null) =>
  stoppedMs === null ? targetMs : Math.round(Math.abs(stoppedMs - targetMs));

export const averageOff = (offs: number[]) => Math.round(offs.reduce((a, b) => a + b, 0) / offs.length);
