import { sfx } from "../audio/sfx";
import { COLORS, EMOTES, TITLES, XP, levelFor } from "../core/progression";
import { loadName } from "./hooks";
import { Screen } from "./Menu";
import { nameStyle, setColor, setTitle, useProfile } from "./profile";

/** Level, XP bar, and pickers for the cosmetics you've unlocked. */
export function ProfileScreen() {
  const { saved, profile } = useProfile();
  const { level, into, need } = levelFor(saved.xp);
  const name = loadName().trim() || "Player";
  return (
    <Screen title="Profile">
      <div className="profile">
        <section className="profile__card">
          <div className="profile__lvl" aria-label={`Level ${level}`}>{level}</div>
          <div className="profile__name"><span {...nameStyle(profile.color)}>{name}</span></div>
          <div className="muted">{TITLES.find((t) => t.id === profile.title)?.label} · {into} / {need} XP to level {level + 1}</div>
          <div className="profile__bar"><i style={{ width: `${(into / need) * 100}%` }} /></div>
        </section>

        <section className="profile__group">
          <h2>Title</h2>
          <div className="chips">
            {TITLES.map((t) => (
              <button key={t.id} className={`chip ${profile.title === t.id ? "is-on" : ""}`} disabled={t.level > level} onClick={() => { sfx("select"); setTitle(t.id); }}>
                {t.label}{t.level > level && <small>Lv {t.level}</small>}
              </button>
            ))}
          </div>
        </section>

        <section className="profile__group">
          <h2>Name colour</h2>
          <div className="chips">
            {COLORS.map((c) => (
              <button key={c.id} className={`chip ${profile.color === c.id ? "is-on" : ""}`} disabled={c.level > level} onClick={() => { sfx("select"); setColor(c.id); }}>
                <span {...nameStyle(c.id)}>{c.label}</span>{c.level > level && <small>Lv {c.level}</small>}
              </button>
            ))}
          </div>
        </section>

        <section className="profile__group">
          <h2>Emotes</h2>
          <div className="chips">
            {EMOTES.map((e) => (
              <span key={e.id} className={`chip ${e.level > level ? "is-locked" : ""}`} style={e.level > level ? { opacity: 0.4 } : undefined}>
                {e.label}{e.level > level && <small>Lv {e.level}</small>}
              </span>
            ))}
          </div>
        </section>

        <p className="profile__earn">
          Earn XP by playing: a practice run {XP.practiceRun}, a new best +{XP.newBest}, beating the CPU {XP.cpuWin}, each match round {XP.roundPlayed} (+{XP.roundWon} if you win it), a finished match {XP.matchPlayed} (+{XP.matchWon} for the win). Your level, title and colour show up on your opponent's screen.
        </p>
      </div>
    </Screen>
  );
}
