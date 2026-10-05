ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "preview_color_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;
