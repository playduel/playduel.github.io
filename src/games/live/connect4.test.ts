import { expect, test } from "vitest";
import { c4Outcome, initC4, stepC4 } from "./connect4";

const play = (moves: number[], seed = 0) => {
  let s = initC4(seed);
  for (const m of moves) s = s.turn === "host" ? stepC4(s, m, null) : stepC4(s, null, m);
  return s;
};

test("discs fall; only the player on turn can move", () => {
  const s = initC4(0);
  const wrong = s.turn === "host" ? stepC4(s, null, 3) : stepC4(s, 3, null);
  expect(wrong).toBe(s);
  const p = play([3]);
  expect(p.board[5 * 7 + 3]).toBe(s.turn);
});

test("four in a row wins, in any direction", () => {
  const first = initC4(0).turn;
  expect(c4Outcome(play([0, 1, 0, 1, 0, 1, 0]))).toBe(first); // vertical
  expect(c4Outcome(play([0, 0, 1, 1, 2, 2, 3]))).toBe(first); // horizontal
  expect(c4Outcome(play([0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]))).toBe(first); // diagonal
});

test("a full column is ignored", () => {
  const s = play([0, 0, 0, 0, 0, 0]);
  expect(play([0, 0, 0, 0, 0, 0, 0]).board).toEqual(s.board);
});
