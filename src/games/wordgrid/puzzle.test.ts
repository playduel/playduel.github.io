import { expect, test } from "vitest";
import { MIN_WORDS, createGridPuzzle, findWords, isPath, pathFor } from "./puzzle";

test("reproducible grids with plenty of words", () => {
  expect(createGridPuzzle(1)).toEqual(createGridPuzzle(1));
  for (let s = 0; s < 10; s++) {
    const p = createGridPuzzle(s);
    expect(p.letters).toHaveLength(16);
    expect(p.words.length).toBeGreaterThanOrEqual(MIN_WORDS);
  }
});

test("paths must be touching and not reuse cells", () => {
  expect(isPath([0, 1, 5])).toBe(true);
  expect(isPath([0, 2])).toBe(false);
  expect(isPath([0, 1, 0])).toBe(false);
});

test("finds words and paths in a known grid", () => {
  const letters = [..."catsxxxxxxxxxxxx"];
  const words = findWords(letters);
  expect(words.has("cat")).toBe(true);
  expect(words.has("cats")).toBe(true);
  expect(pathFor(letters, "cats")).toEqual([0, 1, 2, 3]);
  expect(pathFor(letters, "scat")).toBeNull();
});
