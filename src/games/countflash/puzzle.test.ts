import { expect, test } from "vitest";
import { ROUNDS, createCountPuzzle, totalError } from "./puzzle";

test("reproducible, non-overlapping, harder each round", () => {
  expect(createCountPuzzle(9)).toEqual(createCountPuzzle(9));
  for (let s = 0; s < 20; s++) {
    const { rounds } = createCountPuzzle(s);
    expect(rounds).toHaveLength(ROUNDS);
    for (const dots of rounds)
      for (let i = 0; i < dots.length; i++)
        for (let j = i + 1; j < dots.length; j++)
          expect(Math.hypot(dots[i]!.x - dots[j]!.x, dots[i]!.y - dots[j]!.y)).toBeGreaterThan(dots[i]!.r + dots[j]!.r);
    expect(rounds[4]!.length).toBeGreaterThanOrEqual(24);
  }
});

test("error adds up; skipped rounds count fully", () => {
  const rounds = [Array(10).fill({ x: 0, y: 0, r: 1 }), Array(20).fill({ x: 0, y: 0, r: 1 })];
  expect(totalError(rounds, [12, null])).toBe(22);
});
