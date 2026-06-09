/* eslint-disable no-console */
const axios = require('axios');

const BASE_URL = process.env.CHECKLIST_BASE_URL || 'http://localhost:3001';
const OWNER_TOKEN = process.env.CHECKLIST_OWNER_TOKEN || '';
const PAYOUT_AMOUNT = Number(process.env.CHECKLIST_PAYOUT_AMOUNT || '1');

if (!OWNER_TOKEN) {
  console.error('Missing CHECKLIST_OWNER_TOKEN');
  console.error('Example: CHECKLIST_OWNER_TOKEN="<jwt>" npm run check:stripe:onboarding');
  process.exit(1);
}

const ownerClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${OWNER_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

const results = [];
function addResult(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}${detail ? `: ${detail}` : ''}`);
}

async function run() {
  try {
    let status;
    try {
      const res = await ownerClient.get('/stripe/connect/account-status');
      status = res.data;
      addResult('Read existing Stripe account status', true);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        addResult('Account status missing (expected pre-create)', true);
      } else {
        throw err;
      }
    }

    if (!status) {
      const createRes = await ownerClient.post('/stripe/connect/create-account', {});
      status = await ownerClient.get('/stripe/connect/account-status').then((r) => r.data);
      addResult('Create Stripe account', Boolean(createRes.data?.stripeAccountId || status?.stripeAccountId));
    }

    const payoutGateMsg = await ownerClient
      .post('/stripe/payouts/request', { amount: PAYOUT_AMOUNT })
      .then(() => 'unexpectedly_succeeded')
      .catch((err) => err.response?.data?.message || err.message);

    const payoutProperlyBlocked =
      payoutGateMsg !== 'unexpectedly_succeeded' &&
      /(KYC|verification|not ready|Stripe account)/i.test(String(payoutGateMsg));
    addResult('Payout gating before full verification', payoutProperlyBlocked, String(payoutGateMsg));

    const onboardingPayload = {
      business: {
        legalName: process.env.CHECKLIST_BUSINESS_NAME || 'Checklist Test Pty Ltd',
        businessType: process.env.CHECKLIST_BUSINESS_TYPE || 'company',
        website: process.env.CHECKLIST_WEBSITE || 'https://example.com',
      },
      representative: {
        firstName: process.env.CHECKLIST_REP_FIRST_NAME || 'Test',
        lastName: process.env.CHECKLIST_REP_LAST_NAME || 'Owner',
        email: process.env.CHECKLIST_REP_EMAIL || 'owner@example.com',
        phone: process.env.CHECKLIST_REP_PHONE || '+61400000000',
      },
      bank: {
        accountHolderName: process.env.CHECKLIST_BANK_HOLDER || 'Checklist Test Pty Ltd',
        bsb: process.env.CHECKLIST_BSB || '000000',
        accountNumber: process.env.CHECKLIST_ACCOUNT_NUMBER || '00012345',
      },
    };

    await ownerClient.post('/stripe/connect/custom-onboarding', onboardingPayload);
    addResult('Submit custom onboarding payload', true);

    const refreshed = await ownerClient.get('/stripe/connect/account-status').then((r) => r.data);
    const currentlyDue = refreshed?.verificationDetails?.currentlyDue || [];
    addResult(
      'Fetch refreshed requirements',
      Array.isArray(currentlyDue),
      `currently_due_count=${currentlyDue.length}`
    );

    const allPassed = results.every((r) => r.pass);
    console.log('\n--- Stripe onboarding checklist summary ---');
    console.table(results);
    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('Checklist execution failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

run();
