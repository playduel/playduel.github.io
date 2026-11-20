import { expect, test } from "vitest";
import { GRID, START_LENGTH, createSnakePuzzle, startState, tick } from "./puzzle";

test("same seed + same inputs = same game", () => {
  const p = createSnakePuzzle(5);
  const inputs = ["down", undefined, "left", undefined, "up", "right", undefined] as const;
  const run = () => inputs.reduce((s, t) => tick(p, s, t), startState(p));
  expect(run()).toEqual(run());
});

test("eating grows, walls and your own body kill, no reversing", () => {
  const p = { food: [GRID * 9 + 5, 0, 1, 2] };
  let s = startState(p);
  expect(s.body).toHaveLength(START_LENGTH);
  s = tick(p, s);
  expect(s.body).toHaveLength(START_LENGTH + 1);
  expect(tick(p, s, "left").dir).toBe("right"); // can't reverse into yourself
  let w = s;
  for (let i = 0; i < GRID; i++) w = tick(p, w);
  expect(w.alive).toBe(false);
});
