import { useEffect, useState } from "react";
import { sfx } from "../audio/sfx";
import { COLORS, EMOTES, TITLES } from "../core/progression";
import { type XpToast, onXpToast } from "./profile";

/** "+40 XP" after a game; a bigger "Level 5" card with what it unlocked when you level up. */
export function XpToasts() {
  const [t, setT] = useState<(XpToast & { id: number }) | null>(null);
  useEffect(() => onXpToast((x) => {
    setT({ ...x, id: Date.now() });
    if (x.levelUp) setTimeout(() => sfx("ko"), 200);
  }), []);
  useEffect(() => {
    if (!t) return;
    const id = setTimeout(() => setT(null), 3300);
    return () => clearTimeout(id);
  }, [t]);
  if (!t) return null;
  const unlocks = t.levelUp ? [...TITLES, ...COLORS, ...EMOTES].filter((u) => u.level === t.levelUp).map((u) => u.label) : [];
  return (
    <div key={t.id} className={`xp-toast ${t.levelUp ? "is-level" : ""}`} role="status" data-testid="xp-toast">
      <b>{t.levelUp ? `Level ${t.levelUp}!` : `+${t.gained} XP`}</b>
      {t.levelUp && <span>+{t.gained} XP{unlocks.length ? `. Unlocked: ${unlocks.join(", ")}` : ""}</span>}
    </div>
  );
}
