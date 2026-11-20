import { expect, test } from "vitest";
import { DOWN, N, RIGHT, createMazePuzzle, distanceToExit, step } from "./puzzle";

test("reproducible, and the exit is always reachable", () => {
  expect(createMazePuzzle(1)).toEqual(createMazePuzzle(1));
  for (let s = 0; s < 50; s++) {
    const { walls } = createMazePuzzle(s);
    const d = distanceToExit(walls, 0);
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThanOrEqual(2 * (N - 1));
  }
});

test("walls block movement and the outer edge is closed", () => {
  const { walls } = createMazePuzzle(3);
  expect(step(walls, 0, "up")).toBe(0);
  expect(step(walls, 0, "left")).toBe(0);
  const open = (walls[0]! & RIGHT) === 0 ? "right" : "down";
  expect(step(walls, 0, open)).not.toBe(0);
  expect(walls[N * N - 1]! & DOWN).toBeTruthy();
});
