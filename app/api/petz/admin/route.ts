import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { logAdmin, studioActor } from "@/lib/cyberpet/ops";
import {
  cleanOp, cleanRule, describeOp, levelOf, matchesRule, opReaches, pgArray, stageOf, STATS,
  type ClassRule, type OpRow, type PetFacts, type Scope,
} from "@/lib/cyberpet/ops-core";

/* CyberPet back office API. Same login as the Studio (x-studio-user / x-studio-key headers).
   Every action can target all pets, a class, or specific pets by id. */
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
const json = (o: unknown, status = 200) => NextResponse.json(o, { status, headers });
const deny = () => json({ ok: false, error: "Autenticação necessária" }, 401);
const ID = /^[A-Za-z0-9]{1,16}$/;
const SCAN_CAP = 20000;

type PetRow = { id: string; data: Record<string, unknown> | null; created_at: string; updated_at: string; rev: number; devices: number };

const summary = (p: PetRow) => {
  const d = p.data ?? {};
  return {
    id: p.id, name: String(d.name ?? ""), variant: String(d.variant ?? ""), stage: stageOf(d), level: levelOf(d),
    gone: !!d.gone, asleep: !!d.asleep, coins: Number(d.coins ?? 0), gems: Number(d.gems ?? 0),
    stats: Object.fromEntries(STATS.map((s) => [s, Math.round(Number(d[s] ?? 0))])),
    devices: Number(p.devices), rev: Number(p.rev), createdAt: p.created_at, updatedAt: p.updated_at,
  };
};
const facts = (p: PetRow): PetFacts => ({ id: p.id, createdAt: p.created_at, data: p.data });

async function allPets(): Promise<PetRow[]> {
  return (await getDb().execute(sql`select id, data, created_at, updated_at, rev,
    cardinality(string_to_array(key_hash, ',')) as devices
    from petz_saves order by updated_at desc limit ${SCAN_CAP}`)) as unknown as PetRow[];
}

async function classRule(id: number): Promise<ClassRule | null> {
  const [c] = (await getDb().execute(sql`select rule from petz_classes where id=${id}`)) as unknown as { rule: ClassRule }[];
  return c ? c.rule : null;
}

type ScopeIn = { scope?: string; classId?: unknown; petIds?: unknown; includeNew?: unknown };
async function readScope(b: ScopeIn): Promise<{ ok: true; scope: Scope; classId: number | null; petIds: string[]; rule: ClassRule | null; includeNew: boolean } | { ok: false; error: string }> {
  const includeNew = b.includeNew === true;
  if (b.scope === "all") return { ok: true, scope: "all", classId: null, petIds: [], rule: null, includeNew };
  if (b.scope === "pets") {
    const petIds = Array.isArray(b.petIds) ? [...new Set(b.petIds.map(String).map((s) => s.trim()).filter((s) => ID.test(s)))].slice(0, 5000) : [];
    return petIds.length ? { ok: true, scope: "pets", classId: null, petIds, rule: null, includeNew } : { ok: false, error: "Add at least one pet id" };
  }
  if (b.scope === "class") {
    const classId = Number(b.classId);
    const rule = Number.isInteger(classId) ? await classRule(classId) : null;
    return rule ? { ok: true, scope: "class", classId, petIds: [], rule, includeNew } : { ok: false, error: "Class not found" };
  }
  return { ok: false, error: "Pick a scope" };
}

/** How many existing pets a scope reaches right now. */
async function countScope(s: { scope: Scope; petIds: string[]; rule: ClassRule | null }) {
  if (s.scope === "pets") {
    const [r] = (await getDb().execute(sql`select count(*)::int as n from petz_saves where id = any(${pgArray(s.petIds)}::text[])`)) as unknown as { n: number }[];
    return r.n;
  }
  if (s.scope === "all") {
    const [r] = (await getDb().execute(sql`select count(*)::int as n from petz_saves`)) as unknown as { n: number }[];
    return r.n;
  }
  return (await allPets()).filter((p) => matchesRule(s.rule, facts(p))).length;
}

