ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "artwork_placements" jsonb DEFAULT '{}'::jsonb NOT NULL;
