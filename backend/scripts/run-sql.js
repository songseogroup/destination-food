#!/usr/bin/env node
/**
 * Runs a .sql file against DATABASE_URL. For applying the additive migration
 * scripts in this folder to a hosted database (where TypeORM synchronize is
 * intentionally off).
 *
 *   node scripts/run-sql.js scripts/create-analytics-table.sql
 */
require('dotenv').config();
const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('  Usage: node scripts/run-sql.js <path-to.sql>');
    process.exit(1);
  }
  const sql = fs.readFileSync(file, 'utf8');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');
  const host = url.replace(/^[^@]*@/, '').split('/')[0];
  const isRemote = !/^(localhost|127\.0\.0\.1)/.test(host);

  console.log(`\n  Running ${file}\n  against ${host}\n`);

  const client = new Client({ connectionString: url, ssl: isRemote ? { rejectUnauthorized: false } : false });
  await client.connect();
  try {
    await client.query(sql);
    console.log('  ✅ Applied successfully.\n');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('\n  Failed:', e.message, '\n');
  process.exit(1);
});
