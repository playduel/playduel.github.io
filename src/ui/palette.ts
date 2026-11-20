/**
 * Theme colours for canvas drawing. Canvases can't use CSS variables, so they
 * read the current values from the root element. Hex values only.
 */
export const cssVar = (name: string, fallback: string): string =>
  (typeof document !== "undefined" && getComputedStyle(document.documentElement).getPropertyValue(name).trim()) || fallback;

const rgb = (hex: string) => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};

/** `hex` at opacity `a`. */
export const alpha = (hex: string, a: number) => `rgba(${rgb(hex).join(", ")}, ${a})`;

/** `hex` mixed toward white by `t` (0..1). */
export const lighten = (hex: string, t: number) => `rgb(${rgb(hex).map((v) => Math.round(v + (255 - v) * t)).join(", ")})`;

/** The handful of colours the canvas games use. */
export const palette = () => ({
  well: cssVar("--well", "#06020f"),
  p1: cssVar("--p1", "#2de2e6"),
  p2: cssVar("--p2", "#ff3864"),
  coin: cssVar("--coin", "#f9c80e"),
});

/** What each side's colour is called in the current look ("Cyan", "Blue"...). */
export const sideName = (side: "host" | "guest") =>
  cssVar(side === "host" ? "--p1-name" : "--p2-name", side === "host" ? "Cyan" : "Pink").replace(/"/g, "");
