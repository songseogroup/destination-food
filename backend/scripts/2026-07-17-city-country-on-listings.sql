-- Destination Whisky — schema additions, 2026-07-17
--
-- WHY THIS FILE EXISTS
-- No migration tooling in this project, and `synchronize` is off against hosted
-- databases (app.module.ts refuses to boot otherwise). TypeORM creates these in
-- development; nothing creates them in production.
--
-- Run against each non-development database BEFORE deploying the API that
-- expects these columns. The destination pages return nothing without them.
--
-- Additive, IF NOT EXISTS, drops nothing. Safe to re-run.


-- WHY: the destination landing pages (/destinations/<city>, /destinations/country/<country>)
-- group listings by city and country. Events already had both columns; bars and
-- distilleries had only free-text `location`, which made country pages impossible
-- and city pages a string-matching guess.
ALTER TABLE bars
  ADD COLUMN IF NOT EXISTS city    VARCHAR,
  ADD COLUMN IF NOT EXISTS country VARCHAR;

ALTER TABLE distilleries
  ADD COLUMN IF NOT EXISTS city    VARCHAR,
  ADD COLUMN IF NOT EXISTS country VARCHAR;


-- Backfill. Today every `location` holds a bare city name ("Sydney", "Hobart"),
-- so it maps across cleanly. Only fills blanks — an operator who has already set
-- a city keeps it.
UPDATE bars
   SET city = location
 WHERE city IS NULL AND location IS NOT NULL AND location <> '';

UPDATE distilleries
   SET city = location
 WHERE city IS NULL AND location IS NOT NULL AND location <> '';

-- Every current listing is Australian. Left as a default rather than guessed per
-- row; operators can correct their own from the listing form.
UPDATE bars
   SET country = 'Australia'
 WHERE country IS NULL;

UPDATE distilleries
   SET country = 'Australia'
 WHERE country IS NULL;

-- Events already carry city/country, but older rows may predate the fields.
UPDATE events
   SET city = location
 WHERE city IS NULL AND location IS NOT NULL AND location <> '';

UPDATE events
   SET country = 'Australia'
 WHERE country IS NULL;


-- The destination pages filter on these; without indexes each page load is a
-- full scan of every listing table.
CREATE INDEX IF NOT EXISTS "IDX_bars_city"         ON bars (city);
CREATE INDEX IF NOT EXISTS "IDX_bars_country"      ON bars (country);
CREATE INDEX IF NOT EXISTS "IDX_distilleries_city" ON distilleries (city);
CREATE INDEX IF NOT EXISTS "IDX_distilleries_country" ON distilleries (country);
CREATE INDEX IF NOT EXISTS "IDX_events_city"       ON events (city);
CREATE INDEX IF NOT EXISTS "IDX_events_country"    ON events (country);
