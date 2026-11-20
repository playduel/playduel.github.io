/**
 * Every message that crosses the network.
 *
 * Live progress (`progress`) is deliberately NOT a reducer event: it's
 * cosmetic, frequent, and safe to lose, so it travels beside the event log
 * instead of inside it. The rules never depend on it. Kept as plain JSON-able objects.
 *
 * Design note: instead of a separate message type per rule (config,
 * roundStart, roundResult, matchOver...), the host forwards *reducer events*
 * (`{t:"event"}`). The guest runs the same reducer, so things like the round
 * result never need to be sent: the guest computes it from the two `score`
 * events, exactly as the host did. Fewer message types = fewer ways for the
 * two screens to disagree.
 */
import type { MatchEvent, MatchState } from "../core/match";
import type { Progress } from "../games/types";
import { type Profile, cleanProfile } from "../core/progression";

export const PROTOCOL_VERSION = 3;

/** One player's input to a live game for one tick: a direction, a column, a tap... */
export type LiveInput = string | number;

export type HostToGuest =
  | { t: "sync"; v: number; state: MatchState } // full snapshot on join / rejoin
  | { t: "event"; event: MatchEvent } // every state change, in order
  | { t: "pong"; t0: number; hostTime: number } // clock sync reply
  | { t: "progress"; round: number; attempt: number; p: Progress } // host's live progress
  // Live games: the host steps the simulation and tells the guest which
  // inputs (host's, guest's) went into tick n. Same start + same inputs =
  // same game on both screens, so only inputs ever cross the network.
  | { t: "tick"; round: number; attempt: number; n: number; i: [LiveInput | null, LiveInput | null] }
  | { t: "reject"; reason: string }
  | { t: "emote"; e: string } // host's emote or taunt
  | { t: "profile"; p: Profile }; // host's level, title, name colour

export type GuestToHost =
  | { t: "hello"; v: number; name: string; token: string } // token = same guest on rejoin
  | { t: "score"; round: number; attempt: number; value: number }
  | { t: "rematch" }
  | { t: "ping"; t0: number }
  | { t: "progress"; round: number; attempt: number; p: Progress } // guest's live progress
  | { t: "input"; round: number; attempt: number; input: LiveInput } // guest's live-game input
  | { t: "quit" } // guest left on purpose: forfeit now, no 30 s grace
  | { t: "emote"; e: string }
  | { t: "profile"; p: Profile };

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;
const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const isStr = (x: unknown, max = 64): x is string => typeof x === "string" && x.length <= max;

/**
 * The host must not trust the guest's bytes: validate shape before use.
 * (The guest trusts the host; the host is the authority by design.)
 */
export function parseGuestMessage(x: unknown): GuestToHost | null {
  if (!isObj(x)) return null;
  switch (x.t) {
    case "hello":
      return isNum(x.v) && isStr(x.name, 40) && isStr(x.token) ? { t: "hello", v: x.v, name: x.name, token: x.token } : null;
    case "score":
      return isNum(x.round) && isNum(x.attempt) && isNum(x.value)
        ? { t: "score", round: x.round, attempt: x.attempt, value: x.value }
        : null;
    case "rematch":
      return { t: "rematch" };
    case "ping":
      return isNum(x.t0) ? { t: "ping", t0: x.t0 } : null;
    case "progress": {
      const p = parseProgress(x.p);
      return p && isNum(x.round) && isNum(x.attempt) ? { t: "progress", round: x.round, attempt: x.attempt, p } : null;
    }
    case "input":
      return isNum(x.round) && isNum(x.attempt) && (isNum(x.input) || isStr(x.input, 16))
        ? { t: "input", round: x.round, attempt: x.attempt, input: x.input }
        : null;
    case "quit":
      return { t: "quit" };
    case "emote":
      return isStr(x.e, 16) ? { t: "emote", e: x.e } : null;
    case "profile":
      return isObj(x.p) ? { t: "profile", p: cleanProfile(x.p as Partial<Profile>) } : null;
    default:
      return null;
  }
}

export function parseProgress(x: unknown): Progress | null {
  if (!isObj(x)) return null;
  if (!isNum(x.fraction) || !isStr(x.headline, 12) || !isStr(x.unit, 24) || !isStr(x.detail, 40)) return null;
  return { fraction: Math.max(0, Math.min(1, x.fraction)), headline: x.headline, unit: x.unit, detail: x.detail };
}
