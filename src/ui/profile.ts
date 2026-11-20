/**
 * This device's progression: total XP, chosen title and name colour.
 * Small external store (like settings.ts) so any screen can read it and
 * level-ups can pop a toast wherever you are.
 */
import { useSyncExternalStore } from "react";
import { COLORS, type Profile, TITLES, XP, byId, levelFor } from "../core/progression";

interface Saved { xp: number; title: string; color: string }
const KEY = "duel:profile";
const DEFAULTS: Saved = { xp: 0, title: "rookie", color: "team" };

function load(): Saved {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Saved>) }; } catch { return DEFAULTS; }
}

let saved = load();
let snap: { saved: Saved; profile: Profile } = { saved, profile: toProfile(saved) };
const subs = new Set<() => void>();
const toastSubs = new Set<(t: XpToast) => void>();

function toProfile(s: Saved): Profile {
  const level = levelFor(s.xp).level;
  const title = (byId(TITLES, s.title)?.level ?? 99) <= level ? s.title : "rookie";
  const color = (byId(COLORS, s.color)?.level ?? 99) <= level ? s.color : "team";
  return { level, title, color };
}

function commit(next: Saved) {
  saved = next;
  snap = { saved, profile: toProfile(saved) };
  try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* private mode */ }
  subs.forEach((f) => f());
}

export type XpReason = keyof typeof XP;
export interface XpToast { gained: number; levelUp: number | null }

/** Add XP for one or more things that just happened. Announces level-ups. */
export function earn(...reasons: XpReason[]) {
  const gained = reasons.reduce((n, r) => n + XP[r], 0);
  if (!gained) return;
  const before = levelFor(saved.xp).level;
  commit({ ...saved, xp: saved.xp + gained });
  const after = levelFor(saved.xp).level;
  toastSubs.forEach((f) => f({ gained, levelUp: after > before ? after : null }));
}

export const setTitle = (title: string) => commit({ ...saved, title });
export const setColor = (color: string) => commit({ ...saved, color });
export const myProfile = () => snap.profile;

export const useProfile = () =>
  useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => snap);

export function onXpToast(cb: (t: XpToast) => void) {
  toastSubs.add(cb);
  return () => { toastSubs.delete(cb); };
}

/** Inline style for a name in a chosen colour (rainbow is a CSS class instead). */
export function nameStyle(colorId: string | undefined): { className: string; style?: React.CSSProperties } {
  const c = byId(COLORS, colorId);
  if (!c || !c.css) return { className: "" };
  if (c.css === "rainbow") return { className: "name--rainbow" };
  return { className: "", style: { color: c.css } };
}
