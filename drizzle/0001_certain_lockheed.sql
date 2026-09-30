CREATE TABLE "random_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"media_url" text,
	"link_url" text,
	"link_label" text DEFAULT 'Descobrir' NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
