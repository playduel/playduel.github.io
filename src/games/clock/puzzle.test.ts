import { expect, test } from "vitest";
import { TRIES, averageOff, createClockPuzzle, offBy } from "./puzzle";

test("same seed, same targets; all between 3 and 7 seconds", () => {
  expect(createClockPuzzle(5)).toEqual(createClockPuzzle(5));
  for (let s = 0; s < 50; s++) {
    const p = createClockPuzzle(s);
    expect(p.targetsMs).toHaveLength(TRIES);
    for (const t of p.targetsMs) expect(t >= 3000 && t <= 7000 && t % 500 === 0).toBe(true);
  }
});

test("scoring is distance from the target either side", () => {
  expect(offBy(5000, 5120)).toBe(120);
  expect(offBy(5000, 4880)).toBe(120);
  expect(offBy(5000, null)).toBe(5000);
  expect(averageOff([100, 200, 301])).toBe(200);
});
