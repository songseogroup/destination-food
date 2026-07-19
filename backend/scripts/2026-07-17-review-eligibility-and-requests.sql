-- Destination Whisky — schema additions, 2026-07-17
--
-- WHY THIS FILE EXISTS
-- There is no migration tooling in this project, and `synchronize` is off
-- against hosted databases (app.module.ts refuses to start otherwise). In
-- development TypeORM creates this table on boot; in production nothing does.
--
-- Run this against each non-development database BEFORE deploying the API that
-- expects this table. Reviews will 500 on the eligibility check without it.
--
-- Every statement is IF NOT EXISTS and drops no data, so it is safe to re-run.

-- Reviews are limited to customers who booked through Destination Whisky. This
-- table is the deliberate, auditable exception: an admin vouches that a specific
-- customer really visited a specific listing (a pre-launch guest, or someone who
-- booked by phone), and that customer may review that one listing.
--
-- The enum must match ReviewEntityType in src/reviews/entities/review.entity.ts.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verified_visits_entitytype_enum') THEN
    CREATE TYPE verified_visits_entitytype_enum AS ENUM ('bar', 'distillery', 'event');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS verified_visits (
  id              SERIAL PRIMARY KEY,
  "customerId"    INTEGER NOT NULL,
  "entityType"    verified_visits_entitytype_enum NOT NULL,
  "entityId"      INTEGER NOT NULL,
  "grantedByUserId" INTEGER,
  note            TEXT,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now()
);

-- One grant per customer per listing. Also what makes the "already granted?"
-- lookup in grantVerifiedVisit() cheap.
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_verified_visits_customer_entity"
  ON verified_visits ("customerId", "entityType", "entityId");


-- The "how was it?" email goes out the day after a booking. ReviewRequestScheduler
-- sweeps past bookings daily, so without this marker every eligible guest would be
-- asked again every morning. NULL means never asked.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS "reviewRequestSentAt" TIMESTAMP;
