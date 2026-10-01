ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "name_translations" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;