export async function GET(request: Request) {
  if (!studioActor(request)) return deny();
  const u = new URL(request.url);
  const resource = u.searchParams.get("resource") ?? "overview";
  try {
    const db = getDb();
    if (resource === "overview") {
      const [o] = (await db.execute(sql`select count(*)::int as pets,
        count(*) filter (where updated_at > now() - interval '1 day')::int as active_day,
        count(*) filter (where updated_at > now() - interval '7 days')::int as active_week,
        count(*) filter (where created_at > now() - interval '7 days')::int as new_week
        from petz_saves`)) as unknown as Record<string, number>[];
      const [q] = (await db.execute(sql`select count(*)::int as live from petz_ops
        where cancelled_at is null and (expires_at is null or expires_at > now())`)) as unknown as { live: number }[];
      return json({ ok: true, ...o, liveOps: q.live });
    }
    if (resource === "pets") {
      const q = (u.searchParams.get("q") ?? "").trim().slice(0, 40);
      const classId = Number(u.searchParams.get("classId"));
      const limit = Math.min(200, Math.max(1, Number(u.searchParams.get("limit")) || 50));
      let rows: PetRow[];
      if (Number.isInteger(classId) && classId > 0) {
        const rule = await classRule(classId);
        rows = rule ? (await allPets()).filter((p) => matchesRule(rule, facts(p))) : [];
      } else if (q) {
        rows = (await db.execute(sql`select id, data, created_at, updated_at, rev, cardinality(string_to_array(key_hash, ',')) as devices
          from petz_saves where id ilike ${q + "%"} or data->>'name' ilike ${"%" + q + "%"}
          order by updated_at desc limit ${limit}`)) as unknown as PetRow[];
      } else {
        rows = (await db.execute(sql`select id, data, created_at, updated_at, rev, cardinality(string_to_array(key_hash, ',')) as devices
          from petz_saves order by updated_at desc limit ${limit}`)) as unknown as PetRow[];
      }
      return json({ ok: true, total: rows.length, pets: rows.slice(0, limit).map(summary) });
    }
    if (resource === "pet") {
      const id = u.searchParams.get("id") ?? "";
      if (!ID.test(id)) return json({ ok: false, error: "Invalid id" }, 400);
      const [p] = (await db.execute(sql`select id, data, created_at, updated_at, rev, cardinality(string_to_array(key_hash, ',')) as devices
        from petz_saves where id=${id}`)) as unknown as PetRow[];
      if (!p) return json({ ok: false, error: "Pet not found" }, 404);
      const applied = (await db.execute(sql`select a.op_id as id, a.applied_at, o.kind, o.payload, o.note
        from petz_op_acks a join petz_ops o on o.id=a.op_id where a.pet_id=${id} order by a.applied_at desc limit 50`)) as unknown as { payload: OpRow["payload"] }[];
      const live = (await db.execute(sql`select o.id, o.scope, o.class_id, o.pet_ids, o.include_new, o.created_at, o.payload, o.note, c.rule as class_rule
        from petz_ops o left join petz_classes c on c.id=o.class_id
        where o.cancelled_at is null and (o.expires_at is null or o.expires_at > now())
          and not exists (select 1 from petz_op_acks a where a.op_id=o.id and a.pet_id=${id})
        order by o.id limit 200`)) as unknown as (OpRow & { note: string })[];
      const pending = live.filter((o) => opReaches(o, facts(p))).map((o) => ({ id: o.id, summary: describeOp(o.payload), note: o.note }));
      return json({ ok: true, pet: summary(p), data: p.data, applied: applied.map((a) => ({ ...a, summary: describeOp(a.payload) })), pending });
    }
    if (resource === "classes") {
      const rows = (await db.execute(sql`select id, name, rule, created_at, updated_at from petz_classes order by name`)) as unknown as { id: number; name: string; rule: ClassRule }[];
      const pets = rows.length ? await allPets() : [];
      return json({ ok: true, classes: rows.map((c) => ({ ...c, count: pets.filter((p) => matchesRule(c.rule, facts(p))).length })) });
    }
    if (resource === "ops") {
      const rows = (await db.execute(sql`select o.*, c.name as class_name,
        (select count(*)::int from petz_op_acks a where a.op_id=o.id) as applied
        from petz_ops o left join petz_classes c on c.id=o.class_id order by o.id desc limit 100`)) as unknown as (OpRow & Record<string, unknown>)[];
      return json({ ok: true, ops: rows.map((o) => ({ ...o, summary: describeOp(o.payload) })) });
    }
    if (resource === "log") {
      const rows = await db.execute(sql`select * from petz_admin_log order by id desc limit 200`);
      return json({ ok: true, log: rows });
    }
    return json({ ok: false, error: "Unknown resource" }, 400);
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : "Database error" }, 503);
  }
}

