import type { Side } from "../types";

/** Rope position runs from -WIN (guest wins) to +WIN (host wins). */
export const WIN = 30;
export interface TugState { pos: number; taps: Record<Side, number> }

export const initTug = (): TugState => ({ pos: 0, taps: { host: 0, guest: 0 } });

/** Each tap pulls the rope one step toward you. */
export function stepTug(s: TugState, hostIn: unknown, guestIn: unknown): TugState {
  const h = hostIn === "pull" ? 1 : 0;
  const g = guestIn === "pull" ? 1 : 0;
  if (!h && !g) return s;
  return { pos: s.pos + h - g, taps: { host: s.taps.host + h, guest: s.taps.guest + g } };
}

export const tugOutcome = (s: TugState): Side | null => (s.pos >= WIN ? "host" : s.pos <= -WIN ? "guest" : null);
export const tugTimeout = (s: TugState): Side | "draw" => (s.pos > 0 ? "host" : s.pos < 0 ? "guest" : "draw");
