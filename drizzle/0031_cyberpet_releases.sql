-- CyberPet releases: timed drops of rare items to a scope, as gifts, shop listings or QR / t-shirt unlocks.
CREATE TABLE IF NOT EXISTS "petz_releases" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "item_ids" text[] NOT NULL DEFAULT '{}',
  "channel" text NOT NULL CHECK ("channel" IN ('gift', 'shop', 'qr')),
  "scope" text NOT NULL DEFAULT 'all' CHECK ("scope" IN ('all', 'class', 'pets')),
  "class_id" integer REFERENCES "petz_classes"("id") ON DELETE SET NULL,
  "pet_ids" text[] NOT NULL DEFAULT '{}',
  "include_new" boolean NOT NULL DEFAULT true,
  "starts_at" timestamp with time zone NOT NULL DEFAULT now(),
  "ends_at" timestamp with time zone,
  "status" text NOT NULL DEFAULT 'live' CHECK ("status" IN ('draft', 'live', 'paused', 'ended')),
  "qr_code" varchar(16) UNIQUE,
  "max_claims" integer,
  "claims" integer NOT NULL DEFAULT 0,
  "note" text NOT NULL DEFAULT '',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "petz_releases_live_idx" ON "petz_releases" ("channel", "starts_at") WHERE "status" = 'live';
