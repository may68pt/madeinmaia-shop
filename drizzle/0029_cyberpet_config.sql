-- CyberPet live tuning values, edited in the back office and fetched by the app.
CREATE TABLE IF NOT EXISTS "petz_config" (
  "key" text PRIMARY KEY,
  "value" jsonb NOT NULL,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
