import { Rng } from "../../core/rng";

export const N = 10;
/** Wall bits per cell. */
export const UP = 1, RIGHT = 2, DOWN = 4, LEFT = 8;
const DIRS = [
  { bit: UP, dr: -1, dc: 0, back: DOWN },
  { bit: RIGHT, dr: 0, dc: 1, back: LEFT },
  { bit: DOWN, dr: 1, dc: 0, back: UP },
  { bit: LEFT, dr: 0, dc: -1, back: RIGHT },
];

export interface MazePuzzle {
  /** walls[r * N + c] = bitmask of the walls still standing around that cell. */
  walls: number[];
}

/**
 * "Recursive backtracker" maze: a random depth-first walk that knocks down
 * walls. It makes one long winding path with dead ends, and every cell is
 * reachable, so the exit always can be reached.
 */
export function createMazePuzzle(seed: number): MazePuzzle {
  const rng = new Rng(seed);
  const walls = new Array(N * N).fill(UP | RIGHT | DOWN | LEFT);
  const seen = new Array(N * N).fill(false);
  const stack = [0];
  seen[0] = true;
  while (stack.length) {
    const cur = stack[stack.length - 1]!;
    const r = Math.floor(cur / N), c = cur % N;
    const options = DIRS.filter((d) => {
      const nr = r + d.dr, nc = c + d.dc;
      return nr >= 0 && nr < N && nc >= 0 && nc < N && !seen[nr * N + nc];
    });
    if (!options.length) {
      stack.pop();
      continue;
    }
    const d = rng.pick(options);
    const next = (r + d.dr) * N + (c + d.dc);
    walls[cur] &= ~d.bit;
    walls[next] &= ~d.back;
    seen[next] = true;
    stack.push(next);
  }
  return { walls };
}

/** Move from `cell` in a direction if no wall blocks it. */
export function step(walls: number[], cell: number, dir: "up" | "down" | "left" | "right"): number {
  const d = DIRS[["up", "right", "down", "left"].indexOf(dir)]!;
  if (walls[cell]! & d.bit) return cell;
  return cell + d.dr * N + d.dc;
}

/** Shortest number of moves from `cell` to the exit (bottom-right). */
export function distanceToExit(walls: number[], cell: number): number {
  const exit = N * N - 1;
  const dist = new Map([[cell, 0]]);
  const queue = [cell];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === exit) return dist.get(cur)!;
    for (const dir of ["up", "down", "left", "right"] as const) {
      const n = step(walls, cur, dir);
      if (!dist.has(n)) {
        dist.set(n, dist.get(cur)! + 1);
        queue.push(n);
      }
    }
  }
  return Infinity;
}
