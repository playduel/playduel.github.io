import { Rng } from "../../core/rng";
import type { Side } from "../types";

/** 4x4 boxes = 5x5 dots. Edges 0-19 are horizontal (row r, col c), 20-39 vertical. */
export const B = 4;
export const H_EDGES = (B + 1) * B;
export const EDGES = 2 * H_EDGES;
export const hEdge = (r: number, c: number) => r * B + c;
export const vEdge = (r: number, c: number) => H_EDGES + r * (B + 1) + c;
export const boxEdges = (r: number, c: number) => [hEdge(r, c), hEdge(r + 1, c), vEdge(r, c), vEdge(r, c + 1)];

export interface DotsState {
  edges: Array<Side | null>;
  boxes: Array<Side | null>;
  turn: Side;
  last: number | null;
}

export const initDots = (seed: number): DotsState => ({
  edges: new Array(EDGES).fill(null),
  boxes: new Array(B * B).fill(null),
  turn: new Rng(seed).next() < 0.5 ? "host" : "guest",
  last: null,
});

/** Draw an edge. Closing a box scores it and you go again; otherwise the turn passes. */
export function stepDots(s: DotsState, hostIn: unknown, guestIn: unknown): DotsState {
  const e = s.turn === "host" ? hostIn : guestIn;
  if (typeof e !== "number" || !Number.isInteger(e) || e < 0 || e >= EDGES || s.edges[e]) return s;
  const edges = s.edges.slice();
  edges[e] = s.turn;
  const boxes = s.boxes.slice();
  let scored = false;
  for (let r = 0; r < B; r++)
    for (let c = 0; c < B; c++)
      if (!boxes[r * B + c] && boxEdges(r, c).includes(e) && boxEdges(r, c).every((x) => edges[x])) {
        boxes[r * B + c] = s.turn;
        scored = true;
      }
  return { edges, boxes, turn: scored ? s.turn : s.turn === "host" ? "guest" : "host", last: e };
}

export const boxCount = (s: DotsState, side: Side) => s.boxes.filter((b) => b === side).length;
const leader = (s: DotsState): Side | "draw" => {
  const h = boxCount(s, "host"), g = boxCount(s, "guest");
  return h === g ? "draw" : h > g ? "host" : "guest";
};
export const dotsOutcome = (s: DotsState) => (s.edges.every(Boolean) ? leader(s) : null);
export const dotsTimeout = leader;
