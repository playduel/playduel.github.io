import type { ComponentType } from "react";
import type { Better } from "../core/match";
import type { LiveInput } from "../net/protocol";

/**
 * A snapshot of how a player is doing mid-round, shown live to the opponent.
 * Cosmetic only: the round is still decided by the final score.
 */
export interface Progress {
  /** 0..1, how full the meter is. Same scale for both players. */
  fraction: number;
  /** The big number, e.g. "12" or "241". */
  headline: string;
  /** What the number means, e.g. "solved" or "ms avg". */
  unit: string;
  /** One short line of context, e.g. "Try 2 of 3". */
  detail: string;
}

export interface GameProps<P> {
  puzzle: P;
  /** Call exactly once with the final score. */
  onFinish: (score: number) => void;
  /** Call whenever the visible progress changes (optional). */
  onProgress?: (p: Progress) => void;
}

/**
 * Every minigame implements this. The match code only ever sees this shape,
 * so adding a game means adding one folder and one line in registry.ts.
 *
 * Puzzle generation (`createPuzzle`) is separated from the React component so
 * it's a plain function we can unit-test for determinism: same seed in, same
 * puzzle out, on both players' devices.
 */
export interface MiniGame<P = unknown> {
  id: string;
  name: string;
  emoji: string;
  instructions: string;
  /** Keyboard controls, shown to PC players. */
  keyHint: string;
  /** Hard cap; the game must call onFinish by then. */
  durationMs: number;
  better: Better;
  formatScore: (score: number) => string;
  /** How a winning margin reads, e.g. "87 ms faster" or "3 more solved". */
  formatMargin: (diff: number) => string;
  createPuzzle: (seed: number) => P;
  Component: ComponentType<GameProps<P>>;
  /** Set for head-to-head games where both players share one live board. */
  live?: LiveSpec<any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export type Side = "host" | "guest";

export interface LiveViewProps<S, I> {
  state: S;
  /** Whose screen this is; null on a shared same-keyboard screen. */
  me: Side | null;
  /** Send an input for `side` (defaults to `me`). */
  input: (i: I, side?: Side) => void;
}

/**
 * A live game is a pure, deterministic simulation: `step` turns (state,
 * host input, guest input) into the next state. The host runs it on a fixed
 * tick and sends each tick's inputs to the guest, who runs the same steps.
 * No physics or game state crosses the network, only inputs.
 * Rule for step functions: no Math.random, no Date, no trig (engines can
 * round those differently); seeded Rng and + - * / only.
 */
export interface LiveSpec<S, I extends LiveInput> {
  tickMs: number;
  /** "queue": each press is used once, one per tick (turns, moves). "hold": the latest value applies every tick (paddles). */
  inputMode: "queue" | "hold";
  init: (seed: number) => S;
  step: (s: S, host: I | null, guest: I | null) => S;
  /** The winner, "draw", or null while still playing. */
  outcome: (s: S) => Side | "draw" | null;
  /** Who wins when the clock runs out. */
  timeoutOutcome: (s: S) => Side | "draw";
  View: ComponentType<LiveViewProps<S, I>>;
  /** Same-keyboard controls: key (lower case) -> [side, input]. Hold-mode keys send `release` on key up. */
  keys: Record<string, [Side, I]>;
  /** Hold mode: the input to send when a key is let go. */
  release?: I;
}

/** Live games score 1 for a win and 0 otherwise; a draw (0-0) is replayed like any tie. */
export function defineLiveGame<S, I extends LiveInput>(g: {
  id: string;
  name: string;
  emoji: string;
  instructions: string;
  keyHint: string;
  durationMs: number;
  live: LiveSpec<S, I>;
}): MiniGame<number> {
  return {
    ...g,
    better: "higher",
    formatScore: (n) => (n >= 1 ? "Won" : "Lost"),
    formatMargin: () => "Won",
    createPuzzle: (seed) => seed,
    Component: () => null,
  };
}

/** Helper that keeps the puzzle type checked between createPuzzle and Component. */
export const defineGame = <P,>(g: MiniGame<P>): MiniGame<P> => g;
