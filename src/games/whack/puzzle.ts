import { Rng } from "../../core/rng";

export const HOLES = 9;
export const LIMIT_MS = 30_000;
export const POINTS = { mole: 1, gold: 3, miss: -1 } as const;

export interface Mole {
  hole: number;
  /** ms after the start that it pops up, and how long it stays up. */
  at: number;
  up: number;
  gold: boolean;
}

/**
 * The whole 30 seconds of moles, decided up front from the seed, so both
 * players face exactly the same moles at the same moments. Pops come faster
 * and stay up shorter as time goes on; at most two are up at once.
 */
export function createWhackPuzzle(seed: number): Mole[] {
  const rng = new Rng(seed);
  const moles: Mole[] = [];
  let t = 600;
  while (t < LIMIT_MS - 400) {
    const k = t / LIMIT_MS; // 0..1 through the round
    const up = Math.round(1000 - 450 * k + rng.int(-80, 80));
    const busy = new Set(moles.filter((m) => m.at + m.up > t).map((m) => m.hole));
    if (busy.size < 2) {
      const free = Array.from({ length: HOLES }, (_, i) => i).filter((h) => !busy.has(h) && h !== moles.at(-1)?.hole);
      moles.push({ hole: rng.pick(free), at: t, up, gold: rng.next() < 0.12 });
    }
    t += Math.round(720 - 360 * k + rng.int(-90, 90));
  }
  return moles;
}

/** Which mole (index) is up in `hole` at time `t`, if any, ignoring ones already hit. */
export function moleAt(moles: Mole[], hole: number, t: number, hit: ReadonlySet<number>): number | null {
  for (let i = moles.length - 1; i >= 0; i--) {
    const m = moles[i]!;
    if (m.hole === hole && t >= m.at && t < m.at + m.up && !hit.has(i)) return i;
  }
  return null;
}
