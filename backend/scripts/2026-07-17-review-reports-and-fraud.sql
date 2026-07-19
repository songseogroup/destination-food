-- Destination Whisky — schema additions, 2026-07-17
--
-- WHY THIS FILE EXISTS
-- No migration tooling, and `synchronize` is off against hosted databases.
-- TypeORM creates these in development; nothing creates them in production.
--
-- RUN THIS BEFORE DEPLOYING THE API THAT EXPECTS IT. The reviews endpoints read
-- reviews.status on every public listing page — without this column they 500,
-- and that takes the listing pages down with them, not just the new moderation
-- screens.
--
-- Additive, IF NOT EXISTS, drops nothing. Safe to re-run.


-- Moderation state. Replaces the isHidden boolean, which couldn't tell
-- "reported, nobody has looked" from "we looked and removed it" — the first is
-- a queue, the second is a decision.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reviews_status_enum') THEN
    CREATE TYPE reviews_status_enum AS ENUM ('visible', 'pending', 'removed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reviews_flagreason_enum') THEN
    CREATE TYPE reviews_flagreason_enum AS ENUM ('same_origin_burst', 'rating_spike', 'reported');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_reports_reason_enum') THEN
    CREATE TYPE review_reports_reason_enum AS ENUM ('spam', 'harassment', 'fake', 'other');
  END IF;
END
$$;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS status       reviews_status_enum NOT NULL DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS "flagReason" reviews_flagreason_enum,
  ADD COLUMN IF NOT EXISTS "originHash" VARCHAR(64);

-- Carry the old moderation decisions across. A review an admin had hidden was
-- hidden on purpose; it must not reappear because the flag moved columns.
-- Only touches rows still at the default, so re-running can't undo later work.
UPDATE reviews
   SET status = 'removed'
 WHERE "isHidden" = true AND status = 'visible';

-- `isHidden` is intentionally left in place, not dropped: dropping is
-- irreversible, nothing reads it now, and it is the only record of the original
-- state if this migration ever needs unpicking.


-- Reports are rows, not a counter: three people reporting one review for three
-- different reasons is information a moderator needs, and a count throws it away.
CREATE TABLE IF NOT EXISTS review_reports (
  id                   SERIAL PRIMARY KEY,
  "reviewId"           INTEGER NOT NULL,
  "reporterCustomerId" INTEGER,
  "reporterUserId"     INTEGER,
  reason               review_reports_reason_enum NOT NULL,
  note                 TEXT,
  resolved             BOOLEAN NOT NULL DEFAULT false,
  "createdAt"          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_review_reports_reviewId" ON review_reports ("reviewId");

-- The public listing filters on status, and the fraud check counts recent
-- reviews from one origin, on every single review that gets posted.
CREATE INDEX IF NOT EXISTS "IDX_reviews_status"     ON reviews (status);
CREATE INDEX IF NOT EXISTS "IDX_reviews_originHash" ON reviews ("originHash");
