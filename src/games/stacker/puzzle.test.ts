import { expect, test } from "vitest";
import { BOARD, createStackPuzzle, drop, positionAt } from "./puzzle";

test("reproducible and speeds up", () => {
  const p = createStackPuzzle(8);
  expect(p).toEqual(createStackPuzzle(8));
  expect(p.levels[40]!.speed).toBeGreaterThan(p.levels[0]!.speed);
});

test("blocks bounce inside the board", () => {
  const level = { speed: 7, fromLeft: true };
  for (let t = 0; t < 10; t += 0.13) {
    const x = positionAt(level, 4, t);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x + 4).toBeLessThanOrEqual(BOARD + 1e-9);
  }
  expect(positionAt({ speed: 7, fromLeft: false }, 4, 0)).toBe(6);
});

test("dropping trims the overhang, snaps near-perfect drops, misses end it", () => {
  expect(drop(3, 4, 2, 4)).toEqual({ x: 3, w: 3, perfect: false });
  expect(drop(2.1, 4, 2, 4)).toEqual({ x: 2, w: 4, perfect: true });
  expect(drop(7, 2, 2, 4)).toBeNull();
});
