# Business Owner Onboarding Test Guide

This guide helps you test the onboarding process for Bar Owners, Tour Operators, Distilleries, and Event Hosts.

## Quick Overview

When a business owner signs up, they go through:
1. **Registration** → Account created + Stripe auto-provisioned
2. **Dashboard Setup Checklist** → 4 steps to complete
3. **Stripe Onboarding** → Business info + Identity + Bank account
4. **Ready to receive bookings!**

---

## Testing Scenarios

### Scenario 1: Bar Owner Onboarding

#### Step 1: Registration (SuperAdmin creates the account)
1. Login as SuperAdmin
2. Go to Users → Invite User
3. Fill in:
   - Email: `barowner@test.com`
   - First Name: `John`
   - Last Name: `Smith`
   - Role: **Bar**
4. Submit

**Expected Result:**
- User created with password shown on screen
- Stripe account automatically created (check response: `stripe.accountProvisioned: true`)
- Email sent to bar owner

#### Step 2: Bar Owner First Login
1. Open incognito window
2. Go to `http://localhost:3001` (cms-admin)
3. Login with credentials from registration

**Expected Result:**
- Dashboard shows "Complete Your Setup" checklist
- Progress bar shows 0/4 completed
- 4 clickable steps:
  1. Complete Your Profile
  2. Upload Photos
  3. Add Your Menu
  4. Setup Payments (Stripe)

#### Step 3: Complete Profile
1. Click "Complete Your Profile" in checklist
2. OR click "My Listing" in sidebar
3. Fill in:
   - Business Name: `Melbourne Whisky Bar`
   - Description: `Premium whisky tasting experience`
   - Location: `123 Collins St, Melbourne`
   - Phone: `+61 3 1234 5678`
4. Save

**Expected Result:**
- Returns to dashboard
- Checklist shows 1/4 complete ✓
- Progress bar at 25%

#### Step 4: Upload Photos
1. Click "Upload Photos" in checklist
2. OR click "Media" in sidebar
3. Upload at least 3 photos:
   - Bar interior
   - Whisky selection
   - Tasting setup

**Expected Result:**
- Returns to dashboard
- Checklist shows 2/4 complete ✓
- Progress bar at 50%

#### Step 5: Add Menu Items
1. Click "Add Your Menu" in checklist
2. OR click "Menu" in sidebar
3. Add items:
   - Item 1: `Whisky Flight` - $45 - `Tasting of 3 premium whiskies`
   - Item 2: `Private Tasting` - $150 - `1-hour guided whisky experience`
4. Save each item

**Expected Result:**
- Returns to dashboard
- Checklist shows 3/4 complete ✓
- Progress bar at 75%

#### Step 6: Setup Stripe Payments
1. Click "Setup Payments (Stripe)" in checklist
2. OR click "Finance" in sidebar

**Expected Result:**
- Yellow alert: "Complete Stripe Onboarding"
- Stripe Onboarding stepper appears with 5 steps
- Auto-creates Stripe account if missing

##### Step 6a: Business Information
- Legal Business Name: `Melbourne Whisky Bar Pty Ltd`
- Business Type: `Company`
- Website: (optional)
- Click "Continue"

##### Step 6b: Representative Details
- First Name: `John`
- Last Name: `Smith`
- Email: `john@melbournewhisky.com`
- Phone: `+61 412 345 678`
- Click "Continue"

##### Step 6c: Bank Account
- Account Holder Name: `Melbourne Whisky Bar Pty Ltd`
- BSB: `062000` (Commonwealth Bank example)
- Account Number: `12345678`
- Click "Submit & Continue"

**Expected Result:**
- Form submitted to Stripe
- Step 4 shows: "Verification Status"
- Shows KYC Status: `IN_PROGRESS` or `PENDING_VERIFICATION`
- Shows required documents if any (ID, business registration)

##### Step 6d: Upload Documents (if required)
If Stripe requires documents:
- Click "Choose File" for each requirement
- Upload PDF or image
- Click "Upload"

##### Step 6e: Complete
Once Stripe verifies:
- Step 5 shows: "Account Activated!" 🎉
- KYC Status: `VERIFIED`
- Payouts Enabled: `Yes`

