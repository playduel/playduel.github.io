import type { Side } from "../types";

/**
 * Jump Rope: one rope, two jumpers, side by side. The rope goes round on a
 * fixed beat that speeds up; when it passes under your feet you must be in
 * the air. Jump too late or too early (and land before it arrives) and you
 * trip. Last one jumping wins.
 *
 * Pure integer simulation on a 30 ms tick, so both screens agree exactly.
 */
export const TICK_MS = 30;
/** Ticks you stay in the air after a jump (~360 ms). */
export const AIR = 12;
/**
 * Ticks after landing before you can jump again (~180 ms). Without this,
 * mashing the button would keep you in the air almost all the time; with it,
 * mashing leaves you on the ground a third of the time, so timing wins.
 */
export const RECOVER = 6;
/** Ticks per rope turn at the start (~1.7 s) and at full speed (~0.6 s). */
export const START_PERIOD = 56;
export const MIN_PERIOD = 24;
/** Each turn is this many ticks shorter than the last. */
export const SPEEDUP = 2;

export interface Jumper { air: number; rest: number; alive: boolean; jumps: number }
export interface RopeState {
  /** Ticks into the current turn; the rope is under your feet when this wraps to 0. */
  phase: number;
  period: number;
  turns: number;
  p: Record<Side, Jumper>;
}

const jumper = (): Jumper => ({ air: 0, rest: 0, alive: true, jumps: 0 });

/** The rope starts at the feet and goes round once before the first pass (~1.7 s to get ready). */
export const initRope = (): RopeState => ({ phase: 0, period: START_PERIOD, turns: 0, p: { host: jumper(), guest: jumper() } });

export function stepRope(s: RopeState, hostIn: unknown, guestIn: unknown): RopeState {
  if (ropeOutcome(s)) return s;
  const next = (j: Jumper, input: unknown): Jumper => {
    if (!j.alive) return j;
    // You can only jump from the ground, once you've found your feet.
    if (input === "jump" && j.air === 0 && j.rest === 0) return { ...j, air: AIR };
    if (j.air > 0) return { ...j, air: j.air - 1, rest: j.air === 1 ? RECOVER : 0 };
    return { ...j, rest: Math.max(0, j.rest - 1) };
  };
  const p = { host: next(s.p.host, hostIn), guest: next(s.p.guest, guestIn) };
  let phase = s.phase + 1;
  let { period, turns } = s;
  if (phase >= period) {
    // The rope passes under both jumpers: anyone on the ground trips.
    for (const side of ["host", "guest"] as const) {
      const j = p[side];
      if (!j.alive) continue;
      p[side] = j.air > 0 ? { ...j, jumps: j.jumps + 1 } : { ...j, alive: false };
    }
    phase = 0;
    turns++;
    period = Math.max(MIN_PERIOD, period - SPEEDUP);
  }
  return { phase, period, turns, p };
}

/** Both trip on the same pass: draw (the round is replayed). */
export function ropeOutcome(s: RopeState): Side | "draw" | null {
  const h = s.p.host.alive, g = s.p.guest.alive;
  if (h && g) return null;
  return h ? "host" : g ? "guest" : "draw";
}
export const ropeTimeout = (): "draw" => "draw";
