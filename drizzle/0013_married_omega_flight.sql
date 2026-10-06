ALTER TABLE "products" ADD COLUMN "online_sale_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sales_rank" integer DEFAULT 0 NOT NULL;
