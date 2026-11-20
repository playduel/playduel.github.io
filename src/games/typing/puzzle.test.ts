import { expect, test } from "vitest";
import { createTypingPuzzle, typingScore } from "./puzzle";

test("reproducible, plain lowercase text", () => {
  expect(createTypingPuzzle(4)).toEqual(createTypingPuzzle(4));
  for (let s = 0; s < 30; s++) expect(createTypingPuzzle(s).text).toMatch(/^[a-z ]{60,200}$/);
});

test("wpm with an accuracy penalty", () => {
  expect(typingScore(300, 0, 60_000)).toBe(60); // 60 words in a minute
  expect(typingScore(300, 100, 60_000)).toBe(45); // 75% accurate
  expect(typingScore(0, 3, 1000)).toBe(0);
});
