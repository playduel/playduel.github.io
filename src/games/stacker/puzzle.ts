import { Rng } from "../../core/rng";

/** Board is 10 units wide; blocks start 6 wide. */
export const BOARD = 10;
export const START_WIDTH = 6;
/** Drops this close to perfect snap into place and keep their width. */
export const SNAP = 0.25;

export interface Level { speed: number; fromLeft: boolean }
export interface StackPuzzle { levels: Level[] }

/** Each level's speed (units per second) and start side come from the seed, and creep up. */
export function createStackPuzzle(seed: number): StackPuzzle {
  const rng = new Rng(seed);
  return {
    levels: Array.from({ length: 60 }, (_, i) => ({ speed: 5 + i * 0.35 + rng.next() * 2, fromLeft: rng.next() < 0.5 })),
  };
}

/** Where a block is after `t` seconds: it bounces between the walls. */
export function positionAt(level: Level, width: number, t: number): number {
  const span = BOARD - width;
  if (span <= 0) return 0;
  const d = (level.speed * t) % (2 * span);
  const x = d <= span ? d : 2 * span - d;
  return level.fromLeft ? x : span - x;
}

/** Drop a block at x (width w) on a layer at px (width pw). Returns the new layer, or null if it missed. */
export function drop(x: number, w: number, px: number, pw: number): { x: number; w: number; perfect: boolean } | null {
  if (Math.abs(x - px) <= SNAP) return { x: px, w: Math.min(w, pw), perfect: true };
  const left = Math.max(x, px);
  const right = Math.min(x + w, px + pw);
  if (right - left <= 0.05) return null;
  return { x: left, w: right - left, perfect: false };
}
