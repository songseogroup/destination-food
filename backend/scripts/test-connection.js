#!/usr/bin/env node
/**
 * Connection smoke test. Tries to authenticate against DATABASE_URL and reports
 * ONLY success/failure + server version + whether the schema looks present.
 *
 * It runs `SELECT version()` and a COUNT of tables in the public schema —
 * nothing else. No table rows, no user data, no credentials are printed.
 *
 *   node scripts/test-connection.js
 */
require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const url =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USERNAME || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${
      process.env.DB_HOST || 'localhost'
    }:${process.env.DB_PORT || 5432}/${process.env.DB_DATABASE || 'byfoods_cms'}`;

  const host = url.replace(/^[^@]*@/, '').split('/')[0];
  const isRemote = !/^(localhost|127\.0\.0\.1)/.test(host);
  console.log(`\n  Target: ${host}${isRemote ? '  (remote)' : '  (local)'}\n`);

  const client = new Client({
    connectionString: url,
    ssl: isRemote ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
  } catch (err) {
    console.log('  ❌ Could NOT connect.');
    console.log('     Reason:', err.message);
    if (/password authentication failed/i.test(err.message)) {
      console.log('\n     The server was reached but rejected the password/username.');
      console.log('     -> The credentials are wrong (a typo, or the reset has not applied).');
      console.log('     -> Fix: in Supabase, copy the "URI" from Settings → Database');
      console.log('        (use the copy button — do not retype), and send it as-is.');
    } else if (/getaddrinfo|ENOTFOUND|ETIMEDOUT|ECONNREFUSED/i.test(err.message)) {
      console.log('\n     The host could not be reached at all (network / endpoint issue).');
      console.log('     -> Supabase may need the pooler endpoint rather than the direct host.');
    }
    console.log('');
    process.exit(1);
  }

  try {
    const v = await client.query('SELECT version()');
    const t = await client.query(
      `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    const users = await client.query(
      `SELECT to_regclass('public.users') IS NOT NULL AS has_users`,
    );
    console.log('  ✅ Connected and authenticated.');
    console.log('     Server :', v.rows[0].version.split(' ').slice(0, 2).join(' '));
    console.log('     Public tables:', t.rows[0].n);
    console.log(
      '     Schema state :',
      t.rows[0].n === 0
        ? 'EMPTY — tables need creating before the API can serve.'
        : users.rows[0].has_users
          ? "populated (a 'users' table exists)."
          : "has tables but no 'users' table.",
    );
    console.log('');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('  Failed:', e.message, '\n');
  process.exit(1);
});
