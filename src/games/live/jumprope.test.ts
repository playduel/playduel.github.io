import { expect, test } from "vitest";
import { AIR, MIN_PERIOD, START_PERIOD, initRope, ropeOutcome, stepRope } from "./jumprope";


/** Run until the next rope pass, letting `jumpAt(ticksLeft)` decide when each side jumps. */
function untilPass(s: ReturnType<typeof initRope>, hostLead: number | null, guestLead: number | null) {
  const turns = s.turns;
  while (s.turns === turns && !ropeOutcome(s)) {
    const left = s.period - s.phase;
    s = stepRope(s, left === hostLead ? "jump" : null, left === guestLead ? "jump" : null);
  }
  return s;
}

test("standing still trips you on the first pass", () => {
  const s = untilPass(initRope(), 5, null);
  expect(s.p.host.alive).toBe(true);
  expect(s.p.guest.alive).toBe(false);
  expect(ropeOutcome(s)).toBe("host");
});

test("a jump just before the rope arrives clears it; one too early doesn't", () => {
  let s = untilPass(initRope(), 3, 3);
  expect(s.p.host.jumps).toBe(1);
  expect(ropeOutcome(s)).toBeNull();
  s = untilPass(s, AIR + 3, 4); // host lands before the rope gets there
  expect(ropeOutcome(s)).toBe("guest");
});

test("the rope speeds up to a floor", () => {
  let s = initRope();
  for (let i = 0; i < 60 && !ropeOutcome(s); i++) s = untilPass(s, 4, 4);
  expect(ropeOutcome(s)).toBeNull();
  expect(s.period).toBe(MIN_PERIOD);
  expect(s.p.host.jumps).toBe(60);
  expect(START_PERIOD).toBeGreaterThan(MIN_PERIOD);
});

test("both tripping on the same pass is a draw", () => {
  expect(ropeOutcome(untilPass(initRope(), null, null))).toBe("draw");
});

test("mashing the button doesn't keep you safe", () => {
  // Whatever phase you start mashing at, you end up on the ground when the rope comes.
  let m = initRope();
  let trips = 0;
  for (let run = 0; run < 20; run++) {
    m = initRope();
    for (let i = 0; i < run; i++) m = stepRope(m, null, null); // shift the mash phase
    let n = 0;
    while (!ropeOutcome(m) && n++ < 3000) m = stepRope(m, "jump", "jump");
    if (ropeOutcome(m)) trips++;
  }
  expect(trips).toBe(20);
});
