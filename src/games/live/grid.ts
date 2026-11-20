/** Shared bits for grid-based live games (Light Cycles, Snake Duel). */
import type { Side } from "../types";

export type Dir = "up" | "down" | "left" | "right";
export const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
export const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const isDir = (x: unknown): x is Dir => x === "up" || x === "down" || x === "left" || x === "right";

/** P1 uses WASD, P2 the arrow keys (on a shared keyboard). Online, both sets work for you. */
export const GRID_KEYS: Record<string, [Side, Dir]> = {
  w: ["host", "up"], a: ["host", "left"], s: ["host", "down"], d: ["host", "right"],
  arrowup: ["guest", "up"], arrowleft: ["guest", "left"], arrowdown: ["guest", "down"], arrowright: ["guest", "right"],
};

/** Turn unless it's a U-turn into yourself. */
export const turn = (current: Dir, wanted: unknown): Dir => (isDir(wanted) && wanted !== OPPOSITE[current] ? wanted : current);
