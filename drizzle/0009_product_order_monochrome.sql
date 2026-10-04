ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "monochrome" boolean DEFAULT true NOT NULL;
UPDATE "products" SET "sort_order" = "id" WHERE "sort_order" = 0;
