import { Rng } from "../../core/rng";
import type { Side } from "../types";
import { DELTA, type Dir, turn } from "./grid";

export const W = 36, H = 36;

export interface Rider { x: number; y: number; dir: Dir; alive: boolean }
export interface CyclesState {
  riders: Record<Side, Rider>;
  /** 0 = empty, 1 = host's wall, 2 = guest's wall. */
  walls: number[];
  tick: number;
}

/** Riders start facing each other, mirrored, so neither side has an edge. */
export function initCycles(seed: number): CyclesState {
  const y = new Rng(seed).int(8, H - 9);
  const walls = new Array(W * H).fill(0);
  const host = { x: 6, y, dir: "right" as Dir, alive: true };
  const guest = { x: W - 7, y: H - 1 - y, dir: "left" as Dir, alive: true };
  walls[host.y * W + host.x] = 1;
  walls[guest.y * W + guest.x] = 2;
  return { riders: { host, guest }, walls, tick: 0 };
}

export function stepCycles(s: CyclesState, hostIn: unknown, guestIn: unknown): CyclesState {
  if (!s.riders.host.alive || !s.riders.guest.alive) return s;
  const move = (r: Rider, input: unknown): Rider => {
    const dir = turn(r.dir, input);
    const [dx, dy] = DELTA[dir];
    return { x: r.x + dx, y: r.y + dy, dir, alive: true };
  };
  const h = move(s.riders.host, hostIn);
  const g = move(s.riders.guest, guestIn);
  const crashed = (r: Rider) => r.x < 0 || r.x >= W || r.y < 0 || r.y >= H || s.walls[r.y * W + r.x] !== 0;
  const headOn = h.x === g.x && h.y === g.y;
  h.alive = !crashed(h) && !headOn;
  g.alive = !crashed(g) && !headOn;
  const walls = s.walls.slice();
  if (h.alive) walls[h.y * W + h.x] = 1;
  if (g.alive) walls[g.y * W + g.x] = 2;
  return { riders: { host: h, guest: g }, walls, tick: s.tick + 1 };
}

export function cyclesOutcome(s: CyclesState): Side | "draw" | null {
  const { host, guest } = s.riders;
  if (host.alive && guest.alive) return null;
  if (!host.alive && !guest.alive) return "draw";
  return host.alive ? "host" : "guest";
}
