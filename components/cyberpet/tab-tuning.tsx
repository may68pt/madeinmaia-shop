"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Note, Panel, fmtDate, inputCls, useApi } from "./admin-kit";
import type { ConfigDef } from "@/lib/cyberpet/config-core";

const API = "/api/petz/admin";
const show = (d: ConfigDef, v: unknown) => (d.type === "json" ? JSON.stringify(v) : String(v ?? ""));

/** Live tuning: every value the app reads from /api/petz/config, grouped. Saved values reach phones within minutes. */
export function TuningTab() {
  const api = useApi();
  const [defs, setDefs] = useState<ConfigDef[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [changed, setChanged] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ t: string; tone: "ok" | "error" } | null>(null);
  const load = useCallback(async () => {
    const r = await api<{ defs: ConfigDef[]; values: Record<string, unknown>; changed: Record<string, string> }>(`${API}?resource=config`);
    if (r.ok) { setDefs(r.defs); setValues(r.values); setChanged(r.changed); setDraft({}); }
  }, [api]);
  useEffect(() => { void load(); }, [load]);
  const save = async () => {
    const r = await api(API, { action: "config-save", values: draft });
    setMsg(r.ok ? { t: "Saved. Phones pick it up within about 5 minutes.", tone: "ok" } : { t: r.error || "Failed", tone: "error" });
    if (r.ok) void load();
  };
  const reset = async (key: string) => { await api(API, { action: "config-save", values: {}, reset: [key] }); void load(); };
  const groups = [...new Set(defs.map((d) => d.group))];
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Btn onClick={save} disabled={!Object.keys(draft).length}>Save {Object.keys(draft).length || ""} change(s)</Btn>
        {msg && <Note tone={msg.tone}>{msg.t}</Note>}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g) => (
          <Panel key={g} title={g}>
            <div className="grid gap-3">
              {defs.filter((d) => d.group === g).map((d) => {
                const cur = draft[d.key] ?? show(d, values[d.key]);
                return (
                  <div key={d.key} className="grid gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{d.label}</span>
                      {changed[d.key] && <button type="button" className="text-[11px] text-white/40 underline" onClick={() => reset(d.key)}>reset · set {fmtDate(changed[d.key])}</button>}
                    </div>
                    {d.type === "boolean" ? (
                      <label className="flex items-center gap-2 text-sm text-white/70">
                        <input type="checkbox" checked={cur === "true"} onChange={(e) => setDraft({ ...draft, [d.key]: String(e.target.checked) })} /> {cur === "true" ? "On" : "Off"}
                      </label>
                    ) : d.type === "json" ? (
                      <textarea className={inputCls + " font-mono text-xs"} rows={2} value={cur} onChange={(e) => setDraft({ ...draft, [d.key]: e.target.value })} />
                    ) : (
                      <input className={inputCls} value={cur} onChange={(e) => setDraft({ ...draft, [d.key]: e.target.value })} />
                    )}
                    <span className="text-[11px] text-white/40">{d.help ? d.help + " · " : ""}default {show(d, d.def)}{d.min !== undefined ? ` · ${d.min}–${d.max}` : ""}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
