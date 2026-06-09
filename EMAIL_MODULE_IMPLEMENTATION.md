# Email Module Implementation

## Overview
A complete email notification system has been implemented using Nodemailer to send transactional emails for all financial events in the Stripe payment system.

## Implementation Details

### 1. Email Service (`backend/src/email/email.service.ts`)
- **SMTP Configuration**: Configurable via environment variables
- **Email Templates**: HTML email templates for all notification types
- **Error Handling**: Graceful fallback if email service is not configured

### 2. Email Templates Implemented

#### Booking Confirmation (Customer)
- Sent when a booking payment is confirmed
- Includes: Order ID, event name, date, time, amount paid
- Beautiful HTML template with gradient header

#### Booking Received (Organizer)
- Sent to event/tour organizers when they receive a new booking
- Includes: Order ID, event name, customer name, amount
- Professional notification template

#### Refund Processed
- Sent to both customer and organizer when refund is processed
- Different messages for customer vs organizer
- Includes: Order ID, refund amount, status

#### Payout Notifications
- **Approved**: Sent when payout is approved by Super Admin
- **Rejected**: Sent when payout is rejected (includes reason)
- **Paid**: Sent when payout is successfully transferred
- **Failed**: Sent when payout processing fails
- Status-specific styling and messaging

#### KYC Incomplete Reminder
- Sent to organizers with incomplete Stripe onboarding
- Lists missing requirements
- Includes link to complete onboarding

### 3. Integration Points

#### Stripe Service Integration
- Email service injected into StripeService
- Emails sent automatically when:
  - Payment is confirmed (booking confirmation + booking received)
  - Payout is approved/rejected
  - Payout is paid/failed (via webhook)
  - Refund is processed
  - KYC reminder is triggered

#### Notification System
- All emails are tracked in the Notification entity
- `emailSent` flag updated when email is successfully sent
- Database notification created even if email fails

### 4. Environment Variables

Add to `backend/.env`:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@byfoods.com
```

### 5. Email Provider Setup

#### Gmail Setup
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password as `SMTP_PASSWORD`

#### Other SMTP Providers
- **SendGrid**: Use `smtp.sendgrid.net`, port 587
- **Mailgun**: Use `smtp.mailgun.org`, port 587
- **AWS SES**: Use appropriate SES SMTP endpoint
- **Custom SMTP**: Configure with your provider's settings

### 6. API Endpoints

#### Send KYC Reminder (Super Admin)
```
POST /stripe/kyc/remind
Body: { userId: number }
```

### 7. Email Flow

#### Booking Flow
1. Customer books event → Order created
2. Payment processed → Payment intent succeeded
3. Webhook triggers → `handlePaymentSuccess()`
4. Email sent to:
   - **Customer**: Booking confirmation
   - **Organizer**: Booking received notification

#### Payout Flow
1. Admin requests payout → Email notification to Super Admin (optional)
2. Super Admin approves → Email sent to admin (approved)
3. Stripe processes → Webhook `payout.paid` or `payout.failed`
4. Email sent to admin (paid/failed status)

#### Refund Flow
1. Admin requests refund
2. Super Admin approves → Refund processed
3. Emails sent to:
   - **Customer**: Refund confirmation
   - **Organizer**: Refund notification

### 8. Error Handling

- If SMTP is not configured, emails are skipped (logged as warning)
- Email failures don't block the main transaction flow
- Email status tracked in notification entity
- Failed emails can be retried manually

### 9. Testing

To test email functionality:

1. **Configure SMTP** in `.env`
2. **Test Booking Email**: Create a booking and process payment
3. **Test Payout Email**: Request and approve a payout
4. **Test Refund Email**: Request and process a refund
5. **Test KYC Reminder**: Call `/stripe/kyc/remind` endpoint

### 10. Email Template Customization

All email templates are in `email.service.ts` and can be customized:
- HTML/CSS styling
- Brand colors and logos
- Content and messaging
- Additional information fields

### 11. Future Enhancements

Potential improvements:
- Email queue system (Bull/BullMQ) for better reliability
- Email templates in separate files (Handlebars/EJS)
- Email analytics and tracking
- Unsubscribe functionality
- Batch email sending
- Email preferences per user

## Notes

- Emails are sent asynchronously and don't block the main flow
- Email service gracefully handles missing configuration
- All emails include plain text fallback
- Email templates are responsive and mobile-friendly
- Branding can be customized in template styles
