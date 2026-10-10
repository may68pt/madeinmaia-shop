import type { Metadata } from "next";
import { and, eq, like } from "drizzle-orm";
import { getDb } from "@/db";
import { pages, randomContent } from "@/db/schema";
import type { DiscoveryEntry } from "@/components/discovery-content";
import { LinkLabelFeed } from "@/components/linklabel-feed";
import type { PageBlock } from "@/lib/page-blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Link Label",
  description: "Every Made in Maia label is a link. Every visit opens something different.",
  alternates: { canonical: "/linklabel" },
};

type LinkLabelEntry = DiscoveryEntry & {
  id: string;
  linkUrl: string | null;
  linkLabel: string;
  weight: number;
};

const FALLBACK_ENTRY: LinkLabelEntry = {
  id: "fallback",
  title: "Made in Maia is a label with a link.",
  type: "text",
  body: "Every piece carries a doorway to something unexpected — a story, an image, a video, an internet gem or a place worth finding.",
  category: "Link Label",
  tags: ["made-in-maia"],
  mediaUrl: null,
  linkUrl: "/marca",
  linkLabel: "Meet the brand",
  weight: 1,
};

function chooseWeighted(entries: LinkLabelEntry[]): LinkLabelEntry {
  const total = entries.reduce((sum, entry) => sum + Math.max(1, entry.weight), 0);
  let cursor = Math.random() * total;
  return entries.find((entry) => (cursor -= Math.max(1, entry.weight)) <= 0) ?? entries[0];
}

export default async function LinkLabelPage() {
  let entries: LinkLabelEntry[] = [];
  try {
    const [labels, posts] = await Promise.all([
      getDb().select().from(randomContent).where(eq(randomContent.active, true)),
      getDb().select().from(pages).where(and(like(pages.slug, "blog-%"), eq(pages.status, "published"))),
    ]);
    entries = labels.map((entry) => ({ ...entry, id: `label-${entry.id}` }));
    entries.push(...posts.map((post) => {
      const hero = (post.blocks as PageBlock[])[0];
      return {
        id: `blog-${post.id}`,
        title: post.title,
        type: "blog",
        body: hero?.description ?? "A Made in Maia story.",
        category: "Journal",
        tags: ["blog"],
        mediaUrl: hero?.imageUrl ?? null,
        linkUrl: `/blog/${post.slug.slice(5)}`,
        linkLabel: "Read story",
        weight: 1,
      };
    }));
  } catch {
    entries = [];
  }

  const uniqueEntries = [...new Map(entries.map((entry) => [entry.id, entry])).values()];
  const availableEntries = uniqueEntries.length ? uniqueEntries : [FALLBACK_ENTRY];
  const initialEntry = chooseWeighted(availableEntries);

  return <LinkLabelFeed entries={availableEntries} initialEntry={initialEntry} />;
}
