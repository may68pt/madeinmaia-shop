"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";

/* Small UI kit for the CyberPet back office: one API helper and a few plain, dark-neon controls. */

export type Creds = { user: string; key: string };
export const CredsContext = createContext<Creds>({ user: "", key: "" });

export type ApiResult<T = Record<string, unknown>> = T & { ok: boolean; error?: string };

export function useApi() {
  const creds = useContext(CredsContext);
  return useCallback(
    async <T = Record<string, unknown>>(path: string, body?: unknown): Promise<ApiResult<T>> => {
      try {
        const res = await fetch(path, {
          method: body === undefined ? "GET" : "POST",
          headers: { "content-type": "application/json", "x-studio-user": creds.user, "x-studio-key": creds.key },
          body: body === undefined ? undefined : JSON.stringify(body),
          cache: "no-store",
        });
        const j = (await res.json().catch(() => ({}))) as ApiResult<T>;
        if (!res.ok && j.ok === undefined) return { ...j, ok: false, error: `HTTP ${res.status}` } as ApiResult<T>;
        return j;
      } catch {
        return { ok: false, error: "No connection" } as ApiResult<T>;
      }
    },
    [creds],
  );
}

export const cls = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Panel({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">{title}</h3>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Btn({ children, onClick, kind = "primary", disabled, type = "button", small }: {
  children: ReactNode; onClick?: () => void; kind?: "primary" | "ghost" | "danger"; disabled?: boolean; type?: "button" | "submit"; small?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls(
        "rounded-lg font-bold transition disabled:opacity-40",
        small ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm",
        kind === "primary" && "bg-cyan-400 text-black hover:bg-cyan-300",
        kind === "ghost" && "border border-white/15 text-white hover:bg-white/10",
        kind === "danger" && "bg-rose-500 text-white hover:bg-rose-400",
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-white/60">
      {label}
      {children}
      {hint && <span className="font-normal normal-case tracking-normal text-white/40">{hint}</span>}
    </label>
  );
}

export const inputCls = "w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-cyan-400";

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

export function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" | "ok" }) {
  return (
    <div className={cls("rounded-lg px-3 py-2 text-sm",
      tone === "info" && "bg-white/5 text-white/70",
      tone === "error" && "bg-rose-500/15 text-rose-200",
      tone === "ok" && "bg-emerald-500/15 text-emerald-200")}>
      {children}
    </div>
  );
}

export const fmtDate = (v: unknown) => {
  if (!v) return "—";
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

export const VARIANTS = ["core", "aqua", "ignis", "terra", "lumen", "umbra", "void", "aurora"];
export const STAGES = ["egg", "baby", "juv", "teen", "adult"];
export const STATS = ["happy", "energy", "health", "rest", "bond"];

/* ---------- scope picker shared by ops, releases and anything that targets pets ---------- */
export type ScopeValue = { scope: "all" | "class" | "pets"; classId: number | null; petIds: string; includeNew: boolean };
export const emptyScope: ScopeValue = { scope: "all", classId: null, petIds: "", includeNew: false };
export const scopeBody = (s: ScopeValue) => ({
  scope: s.scope, classId: s.classId, includeNew: s.includeNew,
  petIds: s.petIds.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean),
});

export function ScopePicker({ value, onChange, classes }: { value: ScopeValue; onChange: (v: ScopeValue) => void; classes: { id: number; name: string; count?: number }[] }) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {(["all", "class", "pets"] as const).map((s) => (
          <button key={s} type="button" onClick={() => onChange({ ...value, scope: s })}
            className={cls("rounded-full px-3 py-1 text-xs font-bold", value.scope === s ? "bg-fuchsia-500 text-white" : "border border-white/15 text-white/70")}>
            {s === "all" ? "All pets" : s === "class" ? "A class" : "Specific pets"}
          </button>
        ))}
      </div>
      {value.scope === "class" && (
        <select className={inputCls} value={value.classId ?? ""} onChange={(e) => onChange({ ...value, classId: e.target.value ? Number(e.target.value) : null })}>
          <option value="">Pick a class…</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{typeof c.count === "number" ? ` (${c.count})` : ""}</option>)}
        </select>
      )}
      {value.scope === "pets" && (
        <textarea className={inputCls} rows={2} placeholder="Pet ids, separated by spaces or commas" value={value.petIds} onChange={(e) => onChange({ ...value, petIds: e.target.value })} />
      )}
      {value.scope !== "pets" && (
        <label className="flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={value.includeNew} onChange={(e) => onChange({ ...value, includeNew: e.target.checked })} />
          Also reach pets hatched after this is sent
        </label>
      )}
    </div>
  );
}
