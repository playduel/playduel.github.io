import { expect, test } from "vitest";
import { EMOTES, TITLES, cleanProfile, levelFor, stepFor, unlocked } from "./progression";

test("levels: 100 XP to level 2, then 150 more to level 3", () => {
  expect(levelFor(0)).toEqual({ level: 1, into: 0, need: 100 });
  expect(levelFor(99).level).toBe(1);
  expect(levelFor(100)).toEqual({ level: 2, into: 0, need: 150 });
  expect(levelFor(250).level).toBe(3);
  expect(stepFor(10)).toBe(550);
});

test("unlocks follow level; received profiles can't claim locked cosmetics", () => {
  expect(unlocked(EMOTES, 1)).toHaveLength(6);
  expect(unlocked(TITLES, 5).map((t) => t.id)).toContain("mole");
  expect(cleanProfile({ level: 3, title: "legend", color: "rainbow" })).toEqual({ level: 3, title: "rookie", color: "team" });
  expect(cleanProfile({ level: 12, title: "rat", color: "rainbow" })).toEqual({ level: 12, title: "rat", color: "rainbow" });
  expect(cleanProfile(undefined)).toEqual({ level: 1, title: "rookie", color: "team" });
});
