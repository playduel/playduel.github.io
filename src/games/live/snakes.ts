import { Rng } from "../../core/rng";
import type { Side } from "../types";
import { DELTA, type Dir, turn } from "./grid";

export const SW = 24, SH = 24;

export interface Snake { body: number[]; dir: Dir; alive: boolean }
export interface SnakesState {
  snakes: Record<Side, Snake>;
  food: number;
  /** Where food appears, in order; the next one skips cells under a snake. */
  foods: number[];
  foodIndex: number;
}

const cell = (x: number, y: number) => y * SW + x;

export function initSnakes(seed: number): SnakesState {
  const rng = new Rng(seed);
  const foods = Array.from({ length: 800 }, () => rng.int(0, SW * SH - 1));
  const host = { body: [cell(5, 6), cell(4, 6), cell(3, 6)], dir: "right" as Dir, alive: true };
  const guest = { body: [cell(SW - 6, SH - 7), cell(SW - 5, SH - 7), cell(SW - 4, SH - 7)], dir: "left" as Dir, alive: true };
  return placeFood({ snakes: { host, guest }, food: -1, foods, foodIndex: 0 });
}

function placeFood(s: SnakesState): SnakesState {
  const taken = new Set([...s.snakes.host.body, ...s.snakes.guest.body]);
  let i = s.foodIndex;
  while (taken.has(s.foods[i % s.foods.length]!)) i++;
  return { ...s, food: s.foods[i % s.foods.length]!, foodIndex: i + 1 };
}

export function stepSnakes(s: SnakesState, hostIn: unknown, guestIn: unknown): SnakesState {
  if (!s.snakes.host.alive || !s.snakes.guest.alive) return s;
  const next = (sn: Snake, input: unknown) => {
    const dir = turn(sn.dir, input);
    const head = sn.body[0]!;
    const [dx, dy] = DELTA[dir];
    const x = (head % SW) + dx, y = Math.floor(head / SW) + dy;
    const out = x < 0 || x >= SW || y < 0 || y >= SH;
    return { dir, head: out ? -1 : cell(x, y) };
  };
  const h = next(s.snakes.host, hostIn);
  const g = next(s.snakes.guest, guestIn);
  const hEats = h.head === s.food, gEats = g.head === s.food && !hEats;
  const grow = (sn: Snake, n: { dir: Dir; head: number }, eats: boolean): Snake => ({
    body: [n.head, ...(eats ? sn.body : sn.body.slice(0, -1))],
    dir: n.dir,
    alive: true,
  });
  const H2 = grow(s.snakes.host, h, hEats);
  const G2 = grow(s.snakes.guest, g, gEats);
  // Collisions are checked against both snakes AFTER moving, so chasing a tail is safe.
  const hits = (head: number, ownBody: number[], otherBody: number[]) =>
    head < 0 || ownBody.slice(1).includes(head) || otherBody.includes(head);
  H2.alive = !hits(h.head, H2.body, G2.body);
  G2.alive = !hits(g.head, G2.body, H2.body);
  const state = { ...s, snakes: { host: H2, guest: G2 } };
  return hEats || gEats ? placeFood(state) : state;
}

const longer = (s: SnakesState): Side | "draw" => {
  const a = s.snakes.host.body.length, b = s.snakes.guest.body.length;
  return a === b ? "draw" : a > b ? "host" : "guest";
};

export function snakesOutcome(s: SnakesState): Side | "draw" | null {
  const { host, guest } = s.snakes;
  if (host.alive && guest.alive) return null;
  if (!host.alive && !guest.alive) return longer(s);
  return host.alive ? "host" : "guest";
}

export const snakesTimeout = longer;
