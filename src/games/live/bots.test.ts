import { expect, test } from "vitest";
import { LIVE_GAMES } from "../registry";
import type { LiveSpec } from "../types";
import { hasBot, makeBot } from "./bots";
import { COLS, initC4, stepC4 } from "./connect4";

test("every live game has a CPU, and a CPU-vs-idle game runs to an end without errors", () => {
  for (const g of LIVE_GAMES) {
    expect(hasBot(g.id), g.id).toBe(true);
    const spec = g.live as LiveSpec<unknown, string | number>;
    const bot = makeBot(g.id);
    let s = spec.init(7);
    const ticks = Math.ceil(g.durationMs / spec.tickMs);
    for (let n = 0; n < ticks && !spec.outcome(s); n++) {
      const b = bot(s);
      s = spec.step(s, null, b);
    }
    // An idle human should never beat the CPU.
    const o = spec.outcome(s) ?? spec.timeoutOutcome(s);
    expect(o, g.id).not.toBe("host");
  }
});

test("Connect Four CPU takes a win and blocks one", () => {
  // Guest has three in the bottom row: it should finish the line.
  let s: ReturnType<typeof initC4> = { ...initC4(1), turn: "guest" };
  for (const c of [0, 1, 2]) s = { ...stepC4({ ...s, turn: "guest" }, null, c), turn: "guest" };
  let bot = makeBot("connect4");
  let move: unknown = null;
  for (let i = 0; i < 40 && move === null; i++) move = bot(s);
  expect(move).toBe(3);
  // Host threatens: guest must block (allowing for its rare miss, try a few bots).
  let h: ReturnType<typeof initC4> = { ...initC4(1), turn: "host" };
  for (const c of [0, 1, 2]) h = { ...stepC4({ ...h, turn: "host" }, c, null), turn: "guest" };
  let blocks = 0;
  for (let k = 0; k < 20; k++) {
    bot = makeBot("connect4");
    let m: unknown = null;
    for (let i = 0; i < 40 && m === null; i++) m = bot(h);
    if (m === 3) blocks++;
  }
  expect(blocks).toBeGreaterThan(12);
  expect(COLS).toBe(7);
});
