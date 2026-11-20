import { expect, test } from "vitest";
import { clashScore, createClashPuzzle } from "./puzzle";

test("reproducible and mostly clashing", () => {
  const p = createClashPuzzle(3);
  expect(p).toEqual(createClashPuzzle(3));
  const clashes = p.filter((c) => c.word !== c.ink).length;
  expect(clashes / p.length).toBeGreaterThan(0.65);
  expect(clashes).toBeLessThan(p.length);
});

test("wrong taps cost a point", () => {
  expect(clashScore(20, 3)).toBe(17);
});
