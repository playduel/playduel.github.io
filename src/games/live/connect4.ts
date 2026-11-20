import { Rng } from "../../core/rng";
import type { Side } from "../types";

export const COLS = 7, ROWS = 6;
export interface C4State {
  /** board[r * COLS + c]: null or the side whose disc is there. Row 0 is the top. */
  board: Array<Side | null>;
  turn: Side;
  winner: Side | null;
  line: number[];
  last: number | null;
}

/** Who goes first comes from the seed, so it's fair over many rounds. */
export const initC4 = (seed: number): C4State => ({
  board: new Array(COLS * ROWS).fill(null),
  turn: new Rng(seed).next() < 0.5 ? "host" : "guest",
  winner: null,
  line: [],
  last: null,
});

function fourFrom(board: Array<Side | null>, i: number): number[] {
  const side = board[i];
  const r0 = Math.floor(i / COLS), c0 = i % COLS;
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]] as const) {
    const line = [i];
    for (const s of [1, -1]) {
      let r = r0 + dr * s, c = c0 + dc * s;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r * COLS + c] === side) {
        line.push(r * COLS + c);
        r += dr * s;
        c += dc * s;
      }
    }
    if (line.length >= 4) return line;
  }
  return [];
}

/** Only the player whose turn it is can move; a full or invalid column is ignored. */
export function stepC4(s: C4State, hostIn: unknown, guestIn: unknown): C4State {
  if (s.winner) return s;
  const move = s.turn === "host" ? hostIn : guestIn;
  if (typeof move !== "number" || !Number.isInteger(move) || move < 0 || move >= COLS) return s;
  let row = -1;
  for (let r = ROWS - 1; r >= 0; r--) if (!s.board[r * COLS + move]) { row = r; break; }
  if (row < 0) return s;
  const i = row * COLS + move;
  const board = s.board.slice();
  board[i] = s.turn;
  const line = fourFrom(board, i);
  return { board, turn: s.turn === "host" ? "guest" : "host", winner: line.length ? s.turn : null, line, last: i };
}

export const c4Outcome = (s: C4State): Side | "draw" | null => s.winner ?? (s.board.every(Boolean) ? "draw" : null);
