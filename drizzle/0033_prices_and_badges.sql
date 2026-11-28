-- T-shirt 150g, T-shirt 190g and Long Sleeve T-shirt at 15 € (was 20 / 22 / 28 €).
UPDATE "site_settings"
SET "data" = jsonb_set("data", '{productCatalog,supports}', (
  SELECT jsonb_agg(CASE WHEN s->>'id' IN ('tshirt-150','tshirt-190','long-sleeve') THEN jsonb_set(s, '{priceCents}', '1500'::jsonb) ELSE s END ORDER BY ord)
  FROM jsonb_array_elements("data"->'productCatalog'->'supports') WITH ORDINALITY AS t(s, ord)
)), "updated_at" = now()
WHERE "key" = 'global' AND jsonb_typeof("data"->'productCatalog'->'supports') = 'array';
--> statement-breakpoint
-- Every design's base price follows the T-shirt: 15 €.
UPDATE "products" SET "price_cents" = 1500 WHERE "price_cents" = 2000;
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price_cents" SET DEFAULT 1500;
--> statement-breakpoint
-- Badges: "New" for 2 months after publishing (or forced on/off), best seller, category, promo text.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "badges" jsonb NOT NULL DEFAULT '{}'::jsonb;
--> statement-breakpoint
-- Published designs from the October import count as published at launch (30 Sep); later ones keep their last-update date.
UPDATE "products"
SET "published_at" = CASE WHEN "updated_at" >= '2026-10-12' THEN "updated_at" ELSE '2026-09-30T12:00:00Z'::timestamptz END
WHERE "status" = 'published' AND "published_at" IS NULL;
