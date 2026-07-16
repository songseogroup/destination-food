#!/usr/bin/env node
/**
 * Finds the correct Supabase Session Pooler endpoint for this project.
 *
 * The direct host (db.<ref>.supabase.co) is IPv6-only and times out from an
 * IPv4-only machine, so the app must use the pooler:
 *   postgresql://postgres.<ref>:<pw>@aws-N-<region>.pooler.supabase.com:5432/postgres
 * The only unknown is <region>, and Supabase has a small fixed set of them.
 *
 * This tries each candidate, CONNECT-ONLY (SELECT 1), and stops at the first
 * that authenticates. It reads no tables and prints no data. The error type is
 * itself the diagnosis:
 *   - "password authentication failed"  -> right region, WRONG PASSWORD
 *   - "Tenant or user not found"         -> wrong region, keep looking
 *
 * Password + ref come from POOLER_PW / POOLER_REF env so nothing is hardcoded.
 */
const { Client } = require('pg');

const ref = process.env.POOLER_REF;
const pw = process.env.POOLER_PW;
if (!ref || !pw) {
  console.error('  Set POOLER_REF and POOLER_PW.');
  process.exit(1);
}

// ap-northeast-1 first: the other project in this repo's .env uses that region,
// and one owner usually keeps projects in the same region.
const REGIONS = [
  'ap-northeast-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'sa-east-1',
  'ca-central-1',
];
const PREFIXES = ['aws-0', 'aws-1'];

async function tryHost(host) {
  const client = new Client({
    host,
    port: 5432,
    user: `postgres.${ref}`,
    password: pw,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return { ok: true };
  } catch (e) {
    try { await client.end(); } catch {}
    return { ok: false, msg: e.message };
  }
}

(async () => {
  let sawPasswordError = false;
  for (const region of REGIONS) {
    for (const prefix of PREFIXES) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      process.stdout.write(`  trying ${host} ... `);
      const r = await tryHost(host);
      if (r.ok) {
        console.log('AUTHENTICATED ✅');
        console.log('\n  >>> Working pooler host:', host);
        console.log('  >>> Session pooler URI (password hidden):');
        console.log(`      postgresql://postgres.${ref}:********@${host}:5432/postgres\n`);
        process.exit(0);
      }
      if (/password authentication failed/i.test(r.msg)) {
        console.log('reached — but PASSWORD REJECTED');
        console.log('\n  >>> Right region (' + host + ') but the password is wrong.');
        console.log('  >>> Reset it in Supabase and send the new one.\n');
        process.exit(2);
      }
      // "Tenant or user not found" / timeout -> wrong region, keep going.
      console.log(/tenant or user not found/i.test(r.msg) ? 'no' : `no (${r.msg.slice(0, 40)})`);
    }
  }
  console.log('\n  None of the common regions matched. Please send the exact');
  console.log('  Session pooler URI from Supabase (Connect → Session pooler).\n');
  process.exit(1);
})();
