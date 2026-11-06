import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { clientIp, overLimit } from "./rate-limit-core";

export { clientIp };

/* Shared request limiter stored in Postgres, so limits hold across redeploys and restarts.
   Sliding one-minute window per (bucket, client). Client IPs are stored only as salted hashes. */
const salt = process.env.RATE_LIMIT_SALT ?? "madeinmaia";
const hashClient = (ip: string) => createHash("sha256").update(salt + ":" + ip).digest("hex").slice(0, 32);

type Row = { cur: number; prev: number | null; frac: number };

/**
 * Counts this request and returns true when the client is over `perMinute` for `bucket`.
 * Fails open (returns false) if the database is unreachable, so a database hiccup never locks players out.
 */
export async function rateLimited(requestOrIp: Request | string, bucket: string, perMinute: number): Promise<boolean> {
  const ip = typeof requestOrIp === "string" ? requestOrIp : clientIp(requestOrIp);
  const client = hashClient(ip);
  const b = bucket.slice(0, 32);
  try {
    const db = getDb();
    const rows = (await db.execute(sql`
      with cur as (
        insert into rate_limits (bucket, client, window_start, hits)
        values (${b}, ${client}, date_trunc('minute', now()), 1)
        on conflict (bucket, client, window_start) do update set hits = rate_limits.hits + 1
        returning hits
      )
      select (select hits from cur) as cur,
        (select hits from rate_limits where bucket = ${b} and client = ${client}
           and window_start = date_trunc('minute', now()) - interval '1 minute') as prev,
        extract(epoch from now() - date_trunc('minute', now())) / 60 as frac`)) as unknown as Row[];
    const r = rows[0];
    if (Math.random() < 0.02) {
      db.execute(sql`delete from rate_limits where window_start < now() - interval '5 minutes'`).catch(() => {});
    }
    return r ? overLimit(Number(r.cur), Number(r.prev ?? 0), Number(r.frac), perMinute) : false;
  } catch (error) {
    console.error("rate limit check failed", error);
    return false;
  }
}
