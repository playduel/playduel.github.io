import { type MatchState, type PlayerId, other, winsNeeded } from "./match";

/**
 * Announcer lines, picked from the match history. Pure, so the rules are
 * tested and both screens always call the same thing.
 *
 * After a round:  FLAWLESS (won the match without dropping a round),
 *                 COMEBACK (won the match after trailing), CLUTCH (won a
 *                 round while facing match point), STREAK (3+ rounds in a row).
 * Before a round: MATCH POINT (someone is one round from winning).
 */
export type Callout = { text: string; who: PlayerId | null };

export function roundCallout(s: MatchState): Callout | null {
  const decided = s.history.filter((r) => r.winner !== null);
  const last = decided.at(-1);
  if (!last || s.history.at(-1)?.winner === null) return null;
  const w = last.winner!;
  const need = winsNeeded(s.bestOf);
  const winsBefore = (p: PlayerId) => decided.slice(0, -1).filter((r) => r.winner === p).length;

  if (s.winner === w) {
    if (winsBefore(other(w)) === 0) return { text: "Flawless", who: w };
    // Trailing at any point before the end?
    let a = 0, b = 0, trailed = false;
    for (const r of decided) {
      if (r.winner === w) a++; else b++;
      if (b > a) trailed = true;
    }
    if (trailed) return { text: "Comeback", who: w };
  }
  if (winsBefore(other(w)) === need - 1) return { text: "Clutch", who: w };
  let streak = 0;
  for (let i = decided.length - 1; i >= 0 && decided[i]!.winner === w; i--) streak++;
  if (streak >= 3) return { text: `${streak} in a row`, who: w };
  return null;
}

export function introCallout(s: MatchState): Callout | null {
  const need = winsNeeded(s.bestOf);
  const wins = (p: PlayerId) => s.history.filter((r) => r.winner === p).length;
  const h = wins("host") === need - 1, g = wins("guest") === need - 1;
  if (h && g) return { text: "Final round", who: null };
  if (h || g) return { text: "Match point", who: h ? "host" : "guest" };
  return null;
}
