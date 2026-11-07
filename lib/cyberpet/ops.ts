import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { opReaches, pgArray, type OpRow, type PetFacts } from "./ops-core";

/* Server side of the CyberPet live ops queue.
   Ops are delivered to a pet on its next sync; the app applies them and acks, so each op lands once per pet. */

const MAX_PER_SYNC = 20;

/** Ops that are live, not yet applied by this pet, and reach it. Oldest first. */
export async function pendingOps(pet: PetFacts): Promise<{ id: number; payload: OpRow["payload"] }[]> {
  const rows = (await getDb().execute(sql`
    select o.id, o.scope, o.class_id, o.pet_ids, o.include_new, o.created_at, o.payload, c.rule as class_rule
    from petz_ops o
    left join petz_classes c on c.id = o.class_id
    where o.cancelled_at is null
      and o.starts_at <= now()
      and (o.expires_at is null or o.expires_at > now())
      and (o.scope <> 'pets' or ${pet.id} = any(o.pet_ids))
      and (o.scope <> 'class' or o.class_id is not null)
      and not exists (select 1 from petz_op_acks a where a.op_id = o.id and a.pet_id = ${pet.id})
    order by o.id asc
    limit 200`)) as unknown as OpRow[];
  return rows.filter((op) => opReaches(op, pet)).slice(0, MAX_PER_SYNC).map((op) => ({ id: op.id, payload: op.payload }));
}

/** Records that a pet applied these ops. Ids that don't exist are ignored. */
export async function ackOps(petId: string, ids: unknown): Promise<number> {
  const list = Array.isArray(ids) ? [...new Set(ids.map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 50) : [];
  if (!list.length) return 0;
  const done = (await getDb().execute(sql`
    insert into petz_op_acks (op_id, pet_id)
    select o.id, ${petId} from petz_ops o where o.id = any(${pgArray(list)}::int[])
    on conflict do nothing
    returning op_id`)) as unknown as { op_id: number }[];
  return done.length;
}

export async function logAdmin(actor: string, action: string, target: string, detail: unknown = {}) {
  try {
    await getDb().execute(sql`insert into petz_admin_log (actor, action, target, detail)
      values (${actor.slice(0, 60)}, ${action.slice(0, 60)}, ${target.slice(0, 200)}, ${JSON.stringify(detail ?? {})}::jsonb)`);
  } catch { /* the log never blocks an admin action */ }
}

/** Same check the Studio API uses: the Studio username and password sent as headers. */
export function studioActor(request: Request): string | null {
  const pass = process.env.STUDIO_PASSWORD;
  const user = process.env.STUDIO_USERNAME || "madeinmaia";
  if (!pass) return null;
  return request.headers.get("x-studio-user") === user && request.headers.get("x-studio-key") === pass ? user : null;
}
