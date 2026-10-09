"use client";

import { useMemo, useState } from "react";

export type QualityProduct = {
  id: number;
  name: string;
  slug: string;
  designCode: string;
  status: "draft" | "published";
  onlineSaleEnabled: boolean;
  seoTitle: string;
  seoDescription: string;
  seoCanonical: string;
  seoNoIndex: boolean;
  imageKey: string | null;
  gallery: string[];
  collection: string;
  tags: string[];
  colors: string[];
  sizes: string[];
};

type Finding = { label: string; weight: number };
const check = (p: QualityProduct): Finding[] => {
  const findings: Finding[] = [];
  if (!p.name.trim()) findings.push({ label: "Sem nome", weight: 15 });
  if (!p.imageKey?.trim()) findings.push({ label: "Sem imagem principal", weight: 20 });
  if (!p.seoTitle?.trim()) findings.push({ label: "Sem título SEO", weight: 10 });
  if (!p.seoDescription?.trim()) findings.push({ label: "Sem descrição SEO", weight: 10 });
  if (!p.seoCanonical?.trim()) findings.push({ label: "Sem URL canónica", weight: 5 });
  if (!p.collection?.trim()) findings.push({ label: "Sem coleção", weight: 5 });
  if (!p.tags?.length) findings.push({ label: "Sem tags", weight: 10 });
  if (!p.colors?.length) findings.push({ label: "Sem cores", weight: 10 });
  if (!p.sizes?.length) findings.push({ label: "Sem tamanhos", weight: 10 });
  if (!p.gallery?.length) findings.push({ label: "Sem galeria", weight: 5 });
  if (p.status === "published" && p.seoNoIndex) findings.push({ label: "Publicado mas noindex", weight: 10 });
  return findings;
};
const score = (findings: Finding[]) => Math.max(0, 100 - findings.reduce((sum, item) => sum + item.weight, 0));

export function ProductQualityDashboard({ products, onEdit }: {
  products: QualityProduct[];
  onEdit: (id: number) => void;
}) {
  const [filter, setFilter] = useState<"published" | "all" | "issues">("published");
  const [expanded, setExpanded] = useState(false);
  const analysed = useMemo(() => products.map((product) => {
    const findings = check(product);
    return { product, findings, score: score(findings) };
  }), [products]);
  const published = analysed.filter((row) => row.product.status === "published" && row.product.onlineSaleEnabled);
  const average = published.length ? Math.round(published.reduce((sum, row) => sum + row.score, 0) / published.length) : 0;
  const problemCount = published.filter((row) => row.findings.length > 0).length;
  const shown = analysed.filter((row) => filter === "all" || (filter === "published"
    ? row.product.status === "published" && row.product.onlineSaleEnabled
    : row.findings.length > 0 && row.product.status === "published" && row.product.onlineSaleEnabled))
    .sort((a, b) => a.score - b.score || a.product.name.localeCompare(b.product.name));

  function exportCsv() {
    const rows = [["Código", "Produto", "Estado", "Pontuação", "Problemas"], ...shown.map((row) => [
      row.product.designCode, row.product.name, row.product.status, String(row.score),
      row.findings.map((finding) => finding.label).join("; "),
    ])];
    const csv = "\uFEFF" + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.href = url; link.download = "madeinmaia-product-quality.csv"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="mb-6 border border-black/15 bg-white p-5 text-black sm:p-7" aria-label="Qualidade dos produtos">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[.17em] text-orange-600">Studio · Quality Control</p>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">Product Quality Dashboard</h2>
        <p className="mt-2 max-w-2xl text-sm text-black/60">Auditoria automática dos campos do catálogo. Não altera produtos. A descrição longa e os direitos sobre imagens exigem revisão separada.</p>
      </div>
      <button type="button" onClick={() => setExpanded(!expanded)} className="border border-black/20 px-4 py-2 text-sm font-bold hover:bg-black/5" aria-expanded={expanded}>
        {expanded ? "Fechar relatório" : "Ver relatório"}
      </button>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        ["Publicados online", published.length],
        ["Com problemas", problemCount],
        ["Pontuação média", published.length ? `${average}/100` : "—"],
        ["Prontos (100/100)", published.filter((row) => row.score === 100).length],
      ].map(([label, value]) => <div key={label} className="bg-[#f4f3ef] p-4"><div className="text-2xl font-black">{value}</div><div className="mt-1 text-xs font-semibold text-black/60">{label}</div></div>)}
    </div>
    {expanded && <div className="mt-6">
      <div className="mb-4 flex flex-wrap gap-2">
        {([["published", "Publicados"], ["issues", "Só com problemas"], ["all", "Todos"]] as const).map(([value, label]) =>
          <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`border px-3 py-2 text-xs font-bold ${filter === value ? "border-black bg-black text-white" : "border-black/15 hover:bg-black/5"}`}>{label}</button>)}
        <button type="button" onClick={exportCsv} className="ml-auto border border-black/20 px-3 py-2 text-xs font-bold hover:bg-black/5">Exportar CSV</button>
      </div>
      <div className="max-h-[32rem] space-y-2 overflow-y-auto">
        {shown.map(({ product, findings, score: value }) => <div key={product.id} className="flex flex-wrap items-center gap-3 border border-black/10 px-3 py-3 text-sm">
          <span className={`min-w-16 font-black ${value >= 85 ? "text-green-700" : value >= 60 ? "text-amber-700" : "text-red-700"}`}>{value}/100</span>
          <div className="min-w-40 flex-1">
            <p className="font-bold">{product.name} <span className="font-normal text-black/40">{product.designCode}</span></p>
            <p className="mt-1 text-xs text-black/60">{findings.length ? findings.map((finding) => finding.label).join(" · ") : "Sem problemas nos campos analisados"}</p>
          </div>
          <button type="button" onClick={() => onEdit(product.id)} className="shrink-0 bg-black px-3 py-2 text-xs font-bold text-white hover:bg-black/80">Editar</button>
        </div>)}
        {!shown.length && <p className="p-5 text-sm text-black/60">Sem produtos para este filtro.</p>}
      </div>
    </div>}
  </section>;
}
