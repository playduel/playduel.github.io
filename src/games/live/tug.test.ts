import { expect, test } from "vitest";
import { WIN, initTug, stepTug, tugOutcome, tugTimeout } from "./tug";

test("each pull moves the rope one step; equal pulls cancel", () => {
  let s = initTug();
  s = stepTug(s, "pull", null);
  s = stepTug(s, "pull", "pull");
  expect(s.pos).toBe(1);
  expect(s.taps).toEqual({ host: 2, guest: 1 });
});

test("first to drag it WIN steps wins; time-out goes to whoever is ahead", () => {
  let s = initTug();
  for (let i = 0; i < WIN; i++) s = stepTug(s, null, "pull");
  expect(tugOutcome(s)).toBe("guest");
  expect(tugTimeout(stepTug(initTug(), "pull", null))).toBe("host");
  expect(tugTimeout(initTug())).toBe("draw");
});
