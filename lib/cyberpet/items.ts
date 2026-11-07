import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { clientDef, remaining, type ItemRow } from "./items-core";

/* Gives a pet a rare item, server-side and atomically: checks supply and price, records the grant once,
   and writes the item (and the price) into the pet's save so every device gets it on its next sync. */

export type GrantResult =
  | { ok: true; patch: { coins: number; gems: number; owned: number; def: ReturnType<typeof clientDef> } }
  | { ok: false; error: string; status: number };

export async function grantItem(petId: string, itemId: string, via: "shop" | "paid" | "gift" | "qr" | "admin", ref = "", charge = false): Promise<GrantResult> {
  return getDb().transaction(async (tx) => {
    const [item] = (await tx.execute(sql`select * from petz_items where id=${itemId} for update`)) as unknown as ItemRow[];
    if (!item || !item.active) return { ok: false, error: "This item is not available", status: 404 } as const;
    const left = remaining(item);
    if (left !== null && left <= 0) return { ok: false, error: "Sold out", status: 409 } as const;
    const [save] = (await tx.execute(sql`select data from petz_saves where id=${petId} for update`)) as unknown as { data: Record<string, unknown> }[];
    if (!save) return { ok: false, error: "Pet not found", status: 404 } as const;
    const data = save.data;
    const coins = Number(data.coins ?? 0), gems = Number(data.gems ?? 0);
    if (charge && (coins < item.price_coins || gems < item.price_gems)) return { ok: false, error: "Not enough ⚡ or 💎", status: 402 } as const;
    const added = (await tx.execute(sql`insert into petz_item_grants (item_id, pet_id, via, ref) values (${itemId}, ${petId}, ${via}, ${ref.slice(0, 120)})
      on conflict (item_id, pet_id) do nothing returning id`)) as unknown as { id: number }[];
    if (!added[0]) return { ok: false, error: "Already yours", status: 409 } as const;
    await tx.execute(sql`update petz_items set sold = sold + 1, updated_at = now() where id=${itemId}`);
    const room = (data.room && typeof data.room === "object" ? data.room : {}) as Record<string, unknown>;
    const owned = { ...((room.owned as Record<string, number>) || {}) };
    owned[itemId] = (owned[itemId] || 0) + 1;
    const def = clientDef(item);
    const next = {
      ...data,
      coins: charge ? coins - item.price_coins : coins,
      gems: charge ? gems - item.price_gems : gems,
      room: { ...room, owned },
      cpItems: { ...((data.cpItems as Record<string, unknown>) || {}), [itemId]: def },
    };
    await tx.execute(sql`update petz_saves set data=${JSON.stringify(next)}::jsonb, t=${Date.now()}, rev=rev+1, updated_at=now() where id=${petId}`);
    return { ok: true, patch: { coins: next.coins, gems: next.gems, owned: owned[itemId], def } } as const;
  });
}
