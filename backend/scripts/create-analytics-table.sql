-- analytics_events: one row per page view / click.
--
-- Created via SQL rather than TypeORM synchronize, so the rest of the hosted
-- schema is never touched. Additive and idempotent (IF NOT EXISTS).
--
--   node scripts/run-sql.js scripts/create-analytics-table.sql

BEGIN;

DO $$ BEGIN
  CREATE TYPE "analytics_events_eventtype_enum" AS ENUM ('view', 'click');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "analytics_events_entitytype_enum"
    AS ENUM ('bar', 'distillery', 'event', 'blog', 'homepage', 'ad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id"         SERIAL PRIMARY KEY,
  "eventType"  "analytics_events_eventtype_enum"  NOT NULL DEFAULT 'view',
  "entityType" "analytics_events_entitytype_enum" NOT NULL,
  "entityId"   integer,
  "sessionId"  character varying,
  "path"       character varying,
  "referrer"   character varying,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT now()
);

-- The dashboard's hot query: events for one entity within a date range.
CREATE INDEX IF NOT EXISTS "idx_analytics_entity"
  ON "analytics_events" ("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_analytics_created"
  ON "analytics_events" ("createdAt");

COMMIT;
