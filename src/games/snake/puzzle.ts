import { Rng } from "../../core/rng";

export const GRID = 18;
export const TICK_MS = 115;
export const START_LENGTH = 3;

export type Dir = "up" | "down" | "left" | "right";
export interface SnakePuzzle {
  /** Where food appears, in order. Same list for both players. */
  food: number[];
}

export function createSnakePuzzle(seed: number): SnakePuzzle {
  const rng = new Rng(seed);
  return { food: Array.from({ length: 600 }, () => rng.int(0, GRID * GRID - 1)) };
}

export interface SnakeState {
  /** Head first, as cell indexes. */
  body: number[];
  dir: Dir;
  /** Index into puzzle.food of the next food to place. */
  foodIndex: number;
  food: number;
  alive: boolean;
}

const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

/** First food position in the list that isn't under the snake. */
function placeFood(p: SnakePuzzle, from: number, body: number[]): { food: number; foodIndex: number } {
  let i = from;
  while (body.includes(p.food[i % p.food.length]!)) i++;
  return { food: p.food[i % p.food.length]!, foodIndex: i + 1 };
}

export function startState(p: SnakePuzzle): SnakeState {
  const mid = Math.floor(GRID / 2) * GRID + 4;
  const body = [mid, mid - 1, mid - 2];
  return { body, dir: "right", alive: true, ...placeFood(p, 0, body) };
}

/** One tick of the game: pure, so it's easy to test and identical everywhere. */
export function tick(p: SnakePuzzle, s: SnakeState, turn?: Dir): SnakeState {
  if (!s.alive) return s;
  const dir = turn && turn !== OPPOSITE[s.dir] ? turn : s.dir;
  const head = s.body[0]!;
  const r = Math.floor(head / GRID), c = head % GRID;
  const nr = r + (dir === "down" ? 1 : dir === "up" ? -1 : 0);
  const nc = c + (dir === "right" ? 1 : dir === "left" ? -1 : 0);
  if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) return { ...s, dir, alive: false };
  const next = nr * GRID + nc;
  const eats = next === s.food;
  const body = [next, ...(eats ? s.body : s.body.slice(0, -1))];
  if (body.slice(1).includes(next)) return { ...s, dir, alive: false };
  return eats ? { ...s, body, dir, ...placeFood(p, s.foodIndex, body) } : { ...s, body, dir };
}
