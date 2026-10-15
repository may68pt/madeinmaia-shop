CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_name" text NOT NULL,
	"visitor_id" text NOT NULL,
	"session_id" text NOT NULL,
	"path" text DEFAULT '/' NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"referrer_host" text,
	"device" text DEFAULT 'desktop' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_name_created_idx" ON "analytics_events" USING btree ("event_name","created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_entity_created_idx" ON "analytics_events" USING btree ("entity_type","entity_id","created_at");