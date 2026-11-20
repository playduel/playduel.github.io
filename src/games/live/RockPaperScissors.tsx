import { sfx } from "../../audio/sfx";
import type { LiveViewProps, Side } from "../types";
import { defineLiveGame } from "../types";
import { Legend } from "./LightCycles";
import { COUNT, PICKS, type Pick, type RpsState, TICK_MS, TO_WIN, initRps, rpsOutcome, rpsTimeout, stepRps } from "./rps";
import { sideName } from "../../ui/palette";
import "./style.css";

const HAND: Record<Pick, string> = { rock: "✊", paper: "✋", scissors: "✌️" };
const CALL = ["Rock…", "Paper…", "Scissors…", "Shoot!"];

function View({ state, me, input }: LiveViewProps<RpsState, string>) {
  const last = state.history.at(-1);
  const reveal = state.stage === "reveal" && last;
  const call = CALL[Math.min(3, Math.floor((state.t / COUNT) * 4))]!;

  const hand = (side: Side) => {
    const winner = reveal ? last.winner : null;
    const pick = reveal ? last[side] : null;
    // While counting, only show whether they've picked, never what.
    const shown = reveal ? (pick ? HAND[pick] : "…") : me === side && state.pick[side] ? HAND[state.pick[side]!] : state.pick[side] ? "✔" : "?";
    return (
      <div className={`rps__hand rps__hand--${side} ${winner === side ? "is-win" : winner ? "is-lose" : ""} ${reveal ? "is-reveal" : ""}`} key={`${side}${state.history.length}${state.stage}`}>
        <span className={`rps__glyph ${Object.values(HAND).includes(shown) ? "is-hand" : ""}`}>{shown}</span>
        <span className="rps__pips">{Array.from({ length: TO_WIN }, (_, i) => <i key={i} className={i < state.wins[side] ? "is-on" : ""} />)}</span>
      </div>
    );
  };

  const choose = (p: Pick, side?: Side) => { sfx("key"); input(p, side); };
  const row = (side: Side) => (
    <div key={side} className={`rps__row rps__row--${side}`}>
      {PICKS.map((p) => (
        <button key={p} className={`rps__btn ${me === side && state.pick[side] === p && state.stage === "count" ? "is-on" : ""}`} onPointerDown={(e) => { e.preventDefault(); choose(p, me ? undefined : side); }} aria-label={p} data-testid={`rps-${side}-${p}`}>
          {HAND[p]}
        </button>
      ))}
    </div>
  );
  return (
    <div className="rps">
      <Legend me={me} left={`${sideName("host")} ${state.wins.host}`} right={`${sideName("guest")} ${state.wins.guest}`} />
      <p className="rps__call" key={reveal ? "r" : call}>{reveal ? (last.winner ? `${sideName(last.winner)} takes it` : "Same! Again") : call}</p>
      <div className="rps__stage">
        {hand("host")}
        <span className="rps__vs">VS</span>
        {hand("guest")}
      </div>
      <div className="rps__controls">{me ? row(me) : [row("host"), row("guest")]}</div>
    </div>
  );
}

export const rockPaperScissorsGame = defineLiveGame<RpsState, string>({
  id: "rps",
  name: "Rock Paper Scissors",
  emoji: "✊",
  instructions: "Pick rock, paper or scissors before \"Shoot!\". You can change your mind until then, and your opponent only sees that you've picked. No pick loses the throw. First to 3 throws wins.",
  keyHint: "1 2 3 for rock, paper, scissors; on a shared keyboard P1 uses A S D, P2 uses J K L",
  durationMs: 90_000,
  live: {
    tickMs: TICK_MS,
    inputMode: "queue",
    init: initRps,
    step: stepRps,
    outcome: rpsOutcome,
    timeoutOutcome: rpsTimeout,
    View,
    keys: {
      a: ["host", "rock"], s: ["host", "paper"], d: ["host", "scissors"],
      "1": ["host", "rock"], "2": ["host", "paper"], "3": ["host", "scissors"],
      j: ["guest", "rock"], k: ["guest", "paper"], l: ["guest", "scissors"],
    },
  },
});
