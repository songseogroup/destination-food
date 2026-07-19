-- Destination Whisky — schema addition, 2026-07-18
--
-- WHY THIS FILE EXISTS
-- No migration tooling, and `synchronize` is off against hosted databases.
-- TypeORM creates these in development; nothing creates them in production.
--
-- Run against each non-development database BEFORE deploying the API that
-- expects it. The sessions endpoints 500 without it, and orders that carry a
-- sessionId can't be created.
--
-- Additive, IF NOT EXISTS, drops nothing. Safe to re-run.


-- Bookable time slots with a hard capacity. A booking can only ever take seats
-- that a session actually has.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sessions_entitytype_enum') THEN
    CREATE TYPE sessions_entitytype_enum AS ENUM ('bar', 'distillery', 'event');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS sessions (
  id                SERIAL PRIMARY KEY,
  "entityType"      sessions_entitytype_enum NOT NULL,
  "entityId"        INTEGER NOT NULL,
  "startsAt"        TIMESTAMP NOT NULL,
  "durationMinutes" INTEGER,
  capacity          INTEGER NOT NULL,
  "bookedCount"     INTEGER NOT NULL DEFAULT 0,
  "priceOverride"   NUMERIC(10,2),
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_sessions_entity"  ON sessions ("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "IDX_sessions_startsAt" ON sessions ("startsAt");


-- The order's link to the slot it booked. Nullable: existing free-text bookings
-- and listings without sessions keep working unchanged.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS "sessionId" INTEGER;
