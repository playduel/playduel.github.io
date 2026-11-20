import { expect, test } from "vitest";
import { SW, initSnakes, snakesOutcome, snakesTimeout, stepSnakes } from "./snakes";

test("same seed + same inputs = same game", () => {
  const inputs: Array<[string | null, string | null]> = [["down", null], [null, "up"], ["right", "left"], [null, null], ["up", "down"]];
  const run = () => inputs.reduce((s, [h, g]) => stepSnakes(s, h, g), initSnakes(7));
  expect(run()).toEqual(run());
});

test("hitting the other snake loses; the survivor wins", () => {
  const s = initSnakes(7);
  const crash = { ...s, snakes: { host: s.snakes.host, guest: { ...s.snakes.guest, body: [s.snakes.host.body[0]! + 2, s.snakes.host.body[0]! + 3, s.snakes.host.body[0]! + 4] } } };
  let t = stepSnakes(crash, null, null); // guest moves left into... nothing yet
  t = stepSnakes(t, null, null);
  expect(snakesOutcome(t)).not.toBeNull();
});

test("eating grows by one and food moves on; timeout goes to the longer snake", () => {
  const s = initSnakes(3);
  const head = s.snakes.host.body[0]!;
  const fed = stepSnakes({ ...s, food: head + 1 }, null, null);
  expect(fed.snakes.host.body).toHaveLength(4);
  expect(fed.food).not.toBe(head + 1);
  expect(snakesTimeout(fed)).toBe("host");
  expect(snakesTimeout(s)).toBe("draw");
  expect(SW).toBe(24);
});
