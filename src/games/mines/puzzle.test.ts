import { expect, test } from "vitest";
import { H, MINES, W, createMinesPuzzle, open, safeLeft } from "./puzzle";

test("reproducible board with exactly 10 mines and a safe empty start", () => {
  expect(createMinesPuzzle(4)).toEqual(createMinesPuzzle(4));
  for (let s = 0; s < 30; s++) {
    const p = createMinesPuzzle(s);
    expect(p.mines.filter(Boolean)).toHaveLength(MINES);
    expect(p.mines[p.start]).toBe(false);
    expect(p.counts[p.start]).toBe(0);
  }
});

test("opening an empty cell floods, never into mines", () => {
  const p = createMinesPuzzle(7);
  const r = open(p, new Array(W * H).fill(false), p.start);
  expect(r.filter(Boolean).length).toBeGreaterThan(1);
  r.forEach((v, i) => v && expect(p.mines[i]).toBe(false));
  expect(safeLeft(p, r)).toBeLessThan(W * H - MINES);
});
