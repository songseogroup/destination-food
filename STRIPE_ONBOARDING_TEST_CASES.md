# Stripe Onboarding — Admin Panel Test Cases

Scope: custom Stripe Connect onboarding inside `cms-admin` for business roles
(**Bar**, **Distillery**, **Tour Operator**, **Event Host**). Built from the
actual code paths:

- Stepper UI: [KYCOnboardingStepper.tsx](cms-admin/components/KYCOnboardingStepper.tsx)
- Owner checklist: [OwnerSetupChecklist.tsx](cms-admin/components/OwnerSetupChecklist.tsx)
- Finance entry point: [finance/page.tsx](cms-admin/app/dashboard/finance/page.tsx)
- Backend controller: [stripe.controller.ts](backend/src/stripe/stripe.controller.ts)
- Backend service: [stripe.service.ts](backend/src/stripe/stripe.service.ts)
- DTO validation: [stripe.dto.ts](backend/src/stripe/dto/stripe.dto.ts)
- Auto-provisioning on signup/invite: [auth.service.ts](backend/src/auth/auth.service.ts)
- Stripe entity / status enums: [stripe-account.entity.ts](backend/src/stripe/entities/stripe-account.entity.ts)

---

## 0. Test data & environment

| Item | Value |
|---|---|
| Backend | `http://localhost:3000` |
| CMS Admin | `http://localhost:3001` (or whatever `CMS_ADMIN_URL` resolves to) |
| Stripe mode | Test mode (`STRIPE_SECRET_KEY` must be a `sk_test_...` key) |
| Country | AU (hard-coded in `createConnectAccount`) |
| Default currency | AUD |
| Test BSB | `062000` (Commonwealth Bank, accepted by Stripe test mode) |
| Test account # | `12345678` (valid) / `000123456` (triggers verification needed) |
| Test ID file | any PDF ≤ 10 MB, mimetype `application/pdf` or image/* |

Pre-flight:
- `STRIPE_SECRET_KEY` set in `backend/.env`.
- `CMS_ADMIN_URL` or `FRONTEND_URL` set (required by `createConnectAccount` for refresh/return URLs).
- A `super_admin` account exists for invite-based flows.

---

## 1. Account provisioning (pre-onboarding)

Triggered automatically by:
- `POST /auth/register` — public business signup (`bar`, `distillery`, `tour_operator`, `event_host` only).
- `POST /auth/admin/invite` — SuperAdmin invites a business owner.
- `POST /auth/admin/register` — SuperAdmin direct-create.
- `POST /auth/register-business` — multi-step public business signup.
- `POST /stripe/connect/ensure-account` — idempotent, called by the stepper on mount.

### TC-1.1 — Auto-provision on public registration (happy path)
**Steps**
1. `POST /auth/register` with role=`bar`, valid email, password, names.

**Expected**
- 201, user persisted with `approvalStatus=pending`.
- `stripe_accounts` row created with `status=pending`, `kycStatus=not_started`, `stripeAccountId` starts with `acct_`.
- Backend log: `Stripe account created for user <id>: acct_...`.

### TC-1.2 — Auto-provision on SuperAdmin invite
**Steps**
1. Login as `super_admin` → `POST /auth/admin/invite` with role=`distillery`.

**Expected**
- User invited (`inviteTokenHash` set), `approvalStatus=pending`.
- `stripe_accounts` row created.
- Response `emailSent: true` (if SMTP configured) and an invite email arrives.

### TC-1.3 — Auto-provision skipped for non-vendor roles
**Steps**
1. SuperAdmin invites a user with role=`admin`.

**Expected**
- User created, **no** `stripe_accounts` row.
- `ensurePaymentAccountProvisioned` returns `{ success: true }` (early-return for non-vendor roles).

### TC-1.4 — `ensure-account` is idempotent
**Steps**
1. As an owner whose account was just provisioned, hit `POST /stripe/connect/ensure-account` twice.

**Expected**
- 1st call: `{ created: true, message: "Stripe account created successfully" }`.
- 2nd call: `{ created: false, message: "Stripe account already exists" }` — same `stripeAccountId`.
- Stepper UI’s mount-time `createAccountMutation.mutate()` does not produce a toast on the 2nd call.

### TC-1.5 — `ensure-account` rejected for non-eligible role
**Steps**
1. Login as `admin` (not `bar`/`distillery`/`tour_operator`/`event_host`).
2. `POST /stripe/connect/ensure-account`.

**Expected**
- 403 from `RolesGuard` (role not in `@Roles(...)` list).

### TC-1.6 — Stripe API down → registration still succeeds
**Steps**
1. Set an invalid `STRIPE_SECRET_KEY` and `POST /auth/register`.

**Expected**
- User row created, response payload still 201.
- Response includes `stripe.accountProvisioned: false`, `stripe.error: "<message>"`.
- Owner can later retry from the stepper (auto-creates on mount if missing).

---

## 2. Dashboard setup checklist (per role)

The checklist (`OwnerSetupChecklist.tsx`) currently calls `/bars/my-bar*` endpoints
for **every** owner role. **Known issue**: a Distillery/Event Host/Tour Operator
will see Stripe + Media + Menu queries fail because the endpoint is bar-specific
(the catch swallows it to `null`/`[]`, so the checklist shows steps as
incomplete even when the owner *has* completed them on their own entity).

### TC-2.1 — Bar owner sees 4-step checklist
**Pre**: Bar owner with no listing/media/menu, fresh Stripe account.

**Expected (UI)**
- “0 of 4 done”, progress bar 0%.
- 4 steps visible: Complete Your Profile / Upload Photos / Add Your Menu / Setup Payments (Stripe).
- All 4 cards are clickable; click navigates to expected route.

### TC-2.2 — Each completed step turns green
**Pre**: Bar owner.

**Steps**
1. Complete listing (`/dashboard/details`) → return to dashboard.
2. Upload 3+ media files → return.
3. Add ≥1 menu item → return.
4. Complete Stripe (TC-3 series).

**Expected**
- After each step: counter increments, progress bar animates, step card switches to green with checkmark.
- After step 4: success card replaces checklist (`"You're All Set! 🎉"`) with **View Orders** and **Check Earnings** buttons.

### TC-2.3 — Stripe step only marks complete when `kycStatus=verified` AND `payoutsEnabled=true`
Run combinations and confirm the green state requires **both**:

| `kycStatus` | `payoutsEnabled` | Step shows |
|---|---|---|
| `verified` | `true`  | ✅ green |
| `verified` | `false` | ⬜ incomplete |
| `pending_verification` | `true` | ⬜ incomplete |
| `in_progress` | `false` | ⬜ incomplete |

### TC-2.4 — Distillery checklist (known limitation)
**Pre**: Distillery owner.

**Expected** (current behavior): checklist queries `/bars/my-bar*` which returns
404/empty — checklist shows steps as incomplete. **Document as a defect** if
this isn't intended. Suggested fix: branch on `user.role` and query the
appropriate `/distilleries/my-distillery*` or `/events/my-event*` endpoints.

### TC-2.5 — Tour Operator / Event Host should not see Menu step
Tour/Event roles don’t serve menus. The dashboard menu link is already hidden
for them in `dashboard/page.tsx`. **Verify**: checklist also omits the menu
step for these roles (otherwise it’s a step they can never complete).

---

## 3. KYC stepper — Step 1: Business Info

Entry point: `/dashboard/finance` shows the yellow banner + stepper when
`accountStatus.kycStatus !== 'verified'`.

### TC-3.1 — Auto-create on first mount
**Pre**: Owner whose `stripe_accounts` row was deleted manually.

**Steps**
1. Navigate to Finance.

**Expected**
- Component fetches `/stripe/connect/account-status` → 404.
- `useEffect` auto-fires `ensure-account` mutation.
- Toast: `"Stripe account created successfully!"`.
- Stepper renders at Step 1.

### TC-3.2 — Step 1 required-field gate
**Steps**
1. Stepper Step 1, leave `Legal Business Name` empty.
2. Inspect the Continue button.

**Expected**
- Button disabled (opacity-50, `cursor-not-allowed`).
- Typing any non-empty value enables it.
- Business Type defaults to `Company / Business`.
- Website is optional — Continue stays enabled regardless.

### TC-3.3 — Pre-fill from saved state
**Pre**: Owner who already submitted Step 1 once.

**Expected**
- `useEffect` re-hydrates `form.business.*` from `accountStatus.businessInfo`.
- Going back to Step 1 shows the previously saved Legal Name, type, website.

### TC-3.4 — Business type toggle
**Steps**
1. Switch dropdown between `company` and `individual`.

**Expected (downstream behavior — verified at submission, TC-5.x)**
- `company`: Stripe receives `company.name`; bank account holder type is `company`.
- `individual`: Stripe receives `individual.{first_name,last_name,email,phone}`; bank account holder type is `individual`.

---

## 4. KYC stepper — Step 2: Representative

### TC-4.1 — All 4 fields required
**Steps**
1. Reach Step 2.
2. For each of `firstName`, `lastName`, `email`, `phone`, leave it empty and check the Continue button.

**Expected**
- Continue disabled whenever any of the four is empty.
- All four filled → enabled.

### TC-4.2 — Back navigation preserves Step 1 data
**Steps**
1. Fill Step 1, click Continue.
2. Step 2: click **← Back**.

**Expected**
- Step 1 reopens with previously entered values still present (state held in `form`).

### TC-4.3 — Step indicator click navigation
**Steps**
1. Complete Step 1, advance to Step 2.
2. Click the green Step 1 circle in the indicator strip.

**Expected**
- `setCurrentStep(1)` fires (allowed because status===`completed`).
- Upcoming steps remain locked (`cursor-not-allowed`).

### TC-4.4 — No email format validation on the client
**Steps**
1. Enter `not-an-email` in the email field.

**Expected (current behavior)**
- UI allows it; the backend DTO is `@IsString()` only.
- Failure surfaces only at Stripe API call (Step 3 submit) → toast “Failed to submit onboarding details: …”.

**Recommendation** (file as a defect): add `@IsEmail()` to `CustomOnboardingRepresentativeDto.email` and an HTML `type="email"` validity check.

---

## 5. KYC stepper — Step 3: Bank account & submission

This step calls `POST /stripe/connect/custom-onboarding`, which both updates the
Stripe account AND attaches an external bank account in a single request.

### TC-5.1 — BSB input sanitization
**Steps**
1. Type `062-000` into BSB.

**Expected**
- Letters and dashes stripped on each keystroke (`replace(/[^\d]/g, '')`).
- Truncated to 6 digits.
- Continue/Submit disabled until exactly 6 digits.

### TC-5.2 — Account number sanitization
**Steps**
1. Type `1234 5678 9012` into Account Number.

**Expected**
- Stripped to digits, truncated to 10.
- Submit disabled while length < 6.

### TC-5.3 — Submit happy path (company)
**Pre**: Business type = `company` in Step 1; valid data in Steps 1–3.

**Expected request body** to `/stripe/connect/custom-onboarding`:
```json
{
  "business": { "legalName": "...", "businessType": "company", "website": "..." },
  "representative": { "firstName": "...", "lastName": "...", "email": "...", "phone": "..." },
  "bank": { "accountHolderName": "...", "bsb": "062000", "accountNumber": "12345678" }
}
```
**Expected outcome**
- Service calls `stripe.accounts.update(...)` with `company.name`.
- Service calls `stripe.accounts.createExternalAccount(...)` with `routing_number: "062000"`, `account_number: "12345678"`.
- DB: `bankAccount.accountNumber` stored as `"****5678"` (last-4 only — verify in DB; never log full PAN).
- DB: `kycStatus = in_progress`.
- Toast: “Onboarding details submitted. Stripe verification is now processing.”
- `getAccountStatus` re-sync runs immediately and bumps `kycStatus` further if Stripe already cleared requirements.
- Stepper auto-advances to Step 4 (driven by new `kycStatus`).

### TC-5.4 — Submit happy path (individual)
**Pre**: Business type = `individual`.

**Expected**
- Stripe `accounts.update` receives `individual.{first_name,last_name,email,phone}`; **no** `company` payload.
- Bank `account_holder_type` is `individual`.

### TC-5.5 — Server-side BSB length guard
**Steps**
1. Use DevTools/curl to bypass the UI and POST `bsb: "12345"`.

**Expected**
- 400 with `"BSB must be exactly 6 digits"`.

### TC-5.6 — Server-side account-number length guard
**Steps**
1. POST `accountNumber: "12345"` (5 digits).

**Expected**
- 400 `"Account number must be 6 to 10 digits"`.

### TC-5.7 — Invalid BSB at Stripe (test mode)
**Steps**
1. Submit a syntactically valid but Stripe-rejected BSB, e.g. `999999`.

**Expected**
- Service catches the Stripe error and rethrows as 400 `"Failed to submit onboarding details: <stripe message>"`.
- Toast surfaces the message.
- DB **not** updated (the persistence happens after both Stripe calls succeed, inside the same `try` — confirm by inspecting the row).

### TC-5.8 — Duplicate submission (idempotency)
**Steps**
1. Submit Step 3 once successfully.
2. Go back to Step 3 and submit again (same values).

**Expected (current behavior)**
- A second `createExternalAccount` runs; Stripe may either replace or attach an additional bank account.
- **Risk**: Stripe can accumulate multiple bank accounts. Recommend wrapping in “update default external account if it exists, else create” logic. File as a defect if duplicate accounts appear in `accounts.retrieve(...).external_accounts.data`.

### TC-5.9 — Website is optional
**Steps**
1. Leave website blank, submit.

**Expected**
- Service sends `url: undefined`; Stripe accepts.

---

## 6. KYC stepper — Step 4: Verification status & document upload

### TC-6.1 — Polling refresh
**Pre**: Account in `pending_verification`.

**Expected**
- `useQuery` refetches `/stripe/connect/account-status` every 30 s.
- Each fetch hits backend which calls `stripe.accounts.retrieve` and re-derives `kycStatus`.
- Status badge updates without manual reload.

### TC-6.2 — `currentlyDue` list rendered
**Pre**: Stripe has flagged e.g. `individual.verification.document` as currently due.

**Expected**
- Yellow “Action Required” box lists the requirement (underscores → spaces).
- For any requirement whose string `includes('document')`, a file-picker row appears in the upload block.

### TC-6.3 — Upload happy path
**Steps**
1. Choose a 1 MB JPG for `individual.verification.document`.
2. Click Upload.

**Expected**
- `POST /stripe/connect/requirements/upload` multipart with `requirement` + `file`.
- Backend `stripe.files.create({ purpose: 'account_requirement', ... })`, then `accounts.update` with the deeply-nested field built from the requirement key.
- DB `verificationDetails.uploadedDocuments[<requirement>]` populated with `{fileId, uploadedAt, filename}`.
- Toast: “Document uploaded for individual.verification.document”.
- `accountStatus` refetched.

### TC-6.4 — Upload size & mime guards
| Input | Expected |
|---|---|
| 11 MB JPG | Multer rejects at gateway: 413 / “File too large” (limit is 10 MB) |
| `.exe` | `fileFilter` rejects: `"Only image or PDF files are allowed"` |
| 1 MB PDF (`application/pdf`) | accepted |
| `.gif` (`image/gif`) | accepted |
| Empty form (no file) | 400 `"No file uploaded"` |

### TC-6.5 — Unknown requirement key rejected
**Steps**
1. Manually POST `requirement: "not_a_real_field"` with a file.

**Expected**
- 400 `"Unsupported requirement key: not_a_real_field"`.

### TC-6.6 — Non-document requirement rejected
**Steps**
1. POST `requirement: "external_account"` (currentlyDue but not a document).

**Expected**
- 400 `"This requirement is not a document upload field. Please submit the data through custom onboarding form."`.

### TC-6.7 — Manual refresh button
**Steps**
1. With `hasPendingRequirements=true`, click **Refresh Verification Status**.

**Expected**
- `queryClient.invalidateQueries('stripe-account-status')` runs → immediate refetch.

---

## 7. KYC stepper — Step 5: Activation

### TC-7.1 — Step 5 only shown when fully enabled
**Trigger condition**: `kycStatus === 'verified'` AND `status === 'enabled'`.

**Expected**
- Green success card: “Account Activated!”
- Shows ACCOUNT STATUS / KYC / Payouts (Enabled).
- Yellow “Payouts Disabled” warning at the bottom of the page is **not** rendered (`isBlocked` is false).

### TC-7.2 — “Verified but not yet enabled” edge case
**Pre**: Stripe `currently_due` is empty but `payouts_enabled` still false (Stripe sometimes flips these out of order).

**Expected**
- `accountStatus.status` derived as `RESTRICTED` (because `details_submitted=true` but `payouts_enabled=false`).
- Stepper lands on Step 3 (the fallback branch in `useEffect`).
- “Payouts Disabled” yellow warning visible.
- Next polling tick should flip to `ENABLED` and bump to Step 5.

---

## 8. Refresh / return URLs

Currently the Connect account is created with `accountLinks.create({type: 'account_onboarding'})` pointing back to `/dashboard/stripe/onboarding/{complete,refresh}` — but the in-app custom onboarding flow doesn’t actually redirect to Stripe-hosted onboarding. Validate that:

### TC-8.1 — Complete page renders standalone
- Visit `/dashboard/stripe/onboarding/complete` directly → success card + “Go to Finance” link.

### TC-8.2 — Refresh page renders standalone
- Visit `/dashboard/stripe/onboarding/refresh` → amber alert + “Go to Finance” link.

### TC-8.3 — Confirm/decide: is the hosted onboarding link still needed?
If onboarding is purely custom, the `accountLinks.create` call wastes a Stripe API call per account and the `onboardingLink` column is dead. Either:
- Remove `accountLinks.create` from `createConnectAccount`, or
- Add a “Open Stripe hosted onboarding” fallback button on the stepper that uses `accountStatus.onboardingLink`.

---

## 9. Role gating & cross-tenant safety

### TC-9.1 — Owner cannot see another owner’s status
**Steps**
1. Login as Bar Owner A.
2. `GET /stripe/connect/account-status?userId=<Owner B's id>`.

**Expected**
- Query param `userId` is ignored unless requester is SuperAdmin (`req.user.role === SUPER_ADMIN`).
- Owner A still gets their own row.

### TC-9.2 — SuperAdmin can read any owner’s status
**Steps**
1. Login as `super_admin`.
2. `GET /stripe/connect/account-status?userId=<Owner B's id>`.

**Expected**
- Returns Owner B’s account row.

### TC-9.3 — Non-vendor roles 403
For each of {`super_admin` on `ensure-account`, `admin` on `custom-onboarding`, `admin` on `requirements/upload`}: expect 403.

### TC-9.4 — JWT missing → 401 across all `/stripe/connect/*`.

---

## 10. Payouts & post-activation

### TC-10.1 — Payout request blocked while not enabled
**Pre**: `status !== ENABLED`.

**Steps**
1. `POST /stripe/payouts/request` with amount=10.

**Expected** (verify against `stripe.service.ts requestPayout`)
- 400 or domain-specific message blocking the request.

### TC-10.2 — Payout request happy path
**Pre**: `status=ENABLED`, `availableBalance ≥ requested amount`.

**Expected**
- Payout row created with `status=PENDING`.
- Visible to SuperAdmin in `/dashboard/admin/payouts`.

### TC-10.3 — SuperAdmin approve
**Steps**
1. SuperAdmin: `POST /stripe/payouts/:id/approve`.

**Expected**
- Stripe `transfers`/`payouts` API call succeeds, Payout row → `APPROVED`/`PAID`.
- Owner `availableBalance` decremented.

### TC-10.4 — SuperAdmin reject with reason
**Steps**
1. `POST /stripe/payouts/:id/reject` with `rejectionReason: "AML check"`.

**Expected**
- Row → `REJECTED`, reason persisted, notification emitted (`stripe.service.ts` builds a `Notification`).

---

## 11. Resilience & telemetry

### TC-11.1 — Stripe SDK throws on `accounts.update`
**Steps**
1. Force-temp invalidate `STRIPE_SECRET_KEY` just before Step 3 submit.

**Expected**
- 400 with original Stripe message.
- Backend log line `Error submitting custom onboarding:` at `error` level with stack.
- No partial DB write (the field assignments live inside the same `try`, **after** both Stripe calls).

### TC-11.2 — Webhook idempotency (sanity)
**Pre**: `STRIPE_WEBHOOK_SECRET` configured.

**Steps**
1. Replay the same `payment_intent.succeeded` webhook twice via the Stripe CLI.

**Expected**
- `handlePaymentSuccess` short-circuits on the 2nd call (`status === COMPLETED` early return).
- User balance increments **once**.

### TC-11.3 — `getAccountStatus` survives Stripe down
**Steps**
1. Block outbound traffic to Stripe.

**Expected**
- Endpoint returns the cached DB row, logs `Error syncing Stripe account` but doesn’t 500.

---

## 12. Stepper state transition matrix

Use this matrix to confirm the `useEffect` that maps `kycStatus` → step. Run
each through the polling refresh (30 s) or by mutating the DB directly:

| `kycStatus` | `status` | `payoutsEnabled` | Stepper lands on |
|---|---|---|---|
| `not_started` | `pending` | false | Step 1 |
| `in_progress` | `pending`/`restricted` | false | Step 2 |
| `pending_verification` | `restricted` | false | Step 4 |
| `verified` | `enabled` | true | Step 5 |
| `verified` | `restricted` | false | Step 3 *(fallback branch — file as defect: should be Step 4)* |
| `rejected` | `disabled` | false | Step 3 *(fallback — UI has no rejected state; recommend a dedicated Step 4 “Rejected” surface with `disabledReason` from `verificationDetails`)* |

---

## 13. Acceptance summary (single sheet for client sign-off)

| ID | Outcome | Pass? |
|---|---|---|
| AC-1 | Owner registers → Stripe account auto-created | ☐ |
| AC-2 | Owner sees role-correct setup checklist | ☐ |
| AC-3 | Stepper auto-creates account on mount if missing | ☐ |
| AC-4 | Step 1–3 client-side validation matches server-side | ☐ |
| AC-5 | Company vs individual paths both succeed | ☐ |
| AC-6 | Bank submission stores last-4 only | ☐ |
| AC-7 | `pending_verification` shows currentlyDue + uploads | ☐ |
| AC-8 | Document upload accepts JPG/PNG/WebP/GIF/PDF ≤ 10 MB | ☐ |
| AC-9 | Step 5 “Activated” only when verified AND enabled | ☐ |
| AC-10 | Owners cannot access other owners’ data | ☐ |
| AC-11 | SuperAdmin sees / approves / rejects payouts | ☐ |
| AC-12 | Webhooks are idempotent | ☐ |
| AC-13 | Failures show actionable toasts, no 500s | ☐ |

---

## 14. Defects discovered while writing these cases (status)

| # | Defect | Status | Where |
|---|---|---|---|
| 1 | `OwnerSetupChecklist` hard-codes `/bars/my-bar*` — breaks for Distillery, Tour Operator, Event Host | **Fixed** | [OwnerSetupChecklist.tsx](cms-admin/components/OwnerSetupChecklist.tsx) — now role-aware; uses `/{entityType}` + filter by `userId` |
| 2 | Menu step shown to Tour/Event roles | **Fixed** | Same file — menu step only appended for `bars`/`distilleries` |
| 3 | No email validation on representative email | **Fixed** | [stripe.dto.ts](backend/src/stripe/dto/stripe.dto.ts) — `@IsEmail()`, `@IsIn(['company','individual'])`, BSB/phone/account regex guards, optional `@IsUrl()` |
| 4 | Repeat Step 3 submission attaches duplicate bank accounts | **Fixed** | [stripe.service.ts](backend/src/stripe/stripe.service.ts) `submitCustomOnboarding` — lists existing external accounts, deletes each, creates new with `default_for_currency: true` |
| 5 | `rejected` and `verified+restricted` fall to Step 3 with no UI | **Fixed** | [KYCOnboardingStepper.tsx](cms-admin/components/KYCOnboardingStepper.tsx) — explicit state map + red rejected card with `disabledReason`, orange restricted card, red KYC badge |
| 6 | `accountLinks.create` runs but custom in-app onboarding is the only flow | **Fixed** | [stripe.service.ts](backend/src/stripe/stripe.service.ts) `createConnectAccount` — removed hosted-link API call and the `CMS_ADMIN_URL` / `FRONTEND_URL` precondition that was only needed for it |
| 7 | `uploadRequirementDocument` doesn’t retain audit trail for replaced docs | **Mitigated** | [stripe.service.ts](backend/src/stripe/stripe.service.ts) — now appends previous `{fileId, uploadedAt, filename}` to `uploadedDocuments[req].history[]` (Stripe Files API has no delete, so we can’t truly free server-side storage) |

Re-run TC-2.4, TC-2.5, TC-4.4, TC-5.8, TC-6.3, TC-8.3, TC-12 to validate.
