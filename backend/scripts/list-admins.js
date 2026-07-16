#!/usr/bin/env node
/**
 * READ-ONLY diagnostic: which staff accounts exist, and with what role?
 *
 * Runs a single SELECT. It writes nothing, changes no schema, and never prints
 * a password (the column holds a bcrypt hash and is not selected at all).
 *
 *   node scripts/list-admins.js
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

  console.log(`\n  Reading from: ${host}${isRemote ? '  (remote)' : '  (local)'}`);
  console.log('  (read-only — nothing is modified)\n');

  const client = new Client({
    connectionString: url,
    ssl: isRemote ? { rejectUnauthorized: false } : false,
  });
  await client.connect();

  try {
    const { rows } = await client.query(
      `SELECT id, email, role, "isActive", "approvalStatus",
              (password IS NOT NULL) AS has_password
         FROM "users"
        ORDER BY
          CASE role WHEN 'super_admin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
          id`,
    );

    if (rows.length === 0) {
      console.log('  No users exist at all.\n');
      return;
    }

    const pad = (s, n) => String(s).padEnd(n);
    console.log(
      `  ${pad('ID', 5)}${pad('EMAIL', 38)}${pad('ROLE', 15)}${pad('ACTIVE', 8)}${'PASSWORD'}`,
    );
    console.log(`  ${'-'.repeat(78)}`);
    for (const r of rows) {
      console.log(
        `  ${pad(r.id, 5)}${pad(r.email, 38)}${pad(r.role, 15)}${pad(r.isActive ? 'yes' : 'NO', 8)}${
          r.has_password ? 'set' : 'NOT SET'
        }`,
      );
    }

    const supers = rows.filter((r) => r.role === 'super_admin');
    console.log('');
    if (supers.length === 0) {
      console.log('  ⚠️  No super_admin exists. The homepage builder, payout review and');
      console.log('     vendor-approval notifications are unreachable for everyone.');
      console.log('     Fix with: node scripts/reset-super-admin.js\n');
    } else {
      console.log(`  ${supers.length} super admin(s): ${supers.map((s) => s.email).join(', ')}\n`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\n  Failed:', err.message, '\n');
  process.exit(1);
});
