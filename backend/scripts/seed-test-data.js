#!/usr/bin/env node
/**
 * Demo / test data for client walkthroughs.
 *
 * Creates one login per role and a set of fake but realistic whisky listings —
 * each owner account owns its own listing so the role-scoped CMS views have
 * something to show. Idempotent: re-running upserts users by email and skips
 * listings that already exist by name.
 *
 * Run AFTER the schema exists (the tables are created by a one-time
 * DB_SYNCHRONIZE=true boot). Reads DATABASE_URL from .env.
 *
 *   node scripts/seed-test-data.js
 *
 * ⚠️  These are TEST accounts with a shared, weak password. Delete them or
 *     change the passwords before the site handles real customers.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const TEST_PASSWORD = 'admin123'; // shared, for easy client testing — CHANGE BEFORE LAUNCH

const img = (id) => `https://images.unsplash.com/${id}?w=800&q=70&auto=format&fit=crop`;
const social = (rows) => JSON.stringify(rows);

// ---- role logins -----------------------------------------------------------
const USERS = [
  { email: 'admin@destinationwhisky.life', firstName: 'Super', lastName: 'Admin', role: 'super_admin' },
  { email: 'manager@destinationwhisky.life', firstName: 'Platform', lastName: 'Manager', role: 'admin' },
  { email: 'bar@destinationwhisky.life', firstName: 'Bianca', lastName: 'Barkeep', role: 'bar' },
  { email: 'distillery@destinationwhisky.life', firstName: 'Dara', lastName: 'Distiller', role: 'distillery' },
  { email: 'events@destinationwhisky.life', firstName: 'Evan', lastName: 'Host', role: 'event_host' },
  { email: 'tours@destinationwhisky.life', firstName: 'Tara', lastName: 'Tours', role: 'tour_operator' },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');
  const host = url.replace(/^[^@]*@/, '').split('/')[0];
  const isRemote = !/^(localhost|127\.0\.0\.1)/.test(host);
  console.log(`\n  Seeding test data into: ${host}\n`);

  const client = new Client({ connectionString: url, ssl: isRemote ? { rejectUnauthorized: false } : false });
  await client.connect();

  try {
    const hash = await bcrypt.hash(TEST_PASSWORD, 10);

    // ---- users -------------------------------------------------------------
    const ids = {};
    for (const u of USERS) {
      const { rows } = await client.query(
        `INSERT INTO "users" (email, password, "firstName", "lastName", role, "isActive", "approvalStatus", "passwordSetAt", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,true,'approved',NOW(),NOW(),NOW())
         ON CONFLICT (email) DO UPDATE
           SET password=$2, role=$5, "isActive"=true, "approvalStatus"='approved', "updatedAt"=NOW()
         RETURNING id`,
        [u.email, hash, u.firstName, u.lastName, u.role],
      );
      ids[u.role] = rows[0].id;
      console.log(`  user  ${u.role.padEnd(14)} -> ${u.email}`);
    }

    // ---- customer (separate table) ----------------------------------------
    await client.query(
      `INSERT INTO "customers" (email, password, "firstName", "lastName", role, "isActive", "isVerified", "emailVerified", phone, city, "createdAt", "updatedAt")
       VALUES ($1,$2,'Casey','Customer','customer',true,true,true,'+61 400 000 111','Sydney',NOW(),NOW())
       ON CONFLICT (email) DO UPDATE SET password=$2, "updatedAt"=NOW()`,
      ['customer@destinationwhisky.life', hash],
    );
    console.log('  customer          -> customer@destinationwhisky.life');

    // ---- helper: insert a row only if it does not already exist -----------
    // `idCol` is the natural key to dedupe on — 'name' for listings, but blogs
    // have no `name` column, they use `title`.
    const insertIfNew = async (table, label, cols, vals, idCol = 'name') => {
      const exists = await client.query(
        `SELECT 1 FROM "${table}" WHERE "${idCol}" = $1 LIMIT 1`,
        [label],
      );
      if (exists.rowCount) {
        console.log(`  ${table.padEnd(13)} skip (exists): ${label}`);
        return;
      }
      const placeholders = vals.map((_, i) => `$${i + 1}`).join(',');
      await client.query(`INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`, vals);
      console.log(`  ${table.padEnd(13)} +  ${label}`);
    };

    const barCols =
      '"name","type","rating","reviews","location","image","isOpen","priceRange","specialties","products","description","address","phone","website","socialLinks","operatingHours","refundWindowHours","isActive","userId","createdAt","updatedAt"';
    await insertIfNew('bars', 'The Baxter Inn', barCols, [
      'The Baxter Inn', 'Whisky Bar', 4.8, 247, 'Sydney', img('photo-1470337458703-46ad1756a187'),
      true, '$$', JSON.stringify(['Rare Scotch', 'Tasting Flights', 'Speakeasy']),
      JSON.stringify(['Ardbeg 10', 'Lagavulin 16', 'Yamazaki 12']),
      'A hidden basement bar with one of the deepest whisky lists in the southern hemisphere.',
      '152-156 Clarence St, Sydney NSW', '+61 2 9000 0001', 'https://thebaxterinn.com',
      social([
        { platform: 'instagram', url: 'https://instagram.com/thebaxterinn' },
        { platform: 'facebook', url: 'https://facebook.com/thebaxterinn' },
        { platform: 'other', url: 'https://gofundme.com/bushfire-relief', label: 'Bushfire Relief Fund' },
      ]),
      JSON.stringify({ Mon: '4pm–1am', Tue: '4pm–1am', Wed: '4pm–1am', Thu: '4pm–2am', Fri: '4pm–3am', Sat: '4pm–3am', Sun: 'Closed' }),
      48, true, ids.bar, 'NOW()', 'NOW()',
    ].map((v) => (v === 'NOW()' ? new Date() : v)));

    const distCols =
      '"name","type","rating","reviews","location","image","isOpen","priceRange","specialties","established","products","description","address","phone","website","socialLinks","refundWindowHours","isActive","userId","createdAt","updatedAt"';
    await insertIfNew('distilleries', 'Archie Rose Distilling Co.', distCols, [
      'Archie Rose Distilling Co.', 'Craft Distillery', 4.9, 8133, 'Sydney', img('photo-1569529465841-dfecdab7503b'),
      true, '$$', JSON.stringify(['Single Malt', 'Rye', 'Distillery Tours']), '2014',
      JSON.stringify(['Single Malt Whisky', 'Rye Malt Whisky', 'White Rye']),
      "Australia's most awarded distillery, offering guided tours and blend-your-own experiences.",
      '85 Dunning Ave, Rosebery NSW', '+61 2 9000 0002', 'https://archierose.com.au',
      social([
        { platform: 'instagram', url: 'https://instagram.com/archierosedistilling' },
        { platform: 'youtube', url: 'https://youtube.com/@archierose' },
        { platform: 'twitter', url: 'https://x.com/archierose' },
      ]),
      48, true, ids.distillery, new Date(), new Date(),
    ]);

    const eventCols =
      '"name","type","date","time","location","city","country","image","price","capacity","description","fullDescription","category","organizer","contactEmail","website","rating","reviews","socialLinks","isActive","isFeatured","refundWindowHours","userId","createdAt","updatedAt"';
    await insertIfNew('events', 'Triple Smoked: A Winter Whisky Event', eventCols, [
      'Triple Smoked: A Winter Whisky Event', 'Tasting', '2026-08-14', '18:30', 'Sydney', 'Sydney', 'Australia',
      img('photo-1514362545857-3bc16c4c7d1b'), '89', '60',
      'A guided journey through smoke, flavour and Australian whisky innovation.',
      'Five drams exploring peat, smoke and cask influence, hosted by our head distiller. Includes a welcome cocktail and paired snacks.',
      'Tasting', 'Archie Rose', 'events@destinationwhisky.life', 'https://archierose.com.au/events',
      4.7, 63,
      social([{ platform: 'instagram', url: 'https://instagram.com/archierosedistilling' }]),
      true, true, 48, ids.event_host, new Date(), new Date(),
    ]);
    await insertIfNew('events', 'Highlands Distillery Day Tour', eventCols, [
      'Highlands Distillery Day Tour', 'Tour', '2026-09-06', '10:00', 'Hobart', 'Hobart', 'Australia',
      img('photo-1527281400683-1aae777175f8'), '145', '18',
      'A full-day guided tour of three Tasmanian distilleries with tastings and lunch.',
      'Travel through the Tasmanian highlands visiting three working distilleries. Includes transport, a two-course lunch, and six guided tastings.',
      'Tour', 'Destination Whisky Tours', 'tours@destinationwhisky.life', 'https://destinationwhisky.life/tours',
      4.9, 27,
      social([
        { platform: 'facebook', url: 'https://facebook.com/dwtours' },
        { platform: 'other', url: 'https://tripadvisor.com/dwtours', label: 'TripAdvisor' },
      ]),
      true, false, 48, ids.tour_operator, new Date(), new Date(),
    ]);

    const blogCols =
      '"title","excerpt","content","author","date","readTime","category","image","featured","isActive","tags","views","createdAt","updatedAt"';
    await insertIfNew('blogs', 'How to Read a Whisky Label Like a Distiller', blogCols, [
      'How to Read a Whisky Label Like a Distiller',
      'Age statements, cask strength, non-chill filtered — what actually matters.',
      '<p>Every bottle tells a story before you even pour it. Here is how to read one.</p><h2>Age statements</h2><p>An age statement is the youngest whisky in the bottle...</p>',
      'Ellis Warner', '2026-07-02', '6 min', 'Guides', img('photo-1569529465841-dfecdab7503b'),
      true, true, JSON.stringify(['beginner', 'labels', 'education']), 1204, new Date(), new Date(),
    ], 'title');

    console.log('\n  ─────────────────────────────────────────────');
    console.log('  Test logins (password for ALL: ' + TEST_PASSWORD + ')');
    console.log('  ─────────────────────────────────────────────');
    console.log('  CMS  (localhost:3002):');
    for (const u of USERS) console.log(`    ${u.role.padEnd(14)} ${u.email}`);
    console.log('  Site (localhost:3000):');
    console.log('    customer       customer@destinationwhisky.life');
    console.log('\n  ⚠️  Weak shared password — change before real launch.\n');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('\n  Failed:', e.message, '\n');
  process.exit(1);
});
