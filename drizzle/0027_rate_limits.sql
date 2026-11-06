-- Request limits that survive redeploys. UNLOGGED: fast writes, and losing it after a database crash is harmless.
CREATE UNLOGGED TABLE IF NOT EXISTS "rate_limits" (
  "bucket" varchar(32) NOT NULL,
  "client" varchar(32) NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "hits" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("bucket", "client", "window_start")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_window_idx" ON "rate_limits" ("window_start");
