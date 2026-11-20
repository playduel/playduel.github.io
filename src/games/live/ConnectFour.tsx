import { sfx } from "../../audio/sfx";
import type { LiveViewProps } from "../types";
import { defineLiveGame } from "../types";
import { type C4State, COLS, c4Outcome, initC4, stepC4 } from "./connect4";
import { Legend } from "./LightCycles";
import "./style.css";

function View({ state, me, input }: LiveViewProps<C4State, number>) {
  const myTurn = me === null || state.turn === me;
  const drop = (c: number) => {
    if (!myTurn || state.winner) return;
    sfx("key");
    input(c, me ?? state.turn);
  };
  return (
    <div className="c4">
      <Legend me={me} />
      <p className={`c4__turn c4__turn--${state.turn}`}>
        {state.winner ? "" : me === null ? `${state.turn === "host" ? "Cyan" : "Pink"} to play` : myTurn ? "Your turn" : "Their turn…"}
      </p>
      <div className="c4__board" data-testid="c4-board">
        {Array.from({ length: COLS }, (_, c) => (
          <button key={c} className="c4__col" onPointerDown={(e) => { e.preventDefault(); drop(c); }} aria-label={`Column ${c + 1}`} data-testid={`c4-col-${c}`}>
            {state.board
              .filter((_, i) => i % COLS === c)
              .map((v, r) => {
                const i = r * COLS + c;
                return <span key={r} className={`c4__slot ${v ? `is-${v}` : ""} ${state.line.includes(i) ? "is-line" : ""} ${state.last === i ? "is-last" : ""}`} />;
              })}
          </button>
        ))}
      </div>
    </div>
  );
}

const keys: Record<string, ["host" | "guest", number]> = {};
for (let c = 0; c < COLS; c++) {
  keys[String(c + 1)] = ["host", c]; // number keys 1-7 drop in a column
}

export const connectFourGame = defineLiveGame<C4State, number>({
  id: "connect4",
  name: "Connect Four",
  emoji: "🔴",
  instructions: "Take turns dropping discs. First to line up four in a row, across, down or diagonally, wins. Who goes first is random.",
  keyHint: "Number keys 1 to 7 pick a column",
  durationMs: 150_000,
  live: {
    tickMs: 60,
    inputMode: "queue",
    init: initC4,
    step: stepC4,
    outcome: c4Outcome,
    timeoutOutcome: () => "draw",
    View,
    keys,
  },
});
