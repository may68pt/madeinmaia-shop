"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Btn, Field, Note, Panel, ScopePicker, Stat, STAGES, STATS, VARIANTS, emptyScope, fmtDate, inputCls, scopeBody, useApi,
  type ScopeValue,
} from "./admin-kit";

const API = "/api/petz/admin";

export type ClassRow = { id: number; name: string; rule: Record<string, unknown>; count?: number };
export function useClasses() {
  const api = useApi();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const reload = useCallback(async () => {
    const r = await api<{ classes: ClassRow[] }>(`${API}?resource=classes`);
    if (r.ok) setClasses(r.classes);
  }, [api]);
  useEffect(() => { void reload(); }, [reload]);
  return { classes, reload };
}

/* ---------------- Overview ---------------- */
export function OverviewTab() {
  const api = useApi();
  const [o, setO] = useState<Record<string, number> | null>(null);
  useEffect(() => { void api<Record<string, number>>(`${API}?resource=overview`).then((r) => r.ok && setO(r)); }, [api]);
  if (!o) return <Note>Loading…</Note>;
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Pets" value={o.pets} />
        <Stat label="Active today" value={o.active_day} />
        <Stat label="Active 7 days" value={o.active_week} />
        <Stat label="New 7 days" value={o.new_week} />
        <Stat label="Live ops" value={o.liveOps} />
      </div>
      <Note>Pets sync about every 45 seconds while the app is open, so ops and edits land on the next open or sync.</Note>
    </div>
  );
}

