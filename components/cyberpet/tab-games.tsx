"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Field, Note, Panel, inputCls, useApi } from "./admin-kit";

const API = "/api/petz/admin";
export const GAME_LIST: [string, string, boolean][] = [
  // id, name, rotates daily
  ["orbit", "Orbit Dash (featured)", false], ["run", "Ruins Run", true], ["catch", "Crystal Catch", true], ["sync", "Signal Sync", true],
  ["stack", "Sky Stack", true], ["pounce", "Pounce Patrol", true], ["battle", "Friendly Battle", false], ["massage", "Paw Spa", false],
  ["laser", "Laser Chase", true], ["echo", "Echo Song", true], ["snack", "Snack Catch", true], ["bubble", "Bubble Pop", true], ["words", "Word Match", true],
];

/** Which games are on, which always open, the game of the day, and how many rotate in each day. */
export function GamesTab() {
  const api = useApi();
  const [off, setOff] = useState<string[]>([]);
  const [forced, setForced] = useState<string[]>([]);
  const [hot, setHot] = useState("");
  const [open, setOpen] = useState("4");
  const [msg, setMsg] = useState<{ t: string; tone: "ok" | "error" } | null>(null);
  const load = useCallback(async () => {
    const r = await api<{ values: Record<string, unknown> }>(`${API}?resource=config`);
    if (!r.ok) return;
    setOff((r.values.games_disabled as string[]) || []); setForced((r.values.games_forced as string[]) || []);
    setHot(String(r.values.games_hot || "")); setOpen(String(r.values.games_open ?? 4));
  }, [api]);
  useEffect(() => { const id = setTimeout(() => void load(), 0); return () => clearTimeout(id); }, [load]);
  const flip = (arr: string[], set: (v: string[]) => void, id: string) => set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  const save = async () => {
    const r = await api(API, { action: "config-save", values: { games_disabled: off, games_forced: forced, games_hot: hot, games_open: open } });
    setMsg(r.ok ? { t: "Saved. Phones update within about 5 minutes.", tone: "ok" } : { t: r.error || "Failed", tone: "error" });
  };
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Panel title="Games">
        <table className="w-full text-left text-sm">
          <thead className="text-[11px] uppercase text-white/40"><tr><th className="py-1">Game</th><th>On</th><th>Always open</th><th>Game of the day</th></tr></thead>
          <tbody>
            {GAME_LIST.map(([id, name, rot]) => (
              <tr key={id} className="border-t border-white/5">
                <td className="py-2"><b>{name}</b> <span className="font-mono text-[11px] text-white/40">{id}</span>{!rot && <span className="ml-1 text-[11px] text-white/40">· always on the list</span>}</td>
                <td><input type="checkbox" checked={!off.includes(id)} onChange={() => flip(off, setOff, id)} /></td>
                <td>{rot ? <input type="checkbox" checked={forced.includes(id)} onChange={() => flip(forced, setForced, id)} /> : "—"}</td>
                <td>{rot ? <input type="radio" name="hot" checked={hot === id} onChange={() => setHot(id)} /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel title="Rotation">
        <div className="grid gap-3">
          <Field label="Rotating games open per day"><input className={inputCls} value={open} onChange={(e) => setOpen(e.target.value)} /></Field>
          <Btn kind="ghost" small onClick={() => setHot("")}>Random game of the day</Btn>
          <Note>Every player sees the same line-up on the same day. One training game is always in it. “Always open” games come on top of the daily count.</Note>
          <Btn onClick={save}>Save games</Btn>
          {msg && <Note tone={msg.tone}>{msg.t}</Note>}
        </div>
      </Panel>
    </div>
  );
}
