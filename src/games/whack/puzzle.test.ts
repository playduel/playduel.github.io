import { expect, test } from "vitest";
import { LIMIT_MS, createWhackPuzzle, moleAt } from "./puzzle";

test("reproducible, in time order, never more than two up at once", () => {
  expect(createWhackPuzzle(4)).toEqual(createWhackPuzzle(4));
  for (let s = 0; s < 20; s++) {
    const moles = createWhackPuzzle(s);
    expect(moles.length).toBeGreaterThan(35);
    for (let i = 1; i < moles.length; i++) expect(moles[i]!.at).toBeGreaterThan(moles[i - 1]!.at);
    for (let t = 0; t < LIMIT_MS; t += 50) {
      const up = moles.filter((m) => t >= m.at && t < m.at + m.up);
      expect(up.length).toBeLessThanOrEqual(2);
      expect(new Set(up.map((m) => m.hole)).size).toBe(up.length);
    }
  }
});

test("moleAt finds the mole that's up and skips hit ones", () => {
  const moles = [{ hole: 4, at: 100, up: 500, gold: false }];
  expect(moleAt(moles, 4, 50, new Set())).toBeNull();
  expect(moleAt(moles, 4, 300, new Set())).toBe(0);
  expect(moleAt(moles, 3, 300, new Set())).toBeNull();
  expect(moleAt(moles, 4, 300, new Set([0]))).toBeNull();
});
