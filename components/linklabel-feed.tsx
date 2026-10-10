"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { DiscoveryContent, type DiscoveryEntry } from "@/components/discovery-content";

type LinkLabelEntry = DiscoveryEntry & {
  id: string;
  linkUrl: string | null;
  linkLabel: string;
  weight: number;
};

function nextWeightedUnseen(entries: LinkLabelEntry[], seen: Set<string>) {
  const remaining = entries.filter((entry) => !seen.has(entry.id));
  if (!remaining.length) return null;
  const total = remaining.reduce((sum, entry) => sum + Math.max(1, entry.weight), 0);
  let cursor = Math.random() * total;
  return remaining.find((entry) => (cursor -= Math.max(1, entry.weight)) <= 0) ?? remaining[0];
}

export function LinkLabelFeed({
  entries,
  initialEntry,
}: {
  entries: LinkLabelEntry[];
  initialEntry: LinkLabelEntry;
}) {
  const [shown, setShown] = useState<LinkLabelEntry[]>([initialEntry]);
  const latestEntry = useRef<HTMLElement | null>(null);
  const hasMore = entries.some((entry) => !shown.some((item) => item.id === entry.id));

  function loadMore() {
    const seen = new Set(shown.map((entry) => entry.id));
    const next = nextWeightedUnseen(entries, seen);
    if (!next) return;
    setShown((current) => [...current, next]);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => latestEntry.current?.scrollIntoView({ behavior: "smooth" }));
    });
  }

  return (
    <main id="mim-link-label" className="mim-link-label min-h-dvh bg-[#090909] text-white">
      <header className="mim-link-label__chrome fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-4 sm:p-6">
        <Link href="/loja" aria-label="Made in Maia shop">
          <BrandLogo className="h-16 w-auto sm:h-20" />
        </Link>
      </header>
      <div className="mim-link-label__content">
        {shown.map((entry, index) => (
          <article
            key={entry.id}
            ref={index === shown.length - 1 ? latestEntry : undefined}
            className="relative min-h-dvh"
          >
            <DiscoveryContent entry={entry} />
            {entry.linkUrl && (
              <a
                href={entry.linkUrl}
                className="absolute bottom-5 left-4 z-20 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-black uppercase text-black shadow-2xl sm:bottom-6 sm:left-6"
              >
                {entry.linkLabel}<ArrowUpRight className="size-4" />
              </a>
            )}
          </article>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-[#d8ff42] px-5 py-3 text-sm font-black uppercase text-black shadow-2xl transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8ff42] sm:bottom-6 sm:right-6"
        >
          Load more <Plus className="size-4" />
        </button>
      )}
    </main>
  );
}
