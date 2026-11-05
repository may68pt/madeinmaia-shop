import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

type Body = { action?: string; room?: string; code?: string; target?: string; kind?: string; position?: number; name?: string; sprite?: string };
type Visit = { code: string; host: string; guest: string | null; expires_at: string };

const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const fail = (error: string, status = 400) => reply({ ok: false, error }, status);
const day = sql`to_char(now() at time zone 'Europe/Lisbon', 'YYYY-MM-DD')`;
const active = sql`seen_at > now() - interval '35 seconds'`;
const garden = 12;
const grove = 30;

export async function social(id: string, b: Body) {
  const db = getDb();
  if (b.action === "social-ready") return reply({ ok: true });
  if (b.action === "social-invite") {
    const code = randomBytes(16).toString("hex");
    await db.transaction(async (tx) => {
      await tx.execute(sql`insert into petz_visits (code, host, expires_at)
        values (${code}, ${id}, now() + interval '24 hours')
        on conflict (host) do update set code=excluded.code, guest=null, expires_at=excluded.expires_at`);
      await tx.execute(sql`delete from petz_presence where room=${id} and pet_id<>${id}`);
    });
    return reply({ ok: true, code });
  }
  if (b.action === "social-revoke") {
    await db.transaction(async (tx) => {
      await tx.execute(sql`delete from petz_visits where host=${id}`);
      await tx.execute(sql`delete from petz_presence where room=${id} and pet_id<>${id}`);
    });
    return reply({ ok: true });
  }
  if (b.action === "social-preview") {
    const code = String(b.code ?? "").trim().toLowerCase();
    if (!/^[a-f0-9]{32}$/.test(code)) return fail("Invalid visit link");
    const [visit] = await db.execute<{ name: string; skin: string }>(sql`select
      left(p.data->>'name',30) as name, p.data->'room'->>'skin' as skin
      from petz_visits v join petz_saves p on p.id=v.host
      where v.code=${code} and v.host<>${id} and (v.guest is null or v.guest=${id}) and v.expires_at>now()`);
    return visit ? reply({ ok: true, name: visit.name || "a friend", skin: visit.skin }) : fail("This invite is expired, in use or belongs to you", 404);
  }
  if (b.action === "social-join") {
    const code = String(b.code ?? "").trim().toLowerCase();
    if (!/^[a-f0-9]{32}$/.test(code)) return fail("Invalid visit link");
    const [visit] = await db.execute<Visit>(sql`update petz_visits set guest=${id}
      where code=${code} and host<>${id} and (guest is null or guest=${id}) and expires_at>now()
      returning host`);
    return visit ? reply({ ok: true, room: visit.host }) : fail("This invite is expired, in use or belongs to you", 404);
  }
  if (b.action === "social-leave") {
    await db.execute(sql`delete from petz_presence where pet_id=${id} and room=${b.room ?? ""}`);
    return reply({ ok: true });
  }
  if (b.action !== "social-state") return fail("Unknown social action");
  const room = b.room ?? "";
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 30) || "Cyberpet" : "Cyberpet";
  const sprite = typeof b.sprite === "string" && /^[a-z0-9_-]{1,48}$/i.test(b.sprite) ? b.sprite : "baby";
  const position = Math.max(3, Math.min(97, Math.round(Number(b.position) || 10)));
  return db.transaction(async (tx) => {
    let guest: string | null = null;
    if (room !== "park") {
      const [visit] = await tx.execute<Visit>(sql`select guest from petz_visits
        where host=${room} and expires_at>now() for share`);
      guest = visit?.guest ?? null;
      if (room !== id && guest !== id) return fail("This visit has ended", 403);
    }
    const visible = room === "park" ? sql`true` : sql`pet_id in (${room}, ${guest})`;
    const [progress] = await tx.execute<{ points: number }>(sql`select coalesce(sum(points),0)::int as points from petz_social_events`);
    const points = progress.points;
    const maxPosition = room !== "park" || points >= grove ? 97 : points >= garden ? 71 : 32;
    await tx.execute(sql`insert into petz_presence (pet_id,room,position,name,sprite)
      values (${id},${room},${Math.min(position,maxPosition)},${name},${sprite})
      on conflict (pet_id) do update set room=excluded.room, position=excluded.position, name=excluded.name, sprite=excluded.sprite, seen_at=now()`);

    let earned = 0;
    if (b.kind === "pet" || b.kind === "play") {
      const kind = b.kind;
      const target = String(b.target ?? "");
      if (target === id) return fail("Choose another pet");
      const [friend] = await tx.execute<{ pet_id: string }>(sql`select pet_id from petz_presence
        where pet_id=${target} and room=${room} and ${active} and ${visible}
          and abs(position-${Math.min(position,maxPosition)})<=15`);
      if (!friend) return fail("Move closer to your friend", 409);
      const [event] = await tx.execute(sql`insert into petz_social_events (pet_id,event_key,kind,friend,points)
        values (${id}, ${day} || ':' || ${kind}, ${kind}, ${friend.pet_id}, ${room === "park" ? 2 : 0})
        on conflict do nothing returning event_key`);
      earned = event ? 1 : 0;
    }
    const taskPoints = b.kind === "fountain" ? 2 : b.kind === "bounce" && points >= garden ? 3 : b.kind === "secret" && points >= grove ? 5 : 0;
    if (room === "park" && taskPoints) {
      const taskPosition = b.kind === "fountain" ? 21 : b.kind === "bounce" ? 50 : 90;
      if (Math.abs(position - taskPosition) > 12) return fail("Move closer to the activity", 409);
      const key = b.kind === "secret" ? sql`'secret'` : sql`${day} || ':' || ${b.kind}`;
      const [event] = await tx.execute(sql`insert into petz_social_events (pet_id,event_key,kind,points)
        values (${id}, ${key}, ${b.kind}, ${taskPoints}) on conflict do nothing returning event_key`);
      earned = event ? 1 : 0;
    }

    const peers = await tx.execute(sql`select pet_id as id, name, sprite, position from petz_presence
      where room=${room} and ${active} and ${visible} and pet_id<>${id} order by seen_at desc limit 30`);
    const [stats] = await tx.execute(sql`select
      count(*) filter (where kind='pet')::int * 3 + count(*) filter (where kind in ('play','bounce'))::int * 5 as happy,
      count(*) filter (where kind='fountain')::int * 4 as energy,
      count(*) filter (where kind in ('pet','play'))::int * 2 as bond,
      count(*) filter (where kind in ('play','bounce','secret'))::int * 4 as xp,
      coalesce(bool_or(kind='secret' and pet_id=${id}),false) as secret,
      coalesce(bool_or(kind in ('pet','play')),false) as friend
      from petz_social_events where pet_id=${id} or friend=${id}`);
    const [global] = await tx.execute(sql`select coalesce(sum(points),0)::int as points from petz_social_events`);
    const [host] = room === "park" ? [] : await tx.execute(sql`select data->'room'->>'skin' as skin, data->'room'->'items' as furniture, data->'room'->'tiers' as tiers from petz_saves where id=${room}`);
    return reply({ ok: true, peers, points: global.points, skin: host?.skin, furniture: Array.isArray(host?.furniture) ? host.furniture.slice(0, 80) : [], tiers: host?.tiers, stats, earned, maxPosition });
  });
}
