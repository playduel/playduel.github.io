import { expect, test } from "vitest";
import { SOLVED, createSlidePuzzle, isSolved, misplaced, slide } from "./puzzle";

/** Inversion parity: odd = unsolvable on a 3x3 board. */
const solvable = (t: number[]) => {
  const v = t.filter((x) => x !== 0);
  let inv = 0;
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (v[i]! > v[j]!) inv++;
  return inv % 2 === 0;
};

test("reproducible, scrambled, and always solvable", () => {
  expect(createSlidePuzzle(2)).toEqual(createSlidePuzzle(2));
  for (let s = 0; s < 100; s++) {
    const { tiles } = createSlidePuzzle(s);
    expect([...tiles].sort()).toEqual([...SOLVED].sort());
    expect(misplaced(tiles)).toBeGreaterThanOrEqual(6);
    expect(solvable(tiles)).toBe(true);
  }
});

test("only tiles next to the gap move", () => {
  expect(slide(SOLVED, 7)).toEqual([1, 2, 3, 4, 5, 6, 7, 0, 8]);
  expect(slide(SOLVED, 0)).toBeNull();
  expect(isSolved(SOLVED)).toBe(true);
});
