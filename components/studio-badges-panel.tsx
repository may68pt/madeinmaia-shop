"use client";

import { Tag } from "lucide-react";
import { cardBadges, NEW_BADGE_DAYS, newBadgeEndsAt, normalizeBadges, type ProductBadges } from "@/lib/product-badges";

function toDateInput(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/** Badge settings of one design in the Studio product editor. */
export function BadgesPanel({ badges: rawBadges, publishedAt, collection, status, onChange }: {
  badges?: ProductBadges | null;
  publishedAt?: string | null;
  collection: string;
  status: string;
  onChange: (patch: { badges?: ProductBadges; publishedAt?: string | null }) => void;
}) {
  const badges = normalizeBadges(rawBadges);
  // Keep the raw values while typing (spaces in the promo text); the server normalises on save.
  const set = (patch: Partial<ProductBadges>) => onChange({ badges: { ...(rawBadges ?? {}), newMode: badges.newMode, ...patch } });
  const endsAt = newBadgeEndsAt(publishedAt);
  const now = new Date();
  const preview = cardBadges({ badges, publishedAt, collection }, { new: "Novo", bestSeller: "Mais vendido" }, now);
  const fieldClass = "h-10 border border-black/10 bg-transparent px-3 text-sm font-normal normal-case outline-none focus:border-black/35";

  return <section className="mim-product-badges grid gap-4 rounded-2xl border border-black/10 p-4 md:col-span-2 xl:col-span-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3"><Tag className="mt-0.5 size-4 text-black/40" /><div><p className="text-xs font-black uppercase">Etiquetas no cartão</p><p className="mt-1 text-xs text-black/45">Aparecem no canto do design na grelha da loja.</p></div></div>
      <div className="flex flex-wrap gap-1.5" aria-label="Pré-visualização das etiquetas">{preview.length ? preview.map((badge) => <span key={badge.key} className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[.12em] ${badge.key === "promo" ? "bg-[#ff4f1f] text-white" : badge.key === "best" ? "bg-white text-[#111] ring-1 ring-black/10" : badge.key === "category" ? "bg-black/70 text-white" : "bg-[#e7ff57] text-[#111]"}`}>{badge.label}</span>) : <span className="text-xs text-black/40">Sem etiquetas</span>}</div>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <label className="grid gap-1 text-xs font-bold uppercase"><span>Novo</span>
        <select value={badges.newMode} onChange={(event) => set({ newMode: event.target.value as ProductBadges["newMode"] })} className={fieldClass}>
          <option value="auto">Automático · {NEW_BADGE_DAYS / 30} meses após publicar</option>
          <option value="on">Mostrar sempre</option>
          <option value="off">Nunca mostrar</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs font-bold uppercase"><span>Data de publicação</span>
        <input type="date" value={toDateInput(publishedAt)} onChange={(event) => onChange({ publishedAt: event.target.value ? new Date(`${event.target.value}T12:00:00Z`).toISOString() : null })} className={fieldClass} />
        <span className="font-normal normal-case text-black/45">{!publishedAt ? (status === "published" ? "Fica com a data de hoje ao guardar." : "Preenchida quando o design for ativado.") : badges.newMode !== "auto" ? "" : endsAt && endsAt > now ? `“Novo” até ${endsAt.toLocaleDateString("pt-PT")}` : `“Novo” terminou a ${endsAt?.toLocaleDateString("pt-PT")}`}</span>
      </label>
      <label className="grid gap-1 text-xs font-bold uppercase"><span>Promoção</span>
        <input value={rawBadges?.promo ?? ""} maxLength={24} placeholder="Ex.: −20% · Black Friday" onChange={(event) => set({ promo: event.target.value })} className={fieldClass} />
        <span className="font-normal normal-case text-black/45">Só a etiqueta: o preço não muda.</span>
      </label>
      <div className="grid content-start gap-2 text-xs font-bold uppercase">
        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={badges.bestSeller === true} onChange={(event) => set({ bestSeller: event.target.checked })} className="size-4 accent-[#ff4f1f]" />Mais vendido</label>
        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={badges.category === true} onChange={(event) => set({ category: event.target.checked })} className="size-4 accent-[#ff4f1f]" />Mostrar coleção{collection && collection !== "Made in Maia" ? ` · ${collection}` : " (sem coleção)"}</label>
      </div>
    </div>
  </section>;
}
