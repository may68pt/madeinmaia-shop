"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Gauge, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes, isCrunchable } from "@/lib/image-variants";

export type StudioCreds = { user: string; key: string };

type Variant = { width: number; height: number; bytes: number; url: string };
type LibraryEntry = {
  url: string;
  usedBy: { slug: string; name: string; role: string }[];
  crunched: boolean;
  bytes: number;
  width: number;
  height: number;
  variants: Variant[];
  variantBytes: number;
  error: string;
  missing: boolean;
};
type Summary = { total: number; crunched: number; pending: number; failed: number; missing: number; originalBytes: number; gridBytes: number };

function headers(creds: StudioCreds, json = false): HeadersInit {
  return { ...(json ? { "content-type": "application/json" } : {}), "x-studio-user": creds.user, "x-studio-key": creds.key };
}

const VARIANT_USE: Record<number, string> = { 160: "Miniaturas · Studio", 480: "Grelha da loja", 960: "Página do design", 1600: "Ecrãs grandes · zoom" };
function variantLabel(variant: Variant) {
  const nominal = Number(variant.url.match(/-w(\d+)\.webp$/)?.[1] ?? variant.width);
  return `${nominal}px · ${VARIANT_USE[nominal] ?? "WebP"}`;
}

/** Image SEO fields and the crunched files of one design, shown inside the Studio product editor. */
export function DesignImagePanel({ creds, url, name, alt, title, caption, onChange }: {
  creds: StudioCreds;
  url: string;
  name: string;
  alt: string;
  title: string;
  caption: string;
  onChange: (patch: { imageAlt?: string; imageTitle?: string; imageCaption?: string }) => void;
}) {
  const [entry, setEntry] = useState<LibraryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [crunching, setCrunching] = useState(false);
  const crunchable = isCrunchable(url);

  const load = useCallback(async () => {
    if (!crunchable) { setEntry(null); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/media/assets?url=${encodeURIComponent(url)}`, { headers: headers(creds), cache: "no-store" });
      const data = (await response.json()) as { entry?: LibraryEntry | null };
      setEntry(response.ok ? data.entry ?? null : null);
    } catch { setEntry(null); } finally { setLoading(false); }
  }, [creds.user, creds.key, crunchable, url]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load(); }, [load]);

  async function recrunch() {
    setCrunching(true);
    try {
      const response = await fetch("/api/media/assets", { method: "POST", headers: headers(creds, true), body: JSON.stringify({ action: "crunch", urls: [url], limit: 1 }) });
      const data = (await response.json()) as { results?: { ok: boolean; error?: string }[] };
      const result = data.results?.[0];
      if (response.ok && result?.ok) toast.success("Imagem otimizada.");
      else toast.error(result?.error || "Não foi possível otimizar a imagem.");
      await load();
    } finally { setCrunching(false); }
  }

  const filename = url.split("/").pop() ?? "";
  const altMissing = !alt.trim();
  const saving = entry?.crunched && entry.bytes ? Math.round((1 - (entry.variants.find((v) => v.url.endsWith("-w480.webp"))?.bytes ?? entry.bytes) / entry.bytes) * 100) : 0;

  return <section className="mim-design-image-panel min-w-0 rounded-2xl border border-black/10 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-black uppercase">Imagem · SEO e ficheiros</p><p className="mt-1 text-xs text-black/45">O texto alternativo é o que o Google e os leitores de ecrã “veem”. Descreve o design, não o produto.</p></div>
      {crunchable && <Button type="button" size="sm" variant="outline" className="rounded-none" disabled={crunching} onClick={() => void recrunch()}><RefreshCw className={crunching ? "animate-spin" : undefined} />{crunching ? "A otimizar…" : entry?.crunched ? "Recomprimir" : "Otimizar agora"}</Button>}
    </div>
    <div className="mt-4 grid gap-3">
      <label className="grid gap-1 text-xs font-bold uppercase"><span className="flex justify-between gap-2">Texto alternativo (alt)<span className={`font-normal normal-case ${alt.length > 125 ? "text-red-600" : "text-black/40"}`}>{alt.length}/125</span></span><Input value={alt} placeholder={`Ex.: ${name} — ilustração original Made in Maia`} onChange={(event) => onChange({ imageAlt: event.target.value })} />{altMissing && <span className="font-normal normal-case text-amber-600">Sem alt: a loja usa o nome do design.</span>}</label>
      <label className="grid gap-1 text-xs font-bold uppercase"><span>Título da imagem</span><Input value={title} placeholder={name} onChange={(event) => onChange({ imageTitle: event.target.value })} /></label>
      <label className="grid gap-1 text-xs font-bold uppercase"><span>Legenda / descrição da imagem</span><textarea rows={2} value={caption} placeholder="Ex.: Sardinha de Lisboa em estilo serigrafia, impressa na Maia." onChange={(event) => onChange({ imageCaption: event.target.value })} className="min-h-16 border border-black/10 bg-transparent px-3 py-2 text-sm font-normal normal-case outline-none focus:border-black/35" /></label>
      <p className="text-[11px] text-black/45">Ficheiro: <span className="font-mono">{filename || "—"}</span>{entry?.width ? ` · ${entry.width}×${entry.height}px` : ""}{entry?.bytes ? ` · original ${formatBytes(entry.bytes)}` : ""}</p>
    </div>
    {crunchable && <div className="mt-4 border-t border-black/10 pt-4">
      <p className="text-xs font-black uppercase">Ficheiros otimizados {entry?.crunched && saving > 0 && <span className="ml-2 font-bold normal-case text-emerald-600">grelha −{saving}%</span>}</p>
      {loading ? <p className="mt-2 text-xs text-black/45">A carregar…</p>
        : entry?.missing ? <p className="mt-2 text-xs text-red-600">O ficheiro original não existe no servidor.</p>
        : entry?.error && !entry.crunched ? <p className="mt-2 text-xs text-red-600">Erro ao otimizar: {entry.error}</p>
        : !entry?.crunched ? <p className="mt-2 text-xs text-amber-600">Ainda não otimizada — a loja está a enviar o PNG original. Clica em “Otimizar agora”.</p>
        : <div className="mt-2 grid gap-2">{[...entry.variants].sort((a, b) => a.width - b.width).map((variant) => <a key={variant.url} href={variant.url} target="_blank" rel="noreferrer" className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border border-black/10 p-2 text-xs hover:border-black/30">
            <span className="relative size-10 overflow-hidden bg-black/5"><Image src={variant.url} alt="" fill sizes="40px" unoptimized className="object-contain" /></span>
            <span className="min-w-0"><strong className="block truncate">{variantLabel(variant)}</strong><span className="text-black/45">{variant.width}×{variant.height} · WebP</span></span>
            <strong>{formatBytes(variant.bytes)}</strong>
          </a>)}</div>}
    </div>}
  </section>;
}

/** Library health: how much of the catalogue is crunched, with a button that crunches everything left. */
export function LibraryCrunchPanel({ creds }: { creds: StudioCreds }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const stop = useRef(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/media/assets", { headers: headers(creds), cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { summary: Summary; entries: LibraryEntry[] };
      setSummary(data.summary);
      setEntries(data.entries);
    } catch { /* keep the last report */ }
  }, [creds.user, creds.key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load(); }, [load]);

  async function crunchAll() {
    stop.current = false;
    setRunning(true);
    let failures = 0;
    try {
      for (let round = 0; round < 200 && !stop.current; round++) {
        const response = await fetch("/api/media/assets", { method: "POST", headers: headers(creds, true), body: JSON.stringify({ action: "crunch-pending", limit: 3 }) });
        if (!response.ok) { failures++; if (failures > 3) break; await new Promise((resolve) => setTimeout(resolve, 4000)); continue; }
        const data = (await response.json()) as { results: { ok: boolean }[]; summary: Summary | null };
        if (data.summary) setSummary(data.summary);
        if (!data.results.length) break;
      }
      await load();
      toast.success(stop.current ? "Otimização parada." : "Biblioteca otimizada.");
    } finally { setRunning(false); }
  }

  if (!summary) return null;
  const done = summary.total ? Math.round((summary.crunched / summary.total) * 100) : 100;
  const heavy = [...entries].filter((entry) => !entry.crunched).sort((a, b) => b.bytes - a.bytes).slice(0, 12);
  return <section className="mim-library-crunch mb-5 border border-black/10 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><Gauge className="size-5 text-black/40" /><div><p className="text-xs font-black uppercase">Otimização de imagens · {summary.crunched}/{summary.total} ({done}%)</p><p className="mt-0.5 text-xs text-black/50">Originais {formatBytes(summary.originalBytes)} · a grelha da loja descarrega {formatBytes(summary.gridBytes)}{summary.failed ? ` · ${summary.failed} com erro` : ""}{summary.missing ? ` · ${summary.missing} em falta` : ""}</p></div></div>
      <div className="flex gap-2">
        {summary.pending + summary.failed > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((value) => !value)}>{open ? "Esconder" : "Ver por otimizar"}</Button>}
        {running ? <Button type="button" size="sm" variant="outline" className="rounded-none" onClick={() => { stop.current = true; }}>Parar</Button>
          : summary.pending > 0 && <Button type="button" size="sm" className="rounded-none !bg-[#ff4f1f] !text-white" onClick={() => void crunchAll()}><Zap />Otimizar {summary.pending} imagens</Button>}
      </div>
    </div>
    <div className="mt-3 h-1.5 overflow-hidden bg-black/10"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${done}%` }} /></div>
    {open && heavy.length > 0 && <ul className="mt-3 grid gap-1 text-xs">{heavy.map((entry) => <li key={entry.url} className="flex justify-between gap-3"><span className="min-w-0 truncate">{entry.usedBy[0]?.name ?? entry.url.split("/").pop()}{entry.error ? <span className="text-red-600"> · {entry.error}</span> : null}</span><strong>{formatBytes(entry.bytes)}</strong></li>)}</ul>}
  </section>;
}
