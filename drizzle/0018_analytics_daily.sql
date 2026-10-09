CREATE TABLE IF NOT EXISTS "analytics_daily" (
  "day" date NOT NULL,
  "event" text NOT NULL,
  "path" text NOT NULL,
  "total" integer NOT NULL DEFAULT 0,
  CONSTRAINT "analytics_daily_day_event_path_pk" PRIMARY KEY ("day", "event", "path")
);
CREATE INDEX IF NOT EXISTS "analytics_daily_event_day_idx" ON "analytics_daily" ("event", "day");
