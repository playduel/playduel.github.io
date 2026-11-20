/**
 * CPU opponents for practising live games alone. The bot always plays the
 * guest side (P2) and is asked for an input once per tick.
 *
 * Bots run only on the device that owns the simulation, so they may use
 * Math.random: the lockstep rule (no randomness in step()) is about keeping
 * two screens in sync, and a bot's input is just an input like a key press.
 *
 * Each bot is deliberately beatable: it reacts with a delay and makes mistakes.
 */
import type { LiveInput } from "../../net/protocol";
import { COLS, type C4State, ROWS, stepC4 } from "./connect4";
import { type CyclesState, H, W } from "./cycles";
import { B, type DotsState, EDGES, boxEdges } from "./dots";
import { DELTA, type Dir, OPPOSITE } from "./grid";
import { AIR, type RopeState } from "./jumprope";
import { FH, FW, PADDLE_X, type PongState } from "./pong";
import { COUNT, PICKS, type RpsState } from "./rps";
import { type SnakesState, SH, SW } from "./snakes";

export type Bot = (state: unknown) => LiveInput | null;
const chance = (p: number) => Math.random() < p;
const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)]!;

/** Turn-based games: wait a human-ish "thinking" time before moving. */
function thinker(decide: (s: never) => LiveInput | null, minTicks: number, maxTicks: number): Bot {
  let wait = -1;
  return (s) => {
    const st = s as { turn: string };
    if (st.turn !== "guest") { wait = -1; return null; }
    if (wait < 0) wait = minTicks + Math.floor(Math.random() * (maxTicks - minTicks));
    if (wait-- > 0) return null;
    wait = -1;
    return decide(s as never);
  };
}

/* ---------------- Connect Four: win > block > don't set up their win > centre ---------------- */
function c4Move(s: C4State): number {
  const legal = Array.from({ length: COLS }, (_, c) => c).filter((c) => !s.board[c]);
  const as = (side: "host" | "guest", c: number) => stepC4({ ...s, turn: side }, side === "host" ? c : null, side === "guest" ? c : null);
  const win = legal.find((c) => as("guest", c).winner === "guest");
  if (win !== undefined) return win;
  const block = legal.find((c) => as("host", c).winner === "host");
  if (block !== undefined && !chance(0.12)) return block; // sometimes misses a block
  const safe = legal.filter((c) => {
    const after = as("guest", c);
    return !Array.from({ length: COLS }, (_, k) => k).some((k) => !after.board[k] && stepC4(after, k, null).winner === "host");
  });
  const pool = safe.length ? safe : legal;
  // Prefer the middle columns, with some randomness.
  return pool.map((c) => ({ c, w: 4 - Math.abs(c - (COLS - 1) / 2) + Math.random() * 2.5 })).sort((a, b) => b.w - a.w)[0]!.c;
}
void ROWS;

/* ---------------- Dots and Boxes: take free boxes, avoid giving a third side ---------------- */
function dotsMove(s: DotsState): number {
  const open = Array.from({ length: EDGES }, (_, e) => e).filter((e) => !s.edges[e]);
  const sidesAfter = (e: number) => {
    let worst = 0, takes = 0;
    for (let r = 0; r < B; r++)
      for (let c = 0; c < B; c++) {
        const be = boxEdges(r, c);
        if (!be.includes(e) || s.boxes[r * B + c]) continue;
        const n = be.filter((x) => s.edges[x]).length + 1;
        if (n === 4) takes++;
        worst = Math.max(worst, n);
      }
    return { takes, worst };
  };
  const scored = open.map((e) => ({ e, ...sidesAfter(e) }));
  const taking = scored.filter((x) => x.takes > 0);
  if (taking.length && !chance(0.1)) return pick(taking).e;
  const quiet = scored.filter((x) => x.worst < 3);
  return pick(quiet.length ? quiet : scored).e;
}

/* ---------------- Grid games: stay alive, look for space, go for food ---------------- */
function roomFrom(blocked: (x: number, y: number) => boolean, x: number, y: number, cap = 120): number {
  if (blocked(x, y)) return 0;
  const seen = new Set([`${x},${y}`]);
  const q = [[x, y]];
  while (q.length && seen.size < cap) {
    const [cx, cy] = q.shift()!;
    for (const [dx, dy] of Object.values(DELTA)) {
      const nx = cx! + dx, ny = cy! + dy, k = `${nx},${ny}`;
      if (!seen.has(k) && !blocked(nx, ny)) { seen.add(k); q.push([nx, ny]); }
    }
  }
  return seen.size;
}

