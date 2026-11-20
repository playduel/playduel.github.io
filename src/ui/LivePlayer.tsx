/**
 * Runs a live (head-to-head) game.
 *
 *  host  : owns the clock. Every tick it takes one input per player, steps
 *          the simulation, and sends that tick's inputs to the guest.
 *  guest : never steps on its own. It replays the host's ticks in order, so
 *          its board is always the host's board, one network hop later.
 *  local : both players on one keyboard; same as host with no network.
 *
 * This is "lockstep driven by the host": tiny messages (just inputs), no
 * state ever sent, and no way for the two screens to disagree as long as
 * the step function is deterministic (enforced by tests per game).
 */
import { useEffect, useRef, useState } from "react";
import { sfx } from "../audio/sfx";
import type { LiveSpec, MiniGame, Side } from "../games/types";
import type { LiveInput } from "../net/protocol";

export type LiveLink =
  | { role: "host"; sendTick: (n: number, i: [LiveInput | null, LiveInput | null]) => void; onGuestInput: (cb: (i: LiveInput) => void) => () => void }
  | { role: "guest"; sendInput: (i: LiveInput) => void; ticks: () => Array<[LiveInput | null, LiveInput | null]>; onTick: (cb: () => void) => () => void }
  | { role: "local" };

/** 1-0 for a win, 0-0 for a draw (a tie, replayed like any other). */
export const scoresFor = (o: Side | "draw"): [number, number] => (o === "host" ? [1, 0] : o === "guest" ? [0, 1] : [0, 0]);

export function LivePlayer({
  game,
  seed,
  link,
  onDone,
}: {
  game: MiniGame;
  seed: number;
  link: LiveLink;
  /** Called once on the host/local side with [hostScore, guestScore]. */
  onDone?: (scores: [number, number]) => void;
}) {
  const spec = game.live as LiveSpec<unknown, LiveInput>;
  const [state, setState] = useState(() => spec.init(seed));
  const [outcome, setOutcome] = useState<Side | "draw" | null>(null);
  const sim = useRef({ state, n: 0, over: false });
  const queues = useRef<{ host: LiveInput[]; guest: LiveInput[] }>({ host: [], guest: [] });
  const held = useRef<{ host: LiveInput | null; guest: LiveInput | null }>({ host: null, guest: null });
  const me: Side | null = link.role === "local" ? null : link.role;

  const take = (side: Side): LiveInput | null =>
    spec.inputMode === "hold" ? held.current[side] : queues.current[side].shift() ?? null;

  const end = (o: Side | "draw") => {
    if (sim.current.over) return;
    sim.current.over = true;
    setOutcome(o);
    sfx(o === "draw" ? "tie" : me === null || o === me ? "roundWin" : "roundLose");
    if (link.role !== "guest") setTimeout(() => onDone?.(scoresFor(o)), 1200);
  };

  // Host / local: the fixed-rate simulation loop.
  useEffect(() => {
    if (link.role === "guest") return;
    const unsub = link.role === "host" ? link.onGuestInput((i) => give("guest", i)) : undefined;
    const id = setInterval(() => {
      if (sim.current.over) return;
      const i: [LiveInput | null, LiveInput | null] = [take("host"), take("guest")];
      if (link.role === "host") link.sendTick(sim.current.n, i);
      sim.current.n++;
      sim.current.state = spec.step(sim.current.state, i[0], i[1]);
      setState(sim.current.state);
      const o = spec.outcome(sim.current.state);
      if (o) end(o);
    }, spec.tickMs);
    const timeout = setTimeout(() => end(spec.timeoutOutcome(sim.current.state)), game.durationMs);
    return () => {
      clearInterval(id);
      clearTimeout(timeout);
      unsub?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guest: replay the host's ticks, in order, as they arrive.
  useEffect(() => {
    if (link.role !== "guest") return;
    const catchUp = () => {
      const list = link.ticks();
      let changed = false;
      while (sim.current.n < list.length && !sim.current.over) {
        const [h, g] = list[sim.current.n]!;
        sim.current.state = spec.step(sim.current.state, h, g);
        sim.current.n++;
        changed = true;
        const o = spec.outcome(sim.current.state);
        if (o) end(o);
      }
      if (changed) setState(sim.current.state);
    };
    catchUp();
    return link.onTick(catchUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Record an input for a side (from this device's own controls). */
  function give(side: Side, i: LiveInput) {
    if (spec.inputMode === "hold") held.current[side] = i;
    else if (queues.current[side].length < 4) queues.current[side].push(i);
  }
  const input = (i: LiveInput, side: Side = me ?? "host") => {
    if (sim.current.over) return;
    if (link.role === "guest") link.sendInput(i);
    else give(side, i);
  };

  // Keyboard: on a shared screen both players' keys work; online only your own side's keys, remapped to you.
  useEffect(() => {
    const lookup = (e: KeyboardEvent) => {
      const hit = spec.keys[e.key.toLowerCase()];
      if (!hit) return null;
      if (me && hit[0] !== "host") return null; // online: use the P1 layout (WASD/space) plus arrows below
      return hit;
    };
    const arrows: Record<string, LiveInput | undefined> = {};
    if (me) for (const [k, [side, v]] of Object.entries(spec.keys)) if (side === "guest") arrows[k] = v;
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const hit = lookup(e);
      const v = hit ? hit[1] : me ? arrows[e.key.toLowerCase()] : undefined;
      if (v === undefined) return;
      e.preventDefault();
      // Held keys never auto-repeat: mashing has to be real presses.
      if (e.repeat) return;
      const side = !me && spec.turnOf ? spec.turnOf(sim.current.state) : hit && !me ? hit[0] : undefined;
      input(v, side);
    };
    const up = (e: KeyboardEvent) => {
      if (spec.inputMode !== "hold" || spec.release === undefined) return;
      const hit = spec.keys[e.key.toLowerCase()];
      if (!hit) return;
      input(spec.release, me ? undefined : hit[0]);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const View = spec.View;
  return (
    <div className="live" data-testid="live-game">
      <View state={state} me={me} input={input} />
      {outcome && (
        <div className="live__outcome" data-testid="live-outcome">
          {outcome === "draw" ? "Draw!" : me === null ? `${outcome === "host" ? "Left" : "Right"} player wins` : outcome === me ? "You win!" : "You lose"}
        </div>
      )}
    </div>
  );
}
