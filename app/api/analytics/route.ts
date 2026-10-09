import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { ANALYTICS_EVENTS, normalizeAnalyticsPath } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || new URL(request.url).host;
  try { return new URL(origin).host === host; } catch { return false; }
}

export async function POST(request: Request) {
  if (!sameOrigin(request) || request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return new Response(null, { status: 204 });
  if (Number(request.headers.get("content-length") || 0) > 1024) return new Response(null, { status: 413 });
  let data: unknown;
  try { data = await request.json(); } catch { return new Response(null, { status: 400 }); }
  if (!data || typeof data !== "object") return new Response(null, { status: 400 });
  const { event, path } = data as Record<string, unknown>;
  const safePath = normalizeAnalyticsPath(path);
  if (typeof event !== "string" || !ANALYTICS_EVENTS.includes(event as typeof ANALYTICS_EVENTS[number]) || !safePath) return new Response(null, { status: 400 });
  // Atomic daily aggregation: no IP, fingerprint, cookies, referrer, raw visitor or event logs.
  try {
    await getDb().execute(sql`
      INSERT INTO analytics_daily (day, event, path, total)
      VALUES ((now() AT TIME ZONE 'UTC')::date, ${event}, ${safePath}, 1)
      ON CONFLICT (day, event, path)
      DO UPDATE SET total = analytics_daily.total + 1
    `);
  } catch {
    // Analytics must never interrupt shopping, including during database migrations.
  }
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

export async function GET(request: Request) {
  const username = process.env.STUDIO_USERNAME || "madeinmaia";
  const password = process.env.STUDIO_PASSWORD;
  if (!password || request.headers.get("x-studio-user") !== username || request.headers.get("x-studio-key") !== password) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const days = Math.max(1, Math.min(90, Number(new URL(request.url).searchParams.get("days")) || 30));
  try {
    const result = await getDb().execute(sql`
      SELECT day::text, event, path, total FROM analytics_daily
      WHERE day >= (now() AT TIME ZONE 'UTC')::date - ${days - 1}::integer
      ORDER BY day DESC, total DESC LIMIT 10000
    `);
    return NextResponse.json({ days, rows: result, note: "Aggregated events only; page views are not unique visitors." }, { headers: { "cache-control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Analytics not available; check migrations." }, { status: 503 });
  }
}