function gridChoice(x: number, y: number, dir: Dir, blocked: (x: number, y: number) => boolean, goal?: [number, number]): Dir | null {
  const options = (["up", "down", "left", "right"] as Dir[]).filter((d) => d !== OPPOSITE[dir]);
  const scored = options.map((d) => {
    const [dx, dy] = DELTA[d];
    const room = roomFrom(blocked, x + dx, y + dy);
    const toward = goal ? -(Math.abs(goal[0] - x - dx) + Math.abs(goal[1] - y - dy)) : 0;
    return { d, score: room * 10 + toward * 3 + (d === dir ? 4 : 0) + Math.random() * 6 };
  });
  const best = scored.sort((a, b) => b.score - a.score)[0]!;
  return best.d === dir ? null : best.d;
}

function cyclesBot(): Bot {
  return (st) => {
    const s = st as CyclesState;
    const r = s.riders.guest;
    if (!r.alive || chance(0.15)) return null; // reaction lag
    const blocked = (x: number, y: number) => x < 0 || x >= W || y < 0 || y >= H || s.walls[y * W + x] !== 0;
    return gridChoice(r.x, r.y, r.dir, blocked);
  };
}

function snakesBot(): Bot {
  return (st) => {
    const s = st as SnakesState;
    const sn = s.snakes.guest;
    if (!sn.alive || chance(0.12)) return null;
    const taken = new Set([...s.snakes.host.body, ...sn.body.slice(0, -1)]);
    const blocked = (x: number, y: number) => x < 0 || x >= SW || y < 0 || y >= SH || taken.has(y * SW + x);
    const head = sn.body[0]!;
    return gridChoice(head % SW, Math.floor(head / SW), sn.dir, blocked, [s.food % SW, Math.floor(s.food / SW)]);
  };
}

/* ---------------- Pong: predicts the ball, with lag and aim error ---------------- */
function pongBot(): Bot {
  let target = FH / 2, think = 0, err = 0, lastVx = 0;
  return (st) => {
    const s = st as PongState;
    const b = s.ball;
    if (Math.sign(b.vx) !== Math.sign(lastVx)) err = (Math.random() - 0.5) * 12; // new aim error each rally leg
    lastVx = b.vx;
    if (think-- <= 0) {
      think = 5;
      if (b.vx > 0) {
        // Where will the ball cross our paddle line? Reflect off top and bottom.
        const t = (FW - PADDLE_X - b.x) / b.vx;
        let y = b.y + b.vy * t;
        while (y < 0 || y > FH) y = y < 0 ? -y : 2 * FH - y;
        target = y + err;
      } else target = FH / 2;
    }
    const dy = target - s.paddles.guest;
    return Math.abs(dy) < 2 ? "stop" : dy < 0 ? "up" : "down";
  };
}

/* ---------------- Jump Rope: good timing that slips as the rope speeds up ---------------- */
function ropeBot(): Bot {
  let planned = -1, turn = -1;
  return (st) => {
    const s = st as RopeState;
    if (s.turns !== turn) {
      turn = s.turns;
      // Ideal lead is a few ticks; the faster the rope, the shakier the aim.
      const shake = s.period < 32 ? 5 : s.period < 44 ? 3 : 2;
      planned = Math.max(1, Math.round(4 + (Math.random() - 0.5) * 2 * shake));
      if (chance(0.03)) planned = AIR + 4; // the occasional brain-freeze
    }
    return s.period - s.phase === planned ? "jump" : null;
  };
}

/* ---------------- Rock Paper Scissors: picks at a random moment ---------------- */
function rpsBot(): Bot {
  let at = -1, throwNo = -1;
  return (st) => {
    const s = st as RpsState;
    if (s.stage !== "count") return null;
    if (s.history.length !== throwNo) { throwNo = s.history.length; at = 5 + Math.floor(Math.random() * (COUNT - 12)); }
    return s.t === at ? pick(PICKS) : null;
  };
}

/* ---------------- Tug of War: steady mashing, about 7 taps a second ---------------- */
const tugBot = (): Bot => () => (chance(0.27) ? "pull" : null);

const BOTS: Record<string, () => Bot> = {
  connect4: () => thinker((s: C4State) => c4Move(s), 8, 18),
  dots: () => thinker((s: DotsState) => dotsMove(s), 6, 14),
  cycles: cyclesBot,
  snakeduel: snakesBot,
  pong: pongBot,
  rope: ropeBot,
  rps: rpsBot,
  tug: tugBot,
};

export const hasBot = (gameId: string) => gameId in BOTS;
export const makeBot = (gameId: string): Bot => BOTS[gameId]!();
