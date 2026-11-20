/** What happens when a game ends: save personal bests, post them globally. */
import { Records } from "../core/records";
import { getGame } from "../games/registry";
import { leaderboardEnabled, submitScore } from "../net/leaderboard";
import { loadName } from "./hooks";

export const records = new Records();

export function saveResult(gameId: string, score: number): { isBest: boolean; previous?: number } {
  if (getGame(gameId).live) return { isBest: false }; // win/loss only: nothing to rank
  const name = loadName().trim();
  const result = records.record(name || "Player", gameId, getGame(gameId).better, score);
  // Only personal bests go global, and only for players who set a name.
  if (result.isBest && name && leaderboardEnabled()) {
    submitScore(gameId, name, score).catch(() => {
      /* offline or rejected: the local record still counts */
    });
  }
  return result;
}

/** Win / loss / draw tally against the CPU, per live game, on this device. */
export type CpuRecord = { w: number; l: number; d: number };
const CPU_KEY = "duel:cpu";
export const cpuRecords = {
  all(): Record<string, CpuRecord> {
    try { return JSON.parse(localStorage.getItem(CPU_KEY) ?? "{}") as Record<string, CpuRecord>; } catch { return {}; }
  },
  get(gameId: string): CpuRecord {
    return this.all()[gameId] ?? { w: 0, l: 0, d: 0 };
  },
  add(gameId: string, outcome: "w" | "l" | "d"): CpuRecord {
    const all = this.all();
    const r = { ...(all[gameId] ?? { w: 0, l: 0, d: 0 }) };
    r[outcome]++;
    all[gameId] = r;
    try { localStorage.setItem(CPU_KEY, JSON.stringify(all)); } catch { /* private mode: tally just won't stick */ }
    return r;
  },
};