**Expected Result:**
- Returns to dashboard
- Checklist shows 4/4 complete ✓
- Progress bar at 100%
- Green success message: "You're All Set!"
- Buttons: "View Orders" and "Check Earnings"

---

### Scenario 2: Tour Operator Onboarding

Same flow as Bar Owner, but:
- **No Menu step** - Tours don't have menus
- **My Listing** is for tour company profile
- **Events** page to create/manage tours

Checklist shows:
1. Complete Your Profile ✓
2. Upload Photos ✓
3. Setup Payments (Stripe) ✓
(3 steps instead of 4)

---

### Scenario 3: Distillery Onboarding

Same as Bar Owner:
- Complete Profile
- Upload Photos
- Add Products (instead of Menu)
- Setup Stripe

---

### Scenario 4: Event Host Onboarding

Same as Tour Operator:
- Complete Profile
- Upload Photos
- Setup Stripe
(No menu/products step)

---

## Common User Questions & Answers

### Q: Where do I find my BSB and Account Number?
**A:**
- Check your bank statement
- Login to online banking
- Look at your bank card
- Call your bank

### Q: What if I don't have a website?
**A:** Website is optional. You can leave it blank.

### Q: Should I choose "Company" or "Individual"?
**A:**
- Choose **Company** if you have an ABN/ACN and registered business name
- Choose **Individual** if you operate under your own name as a sole trader

### Q: How long does Stripe verification take?
**A:** Usually 1-2 business days. You can check status in Finance → Stripe Onboarding.

### Q: Can I receive bookings before Stripe is verified?
**A:** Yes! Customers can book, but payouts will be held until verification completes.

### Q: What if Stripe asks for more documents?
**A:** Upload them in Step 4 (Verification Status). Common requests:
- Driver's license or passport
- Business registration certificate
- Proof of address

---

## Error Handling Test Cases

### Test: Missing Business Name
1. Go to Stripe Onboarding Step 1
2. Leave Legal Business Name empty
3. Try to click Continue

**Expected:** Button disabled, cannot proceed

### Test: Invalid BSB
1. Go to Stripe Onboarding Step 3
2. Enter BSB: `123` (only 3 digits)
3. Try to submit

**Expected:** Button disabled until 6 digits entered

### Test: Bank Account Too Short
1. Enter account number: `123` (only 3 digits)
2. Try to submit

**Expected:** Button disabled until at least 6 digits

### Test: Going Back
1. Complete Step 1 and Step 2
2. Click green checkmark on Step 1

**Expected:** Returns to Step 1, can edit and continue

---

## SuperAdmin Testing

### Verify Stripe Auto-Provisioning
1. Create new business owner
2. Check response includes:
   ```json
   {
     "stripe": {
       "accountProvisioned": true,
       "accountId": "acct_xxx",
       "error": null
     }
   }
   ```

### Check Payout Review
1. Go to Dashboard → Payout Review
2. See pending payout requests from business owners
3. Click Approve/Reject

### View All Transactions
1. Go to Finance (as SuperAdmin)
2. Add `?userId=123` to see specific user's transactions

---

## Summary Checklist for Client Testing

✅ Registration creates Stripe account automatically  
✅ Dashboard shows setup progress checklist  
✅ Checklist items are clickable and navigate correctly  
✅ Profile can be completed  
✅ Photos can be uploaded (3+ required)  
✅ Menu/Products can be added  
✅ Stripe onboarding has 3 clear steps  
✅ Form validation prevents submission with errors  
✅ Back navigation works between steps  
✅ Document upload works if required  
✅ Verification status updates automatically  
✅ Success message shows when complete  
✅ User can receive bookings after setup  
✅ SuperAdmin can approve payouts  

---

## Support Text (for Help Section)

**Need Help?**

1. **Can't find your bar/distillery?** - Make sure you were assigned the correct role (Bar, Distillery, Event Host, or Tour Operator)

2. **Stripe verification taking too long?** - Check if you've uploaded all required documents. Contact support if pending more than 3 days.

3. **Payouts not working?** - Ensure your bank account details are correct and Stripe verification is complete.

4. **Forgot password?** - Use the "Forgot Password" link on the login page.

5. **Can't upload photos?** - Make sure images are under 5MB and in JPG, PNG, or WebP format.
