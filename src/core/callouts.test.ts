import { expect, test } from "vitest";
import { introCallout, roundCallout } from "./callouts";
import type { MatchState, PlayerId } from "./match";

const state = (bestOf: 3 | 5, winners: Array<PlayerId | null>, matchWinner: PlayerId | null = null) =>
  ({
    bestOf,
    winner: matchWinner,
    history: winners.map((w, i) => ({ round: i + 1, attempt: 0, gameId: "math", scores: { host: 0, guest: 0 }, winner: w })),
  }) as unknown as MatchState;

test("flawless, comeback, clutch and streak", () => {
  expect(roundCallout(state(3, ["host", "host"], "host"))).toEqual({ text: "Flawless", who: "host" });
  expect(roundCallout(state(5, ["guest", "guest", "host", "host", "host"], "host"))).toEqual({ text: "Comeback", who: "host" });
  expect(roundCallout(state(5, ["guest", "guest", "host"]))).toEqual({ text: "Clutch", who: "host" });
  expect(roundCallout(state(5, ["host", "guest", "guest", "guest"], "guest"))).toEqual({ text: "Comeback", who: "guest" });
  expect(roundCallout(state(3, ["host"]))).toBeNull();
  expect(roundCallout(state(3, ["host", null]))).toBeNull(); // a tie says nothing
});

test("match point and final round", () => {
  expect(introCallout(state(3, ["guest"]))).toEqual({ text: "Match point", who: "guest" });
  expect(introCallout(state(3, ["guest", "host"]))).toEqual({ text: "Final round", who: null });
  expect(introCallout(state(5, ["guest"]))).toBeNull();
});
