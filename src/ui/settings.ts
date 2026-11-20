/** Player settings, saved on the device. */
import { useSyncExternalStore } from "react";

export interface Settings {
  sound: boolean;
  /** 0..1 */
  volume: number;
  /** CRT scanlines over the screen. */
  scanlines: boolean;
  /** Visual style. Try-out looks while we pick one; see ./themes/looks.css. */
  look: Look;
}

export const LOOKS = [
  { id: "crt", name: "CRT" },
  { id: "neon", name: "Neon Sign" },
  { id: "pinball", name: "Pinball" },
  { id: "rink", name: "Air Hockey" },
] as const;
export type Look = (typeof LOOKS)[number]["id"];

const KEY = "duel:settings";
const DEFAULTS: Settings = { sound: true, volume: 0.5, scanlines: true, look: "crt" };
// ?look=pinball in the URL switches look for this device (handy for comparing).
const urlLook = typeof location === "undefined" ? null : new URLSearchParams(location.search).get("look");

function load(): Settings {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

let current = load();
if (urlLook && LOOKS.some((l) => l.id === urlLook)) current = { ...current, look: urlLook as Look };
const subs = new Set<() => void>();
const apply = () => {
  const root = document.documentElement;
  root.dataset.scanlines = current.scanlines ? "on" : "off";
  if (root.dataset.look !== current.look) {
    root.dataset.look = current.look;
    // The background canvas reads colours once per resize; nudge it to redraw.
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }
};
apply();

export const getSettings = () => current;

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  localStorage.setItem(KEY, JSON.stringify(current));
  apply();
  subs.forEach((f) => f());
}

export const useSettings = () =>
  useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => current);
