import { sfx } from "../../audio/sfx";
import type { LiveViewProps, Side } from "../types";
import { defineLiveGame } from "../types";
import { Legend } from "./LightCycles";
import { AIR, type Jumper, type RopeState, TICK_MS, initRope, ropeOutcome, ropeTimeout, stepRope } from "./jumprope";
import { sideName } from "../../ui/palette";
import "./style.css";

const X: Record<Side, number> = { host: 78, guest: 122 };
const FEET = 104;

/** A stick figure: arcs up while in the air, falls flat when tripped. */
function Figure({ side, j }: { side: Side; j: Jumper }) {
  const t = (AIR - j.air) / AIR;
  const lift = j.air > 0 ? 4 * 20 * t * (1 - t) : 0;
  const x = X[side];
  const y = FEET - lift;
  return (
    <g className={`rope__kid rope__kid--${side} ${j.alive ? "" : "is-out"}`} transform={j.alive ? undefined : `rotate(${side === "host" ? -80 : 80} ${x} ${FEET})`}>
      <circle cx={x} cy={y - 40} r={6} />
      <line x1={x} y1={y - 34} x2={x} y2={y - 14} />
      <line x1={x} y1={y - 28} x2={x - 9} y2={y - 20 - (j.air ? 8 : 0)} />
      <line x1={x} y1={y - 28} x2={x + 9} y2={y - 20 - (j.air ? 8 : 0)} />
      <line x1={x} y1={y - 14} x2={x - 6} y2={y - (j.air ? 4 : 0)} />
      <line x1={x} y1={y - 14} x2={x + 6} y2={y - (j.air ? 4 : 0)} />
    </g>
  );
}

function View({ state, me, input }: LiveViewProps<RopeState, string>) {
  // The rope is a curve between the two turners' hands; its sag follows the
  // turn: under the feet at phase 0, overhead half a turn later.
  const angle = (2 * Math.PI * state.phase) / state.period;
  const c = 50 + 92 * Math.cos(angle);
  const rope = <path d={`M 14 58 Q 100 ${c} 186 58`} className={`rope__line ${Math.cos(angle) > 0 ? "is-front" : "is-back"}`} />;
  const near = state.period - state.phase <= 8; // rope about to reach the feet
  const jump = (side?: Side) => { sfx("tap"); input("jump", side); };
  const button = (side: Side) => (
    <button key={side} className={`tug-btn tug-btn--${side}`} onPointerDown={(e) => { e.preventDefault(); jump(me ? undefined : side); }} data-testid={`rope-${side}`}>
      Jump!
      <small>{state.p[side].jumps} jumps</small>
    </button>
  );
  return (
    <div className="rope">
      <Legend me={me} left={`${sideName("host")} ${state.p.host.jumps}`} right={`${sideName("guest")} ${state.p.guest.jumps}`} />
      <svg className="rope__field" viewBox="0 0 200 120" data-testid="rope-field">
        <line x1={0} y1={FEET + 1} x2={200} y2={FEET + 1} className="rope__floor" />
        <ellipse cx={100} cy={FEET + 2} rx={46} ry={4} className={`rope__mark ${near ? "is-near" : ""}`} />
        {Math.cos(angle) <= 0 && rope}
        <Figure side="host" j={state.p.host} />
        <Figure side="guest" j={state.p.guest} />
        {Math.cos(angle) > 0 && rope}
        <g className="rope__turner"><circle cx={10} cy={48} r={5} /><line x1={10} y1={53} x2={10} y2={FEET} /><line x1={10} y1={58} x2={14} y2={58} /></g>
        <g className="rope__turner"><circle cx={190} cy={48} r={5} /><line x1={190} y1={53} x2={190} y2={FEET} /><line x1={190} y1={58} x2={186} y2={58} /></g>
        <text x={100} y={14} className="rope__speed">{Math.round((60_000 / (state.period * TICK_MS)) )} turns / min</text>
      </svg>
      <div className="tugwar__buttons">{me ? button(me) : [button("host"), button("guest")]}</div>
    </div>
  );
}

export const jumpRopeGame = defineLiveGame<RopeState, string>({
  id: "rope",
  name: "Jump Rope",
  emoji: "🤸",
  instructions: "One rope, two jumpers. Jump just before the rope reaches your feet. Too late or too early and you trip. It keeps getting faster. Last one jumping wins.",
  keyHint: "Space or tap to jump; on a shared keyboard P1 presses A, P2 presses L",
  durationMs: 90_000,
  live: {
    tickMs: TICK_MS,
    inputMode: "queue",
    init: initRope,
    step: stepRope,
    outcome: ropeOutcome,
    timeoutOutcome: ropeTimeout,
    View,
    keys: { a: ["host", "jump"], w: ["host", "jump"], " ": ["host", "jump"], l: ["guest", "jump"], arrowup: ["guest", "jump"], enter: ["guest", "jump"] },
  },
});
