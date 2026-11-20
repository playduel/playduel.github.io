import type { LiveViewProps, Side } from "../types";
import { defineLiveGame } from "../types";
import { type CyclesState, H, W, cyclesOutcome, initCycles, stepCycles } from "./cycles";
import { GRID_KEYS } from "./grid";
import { GridBoard, SIDE_COLORS } from "./GridBoard";
import { sideName } from "../../ui/palette";
import "./style.css";

export function Legend({ me, left = sideName("host"), right = sideName("guest") }: { me: Side | null; left?: string; right?: string }) {
  return (
    <p className="live__legend">
      <span className="p1">{left}{me === "host" ? " (you)" : ""}</span>
      <span className="p2">{right}{me === "guest" ? " (you)" : ""}</span>
    </p>
  );
}

function View({ state, me, input }: LiveViewProps<CyclesState, string>) {
  const cells: Array<[number, string]> = [];
  state.walls.forEach((v, i) => v && cells.push([i, v === 1 ? SIDE_COLORS.host.body : SIDE_COLORS.guest.body]));
  const glow: Array<[number, string, "square"]> = (["host", "guest"] as const).map((s) => {
    const r = state.riders[s];
    return [Math.max(0, Math.min(W - 1, r.x)) + Math.max(0, Math.min(H - 1, r.y)) * W, r.alive ? SIDE_COLORS[s].head : "#ffffff", "square"];
  });
  return (
    <>
      <Legend me={me} />
      <GridBoard w={W} h={H} paint={{ cells, glow }} steer={(d, side) => input(d, side)} me={me} />
    </>
  );
}

export const lightCyclesGame = defineLiveGame<CyclesState, string>({
  id: "cycles",
  name: "Light Cycles",
  emoji: "🏍",
  instructions: "You both ride at once and leave a wall behind you. Turn to avoid every wall, including your own. Last one riding wins. Live: what you do changes their game.",
  keyHint: "Arrow keys or WASD; on a shared keyboard P1 uses WASD, P2 the arrows",
  durationMs: 90_000,
  live: {
    tickMs: 90,
    inputMode: "queue",
    init: initCycles,
    step: stepCycles,
    outcome: cyclesOutcome,
    timeoutOutcome: () => "draw",
    View,
    keys: GRID_KEYS,
  },
});
