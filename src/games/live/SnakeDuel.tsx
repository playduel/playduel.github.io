import type { LiveViewProps } from "../types";
import { defineLiveGame } from "../types";
import { GRID_KEYS } from "./grid";
import { GridBoard, SIDE_COLORS } from "./GridBoard";
import { Legend } from "./LightCycles";
import { SH, SW, type SnakesState, initSnakes, snakesOutcome, snakesTimeout, stepSnakes } from "./snakes";
import "./style.css";

function View({ state, me, input }: LiveViewProps<SnakesState, string>) {
  const cells: Array<[number, string]> = [];
  const glow: Array<[number, string, "square" | "dot"]> = [[state.food, "#f9c80e", "dot"]];
  for (const side of ["host", "guest"] as const) {
    const sn = state.snakes[side];
    sn.body.slice(1).forEach((b) => b >= 0 && cells.push([b, sn.alive ? SIDE_COLORS[side].body : "rgba(255,255,255,0.35)"]));
    if (sn.body[0]! >= 0) glow.push([sn.body[0]!, SIDE_COLORS[side].head, "square"]);
  }
  const { host, guest } = state.snakes;
  return (
    <>
      <Legend me={me} left={`Cyan ${host.body.length}`} right={`Pink ${guest.body.length}`} />
      <GridBoard w={SW} h={SH} paint={{ cells, glow }} steer={(d) => input(d)} me={me} />
    </>
  );
}

export const snakeDuelGame = defineLiveGame<SnakesState, string>({
  id: "snakeduel",
  name: "Snake Duel",
  emoji: "🐉",
  instructions: "Both snakes share one board and one food supply. Hit a wall, yourself or the other snake and you lose. If time runs out, the longer snake wins.",
  keyHint: "Arrow keys or WASD; on a shared keyboard P1 uses WASD, P2 the arrows",
  durationMs: 90_000,
  live: {
    tickMs: 120,
    inputMode: "queue",
    init: initSnakes,
    step: stepSnakes,
    outcome: snakesOutcome,
    timeoutOutcome: snakesTimeout,
    View,
    keys: GRID_KEYS,
  },
});
