import { Rng } from "../../core/rng";

export const LIMIT_MS = 40_000;
export const SWISH = 3;
export const BASKET = 2;

export interface Shot {
  /** How fast the power meter sweeps, in full sweeps (0 to 100 and back) per second. */
  speed: number;
  /** Centre and width of the "in" zone on the 0..100 meter. */
  center: number;
  width: number;
}

/**
 * Arcade basketball (Pop-A-Shot style). Each ball gets its own power meter:
 * the zone shrinks and the meter speeds up as you go, same balls for both.
 */
export function createHoopsPuzzle(seed: number): Shot[] {
  const rng = new Rng(seed);
  return Array.from({ length: 80 }, (_, i) => ({
    speed: Math.round((0.55 + Math.min(i, 30) * 0.03 + rng.next() * 0.15) * 100) / 100,
    center: rng.int(45, 80),
    width: Math.max(10, 26 - Math.floor(i / 3)),
  }));
}

/** Meter reading `ms` after the ball is ready: a triangle wave 0 → 100 → 0. */
export function meterAt(shot: Shot, ms: number): number {
  const phase = ((ms / 1000) * shot.speed) % 1;
  return phase < 0.5 ? phase * 200 : (1 - phase) * 200;
}

/** Points for releasing at meter value `v`: dead centre swishes, inside the zone banks in. */
export function shoot(shot: Shot, v: number): number {
  const off = Math.abs(v - shot.center);
  return off <= 3 ? SWISH : off <= shot.width / 2 ? BASKET : 0;
}
