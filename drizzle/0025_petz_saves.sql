CREATE TABLE IF NOT EXISTS "petz_saves" (
  "id" varchar(16) PRIMARY KEY,
  "key_hash" text NOT NULL,
  "rev" integer NOT NULL DEFAULT 1,
  "t" bigint NOT NULL DEFAULT 0,
  "data" jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "petz_links" (
  "code" varchar(8) PRIMARY KEY,
  "pet_id" varchar(16) NOT NULL REFERENCES "petz_saves"("id") ON DELETE CASCADE,
  "expires_at" timestamp with time zone NOT NULL
);
