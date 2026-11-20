import { expect, test } from "vitest";
import { FH, FW, WIN_POINTS, initPong, pongOutcome, stepPong } from "./pong";

test("same seed + same inputs = same rally, bit for bit", () => {
  const inputs = Array.from({ length: 600 }, (_, i) => [i % 40 < 20 ? "up" : "down", i % 30 < 15 ? "down" : null] as const);
  const run = () => inputs.reduce((s, [h, g]) => stepPong(s, h, g), initPong(99));
  expect(run()).toEqual(run());
});

test("ball stays in the field vertically; paddles stay on screen", () => {
  let s = initPong(5);
  for (let i = 0; i < 2000 && !pongOutcome(s); i++) {
    s = stepPong(s, "up", "down");
    expect(s.ball.y).toBeGreaterThanOrEqual(0);
    expect(s.ball.y).toBeLessThanOrEqual(FH);
    expect(s.paddles.host).toBeGreaterThanOrEqual(0);
  }
  expect(FW).toBe(100);
});

test("unreturned balls score, and the first to 5 wins", () => {
  let s = initPong(5);
  for (let i = 0; i < 20000 && !pongOutcome(s); i++) s = stepPong(s, "up", "up");
  expect(pongOutcome(s)).not.toBeNull();
  expect(Math.max(s.score.host, s.score.guest)).toBe(WIN_POINTS);
});
