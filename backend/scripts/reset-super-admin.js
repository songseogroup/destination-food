#!/usr/bin/env node
/**
 * Reset (or create) the Destination Whisky super admin.
 *
 * WHY THIS EXISTS
 * src/database/seed.ts creates admin@byfoods.com with role `admin`, NOT
 * `super_admin` — so a fresh database has no super admin at all, and every
 * super-admin-only surface (the homepage builder, payout review, vendor
 * approval notifications) is unreachable. The seed also only inserts when the
 * email is absent, so editing it does nothing for a database that already has
 * that row. This script is the way to fix a live database.
 *
 * SAFETY
 *  - You supply the password. It is never hardcoded, defaulted or logged.
 *  - It refuses to run unless you explicitly confirm, and prints the target
 *    host first — this repo's .env points DATABASE_URL at production Supabase,
 *    so a careless run would hit prod.
 *  - It only touches the one user row. No schema changes, no other tables.
 *
 * USAGE (PowerShell)
 *   $env:SUPER_ADMIN_EMAIL="you@destinationwhisky.life"
 *   $env:SUPER_ADMIN_PASSWORD="<a strong password you choose>"
 *   $env:CONFIRM="yes"
 *   node scripts/reset-super-admin.js
 *
 * USAGE (bash)
 *   SUPER_ADMIN_EMAIL=you@destinationwhisky.life \
 *   SUPER_ADMIN_PASSWORD='<a strong password you choose>' \
 *   CONFIRM=yes node scripts/reset-super-admin.js
 *
 * Target a different database by setting DATABASE_URL for the run.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

function fail(msg) {
  console.error(`\n  ERROR: ${msg}\n`);
  process.exit(1);
}

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || '';
  const confirm = (process.env.CONFIRM || '').trim().toLowerCase();

  const url =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USERNAME || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${
      process.env.DB_HOST || 'localhost'
    }:${process.env.DB_PORT || 5432}/${process.env.DB_DATABASE || 'byfoods_cms'}`;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    fail('Set SUPER_ADMIN_EMAIL to a valid email address.');
  }

  // Show the target before doing anything. Credentials are stripped so this is
  // safe to paste into a ticket.
  const host = url.replace(/^[^@]*@/, '').split('/')[0];
  const isRemote = !/^(localhost|127\.0\.0\.1)/.test(host);

  /**
   * Password strength is enforced against the risk, not as a blanket rule.
   *
   * A weak password on a throwaway local database costs nothing. The same
   * password on the shared/production database guards Stripe payout approval,
   * commission rates and every customer's contact details — so it stays
   * blocked there regardless of how the script is invoked.
   */
  const MIN_LENGTH = isRemote ? 12 : 6;
  if (password.length < MIN_LENGTH) {
    fail(
      isRemote
        ? `This is a REMOTE database (${host}).\n` +
            '  SUPER_ADMIN_PASSWORD must be at least 12 characters there.\n' +
            '  If you meant to target your local database, run with DATABASE_URL= (empty)\n' +
            "  to fall back to DB_HOST/DB_PORT/DB_DATABASE from .env."
        : `Set SUPER_ADMIN_PASSWORD to at least ${MIN_LENGTH} characters.`,
    );
  }

  console.log('\n  Reset super admin');
  console.log('  ─────────────────────────────────────────────');
  console.log(`  Database : ${host}${isRemote ? '   <-- REMOTE / LIKELY PRODUCTION' : '   (local)'}`);
  console.log(`  Email    : ${email}`);
  console.log(`  Password : (${password.length} characters, not shown)`);
  console.log('  ─────────────────────────────────────────────');

  if (confirm !== 'yes') {
    console.log('\n  Nothing was changed. Re-run with CONFIRM=yes to apply.\n');
    process.exit(0);
  }

  const client = new Client({
    connectionString: url,
    ssl: isRemote ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  try {
    // 10 rounds matches what the rest of the codebase uses (auth.service.ts,
    // customers.service.ts, seed.ts). A different cost still verifies fine, but
    // keeping it consistent avoids surprises.
    const hash = await bcrypt.hash(password, 10);

    const existing = await client.query('SELECT id, role FROM "users" WHERE lower(email) = $1', [
      email,
    ]);

    if (existing.rowCount > 0) {
      const { id, role } = existing.rows[0];
      await client.query(
        `UPDATE "users"
            SET password = $1,
                role = 'super_admin',
                "isActive" = true,
                "approvalStatus" = 'approved',
                "passwordSetAt" = NOW(),
                "passwordResetTokenHash" = NULL,
                "passwordResetExpiresAt" = NULL,
                "inviteTokenHash" = NULL,
                "inviteTokenExpiresAt" = NULL,
                "updatedAt" = NOW()
          WHERE id = $2`,
        [hash, id],
      );
      console.log(`\n  Updated user #${id} (was role '${role}') -> super_admin, password reset.`);
    } else {
      const inserted = await client.query(
        `INSERT INTO "users"
           (email, password, "firstName", "lastName", role, "isActive", "approvalStatus",
            "passwordSetAt", "createdAt", "updatedAt")
         VALUES ($1, $2, 'Super', 'Admin', 'super_admin', true, 'approved', NOW(), NOW(), NOW())
         RETURNING id`,
        [email, hash],
      );
      console.log(`\n  Created super admin #${inserted.rows[0].id}.`);
    }

    const all = await client.query(
      `SELECT email, "isActive" FROM "users" WHERE role = 'super_admin' ORDER BY id`,
    );
    console.log('\n  Super admins now in this database:');
    all.rows.forEach((r) => console.log(`    - ${r.email}${r.isActive ? '' : '  (INACTIVE)'}`));
    console.log('\n  Done. Sign in at the CMS with the password you set.\n');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\n  Failed:', err.message, '\n');
  process.exit(1);
});
