ALTER TABLE "random_content" ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'Internet gem' NOT NULL;
ALTER TABLE "random_content" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;
INSERT INTO "random_content" ("title", "type", "body", "category", "tags", "link_url", "link_label", "weight", "active")
SELECT 'Missing Missy', 'link', 'A legendary internet exchange in which a simple request for a missing-cat poster turns into an escalating masterclass in mischievous graphic design. An early-web comedy classic by David Thorne.', 'Internet gem', '["internet history", "design", "cats", "comedy"]'::jsonb, 'https://27bslash6.com/missy.html', 'Read the original', 1, false
WHERE NOT EXISTS (SELECT 1 FROM "random_content" WHERE "title" = 'Missing Missy');
