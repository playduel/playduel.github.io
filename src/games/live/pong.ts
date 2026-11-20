import { Rng } from "../../core/rng";
import type { Side } from "../types";

/**
 * Pong on a 100 x 60 field, stepped 30 times a second. Plain + - * / only
 * (no trig), so every browser computes exactly the same ball path.
 */
export const FW = 100, FH = 60;
export const PADDLE_H = 14, PADDLE_X = 4, BALL_R = 1.4;
export const WIN_POINTS = 5;
const PADDLE_SPEED = 1.7;
const START_SPEED = 0.9, MAX_SPEED = 2.4;
const SERVE_WAIT = 25;

export interface PongState {
  paddles: Record<Side, number>; // centre y
  ball: { x: number; y: number; vx: number; vy: number };
  score: Record<Side, number>;
  /** Ticks until the ball is served after a point. */
  wait: number;
  /** Which way the next serve goes: +1 toward the guest, -1 toward the host. */
  serve: number;
}

const serveBall = (dir: number, tilt: number) => ({ x: FW / 2, y: FH / 2, vx: START_SPEED * dir, vy: tilt });

export function initPong(seed: number): PongState {
  const rng = new Rng(seed);
  const dir = rng.next() < 0.5 ? 1 : -1;
  return {
    paddles: { host: FH / 2, guest: FH / 2 },
    ball: serveBall(dir, (rng.next() - 0.5) * 0.8),
    score: { host: 0, guest: 0 },
    wait: SERVE_WAIT,
    serve: dir,
  };
}

const move = (y: number, input: unknown) => {
  const d = input === "up" ? -PADDLE_SPEED : input === "down" ? PADDLE_SPEED : 0;
  return Math.max(PADDLE_H / 2, Math.min(FH - PADDLE_H / 2, y + d));
};

export function stepPong(s: PongState, hostIn: unknown, guestIn: unknown): PongState {
  if (pongOutcome(s)) return s;
  const paddles = { host: move(s.paddles.host, hostIn), guest: move(s.paddles.guest, guestIn) };
  if (s.wait > 0) return { ...s, paddles, wait: s.wait - 1 };

  let { x, y, vx, vy } = s.ball;
  x += vx;
  y += vy;
  if (y < BALL_R) { y = 2 * BALL_R - y; vy = -vy; }
  if (y > FH - BALL_R) { y = 2 * (FH - BALL_R) - y; vy = -vy; }

  // Paddle hits: the further from the paddle's centre, the steeper the bounce.
  const hit = (py: number) => Math.abs(y - py) <= PADDLE_H / 2 + BALL_R;
  const speedUp = (v: number) => Math.min(MAX_SPEED, Math.abs(v) * 1.06);
  if (vx < 0 && x - BALL_R <= PADDLE_X + 1 && x > PADDLE_X - 2 && hit(paddles.host)) {
    vx = speedUp(vx);
    vy = ((y - paddles.host) / (PADDLE_H / 2)) * vx * 0.9;
    x = PADDLE_X + 1 + BALL_R;
  } else if (vx > 0 && x + BALL_R >= FW - PADDLE_X - 1 && x < FW - PADDLE_X + 2 && hit(paddles.guest)) {
    vx = -speedUp(vx);
    vy = ((y - paddles.guest) / (PADDLE_H / 2)) * -vx * 0.9;
    x = FW - PADDLE_X - 1 - BALL_R;
  }

  if (x < 0 || x > FW) {
    const scorer: Side = x < 0 ? "guest" : "host";
    const score = { ...s.score, [scorer]: s.score[scorer] + 1 };
    const serve = scorer === "host" ? -1 : 1; // serve toward whoever just lost the point
    return { paddles, ball: serveBall(serve, serve * 0.3), score, wait: SERVE_WAIT, serve };
  }
  return { ...s, paddles, ball: { x, y, vx, vy } };
}

export const pongOutcome = (s: PongState): Side | null =>
  s.score.host >= WIN_POINTS ? "host" : s.score.guest >= WIN_POINTS ? "guest" : null;
export const pongTimeout = (s: PongState): Side | "draw" =>
  s.score.host === s.score.guest ? "draw" : s.score.host > s.score.guest ? "host" : "guest";
