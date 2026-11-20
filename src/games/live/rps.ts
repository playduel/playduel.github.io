import type { Side } from "../types";

/**
 * Rock Paper Scissors, first to 3 throws. Each throw is a fixed count-in
 * ("rock, paper, scissors, shoot"); you can change your pick until "shoot".
 * Not picking loses the throw. Ties are thrown again.
 */
export const TICK_MS = 50;
/** Ticks of count-in per throw (2.5 s) and of showing the result (1.5 s). */
export const COUNT = 50;
export const REVEAL = 30;
export const TO_WIN = 3;

export type Pick = "rock" | "paper" | "scissors";
export const PICKS: Pick[] = ["rock", "paper", "scissors"];
const BEATS: Record<Pick, Pick> = { rock: "scissors", paper: "rock", scissors: "paper" };

export interface Throw { host: Pick | null; guest: Pick | null; winner: Side | null }
export interface RpsState {
  stage: "count" | "reveal";
  t: number;
  pick: Record<Side, Pick | null>;
  wins: Record<Side, number>;
  history: Throw[];
}

export const initRps = (): RpsState => ({ stage: "count", t: 0, pick: { host: null, guest: null }, wins: { host: 0, guest: 0 }, history: [] });

/** Who takes a throw. A missing pick loses to any pick. */
export function judgeThrow(h: Pick | null, g: Pick | null): Side | null {
  if (h === g) return null;
  if (!g) return "host";
  if (!h) return "guest";
  return BEATS[h] === g ? "host" : "guest";
}

const isPick = (v: unknown): v is Pick => PICKS.includes(v as Pick);

export function stepRps(s: RpsState, hostIn: unknown, guestIn: unknown): RpsState {
  if (rpsOutcome(s)) return s;
  if (s.stage === "count") {
    const pick = { host: isPick(hostIn) ? hostIn : s.pick.host, guest: isPick(guestIn) ? guestIn : s.pick.guest };
    if (s.t + 1 < COUNT) return { ...s, t: s.t + 1, pick };
    const winner = judgeThrow(pick.host, pick.guest);
    const wins = winner ? { ...s.wins, [winner]: s.wins[winner] + 1 } : s.wins;
    return { stage: "reveal", t: 0, pick, wins, history: [...s.history, { ...pick, winner }] };
  }
  if (s.t + 1 < REVEAL) return { ...s, t: s.t + 1 };
  return { ...s, stage: "count", t: 0, pick: { host: null, guest: null } };
}

/** The match ends once the winning throw has been shown. */
export const rpsOutcome = (s: RpsState): Side | null =>
  s.stage === "reveal" && s.t >= REVEAL - 1 ? (s.wins.host >= TO_WIN ? "host" : s.wins.guest >= TO_WIN ? "guest" : null) : null;
export const rpsTimeout = (s: RpsState): Side | "draw" => (s.wins.host > s.wins.guest ? "host" : s.wins.guest > s.wins.host ? "guest" : "draw");
