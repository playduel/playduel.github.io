import { expect, test } from "vitest";
import { PAIRS, createPairsPuzzle, timeoutScore } from "./puzzle";

test("reproducible 4x4 grid made of exact pairs", () => {
  const p = createPairsPuzzle(11);
  expect(p).toEqual(createPairsPuzzle(11));
  expect(p.cards).toHaveLength(PAIRS * 2);
  const counts = new Map<string, number>();
  for (const c of p.cards) counts.set(c, (counts.get(c) ?? 0) + 1);
  expect([...counts.values()].every((n) => n === 2)).toBe(true);
});

test("running out of time is always worse than finishing", () => {
  expect(timeoutScore(60_000, 1)).toBeGreaterThan(60_000);
});
