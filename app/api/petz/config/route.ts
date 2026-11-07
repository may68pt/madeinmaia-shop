import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { configDefaults } from "@/lib/cyberpet/config-core";

/* Public: the CyberPet app reads its live tuning values here. Defaults fill anything not set in the back office. */
export const dynamic = "force-dynamic";

export async function GET() {
  const config = configDefaults();
  try {
    const rows = (await getDb().execute(sql`select key, value from petz_config`)) as unknown as { key: string; value: unknown }[];
    for (const r of rows) if (r.key in config) config[r.key] = r.value;
  } catch { /* database down: defaults keep the app running */ }
  return NextResponse.json({ ok: true, config }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" } });
}
