import { LIVE_GAMES, SOLO_GAMES as GAMES } from "../games/registry";
import { loadName } from "./hooks";
import { Menu } from "./Menu";
import { Screen } from "./Menu";
import { cpuRecords, records } from "./results";
import { navigate } from "./router";

export function PracticeList() {
  const bests = records.bests(loadName());
  const cpu = cpuRecords.all();
  return (
    <Screen title="Practice">
      <h2 className="practice__group">Beat your best</h2>
      <Menu
        label="Solo games"
        items={GAMES.map((g) => ({
          label: g.name,
          hint: bests[g.id] ? `Your best: ${g.formatScore(bests[g.id]!.score)}` : "No best yet",
          testId: `practice-${g.id}`,
          onSelect: () => navigate(`/practice/${g.id}`),
        }))}
      />
      <h2 className="practice__group">Versus CPU</h2>
      <Menu
        label="Head-to-head games against the computer"
        items={LIVE_GAMES.map((g) => {
          const r = cpu[g.id];
          return {
            label: g.name,
            hint: r ? `You ${r.w}, CPU ${r.l}${r.d ? `, ${r.d} draws` : ""}` : "Play the computer",
            testId: `practice-${g.id}`,
            onSelect: () => navigate(`/practice/${g.id}`),
          };
        })}
      />
    </Screen>
  );
}
