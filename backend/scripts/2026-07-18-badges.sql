-- Destination Whisky — schema addition, 2026-07-18
--
-- WHY THIS FILE EXISTS
-- No migration tooling, and `synchronize` is off against hosted databases.
-- TypeORM creates this in development; nothing creates it in production.
--
-- Run against each non-development database BEFORE deploying the API that
-- expects it. The badges endpoints 500 without it, and the daily recompute job
-- can't run.
--
-- Additive, IF NOT EXISTS, drops nothing. Safe to re-run.


-- Earned badges. Computed from real activity by BadgesService and nothing else —
-- there's no operator write path, which is the whole point of the feature.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badges_entitytype_enum') THEN
    CREATE TYPE badges_entitytype_enum AS ENUM ('bar', 'distillery', 'event');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badges_type_enum') THEN
    CREATE TYPE badges_type_enum AS ENUM (
      'trending', 'most_reviewed', 'top_rated_in_city', 'community_favourite'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS badges (
  id           SERIAL PRIMARY KEY,
  "entityType" badges_entitytype_enum NOT NULL,
  "entityId"   INTEGER NOT NULL,
  type         badges_type_enum NOT NULL,
  context      JSON,
  "expiresAt"  TIMESTAMP NOT NULL,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMP NOT NULL DEFAULT now()
);

-- One of each badge type per listing.
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_badges_entity_type"
  ON badges ("entityType", "entityId", type);
CREATE INDEX IF NOT EXISTS "IDX_badges_entity"
  ON badges ("entityType", "entityId");
