ALTER TABLE "orders" ADD COLUMN "tracking_code" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "internal_notes" text DEFAULT '' NOT NULL;