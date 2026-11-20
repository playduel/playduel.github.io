import { Rng } from "../../core/rng";

export const W = 9, H = 9, MINES = 10;
export const MINE_PENALTY_MS = 10_000;

export interface MinesPuzzle {
  mines: boolean[];
  /** Number of mines touching each cell. */
  counts: number[];
  /** A cell with no mines around it, opened for you at the start (same for both players). */
  start: number;
}

export const around = (i: number) => {
  const r = Math.floor(i / W), c = i % W;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if ((dr || dc) && nr >= 0 && nr < H && nc >= 0 && nc < W) out.push(nr * W + nc);
    }
  return out;
};

/**
 * "First click is always safe" normally depends on where you click, which
 * would give two players different boards. Instead the board comes with a
 * guaranteed-empty starting cell already opened, so the board is identical.
 */
export function createMinesPuzzle(seed: number): MinesPuzzle {
  const rng = new Rng(seed);
  for (;;) {
    const cells = rng.shuffle(Array.from({ length: W * H }, (_, i) => i));
    const mines = new Array(W * H).fill(false);
    for (const i of cells.slice(0, MINES)) mines[i] = true;
    const counts = mines.map((_, i) => around(i).filter((j) => mines[j]).length);
    const zeros = counts.map((n, i) => (n === 0 && !mines[i] ? i : -1)).filter((i) => i >= 0);
    if (zeros.length) return { mines, counts, start: rng.pick(zeros) };
  }
}

/** Opens a cell; empty cells open their neighbours too (flood fill). */
export function open(p: MinesPuzzle, revealed: boolean[], i: number): boolean[] {
  const next = revealed.slice();
  const stack = [i];
  while (stack.length) {
    const cur = stack.pop()!;
    if (next[cur]) continue;
    next[cur] = true;
    if (!p.mines[cur] && p.counts[cur] === 0) for (const j of around(cur)) if (!next[j] && !p.mines[j]) stack.push(j);
  }
  return next;
}

export const safeLeft = (p: MinesPuzzle, revealed: boolean[]) => revealed.filter((r, i) => !r && !p.mines[i]).length;
