import { useEffect, useState } from "react";
import { sfx } from "../audio/sfx";

/**
 * Small "Quit" button in the corner of a game. Two steps, so a stray tap
 * never ends a match: the button opens a confirm sheet, and only its Quit
 * button actually leaves. The game keeps running behind the sheet (online
 * games can't pause), so the sheet says what quitting costs.
 */
export function QuitButton({ onQuit, warning }: { onQuit: () => void; warning: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); setOpen(false); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  return (
    <>
      <button className="quit" onClick={() => { sfx("back"); setOpen(true); }} aria-label="Quit" data-testid="quit">
        <span aria-hidden="true">✕</span> Quit
      </button>
      {open && (
        <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="quit-title" onPointerDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="sheet__card">
            <h2 id="quit-title" className="sheet__title">Leave this game?</h2>
            <p className="sheet__text">{warning}</p>
            <div className="sheet__actions">
              <button className="key" autoFocus onClick={() => { sfx("select"); setOpen(false); }}>Keep playing</button>
              <button className="key key--danger" onClick={() => { sfx("koLose"); setOpen(false); onQuit(); }} data-testid="quit-confirm">Quit</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
