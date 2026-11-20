import { expect, test } from "vitest";
import { DOWN, LEFT, N, RIGHT, UP, createMazePuzzle, distanceToExit, run, step } from "./puzzle";

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

test("run slides to the next wall or junction", () => {
  const all = UP | RIGHT | DOWN | LEFT;
  // Row 0 is an open corridor; cell 3 also opens downwards (a junction).
  const walls = new Array(N * N).fill(all);
  for (let c = 0; c < 6; c++) walls[c] = UP | DOWN;
  walls[0] |= LEFT;
  walls[5] |= RIGHT;
  walls[3] &= ~DOWN;
  walls[N + 3] &= ~UP;
  expect(run(walls, 0, "right")).toEqual([1, 2, 3]);
  expect(run(walls, 3, "right")).toEqual([4, 5]);
  expect(run(walls, 5, "right")).toEqual([]);
  expect(run(walls, 3, "down")).toEqual([N + 3]);
});

test("running every way from the start eventually reaches the exit", () => {
  const { walls } = createMazePuzzle(9);
  // Following runs along the shortest path always gets out.
  let cell = 0, guard = 0;
  while (cell !== N * N - 1 && guard++ < 200) {
    const best = (["up", "down", "left", "right"] as const)
      .map((d) => run(walls, cell, d))
      .filter((p) => p.length)
      .sort((a, b) => distanceToExit(walls, a.at(-1)!) - distanceToExit(walls, b.at(-1)!))[0]!;
    cell = best.at(-1)!;
  }
  expect(cell).toBe(N * N - 1);
});
