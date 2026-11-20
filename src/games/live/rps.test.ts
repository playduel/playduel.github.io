import { expect, test } from "vitest";
import { COUNT, REVEAL, initRps, judgeThrow, rpsOutcome, rpsTimeout, stepRps } from "./rps";

test("rock beats scissors beats paper beats rock; no pick loses; same pick ties", () => {
  expect(judgeThrow("rock", "scissors")).toBe("host");
  expect(judgeThrow("scissors", "paper")).toBe("host");
  expect(judgeThrow("rock", "paper")).toBe("guest");
  expect(judgeThrow(null, "rock")).toBe("guest");
  expect(judgeThrow("paper", "paper")).toBeNull();
  expect(judgeThrow(null, null)).toBeNull();
});

function playThrow(s: ReturnType<typeof initRps>, h: string | null, g: string | null) {
  s = stepRps(s, h, g);
  for (let i = 1; i < COUNT + REVEAL; i++) s = stepRps(s, null, null);
  return s;
}

test("you can change your pick until shoot; first to 3 wins", () => {
  let s = stepRps(initRps(), "rock", "paper");
  s = stepRps(s, "scissors", null); // host switches
  for (let i = 2; i < COUNT; i++) s = stepRps(s, null, null);
  expect(s.history[0]).toEqual({ host: "scissors", guest: "paper", winner: "host" });
  for (let i = 0; i < REVEAL; i++) s = stepRps(s, null, null);
  s = playThrow(s, "rock", "rock"); // tie, doesn't count
  s = playThrow(s, "rock", "scissors");
  expect(rpsOutcome(s)).toBeNull();
  s = playThrow(s, "paper", "rock");
  expect(s.wins).toEqual({ host: 3, guest: 0 });
  expect(rpsOutcome(s)).toBe("host");
  expect(rpsTimeout(s)).toBe("host");
});
