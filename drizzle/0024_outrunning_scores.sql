CREATE TABLE IF NOT EXISTS "game_scores" (
  "id" serial PRIMARY KEY,
  "game" varchar(40) NOT NULL DEFAULT 'outrunning',
  "chapter" integer NOT NULL DEFAULT 0,
  "name" varchar(3) NOT NULL,
  "score" integer NOT NULL,
  "won" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "game_scores_game_score_idx" ON "game_scores" ("game","score" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "game_scores_game_chapter_score_idx" ON "game_scores" ("game","chapter","score" DESC);