export async function POST(request: Request) {
  const actor = studioActor(request);
  if (!actor) return deny();
  let b: Record<string, unknown>;
  try { b = (await request.json()) as Record<string, unknown>; } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  try {
    const db = getDb();
    switch (b.action) {
      case "preview": {
        const s = await readScope(b as ScopeIn);
        if (!s.ok) return json(s, 400);
        return json({ ok: true, count: await countScope(s) });
      }
      case "class-save": {
        const name = String(b.name ?? "").trim().slice(0, 60);
        if (!name) return json({ ok: false, error: "Class needs a name" }, 400);
        const rule = cleanRule(b.rule);
        const id = Number(b.id);
        const [row] = Number.isInteger(id) && id > 0
          ? ((await db.execute(sql`update petz_classes set name=${name}, rule=${JSON.stringify(rule)}::jsonb, updated_at=now() where id=${id} returning id`)) as unknown as { id: number }[])
          : ((await db.execute(sql`insert into petz_classes (name, rule) values (${name}, ${JSON.stringify(rule)}::jsonb) returning id`)) as unknown as { id: number }[]);
        if (!row) return json({ ok: false, error: "Class not found" }, 404);
        await logAdmin(actor, "class-save", `class:${row.id}`, { name, rule });
        return json({ ok: true, id: row.id, rule });
      }
      case "class-delete": {
        const id = Number(b.id);
        await db.execute(sql`delete from petz_classes where id=${id}`);
        await logAdmin(actor, "class-delete", `class:${id}`);
        return json({ ok: true });
      }
      case "op-create": {
        const s = await readScope(b as ScopeIn);
        if (!s.ok) return json(s, 400);
        const c = cleanOp(b.op);
        if (!c.ok) return json(c, 400);
        const note = String(b.note ?? "").slice(0, 200);
        const starts = typeof b.startsAt === "string" && !Number.isNaN(Date.parse(b.startsAt)) ? new Date(b.startsAt).toISOString() : new Date().toISOString();
        const expires = typeof b.expiresAt === "string" && !Number.isNaN(Date.parse(b.expiresAt)) ? new Date(b.expiresAt).toISOString() : null;
        const [row] = (await db.execute(sql`insert into petz_ops (scope, class_id, pet_ids, include_new, kind, payload, note, starts_at, expires_at, created_by)
          values (${s.scope}, ${s.classId}, ${pgArray(s.petIds)}::text[], ${s.includeNew}, ${c.op.kind}, ${JSON.stringify(c.op)}::jsonb, ${note}, ${starts}, ${expires}, ${actor})
          returning id`)) as unknown as { id: number }[];
        const reach = await countScope(s);
        await logAdmin(actor, "op-create", `op:${row.id}`, { scope: s.scope, classId: s.classId, pets: s.petIds.length, summary: describeOp(c.op), reach });
        return json({ ok: true, id: row.id, reach, summary: describeOp(c.op) });
      }
      case "op-cancel": {
        const id = Number(b.id);
        await db.execute(sql`update petz_ops set cancelled_at=now() where id=${id} and cancelled_at is null`);
        await logAdmin(actor, "op-cancel", `op:${id}`);
        return json({ ok: true });
      }
      case "pet-patch": {
        // Direct edit of one pet's save. Bumps t so every device adopts the server copy on its next pull.
        const id = String(b.id ?? "");
        if (!ID.test(id)) return json({ ok: false, error: "Invalid id" }, 400);
        const patch = (b.patch && typeof b.patch === "object" ? b.patch : {}) as Record<string, unknown>;
        const allowed: Record<string, unknown> = {};
        for (const s of STATS) if (typeof patch[s] === "number") allowed[s] = Math.max(0, Math.min(100, patch[s] as number));
        for (const k of ["coins", "gems", "xp", "growth"]) if (typeof patch[k] === "number" && Number.isFinite(patch[k])) allowed[k] = Math.max(0, patch[k] as number);
        if (typeof patch.name === "string") allowed.name = patch.name.replace(/[<>]/g, "").trim().slice(0, 30);
        if (typeof patch.gone === "boolean") allowed.gone = patch.gone;
        if (!Object.keys(allowed).length) return json({ ok: false, error: "Nothing to change" }, 400);
        const [row] = (await db.execute(sql`update petz_saves set data = data || ${JSON.stringify(allowed)}::jsonb,
          t = ${Date.now()}, rev = rev + 1, updated_at = now() where id=${id} returning rev`)) as unknown as { rev: number }[];
        if (!row) return json({ ok: false, error: "Pet not found" }, 404);
        await logAdmin(actor, "pet-patch", `pet:${id}`, allowed);
        return json({ ok: true, rev: Number(row.rev) });
      }
      case "pet-unlink": {
        // Signs out every device except the newest one, e.g. after a lost phone.
        const id = String(b.id ?? "");
        if (!ID.test(id)) return json({ ok: false, error: "Invalid id" }, 400);
        await db.execute(sql`update petz_saves set key_hash = (string_to_array(key_hash, ','))[cardinality(string_to_array(key_hash, ','))] where id=${id}`);
        await logAdmin(actor, "pet-unlink", `pet:${id}`);
        return json({ ok: true });
      }
      default:
        return json({ ok: false, error: "Unknown action" }, 400);
    }
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : "Database error" }, 503);
  }
}
