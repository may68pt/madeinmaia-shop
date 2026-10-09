"use client";

import { useEffect, useMemo, useState } from "react";

type Row = { day: string; event: string; path: string; total: number };

export function ShopAnalyticsDashboard({ username, password }: { username: string; password: string }) {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!username || !password) return;
    const controller = new AbortController();
    queueMicrotask(() => { setLoading(true); setError(""); });
    fetch(`/api/analytics?days=${days}`, { headers: { "x-studio-user": username, "x-studio-key": password }, signal: controller.signal, cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("Não foi possível carregar os dados."); return response.json(); })
      .then((data: { rows: Row[] }) => { if (!controller.signal.aborted) setRows(data.rows ?? []); })
      .catch(() => { if (!controller.signal.aborted) setError("Analítica indisponível. Confirma a migração e a ligação à base de dados."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [days, username, password]);

  const totals = useMemo(() => {
    const tally = new Map<string, number>();
    const paths = new Map<string, number>();
    for (const row of rows) {
      tally.set(row.event, (tally.get(row.event) ?? 0) + Number(row.total));
      if (row.event === "page_view") paths.set(row.path, (paths.get(row.path) ?? 0) + Number(row.total));
    }
    return { tally, paths: [...paths.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15) };
  }, [rows]);
  function download() {
    const csv = "\uFEFF" + [["Dia", "Evento", "Página", "Total"], ...rows.map((r) => [r.day, r.event, r.path, String(r.total)])].map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "madeinmaia-analytics.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="mb-6 border border-black/15 bg-white p-5 text-black sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-600">Made in Maia · First-party analytics</p><h2 className="mt-2 text-3xl font-black uppercase">Analytics</h2><p className="mt-2 text-sm text-black/60">Contagens agregadas por dia e página, sem cookies, perfis ou identificação pessoal. Visualizações não equivalem a visitantes únicos.</p></div>
      <div className="flex gap-2"><select aria-label="Período" value={days} onChange={(e) => setDays(Number(e.target.value))} className="border border-black/20 bg-white px-3 py-2"><option value={7}>7 dias</option><option value={30}>30 dias</option><option value={90}>90 dias</option></select><button className="border border-black/20 px-3 py-2 text-sm font-bold" onClick={download} disabled={!rows.length}>Exportar CSV</button></div>
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    {loading && <p className="mt-4 text-sm">A carregar…</p>}
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{([["Visualizações", "page_view"], ["Produtos vistos", "product_view"], ["Adições ao carrinho", "add_to_cart"], ["Checkouts iniciados", "checkout_started"]] as const).map(([label, key]) => <div key={key} className="bg-[#f4f3ef] p-4"><p className="text-3xl font-black">{(totals.tally.get(key) ?? 0).toLocaleString("pt-PT")}</p><p className="mt-2 text-xs font-semibold">{label}</p></div>)}</div>
    <div className="mt-7"><h3 className="mb-3 text-lg font-black uppercase">Páginas mais vistas</h3>{totals.paths.length ? <div className="space-y-2">{totals.paths.map(([path, count]) => <div key={path} className="flex items-center justify-between gap-4 border-b border-black/10 py-2 text-sm"><span className="truncate font-medium">{path}</span><strong>{count.toLocaleString("pt-PT")}</strong></div>)}</div> : <p className="text-sm text-black/50">Ainda não existem dados no período selecionado.</p>}</div>
  </section>;
}
