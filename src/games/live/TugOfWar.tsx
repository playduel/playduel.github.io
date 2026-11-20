import { sfx } from "../../audio/sfx";
import type { LiveViewProps, Side } from "../types";
import { defineLiveGame } from "../types";
import { Legend } from "./LightCycles";
import { type TugState, WIN, initTug, stepTug, tugOutcome, tugTimeout } from "./tug";
import { sideName } from "../../ui/palette";
import "./style.css";

function View({ state, me, input }: LiveViewProps<TugState, string>) {
  const pull = (side?: Side) => {
    sfx("key");
    input("pull", side);
  };
  // Rope marker: centre is 50%; host pulls it left (toward the cyan side).
  const at = 50 - (state.pos / WIN) * 45;
  const button = (side: Side) => (
    <button
      key={side}
      className={`tug-btn tug-btn--${side}`}
      onPointerDown={(e) => { e.preventDefault(); pull(me ? undefined : side); }}
      data-testid={`tug-${side}`}
    >
      Pull!
      <small>{state.taps[side]} taps</small>
    </button>
  );
  return (
    <div className="tugwar">
      <Legend me={me} />
      <div className="tugwar__field">
        <div className="tugwar__zone tugwar__zone--host" />
        <div className="tugwar__zone tugwar__zone--guest" />
        <div className="tugwar__rope" />
        <div className="tugwar__knot" style={{ left: `${at}%` }} />
      </div>
      <p className="tugwar__lead">{state.pos === 0 ? "Even" : `${Math.abs(state.pos)} to ${sideName(state.pos > 0 ? "host" : "guest")}`}</p>
      <div className="tugwar__buttons">{me ? button(me) : [button("host"), button("guest")]}</div>
    </div>
  );
}

export const tugOfWarGame = defineLiveGame<TugState, string>({
  id: "tug",
  name: "Tug of War",
  emoji: "🪢",
  instructions: "Mash your button as fast as you can. Every tap pulls the rope your way. Drag it all the way to your side, or be ahead when 30 seconds are up.",
  keyHint: "Space or tap; on a shared keyboard P1 presses A, P2 presses L",
  durationMs: 30_000,
  live: {
    tickMs: 40,
    inputMode: "queue",
    init: initTug,
    step: stepTug,
    outcome: tugOutcome,
    timeoutOutcome: tugTimeout,
    View,
    keys: { a: ["host", "pull"], " ": ["host", "pull"], l: ["guest", "pull"], enter: ["guest", "pull"] },
  },
});
