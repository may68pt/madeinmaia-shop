ALTER TABLE "products" ADD COLUMN "artwork_placements" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "preview_color_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "monochrome" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "online_sale_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sales_rank" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "random_content" ADD COLUMN "category" text DEFAULT 'Internet gem' NOT NULL;--> statement-breakpoint
ALTER TABLE "random_content" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;