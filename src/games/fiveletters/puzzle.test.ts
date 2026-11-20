import { expect, test } from "vitest";
import { ANSWERS, GUESSES, createFivePuzzle, decodeScore, encodeScore, score } from "./puzzle";

test("reproducible; opener differs from the answer; both are valid words", () => {
  expect(createFivePuzzle(6)).toEqual(createFivePuzzle(6));
  for (let s = 0; s < 50; s++) {
    const p = createFivePuzzle(s);
    expect(p.opener).not.toBe(p.answer);
    expect(score(p.opener, p.answer)).toContain("near");
    expect(GUESSES.has(p.answer) && GUESSES.has(p.opener)).toBe(true);
  }
  expect(ANSWERS.length).toBeGreaterThan(500);
});

test("marks handle repeated letters", () => {
  expect(score("crane", "crane")).toEqual(["hit", "hit", "hit", "hit", "hit"]);
  expect(score("allee", "eagle")).toEqual(["near", "near", "miss", "near", "hit"]);
  expect(score("speed", "abide")).toEqual(["miss", "miss", "near", "miss", "near"]);
});

test("score orders by guesses, then time", () => {
  expect(encodeScore(3, 90_000)).toBeLessThan(encodeScore(4, 5_000));
  expect(encodeScore(3, 10_000)).toBeLessThan(encodeScore(3, 20_000));
  expect(decodeScore(encodeScore(4, 12_345))).toEqual({ guesses: 4, ms: 12_345 });
});
