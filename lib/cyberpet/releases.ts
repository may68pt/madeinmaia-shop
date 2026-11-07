import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { grantItem, type GrantResult } from "./items";
import type { ItemRow } from "./items-core";
import { opReaches, type ClassRule, type OpRow, type PetFacts } from "./ops-core";

/* Releases: timed drops of rare items to all pets, a class or chosen pets.
   gift = delivered on the pet's next sync · shop = on sale for the window · qr = unlocked by scanning a code (t-shirts). */

export type ReleaseRow = {
  id: number; name: string; item_ids: string[]; channel: "gift" | "shop" | "qr"; scope: "all" | "class" | "pets";
  class_id: number | null; pet_ids: string[]; include_new: boolean; starts_at: string; ends_at: string | null;
  status: string; qr_code: string | null; max_claims: number | null; claims: number; created_at: string; class_rule?: ClassRule | null;
};

async function liveReleases(channel: ReleaseRow["channel"]): Promise<ReleaseRow[]> {
  return (await getDb().execute(sql`select r.*, c.rule as class_rule from petz_releases r left join petz_classes c on c.id = r.class_id
    where r.channel = ${channel} and r.status = 'live' and r.starts_at <= now() and (r.ends_at is null or r.ends_at > now())
    order by r.id`)) as unknown as ReleaseRow[];
}

/** Same reach rules as live ops: scope, class rule, and whether pets born later count. */
export const releaseReaches = (r: ReleaseRow, pet: PetFacts) =>
  opReaches({ id: r.id, scope: r.scope, class_id: r.class_id, pet_ids: r.pet_ids, include_new: r.include_new, created_at: r.created_at, payload: { kind: "revive" }, class_rule: r.class_rule } as OpRow, pet);

/** Items on sale for this pet through live shop releases. */
export async function shopReleaseItems(pet: PetFacts): Promise<ItemRow[]> {
  const ids = [...new Set((await liveReleases("shop")).filter((r) => releaseReaches(r, pet)).flatMap((r) => r.item_ids))];
  if (!ids.length) return [];
  const lit = "{" + ids.filter((i) => /^rx_[a-z0-9_]+$/.test(i)).join(",") + "}";
  return (await getDb().execute(sql`select * from petz_items where active and id = any(${lit}::text[])`)) as unknown as ItemRow[];
}

/** Grants any live gift releases this pet hasn't received. Returns the patches for the app to apply. */
export async function deliverGifts(pet: PetFacts): Promise<{ release: string; patch: Extract<GrantResult, { ok: true }>["patch"] }[]> {
  const out: { release: string; patch: Extract<GrantResult, { ok: true }>["patch"] }[] = [];
  const gifts = (await liveReleases("gift")).filter((r) => releaseReaches(r, pet));
  if (!gifts.length) return out;
  const owned = new Set(((await getDb().execute(sql`select item_id from petz_item_grants where pet_id=${pet.id}`)) as unknown as { item_id: string }[]).map((r) => r.item_id));
  for (const r of gifts) for (const item of r.item_ids) {
    if (owned.has(item)) continue;
    const g = await grantItem(pet.id, item, "gift", `release:${r.id}`);
    if (g.ok) { out.push({ release: r.name, patch: g.patch }); owned.add(item); }
  }
  return out;
}

/** QR / t-shirt unlock. One claim per pet per item; max_claims caps the whole release. */
export async function claimQr(pet: PetFacts, code: string) {
  const [r] = (await getDb().execute(sql`select r.*, c.rule as class_rule from petz_releases r left join petz_classes c on c.id = r.class_id
    where r.qr_code = ${code} and r.channel = 'qr'`)) as unknown as ReleaseRow[];
  if (!r) return { ok: false as const, error: "This code is not valid", status: 404 };
  const now = Date.now();
  if (r.status !== "live" || Date.parse(r.starts_at) > now || (r.ends_at && Date.parse(r.ends_at) <= now)) return { ok: false as const, error: "This code is not active right now", status: 410 };
  if (r.max_claims !== null && r.claims >= r.max_claims) return { ok: false as const, error: "All unlocks for this code are taken", status: 410 };
  if (!releaseReaches(r, pet)) return { ok: false as const, error: "This code is for other CyberPets", status: 403 };
  const patches: Extract<GrantResult, { ok: true }>["patch"][] = [];
  for (const item of r.item_ids) { const g = await grantItem(pet.id, item, "qr", `release:${r.id}`); if (g.ok) patches.push(g.patch); }
  if (!patches.length) return { ok: false as const, error: "Already unlocked", status: 409 };
  await getDb().execute(sql`update petz_releases set claims = claims + 1 where id=${r.id}`);
  return { ok: true as const, release: r.name, patches };
}
