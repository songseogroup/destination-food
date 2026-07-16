-- Destination Whisky — schema additions, 2026-07-16
--
-- WHY THIS FILE EXISTS
-- app.module.ts sets `synchronize: process.env.NODE_ENV === 'development'`, and
-- there is no migration tooling in this project (no typeorm migration scripts,
-- no prisma). So in development TypeORM adds these columns automatically on
-- boot, but in production `synchronize` is false and nothing creates them —
-- the new fields would silently never exist.
--
-- Run this against each non-development database BEFORE deploying the API that
-- expects these columns.
--
-- Every statement is additive, nullable-or-defaulted, and IF NOT EXISTS, so it
-- is safe to run more than once and drops no data.
--
--   psql "$DATABASE_URL" -f backend/scripts/2026-07-16-social-links-and-event-ratings.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- socialLinks: Instagram / Facebook / YouTube / X / TikTok / LinkedIn, plus
-- `other` links such as a charity or GoFundMe page.
-- Shape: [{ "platform": "instagram", "url": "https://…", "label": "…" }]
-- See src/common/dto/social-link.dto.ts
-- ---------------------------------------------------------------------------
ALTER TABLE "bars"         ADD COLUMN IF NOT EXISTS "socialLinks" json;
ALTER TABLE "distilleries" ADD COLUMN IF NOT EXISTS "socialLinks" json;
ALTER TABLE "events"       ADD COLUMN IF NOT EXISTS "socialLinks" json;

-- ---------------------------------------------------------------------------
-- Event had no website column at all, unlike Bar and Distillery.
-- ---------------------------------------------------------------------------
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "website" character varying;

-- ---------------------------------------------------------------------------
-- Event review aggregate, mirroring bars/distilleries.
-- The reviews table already supports entityType='event', but Event carried no
-- rating/reviews columns, so event cards could never show a star rating.
-- ---------------------------------------------------------------------------
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "rating"  numeric(3,2) NOT NULL DEFAULT 0;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "reviews" integer      NOT NULL DEFAULT 0;

-- Backfill the aggregate from any event reviews that already exist, so the new
-- columns are correct on day one rather than showing every event as "New".
UPDATE "events" e
SET
  "rating"  = COALESCE(agg.avg_rating, 0),
  "reviews" = COALESCE(agg.cnt, 0)
FROM (
  SELECT
    r."entityId"                      AS event_id,
    ROUND(AVG(r."rating")::numeric, 2) AS avg_rating,
    COUNT(*)                          AS cnt
  FROM "reviews" r
  WHERE r."entityType" = 'event'
    AND r."isHidden" = false
  GROUP BY r."entityId"
) AS agg
WHERE e."id" = agg.event_id;

-- ---------------------------------------------------------------------------
-- Promo-band campaign fields on banners.
-- A `featured_above` banner renders as a byFood-style promo band: a copy block
-- (highlight + title + subtitle + CTA) beside a row of listing cards stamped
-- with badgeLabel. Other slots ignore these and stay plain image tiles.
-- ---------------------------------------------------------------------------
ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "highlight"  character varying;
ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "ctaLabel"   character varying;
ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "badgeLabel" character varying;

-- imageUrl becomes optional: a promo band draws its imagery from the cards
-- beside it and has no banner image of its own.
ALTER TABLE "banners" ALTER COLUMN "imageUrl" DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- Homepage layout: ordering + visibility.
--
-- The storefront homepage is now CMS-driven (GET /homepage/layout) instead of
-- hardcoded in app/page.tsx, so a super admin can reorder and hide blocks from
-- the builder. These two columns are what makes that possible.
-- ---------------------------------------------------------------------------
ALTER TABLE "homepage_content" ADD COLUMN IF NOT EXISTS "order"     integer NOT NULL DEFAULT 0;
ALTER TABLE "homepage_content" ADD COLUMN IF NOT EXISTS "isVisible" boolean NOT NULL DEFAULT true;

-- Give existing rows a stable order. They all default to 0, which would render
-- in arbitrary order; seed the shipped arrangement instead.
UPDATE "homepage_content" SET "order" = 0 WHERE "section" = 'banner'                 AND "order" = 0;
UPDATE "homepage_content" SET "order" = 1 WHERE "section" = 'featured_bars'          AND "order" = 0;
UPDATE "homepage_content" SET "order" = 3 WHERE "section" = 'featured_distilleries'  AND "order" = 0;
UPDATE "homepage_content" SET "order" = 4 WHERE "section" = 'featured_events'        AND "order" = 0;
UPDATE "homepage_content" SET "order" = 5 WHERE "section" = 'featured_blogs'         AND "order" = 0;

-- The promo ad band between bars and distilleries (order 2).
INSERT INTO "homepage_content" ("section", "content", "order", "isVisible", "createdAt", "updatedAt")
VALUES ('ad:featured_above', '{"slot":"featured_above"}', 2, true, NOW(), NOW())
ON CONFLICT ("section") DO NOTHING;

COMMIT;

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
-- SELECT table_name, column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE (table_name, column_name) IN (
--   ('bars','socialLinks'), ('distilleries','socialLinks'), ('events','socialLinks'),
--   ('events','website'), ('events','rating'), ('events','reviews'),
--   ('banners','highlight'), ('banners','ctaLabel'), ('banners','badgeLabel'),
--   ('banners','imageUrl')
-- )
-- ORDER BY table_name, column_name;
--
-- Seed a promo band:
-- INSERT INTO "banners" ("slot","title","subtitle","highlight","ctaLabel","badgeLabel","linkUrl","isActive","priority")
-- VALUES ('featured_above','Savour Winter','Through Whisky','Save 10%','Explore Now','Winter Special','/events',true,0);
