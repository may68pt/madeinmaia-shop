ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gallery" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "disabled_supports" jsonb DEFAULT '[]'::jsonb NOT NULL;
