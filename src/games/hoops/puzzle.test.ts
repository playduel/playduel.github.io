import { expect, test } from "vitest";
import { BASKET, SWISH, createHoopsPuzzle, meterAt, shoot } from "./puzzle";

test("reproducible; zones shrink but never vanish", () => {
  expect(createHoopsPuzzle(9)).toEqual(createHoopsPuzzle(9));
  const shots = createHoopsPuzzle(9);
  expect(shots[0]!.width).toBeGreaterThan(shots[40]!.width);
  expect(Math.min(...shots.map((s) => s.width))).toBeGreaterThanOrEqual(10);
});

test("meter sweeps 0 to 100 and back", () => {
  const shot = { speed: 1, center: 50, width: 20 };
  expect(meterAt(shot, 0)).toBe(0);
  expect(meterAt(shot, 500)).toBeCloseTo(100);
  expect(meterAt(shot, 250)).toBeCloseTo(50);
  expect(meterAt(shot, 750)).toBeCloseTo(50);
});

test("swish at the centre, basket in the zone, miss outside", () => {
  const shot = { speed: 1, center: 60, width: 20 };
  expect(shoot(shot, 61)).toBe(SWISH);
  expect(shoot(shot, 68)).toBe(BASKET);
  expect(shoot(shot, 75)).toBe(0);
});
