import { Rng } from "../../core/rng";
import { DICT } from "../anagrams/puzzle";

export const SIZE = 4;
export const MIN_WORDS = 30;
export const POINTS: Record<number, number> = { 3: 100, 4: 400, 5: 800, 6: 1400 };

/** Letter weights roughly like English text (no Q: it's nearly useless without U). */
const WEIGHTS: Record<string, number> = {
  e: 12, a: 9, o: 8, i: 8, t: 9, n: 7, s: 7, r: 7, h: 4, l: 5, d: 4, c: 3, u: 4, m: 3,
  f: 2, p: 2, g: 2, w: 2, y: 2, b: 2, v: 1, k: 1, x: 0.5, j: 0.3, z: 0.3,
};
const BAG = Object.entries(WEIGHTS).flatMap(([ch, w]) => Array(Math.round(w * 2)).fill(ch) as string[]);

const PREFIXES: ReadonlySet<string> = new Set([...DICT].flatMap((w) => Array.from({ length: w.length }, (_, i) => w.slice(0, i + 1))));

export const neighbours = (i: number) => {
  const r = Math.floor(i / SIZE), c = i % SIZE;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if ((dr || dc) && nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) out.push(nr * SIZE + nc);
    }
  return out;
};

/** Every dictionary word you can trace through touching letters, each letter used once. */
export function findWords(letters: string[]): Set<string> {
  const found = new Set<string>();
  const walk = (i: number, word: string, used: Set<number>) => {
    const w = word + letters[i];
    if (!PREFIXES.has(w)) return;
    if (w.length >= 3 && DICT.has(w)) found.add(w);
    if (w.length >= 6) return;
    used.add(i);
    for (const n of neighbours(i)) if (!used.has(n)) walk(n, w, used);
    used.delete(i);
  };
  for (let i = 0; i < letters.length; i++) walk(i, "", new Set());
  return found;
}

export interface GridPuzzle { letters: string[]; words: string[] }

/** Keep rolling grids until one has at least 30 words to find. */
export function createGridPuzzle(seed: number): GridPuzzle {
  const rng = new Rng(seed);
  for (;;) {
    const letters = Array.from({ length: SIZE * SIZE }, () => rng.pick(BAG));
    if (letters.filter((l) => "aeiou".includes(l)).length < 4) continue;
    const words = findWords(letters);
    if (words.size >= MIN_WORDS) return { letters, words: [...words].sort((a, b) => b.length - a.length || a.localeCompare(b)) };
  }
}

/** Is `path` a chain of touching, distinct cells? */
export const isPath = (path: number[]) =>
  new Set(path).size === path.length && path.every((c, i) => i === 0 || neighbours(path[i - 1]!).includes(c));

/** Find a path that spells `word` (for typing on a keyboard), or null. */
export function pathFor(letters: string[], word: string): number[] | null {
  const go = (path: number[]): number[] | null => {
    if (path.length === word.length) return path;
    const options = path.length ? neighbours(path[path.length - 1]!) : letters.map((_, i) => i);
    for (const n of options) if (!path.includes(n) && letters[n] === word[path.length]) {
      const p = go([...path, n]);
      if (p) return p;
    }
    return null;
  };
  return go([]);
}
