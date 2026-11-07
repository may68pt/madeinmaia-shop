-- CyberPet rare items and who owns them.
CREATE TABLE IF NOT EXISTS "petz_items" (
  "id" varchar(40) PRIMARY KEY,
  "name" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "tier" text NOT NULL DEFAULT 'common',
  "category" text NOT NULL DEFAULT 'decor',
  "art_url" text NOT NULL DEFAULT '',
  "room" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "stats" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "price_coins" integer NOT NULL DEFAULT 0,
  "price_gems" integer NOT NULL DEFAULT 0,
  "price_cents" integer,
  "supply_limit" integer,
  "sold" integer NOT NULL DEFAULT 0,
  "in_shop" boolean NOT NULL DEFAULT true,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "petz_item_grants" (
  "id" serial PRIMARY KEY,
  "item_id" varchar(40) NOT NULL REFERENCES "petz_items"("id") ON DELETE CASCADE,
  "pet_id" varchar(16) NOT NULL REFERENCES "petz_saves"("id") ON DELETE CASCADE,
  "via" text NOT NULL,
  "ref" text NOT NULL DEFAULT '',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "petz_item_grants_once" ON "petz_item_grants" ("item_id", "pet_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "petz_item_grants_pet_idx" ON "petz_item_grants" ("pet_id");
