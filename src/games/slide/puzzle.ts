import { Rng } from "../../core/rng";

export const SIZE = 3;
/** 0 is the empty square. Solved = 1..8 then 0. */
export const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 0];

export interface SlidePuzzle { tiles: number[] }

/** Squares next to `i` on the board. */
export const neighbours = (i: number) => {
  const r = Math.floor(i / SIZE), c = i % SIZE;
  return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([y, x]) => y! >= 0 && y! < SIZE && x! >= 0 && x! < SIZE).map(([y, x]) => y! * SIZE + x!);
};

/** Slides tile `i` into the gap if they touch; returns the new board or null. */
export function slide(tiles: number[], i: number): number[] | null {
  const gap = tiles.indexOf(0);
  if (!neighbours(gap).includes(i)) return null;
  const next = tiles.slice();
  [next[gap], next[i]] = [next[i]!, next[gap]!];
  return next;
}

export const isSolved = (tiles: number[]) => tiles.every((t, i) => t === SOLVED[i]);
export const misplaced = (tiles: number[]) => tiles.filter((t, i) => t !== 0 && t !== SOLVED[i]).length;

/**
 * Scramble by making random legal moves from the solved board. That way the
 * puzzle is always solvable (half of all random arrangements are not).
 */
export function createSlidePuzzle(seed: number): SlidePuzzle {
  const rng = new Rng(seed);
  let tiles = SOLVED.slice();
  let prevGap = -1;
  for (let k = 0; k < 80 || misplaced(tiles) < 6; k++) {
    const gap = tiles.indexOf(0);
    const options = neighbours(gap).filter((i) => i !== prevGap); // no instant undo
    tiles = slide(tiles, rng.pick(options))!;
    prevGap = gap;
  }
  return { tiles };
}
