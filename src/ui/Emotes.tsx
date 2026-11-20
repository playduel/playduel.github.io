import { useEffect, useState } from "react";
import { sfx } from "../audio/sfx";
import { EMOTES, byId, unlocked } from "../core/progression";
import { now } from "../core/clock";
import { useProfile } from "./profile";

/** You can send one emote every this-many ms. The network layer also drops anything under 1 s. */
export const EMOTE_COOLDOWN_MS = 2500;
/** How long an emote bubble stays up. */
const SHOW_MS = 2200;

/**
 * Emote tray: a small button in the bottom corner that opens one row of
 * emotes. Kept out of the play area; it closes after each send and shows a
 * cooldown ring so spamming isn't possible.
 */
export function EmoteTray({ onSend }: { onSend: (id: string) => void }) {
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [readyAt, setReadyAt] = useState(0);
  const [, tick] = useState(0);
  const cooling = now() < readyAt;
  useEffect(() => {
    if (!cooling) return;
    const id = setTimeout(() => tick((n) => n + 1), readyAt - now() + 20);
    return () => clearTimeout(id);
  }, [cooling, readyAt]);

  const send = (id: string) => {
    if (now() < readyAt) return;
    sfx("pop");
    onSend(id);
    setReadyAt(now() + EMOTE_COOLDOWN_MS);
    setOpen(false);
  };
  return (
    <div className={`emotes ${open ? "is-open" : ""}`} data-testid="emote-tray">
      {open && (
        <div className="emotes__row" role="menu" aria-label="Send an emote">
          {unlocked(EMOTES, profile.level).map((e) => (
            <button key={e.id} role="menuitem" className={`emotes__pick ${e.label.length > 2 ? "is-text" : ""}`} onPointerDown={(ev) => { ev.preventDefault(); send(e.id); }} data-testid={`emote-${e.id}`}>
              {e.label}
            </button>
          ))}
        </div>
      )}
      <button
        className={`emotes__toggle ${cooling ? "is-cooling" : ""}`}
        style={cooling ? { animationDuration: `${EMOTE_COOLDOWN_MS}ms` } : undefined}
        key={cooling ? readyAt : "ready"}
        onPointerDown={(e) => { e.preventDefault(); if (!cooling) setOpen((o) => !o); }}
        aria-label={cooling ? "Emotes cooling down" : "Emotes"}
        aria-expanded={open}
      >
        💬
      </button>
    </div>
  );
}

/** The latest emote from each side, shown under their name in the scoreboard for a couple of seconds. */
export function EmoteBubbles({ emotes }: { emotes: Partial<Record<"host" | "guest", { e: string; at: number }>> }) {
  const [, tick] = useState(0);
  const t = now();
  const live = (["host", "guest"] as const).filter((p) => emotes[p] && t - emotes[p]!.at < SHOW_MS);
  useEffect(() => {
    if (!live.length) return;
    const id = setTimeout(() => tick((n) => n + 1), 250);
    return () => clearTimeout(id);
  });
  return (
    <>
      {live.map((p) => {
        const em = byId(EMOTES, emotes[p]!.e);
        if (!em) return null;
        return (
          <div key={`${p}${emotes[p]!.at}`} className={`bubble bubble--${p === "host" ? "p1" : "p2"} ${em.label.length > 2 ? "is-text" : ""}`} data-testid={`bubble-${p}`}>
            {em.label}
          </div>
        );
      })}
    </>
  );
}
