#!/usr/bin/env node
/**
 * Seed / refresh the homepage layout with the polished Destination Whisky copy
 * plus a promo ad block, so the builder and storefront show the real content
 * instead of the stale "Premium Nightlife" seed from the food-era template.
 *
 * Idempotent: upserts each section by key (ON CONFLICT (section) DO UPDATE).
 * Safe to re-run; it only touches the homepage_content rows below.
 *
 *   node scripts/seed-homepage.js
 */
require('dotenv').config();
const { Client } = require('pg');

const SECTIONS = [
  {
    section: 'banner',
    order: 0,
    content: {
      // Carousel slides — the client edits/adds/reorders these in the builder.
      slides: [
        {
          image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&h=1080&fit=crop',
          highlight: "Australia's whisky marketplace",
          title: 'Find your next',
          subtitle: 'great dram',
          description:
            'Book whisky tastings, distillery tours, bar events and festivals — direct with the people who pour them.',
        },
        {
          image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=1920&h=1080&fit=crop',
          highlight: 'Winter season',
          title: 'Savour the smoke',
          subtitle: 'this winter',
          description: 'Peated drams, fireside tastings and the festivals worth travelling for.',
          ctaLabel: 'Explore winter events',
          ctaHref: '/events',
        },
        {
          image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=1920&h=1080&fit=crop',
          highlight: 'Go behind the still',
          title: 'Tour a working',
          subtitle: 'distillery',
          description: 'Meet the makers, walk the floor, and taste straight from the cask.',
          ctaLabel: 'Browse distilleries',
          ctaHref: '/distilleries',
        },
      ],
      // Shown on every slide (constant).
      searchPlaceholder: 'Search tastings, tours, distilleries...',
      popularSearches: ['Sydney', 'Melbourne', 'Hobart'],
    },
  },
  {
    section: 'featured_bars',
    order: 1,
    content: {
      title: 'Featured Whisky Bars',
      description: 'Rare drams, deep back bars, and the people who know them best',
      viewAllLabel: 'View all bars',
      tone: 'cream',
    },
  },
  {
    // Inline promo ad — renders the byFood-style promo band with no /banners row.
    section: 'ad:featured_above',
    order: 2,
    content: {
      slot: 'featured_above',
      highlight: 'Save 10%',
      title: 'Savour Winter',
      subtitle: 'Through Whisky',
      ctaLabel: 'Explore Now',
      badgeLabel: 'Winter Special',
      linkUrl: '/events',
    },
  },
  {
    section: 'featured_distilleries',
    order: 3,
    content: {
      title: 'Distilleries & Tours',
      description: 'Go behind the still with the makers themselves',
      viewAllLabel: 'View all distilleries',
      tone: 'white',
    },
  },
  {
    section: 'featured_events',
    order: 4,
    content: {
      title: 'Upcoming Whisky Events',
      description: 'Tastings, masterclasses and festivals worth clearing your calendar for',
      viewAllLabel: 'View all events',
      tone: 'cream',
    },
  },
  {
    section: 'featured_blogs',
    order: 5,
    content: {
      title: 'From the Journal',
      description: 'Tasting notes, distillery stories and the odd strong opinion',
      viewAllLabel: 'Read the journal',
      tone: 'white',
    },
  },
  {
    // Site-wide promo band — the same campaign on every page (byFood-style).
    // Edited once via the builder's "Site promo" button.
    section: 'site_promo',
    order: 200,
    content: {
      enabled: 'yes',
      highlight: 'Save 10%',
      title: 'Savour Winter',
      subtitle: 'Through Whisky',
      ctaLabel: 'Explore Now',
      ctaHref: '/events',
      badgeLabel: 'Winter Special',
      source: 'events',
      discountPercent: 10,
    },
  },
  {
    // Editable footer content (the builder's "Edit footer" reads this).
    section: 'site_footer',
    order: 100,
    content: {
      tagline:
        'The marketplace for whisky experiences — tastings, distillery tours, bar events and festivals. Book direct, drink well.',
      email: 'hello@destinationwhisky.life',
      location: 'Sydney, Australia',
      instagram: 'https://instagram.com/destinationwhisky',
      facebook: 'https://facebook.com/destinationwhisky',
      youtube: 'https://youtube.com/@destinationwhisky',
      twitter: 'https://x.com/destinationwhisky',
      copyright: `© ${new Date().getFullYear()} Destination Whisky. All rights reserved.`,
    },
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const host = url.replace(/^[^@]*@/, '').split('/')[0];
  const isRemote = !/^(localhost|127\.0\.0\.1)/.test(host);
  console.log(`\n  Seeding homepage into: ${host}\n`);

  const client = new Client({ connectionString: url, ssl: isRemote ? { rejectUnauthorized: false } : false });
  await client.connect();
  try {
    for (const s of SECTIONS) {
      await client.query(
        `INSERT INTO "homepage_content" ("section","content","order","isVisible","createdAt","updatedAt")
         VALUES ($1,$2,$3,true,NOW(),NOW())
         ON CONFLICT ("section") DO UPDATE
           SET "content" = EXCLUDED."content",
               "order"   = EXCLUDED."order",
               "updatedAt" = NOW()`,
        [s.section, JSON.stringify(s.content), s.order],
      );
      console.log(`  ${String(s.order).padStart(3)}  ${s.section}`);
    }
    console.log('\n  ✅ Homepage seeded (incl. promo ad block + editable footer).\n');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('\n  Failed:', e.message, '\n');
  process.exit(1);
});
