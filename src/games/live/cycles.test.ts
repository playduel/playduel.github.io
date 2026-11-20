import { expect, test } from "vitest";
import { H, W, cyclesOutcome, initCycles, stepCycles } from "./cycles";

test("same seed + same inputs = same game (both screens agree)", () => {
  const inputs: Array<[string | null, string | null]> = [["up", null], [null, "down"], ["left", "up"], [null, null], ["down", "right"]];
  const run = () => inputs.reduce((s, [h, g]) => stepCycles(s, h, g), initCycles(42));
  expect(run()).toEqual(run());
});

test("starts mirrored; riding into the wall loses", () => {
  const s0 = initCycles(1);
  expect(s0.riders.host.y + s0.riders.guest.y).toBe(H - 1);
  let s = s0;
  for (let i = 0; i < W && !cyclesOutcome(s); i++) s = stepCycles(s, "up", null);
  expect(cyclesOutcome(s)).toBe("guest");
});

test("crashing into a trail loses; meeting head-on is a draw", () => {
  let s = initCycles(1);
  s = stepCycles(s, "up", null);
  s = stepCycles(s, "right", null);
  s = stepCycles(s, "down", null);
  s = stepCycles(s, "left", null); // into its own trail
  expect(s.riders.host.alive).toBe(false);

  const a = initCycles(1);
  const meet = { ...a, riders: { host: { ...a.riders.host, x: 10, y: 10 }, guest: { ...a.riders.guest, x: 12, y: 10 } } };
  expect(cyclesOutcome(stepCycles(meet, null, null))).toBe("draw");
});
