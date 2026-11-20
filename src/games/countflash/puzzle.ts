import { Rng } from "../../core/rng";

export const ROUNDS = 5;
export const FLASH_MS = 1000;

export interface Dot { x: number; y: number; r: number }
export interface CountPuzzle { rounds: Dot[][] }

/** Dots never overlap, so the count is always fair to eyeball. */
export function createCountPuzzle(seed: number): CountPuzzle {
  const rng = new Rng(seed);
  const rounds = Array.from({ length: ROUNDS }, (_, i) => {
    const n = rng.int(8 + i * 4, 18 + i * 6); // gets harder each round
    const dots: Dot[] = [];
    let guard = 0;
    while (dots.length < n && guard++ < 5000) {
      const d = { x: rng.int(6, 94), y: rng.int(6, 94), r: rng.int(2, 4) };
      if (dots.every((o) => Math.hypot(o.x - d.x, o.y - d.y) > o.r + d.r + 2)) dots.push(d);
    }
    return dots;
  });
  return { rounds };
}

/** Total error across rounds. A skipped round counts its whole dot count. */
export const totalError = (rounds: Dot[][], guesses: Array<number | null>) =>
  rounds.reduce((sum, dots, i) => sum + (guesses[i] == null ? dots.length : Math.abs(guesses[i]! - dots.length)), 0);
