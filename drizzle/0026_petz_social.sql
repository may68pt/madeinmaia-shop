CREATE TABLE petz_presence (
  pet_id varchar(16) PRIMARY KEY REFERENCES petz_saves(id) ON DELETE CASCADE,
  room varchar(16) NOT NULL,
  position integer NOT NULL,
  name text NOT NULL,
  sprite text NOT NULL,
  seen_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX petz_presence_room_idx ON petz_presence (room, seen_at);
--> statement-breakpoint
CREATE TABLE petz_visits (
  code varchar(32) PRIMARY KEY,
  host varchar(16) NOT NULL REFERENCES petz_saves(id) ON DELETE CASCADE,
  guest varchar(16) REFERENCES petz_saves(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX petz_visits_host_idx ON petz_visits (host);
--> statement-breakpoint
CREATE TABLE petz_social_events (
  pet_id varchar(16) NOT NULL REFERENCES petz_saves(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  kind text NOT NULL,
  friend varchar(16) REFERENCES petz_saves(id) ON DELETE SET NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pet_id, event_key)
);
--> statement-breakpoint
CREATE INDEX petz_social_events_friend_idx ON petz_social_events (friend);
