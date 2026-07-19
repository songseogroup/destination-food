-- Destination Whisky — schema addition, 2026-07-18
--
-- WHY THIS FILE EXISTS
-- No migration tooling, and `synchronize` is off against hosted databases.
-- TypeORM creates this in development; nothing creates it in production.
--
-- Run against each non-development database BEFORE deploying the API that
-- expects it. The claims endpoints 500 without it.
--
-- Additive, IF NOT EXISTS, drops nothing. Safe to re-run.


-- Requests from business owners to take over a listing that has no owner yet.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claims_entitytype_enum') THEN
    CREATE TYPE claims_entitytype_enum AS ENUM ('bar', 'distillery', 'event');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claims_status_enum') THEN
    CREATE TYPE claims_status_enum AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS claims (
  id                 SERIAL PRIMARY KEY,
  "entityType"       claims_entitytype_enum NOT NULL,
  "entityId"         INTEGER NOT NULL,
  "claimantName"     VARCHAR NOT NULL,
  "claimantEmail"    VARCHAR NOT NULL,
  "claimantPhone"    VARCHAR,
  message            TEXT,
  status             claims_status_enum NOT NULL DEFAULT 'pending',
  "reviewedByUserId" INTEGER,
  "reviewNote"       TEXT,
  "reviewedAt"       TIMESTAMP,
  "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_claims_entity" ON claims ("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "IDX_claims_status" ON claims (status);
