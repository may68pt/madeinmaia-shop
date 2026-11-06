import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Row = { n: string; s: number; c: number; w: boolean };

async function top(chapter: number | null) {
  const db = getDb();
  const rows = chapter === null
    ? await db.execute(sql`select name as n, score as s, chapter as c, won as w from game_scores where game='outrunning' order by score desc, created_at asc limit 10`)
    : await db.execute(sql`select name as n, score as s, chapter as c, won as w from game_scores where game='outrunning' and chapter=${chapter} order by score desc, created_at asc limit 10`);
  return (rows as unknown as Row[]).map((r) => ({ n: r.n, s: Number(r.s), c: Number(r.c), w: !!r.w }));
}

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  try {
    const u = new URL(request.url);
    const cRaw = u.searchParams.get("chapter");
    const chapter = cRaw === null ? null : Math.max(0, Math.min(20, Number(cRaw) | 0));
    return NextResponse.json({ ok: true, scores: await top(chapter) }, { headers });
  } catch {
    return NextResponse.json({ ok: false, scores: [] }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  if (await rateLimited(request, "outrunning-scores", 6)) return NextResponse.json({ ok: false, error: "slow down" }, { status: 429, headers });
  const body = (await request.json().catch(() => null)) as { n?: unknown; s?: unknown; c?: unknown; w?: unknown } | null;
  const name = String(body?.n ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
  const score = Math.floor(Number(body?.s));
  const chapter = Math.floor(Number(body?.c ?? 0));
  if (name.length < 1 || !Number.isFinite(score) || score < 0 || score > 5_000_000 || !(chapter >= 0 && chapter <= 20))
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400, headers });
  try {
    const db = getDb();
    await db.execute(sql`insert into game_scores (game, chapter, name, score, won) values ('outrunning', ${chapter}, ${name}, ${score}, ${!!body?.w})`);
    return NextResponse.json({ ok: true, scores: await top(null) }, { headers });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers });
  }
}
