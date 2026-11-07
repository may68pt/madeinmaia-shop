-- CyberPet back office: pet classes, a live ops queue the app applies on sync, and an audit log.
CREATE TABLE IF NOT EXISTS "petz_classes" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL UNIQUE,
  "rule" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "petz_ops" (
  "id" serial PRIMARY KEY,
  "scope" text NOT NULL CHECK ("scope" IN ('all', 'class', 'pets')),
  "class_id" integer REFERENCES "petz_classes"("id") ON DELETE SET NULL,
  "pet_ids" text[] NOT NULL DEFAULT '{}',
  "include_new" boolean NOT NULL DEFAULT false,
  "kind" text NOT NULL,
  "payload" jsonb NOT NULL,
  "note" text NOT NULL DEFAULT '',
  "starts_at" timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "created_by" text NOT NULL DEFAULT '',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "petz_ops_live_idx" ON "petz_ops" ("starts_at") WHERE "cancelled_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "petz_ops_pets_idx" ON "petz_ops" USING gin ("pet_ids");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "petz_op_acks" (
  "op_id" integer NOT NULL REFERENCES "petz_ops"("id") ON DELETE CASCADE,
  "pet_id" varchar(16) NOT NULL REFERENCES "petz_saves"("id") ON DELETE CASCADE,
  "applied_at" timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("op_id", "pet_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "petz_op_acks_pet_idx" ON "petz_op_acks" ("pet_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "petz_admin_log" (
  "id" serial PRIMARY KEY,
  "actor" text NOT NULL DEFAULT '',
  "action" text NOT NULL,
  "target" text NOT NULL DEFAULT '',
  "detail" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "petz_admin_log_time_idx" ON "petz_admin_log" ("created_at" DESC);
