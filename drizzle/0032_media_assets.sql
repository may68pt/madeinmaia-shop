-- Image SEO fields per design and a register of crunched image files (WebP copies at 160/480/960/1600 px).
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_alt" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_title" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_caption" text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_assets" (
  "id" serial PRIMARY KEY,
  "url" text NOT NULL UNIQUE,
  "filename" text NOT NULL,
  "format" text NOT NULL DEFAULT '',
  "width" integer NOT NULL DEFAULT 0,
  "height" integer NOT NULL DEFAULT 0,
  "bytes" integer NOT NULL DEFAULT 0,
  "has_alpha" boolean NOT NULL DEFAULT false,
  "variants" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "crunched_at" timestamp with time zone,
  "error" text NOT NULL DEFAULT '',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
