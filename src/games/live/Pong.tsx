import type { LiveViewProps, Side } from "../types";
import { defineLiveGame } from "../types";
import { Legend } from "./LightCycles";
import { BALL_R, FH, FW, PADDLE_H, PADDLE_X, type PongState, initPong, pongOutcome, pongTimeout, stepPong } from "./pong";
import "./style.css";

function View({ state, me, input }: LiveViewProps<PongState, string>) {
  // Hold-to-move buttons: pressing sends up/down, letting go sends stop.
  const pad = (side: Side) => (
    <div key={side} className={`pong__pad pong__pad--${side}`}>
      {(["up", "down"] as const).map((d) => (
        <button
          key={d}
          className="pong__btn"
          onPointerDown={(e) => { e.preventDefault(); input(d, me ? undefined : side); }}
          onPointerUp={() => input("stop", me ? undefined : side)}
          onPointerLeave={() => input("stop", me ? undefined : side)}
          onPointerCancel={() => input("stop", me ? undefined : side)}
          aria-label={d}
        >
          {d === "up" ? "▲" : "▼"}
        </button>
      ))}
    </div>
  );
  return (
    <div className="pong">
      <Legend me={me} left={`Cyan ${state.score.host}`} right={`Pink ${state.score.guest}`} />
      <svg className="pong__field" viewBox={`0 0 ${FW} ${FH}`} data-testid="pong-field">
        <line x1={FW / 2} y1={0} x2={FW / 2} y2={FH} className="pong__net" />
        <text x={FW / 2 - 8} y={10} className="pong__score pong__score--host">{state.score.host}</text>
        <text x={FW / 2 + 4} y={10} className="pong__score pong__score--guest">{state.score.guest}</text>
        <rect x={PADDLE_X - 1} y={state.paddles.host - PADDLE_H / 2} width={2} height={PADDLE_H} className="pong__paddle pong__paddle--host" />
        <rect x={FW - PADDLE_X - 1} y={state.paddles.guest - PADDLE_H / 2} width={2} height={PADDLE_H} className="pong__paddle pong__paddle--guest" />
        {state.wait === 0 && <circle cx={state.ball.x} cy={state.ball.y} r={BALL_R} className="pong__ball" />}
      </svg>
      <div className="pong__controls">{me ? pad(me) : [pad("host"), pad("guest")]}</div>
    </div>
  );
}

export const pongGame = defineLiveGame<PongState, string>({
  id: "pong",
  name: "Pong",
  emoji: "🏓",
  instructions: "Move your paddle to hit the ball back. Miss it and they score. First to 5 points wins. You're cyan on the left if you made the room, pink on the right if you joined.",
  keyHint: "W/S or arrow keys; on a shared keyboard P1 uses W/S, P2 the arrows",
  durationMs: 120_000,
  live: {
    tickMs: 33,
    inputMode: "hold",
    init: initPong,
    step: stepPong,
    outcome: pongOutcome,
    timeoutOutcome: pongTimeout,
    View,
    keys: { w: ["host", "up"], s: ["host", "down"], arrowup: ["guest", "up"], arrowdown: ["guest", "down"] },
    release: "stop",
  },
});
