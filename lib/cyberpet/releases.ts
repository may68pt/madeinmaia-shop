import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import type { ItemRow } from "./items-core";
import type { PetFacts } from "./ops-core";

/* Releases (block 14) put items on sale for a window and a scope. Until block 14 lands nothing extra is on sale. */
export async function shopReleaseItems(pet: PetFacts): Promise<ItemRow[]> {
  void pet; void sql; void getDb;
  return [];
}
