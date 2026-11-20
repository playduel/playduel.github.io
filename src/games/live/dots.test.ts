import { expect, test } from "vitest";
import { EDGES, boxCount, boxEdges, dotsOutcome, hEdge, initDots, stepDots, vEdge } from "./dots";

const move = (s: ReturnType<typeof initDots>, e: number) => (s.turn === "host" ? stepDots(s, e, null) : stepDots(s, null, e));

test("closing a box scores it and keeps the turn; otherwise the turn passes", () => {
  let s = initDots(0);
  const first = s.turn;
  s = move(s, hEdge(0, 0));
  expect(s.turn).not.toBe(first);
  s = move(s, hEdge(1, 0));
  s = move(s, vEdge(0, 0));
  const closer = s.turn;
  s = move(s, vEdge(0, 1));
  expect(boxCount(s, closer)).toBe(1);
  expect(s.turn).toBe(closer);
});

test("taken edges and off-turn moves are ignored; game ends when every edge is drawn", () => {
  let s = initDots(1);
  const offTurn = s.turn === "host" ? stepDots(s, null, 0) : stepDots(s, 0, null);
  expect(offTurn).toBe(s);
  for (let e = 0; e < EDGES; e++) s = move(s, e);
  expect(s.edges.every(Boolean)).toBe(true);
  expect(dotsOutcome(s)).not.toBeNull();
  expect(boxEdges(0, 0)).toHaveLength(4);
});
