import { sfx } from "../../audio/sfx";
import type { LiveViewProps } from "../types";
import { defineLiveGame } from "../types";
import { B, type DotsState, H_EDGES, boxCount, dotsOutcome, dotsTimeout, initDots, stepDots } from "./dots";
import { Legend } from "./LightCycles";
import "./style.css";

const GAP = 20;
const pos = (n: number) => 10 + n * GAP;

function View({ state, me, input }: LiveViewProps<DotsState, number>) {
  const myTurn = me === null || state.turn === me;
  const draw = (e: number) => {
    if (!myTurn || state.edges[e]) return;
    sfx("key");
    input(e, me ?? state.turn);
  };
  const edges = Array.from({ length: 2 * H_EDGES }, (_, e) => {
    const horiz = e < H_EDGES;
    const k = horiz ? e : e - H_EDGES;
    const r = horiz ? Math.floor(k / B) : Math.floor(k / (B + 1));
    const c = horiz ? k % B : k % (B + 1);
    const [x1, y1, x2, y2] = horiz ? [pos(c), pos(r), pos(c + 1), pos(r)] : [pos(c), pos(r), pos(c), pos(r + 1)];
    const owner = state.edges[e];
    return (
      <g key={e} className={`dots__edge ${owner ? `is-${owner}` : myTurn ? "is-open" : ""} ${state.last === e ? "is-last" : ""}`} onPointerDown={(ev) => { ev.preventDefault(); draw(e); }} data-testid={`edge-${e}`}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} className="dots__hit" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} className="dots__line" />
      </g>
    );
  });
  return (
    <div className="dots">
      <Legend me={me} left={`Cyan ${boxCount(state, "host")}`} right={`Pink ${boxCount(state, "guest")}`} />
      <p className={`c4__turn c4__turn--${state.turn}`}>{me === null ? `${state.turn === "host" ? "Cyan" : "Pink"} to play` : myTurn ? "Your turn" : "Their turn…"}</p>
      <svg className="dots__board" viewBox={`0 0 ${GAP * B + 20} ${GAP * B + 20}`} data-testid="dots-board">
        {state.boxes.map((b, i) => b && <rect key={i} x={pos(i % B) + 1.5} y={pos(Math.floor(i / B)) + 1.5} width={GAP - 3} height={GAP - 3} className={`dots__box is-${b}`} />)}
        {edges}
        {Array.from({ length: (B + 1) * (B + 1) }, (_, i) => <circle key={i} cx={pos(i % (B + 1))} cy={pos(Math.floor(i / (B + 1)))} r={1.6} className="dots__dot" />)}
      </svg>
    </div>
  );
}

export const dotsAndBoxesGame = defineLiveGame<DotsState, number>({
  id: "dots",
  name: "Dots and Boxes",
  emoji: "🔲",
  instructions: "Take turns drawing a line between two dots. Close a box with the fourth line and it's yours, and you go again. Most boxes when the grid is full wins.",
  keyHint: "Click a gap between two dots",
  durationMs: 180_000,
  live: {
    tickMs: 60,
    inputMode: "queue",
    init: initDots,
    step: stepDots,
    outcome: dotsOutcome,
    timeoutOutcome: dotsTimeout,
    View,
    keys: {},
    turnOf: (s) => s.turn,
  },
});
