/**
 * XP, levels and the cosmetics they unlock. Everything lives on this device
 * (no accounts); your level, title and name colour are sent to whoever you
 * play so they show up on their screen too.
 *
 * Kept pure (no localStorage in here) so the maths is unit-tested; the UI
 * layer loads and saves the numbers.
 */

/** XP for each thing you can do. Losing still pays, just less. */
export const XP = {
  practiceRun: 10,
  newBest: 25,
  cpuWin: 30,
  cpuLoss: 10,
  roundPlayed: 10,
  roundWon: 20,
  matchPlayed: 40,
  matchWon: 100,
} as const;

/** XP needed to go from level n to n+1: 100, 150, 200, ... */
export const stepFor = (level: number) => 100 + 50 * (level - 1);

/** Level and progress within it for a total XP. */
export function levelFor(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let left = Math.max(0, Math.floor(xp));
  while (left >= stepFor(level)) {
    left -= stepFor(level);
    level++;
  }
  return { level, into: left, need: stepFor(level) };
}

export interface Unlock { id: string; label: string; level: number }

export const TITLES: Unlock[] = [
  { id: "rookie", label: "Rookie", level: 1 },
  { id: "masher", label: "Button Masher", level: 3 },
  { id: "mole", label: "Mole Menace", level: 5 },
  { id: "rope", label: "Rope Demon", level: 7 },
  { id: "rat", label: "Arcade Rat", level: 10 },
  { id: "clutch", label: "Clutch Factor", level: 13 },
  { id: "boss", label: "Final Boss", level: 16 },
  { id: "legend", label: "Legend", level: 20 },
];

/** Name colours. "team" means your side's colour (blue or red), the default. */
export const COLORS: Array<Unlock & { css: string }> = [
  { id: "team", label: "Team colour", level: 1, css: "" },
  { id: "gold", label: "Gold", level: 2, css: "#ffc83d" },
  { id: "mint", label: "Mint", level: 4, css: "#5cf2b0" },
  { id: "violet", label: "Violet", level: 6, css: "#b48cff" },
  { id: "orange", label: "Orange", level: 8, css: "#ff9a3d" },
  { id: "rainbow", label: "Rainbow", level: 12, css: "rainbow" },
];

/** Emotes and taunts. The first six are free; the rest unlock by level. */
export const EMOTES: Unlock[] = [
  { id: "gg", label: "GG", level: 1 },
  { id: "lol", label: "😂", level: 1 },
  { id: "skull", label: "💀", level: 1 },
  { id: "fire", label: "🔥", level: 1 },
  { id: "mad", label: "😤", level: 1 },
  { id: "you", label: "🫵", level: 1 },
  { id: "lucky", label: "Lucky", level: 2 },
  { id: "moai", label: "🗿", level: 3 },
  { id: "skill", label: "Skill issue", level: 4 },
  { id: "clown", label: "🤡", level: 6 },
  { id: "cooked", label: "You're cooked", level: 8 },
  { id: "crown", label: "👑", level: 11 },
];

export const unlocked = <T extends Unlock>(list: T[], level: number) => list.filter((u) => u.level <= level);
export const byId = <T extends Unlock>(list: T[], id: string | undefined) => list.find((u) => u.id === id);

/** What the other player sees of you. */
export interface Profile { level: number; title: string; color: string }

/** Clamp anything received from the network to known, allowed values. */
export function cleanProfile(p: Partial<Profile> | undefined): Profile {
  const level = Math.max(1, Math.min(999, Math.floor(Number(p?.level) || 1)));
  const title = byId(TITLES, p?.title)?.level ?? 99;
  const color = byId(COLORS, p?.color)?.level ?? 99;
  return { level, title: title <= level ? p!.title! : "rookie", color: color <= level ? p!.color! : "team" };
}