/* ---------------- Pets ---------------- */
type PetSummary = {
  id: string; name: string; variant: string; stage: string; level: number; gone: boolean; asleep: boolean;
  coins: number; gems: number; stats: Record<string, number>; devices: number; createdAt: string; updatedAt: string;
};
export function PetsTab({ onSendOp }: { onSendOp: (petId: string) => void }) {
  const api = useApi();
  const { classes } = useClasses();
  const [q, setQ] = useState("");
  const [classId, setClassId] = useState("");
  const [pets, setPets] = useState<PetSummary[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const load = useCallback(async () => {
    const p = new URLSearchParams({ resource: "pets", limit: "100" });
    if (q) p.set("q", q);
    if (classId) p.set("classId", classId);
    const r = await api<{ pets: PetSummary[] }>(`${API}?${p}`);
    if (r.ok) setPets(r.pets);
  }, [api, q, classId]);
  useEffect(() => { void load(); }, [load]);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
      <Panel title="Pets" right={<span className="text-xs text-white/40">{pets.length} shown</span>}>
        <div className="mb-3 flex flex-wrap gap-2">
          <input className={inputCls + " max-w-xs"} placeholder="Search name or id" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={inputCls + " max-w-xs"} value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.count ?? 0})</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase text-white/40">
              <tr><th className="py-1">Name</th><th>Id</th><th>Variant</th><th>Stage</th><th>Lv</th><th>Last seen</th></tr>
            </thead>
            <tbody>
              {pets.map((p) => (
                <tr key={p.id} onClick={() => setSel(p.id)} className={"cursor-pointer border-t border-white/5 hover:bg-white/5 " + (sel === p.id ? "bg-cyan-400/10" : "")}>
                  <td className="py-1.5 font-semibold">{p.name || "—"} {p.gone && "💀"}{p.asleep && "💤"}</td>
                  <td className="font-mono text-xs text-white/60">{p.id}</td>
                  <td>{p.variant}</td><td>{p.stage}</td><td>{p.level}</td>
                  <td className="text-xs text-white/50">{fmtDate(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {sel ? <PetInspector id={sel} onChanged={load} onSendOp={onSendOp} /> : <Note>Pick a pet to inspect it.</Note>}
    </div>
  );
}

function PetInspector({ id, onChanged, onSendOp }: { id: string; onChanged: () => void; onSendOp: (petId: string) => void }) {
  const api = useApi();
  const [d, setD] = useState<{ pet: PetSummary; data: Record<string, unknown>; applied: { id: number; summary: string; applied_at: string }[]; pending: { id: number; summary: string }[] } | null>(null);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ t: string; tone: "ok" | "error" } | null>(null);
  const [raw, setRaw] = useState(false);
  const load = useCallback(async () => {
    const r = await api<NonNullable<typeof d>>(`${API}?resource=pet&id=${id}`);
    if (r.ok) { setD(r); setEdit({}); }
  }, [api, id]);
  useEffect(() => { void load(); setMsg(null); }, [load]);
  if (!d) return <Note>Loading pet…</Note>;
  const p = d.pet;
  const save = async () => {
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(edit)) if (v !== "") patch[k] = k === "name" ? v : Number(v);
    const r = await api(API, { action: "pet-patch", id, patch });
    setMsg(r.ok ? { t: "Saved. The pet picks it up on its next sync.", tone: "ok" } : { t: r.error || "Failed", tone: "error" });
    if (r.ok) { void load(); onChanged(); }
  };
  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    const r = await api(API, { action, id, ...extra });
    setMsg(r.ok ? { t: "Done.", tone: "ok" } : { t: r.error || "Failed", tone: "error" });
    void load();
  };
  return (
    <Panel title={p.name || p.id} right={<span className="font-mono text-xs text-white/50">{p.id}</span>}>
      <div className="grid gap-3 text-sm">
        <div className="grid grid-cols-3 gap-2 text-xs text-white/60">
          <span>{p.variant} · {p.stage}</span><span>Level {p.level}</span><span>{p.devices} device(s)</span>
          <span>Hatched {fmtDate(p.createdAt)}</span><span>Seen {fmtDate(p.updatedAt)}</span><span>{p.gone ? "Gone 💀" : p.asleep ? "Asleep" : "Awake"}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["name", ...STATS, "coins", "gems", "xp"].map((k) => (
            <Field key={k} label={k}>
              <input className={inputCls} placeholder={String(k === "name" ? p.name : k in p.stats ? p.stats[k] : k === "xp" ? d.data.xp ?? 0 : (p as unknown as Record<string, unknown>)[k] ?? "")}
                value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
            </Field>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={save} disabled={!Object.values(edit).some(Boolean)}>Save edits</Btn>
          <Btn kind="ghost" onClick={() => onSendOp(id)}>Send op to this pet</Btn>
          {p.gone && <Btn kind="ghost" onClick={() => act("pet-patch", { patch: { gone: false, health: 60, energy: 60 } })}>Revive now</Btn>}
          <Btn kind="danger" small onClick={() => { if (confirm("Sign out every device except the newest?")) void act("pet-unlink"); }}>Unlink old devices</Btn>
        </div>
        {msg && <Note tone={msg.tone}>{msg.t}</Note>}
        <div>
          <div className="mb-1 text-[11px] uppercase text-white/40">Waiting for this pet</div>
          {d.pending.length ? d.pending.map((o) => <div key={o.id} className="text-xs">#{o.id} {o.summary}</div>) : <div className="text-xs text-white/40">Nothing queued</div>}
        </div>
        <div>
          <div className="mb-1 text-[11px] uppercase text-white/40">Applied</div>
          {d.applied.length ? d.applied.slice(0, 12).map((o) => <div key={o.id} className="text-xs">#{o.id} {o.summary} <span className="text-white/40">· {fmtDate(o.applied_at)}</span></div>) : <div className="text-xs text-white/40">None yet</div>}
        </div>
        <button type="button" className="text-left text-xs text-cyan-300 underline" onClick={() => setRaw(!raw)}>{raw ? "Hide" : "Show"} raw save</button>
        {raw && <pre className="max-h-80 overflow-auto rounded-lg bg-black/50 p-2 text-[11px] text-white/70">{JSON.stringify(d.data, null, 2)}</pre>}
      </div>
    </Panel>
  );
}

/* ---------------- Classes ---------------- */
export function ClassesTab() {
  const api = useApi();
  const { classes, reload } = useClasses();
  const blank = { id: 0, name: "", variants: [] as string[], stages: [] as string[], minLevel: "", maxLevel: "", createdAfter: "", createdBefore: "", petIds: "" };
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState<string | null>(null);
  const toggle = (k: "variants" | "stages", v: string) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });
  const edit = (c: ClassRow) => {
    const r = c.rule as Record<string, unknown>;
    setF({ id: c.id, name: c.name, variants: (r.variants as string[]) || [], stages: (r.stages as string[]) || [],
      minLevel: r.minLevel ? String(r.minLevel) : "", maxLevel: r.maxLevel ? String(r.maxLevel) : "",
      createdAfter: r.createdAfter ? String(r.createdAfter).slice(0, 10) : "", createdBefore: r.createdBefore ? String(r.createdBefore).slice(0, 10) : "",
      petIds: ((r.petIds as string[]) || []).join(" ") });
  };
  const save = async () => {
    const rule = { variants: f.variants, stages: f.stages, minLevel: f.minLevel, maxLevel: f.maxLevel,
      createdAfter: f.createdAfter || undefined, createdBefore: f.createdBefore || undefined,
      petIds: f.petIds.split(/[\s,;]+/).filter(Boolean) };
    const r = await api(API, { action: "class-save", id: f.id || undefined, name: f.name, rule });
    setMsg(r.ok ? "Class saved" : r.error || "Failed");
    if (r.ok) { setF(blank); void reload(); }
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Classes">
        {classes.length ? classes.map((c) => (
          <div key={c.id} className="flex items-center justify-between border-t border-white/5 py-2 text-sm">
            <div><b>{c.name}</b> <span className="text-white/50">· {c.count ?? 0} pets</span>
              <div className="font-mono text-[11px] text-white/40">{JSON.stringify(c.rule)}</div></div>
            <div className="flex gap-2">
              <Btn small kind="ghost" onClick={() => edit(c)}>Edit</Btn>
              <Btn small kind="danger" onClick={async () => { if (confirm(`Delete ${c.name}?`)) { await api(API, { action: "class-delete", id: c.id }); void reload(); } }}>Delete</Btn>
            </div>
          </div>
        )) : <Note>No classes yet. A class is a saved group: e.g. “Ignis teens” or “T-shirt batch 1”.</Note>}
      </Panel>
      <Panel title={f.id ? "Edit class" : "New class"}>
        <div className="grid gap-3">
          <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Variants (none = any)">
            <div className="flex flex-wrap gap-1">{VARIANTS.map((v) => <button type="button" key={v} onClick={() => toggle("variants", v)} className={"rounded-full px-2 py-0.5 text-xs " + (f.variants.includes(v) ? "bg-cyan-400 text-black" : "border border-white/15")}>{v}</button>)}</div>
          </Field>
          <Field label="Stages (none = any)">
            <div className="flex flex-wrap gap-1">{STAGES.map((v) => <button type="button" key={v} onClick={() => toggle("stages", v)} className={"rounded-full px-2 py-0.5 text-xs " + (f.stages.includes(v) ? "bg-cyan-400 text-black" : "border border-white/15")}>{v}</button>)}</div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min level"><input className={inputCls} value={f.minLevel} onChange={(e) => setF({ ...f, minLevel: e.target.value })} /></Field>
            <Field label="Max level"><input className={inputCls} value={f.maxLevel} onChange={(e) => setF({ ...f, maxLevel: e.target.value })} /></Field>
            <Field label="Hatched after"><input type="date" className={inputCls} value={f.createdAfter} onChange={(e) => setF({ ...f, createdAfter: e.target.value })} /></Field>
            <Field label="Hatched before"><input type="date" className={inputCls} value={f.createdBefore} onChange={(e) => setF({ ...f, createdBefore: e.target.value })} /></Field>
          </div>
          <Field label="Only these pet ids" hint="Optional: a hand-picked list, e.g. a t-shirt batch"><textarea className={inputCls} rows={2} value={f.petIds} onChange={(e) => setF({ ...f, petIds: e.target.value })} /></Field>
          <div className="flex gap-2"><Btn onClick={save} disabled={!f.name}>Save class</Btn>{f.id ? <Btn kind="ghost" onClick={() => setF(blank)}>Cancel</Btn> : null}</div>
          {msg && <Note>{msg}</Note>}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- Ops ---------------- */
type OpListRow = { id: number; scope: string; class_name: string | null; pet_ids: string[]; summary: string; note: string; applied: number; created_at: string; starts_at: string; expires_at: string | null; cancelled_at: string | null; created_by: string };
export function OpsTab({ presetPet }: { presetPet: string | null }) {
  const api = useApi();
  const { classes } = useClasses();
  const [ops, setOps] = useState<OpListRow[]>([]);
  const [scope, setScope] = useState<ScopeValue>(presetPet ? { ...emptyScope, scope: "pets", petIds: presetPet } : emptyScope);
  const [kind, setKind] = useState("grant");
  const [f, setF] = useState<Record<string, string>>({ style: "toast" });
  const [note, setNote] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reach, setReach] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ t: string; tone: "ok" | "error" } | null>(null);
  const load = useCallback(async () => { const r = await api<{ ops: OpListRow[] }>(`${API}?resource=ops`); if (r.ok) setOps(r.ops); }, [api]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (presetPet) setScope({ ...emptyScope, scope: "pets", petIds: presetPet }); }, [presetPet]);
  useEffect(() => {
    const t = setTimeout(async () => { const r = await api<{ count: number }>(API, { action: "preview", ...scopeBody(scope) }); setReach(r.ok ? r.count : null); }, 300);
    return () => clearTimeout(t);
  }, [api, scope]);
  const n = (k: string) => (f[k] ? Number(f[k]) : undefined);
  const buildOp = (): Record<string, unknown> => {
    switch (kind) {
      case "grant": {
        const items: Record<string, number> = {};
        (f.items || "").split(/[,\n]+/).forEach((pair) => { const [k, v] = pair.split(/[:=\s]+/).map((s) => s.trim()); if (k) items[k] = Number(v || 1); });
        return { kind, coins: n("coins"), gems: n("gems"), xp: n("xp"), items };
      }
      case "stat": {
        const set: Record<string, number> = {}, add: Record<string, number> = {};
        STATS.forEach((s) => { if (f["set_" + s]) set[s] = Number(f["set_" + s]); if (f["add_" + s]) add[s] = Number(f["add_" + s]); });
        return { kind, set, add };
      }
      case "message": return { kind, text: f.text, title: f.title, style: f.style };
      case "anim": return { kind, name: f.name };
      case "flag": return { kind, key: f.key, value: f.value === "true" ? true : f.value === "false" ? false : f.value === "" || f.value === undefined ? null : Number.isNaN(Number(f.value)) ? f.value : Number(f.value) };
      default: return { kind };
    }
  };
  const send = async () => {
    if (scope.scope === "all" && !confirm(`Send to ALL pets (${reach ?? "?"})?`)) return;
    const r = await api<{ reach: number; summary: string }>(API, {
      action: "op-create", ...scopeBody(scope), op: buildOp(), note,
      startsAt: startsAt ? new Date(startsAt).toISOString() : undefined, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    });
    setMsg(r.ok ? { t: `Queued: ${r.summary} → ${r.reach} pets now`, tone: "ok" } : { t: r.error || "Failed", tone: "error" });
    if (r.ok) void load();
  };
  const input = (k: string, label: string, ph = "") => <Field key={k} label={label}><input className={inputCls} placeholder={ph} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Field>;
  return (
    <div className="grid gap-4 lg:grid-cols-[440px_1fr]">
      <Panel title="Send an op">
        <div className="grid gap-4">
          <ScopePicker value={scope} onChange={setScope} classes={classes} />
          <div className="text-xs text-white/50">Reaches <b className="text-white">{reach ?? "…"}</b> existing pets</div>
          <Field label="What">
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="grant">🎁 Gift (coins, gems, XP, items)</option>
              <option value="stat">📊 Change stats</option>
              <option value="message">💬 Message</option>
              <option value="anim">🎬 Play animation</option>
              <option value="flag">🚩 Set flag</option>
              <option value="revive">⚡ Revive / recharge</option>
            </select>
          </Field>
          {kind === "grant" && <div className="grid grid-cols-3 gap-2">{input("coins", "Coins")}{input("gems", "Gems")}{input("xp", "XP")}<div className="col-span-3">{input("items", "Items", "shard:2, leaf:3")}</div></div>}
          {kind === "stat" && (
            <div className="grid grid-cols-[80px_1fr_1fr] items-center gap-2 text-xs">
              <span /><span className="text-white/50">Set to</span><span className="text-white/50">Add</span>
              {STATS.map((s) => [
                <span key={s}>{s}</span>,
                <input key={s + "s"} className={inputCls} value={f["set_" + s] ?? ""} onChange={(e) => setF({ ...f, ["set_" + s]: e.target.value })} />,
                <input key={s + "a"} className={inputCls} value={f["add_" + s] ?? ""} onChange={(e) => setF({ ...f, ["add_" + s]: e.target.value })} />,
              ])}
            </div>
          )}
          {kind === "message" && (
            <div className="grid gap-2">
              <Field label="Style"><select className={inputCls} value={f.style} onChange={(e) => setF({ ...f, style: e.target.value })}><option value="toast">Toast</option><option value="say">Pet says it</option><option value="modal">Popup</option></select></Field>
              {f.style === "modal" && input("title", "Title")}
              <Field label="Text"><textarea className={inputCls} rows={3} value={f.text ?? ""} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>
            </div>
          )}
          {kind === "anim" && input("name", "Animation", "greet, backflip, catchtail, jump…")}
          {kind === "flag" && <div className="grid grid-cols-2 gap-2">{input("key", "Key")}{input("value", "Value", "true / 3 / text / empty = remove")}</div>}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Starts (optional)"><input type="datetime-local" className={inputCls} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></Field>
            <Field label="Expires (optional)"><input type="datetime-local" className={inputCls} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></Field>
          </div>
          <Field label="Internal note"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <Btn onClick={send}>Queue op</Btn>
          {msg && <Note tone={msg.tone}>{msg.t}</Note>}
        </div>
      </Panel>
      <Panel title="Recent ops">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase text-white/40"><tr><th>#</th><th>What</th><th>Scope</th><th>Applied</th><th>When</th><th /></tr></thead>
            <tbody>
              {ops.map((o) => (
                <tr key={o.id} className={"border-t border-white/5 " + (o.cancelled_at ? "opacity-40" : "")}>
                  <td className="py-1.5 text-white/50">{o.id}</td>
                  <td>{o.summary}{o.note && <div className="text-[11px] text-white/40">{o.note}</div>}</td>
                  <td className="text-xs">{o.scope === "class" ? `class: ${o.class_name ?? "deleted"}` : o.scope === "pets" ? `${o.pet_ids.length} pet(s)` : "all"}</td>
                  <td>{o.applied}</td>
                  <td className="text-xs text-white/50">{fmtDate(o.starts_at)}{o.expires_at && <> → {fmtDate(o.expires_at)}</>}</td>
                  <td>{!o.cancelled_at && <Btn small kind="ghost" onClick={async () => { await api(API, { action: "op-cancel", id: o.id }); void load(); }}>Cancel</Btn>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- Audit log ---------------- */
export function LogTab() {
  const api = useApi();
  const [log, setLog] = useState<{ id: number; actor: string; action: string; target: string; detail: unknown; created_at: string }[]>([]);
  useEffect(() => { void api<{ log: typeof log }>(`${API}?resource=log`).then((r) => r.ok && setLog(r.log)); }, [api]);
  return (
    <Panel title="Audit log">
      <table className="w-full text-left text-sm">
        <thead className="text-[11px] uppercase text-white/40"><tr><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead>
        <tbody>
          {log.map((l) => (
            <tr key={l.id} className="border-t border-white/5 align-top">
              <td className="py-1.5 text-xs text-white/50">{fmtDate(l.created_at)}</td><td>{l.actor}</td><td>{l.action}</td>
              <td className="font-mono text-xs">{l.target}</td><td className="font-mono text-[11px] text-white/50">{JSON.stringify(l.detail).slice(0, 160)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
