import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationType } from '../stripe/entities/notification.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Strip surrounding quotes + all whitespace from secrets — Railway env vars sometimes
    // get pasted with spaces ("quwy dxmu ztrp ikot") or wrapping quotes, both of which
    // Gmail rejects as "Invalid login: 535-5.7.8". Cleaning here is defensive.
    const cleanSecret = (raw?: string) =>
      (raw || '').replace(/^["']|["']$/g, '').replace(/\s+/g, '');

    const emailConfig = {
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true', // true for 465, false for other ports
      auth: {
        user: (this.configService.get<string>('SMTP_USER') || '').replace(/^["']|["']$/g, '').trim(),
        pass: cleanSecret(this.configService.get<string>('SMTP_PASSWORD')),
      },
    };

    // Only create transporter if credentials are provided
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
    } else {
      this.logger.warn('Email service not configured. SMTP credentials missing.');
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Skipping email send.');
      return false;
    }

    const from = this.configService.get<string>('SMTP_FROM') ||
                 this.configService.get<string>('SMTP_USER') ||
                 'noreply@destinationwhisky.com';
    const brand = this.configService.get<string>('BRAND_NAME') || 'Destination Whisky';

    try {
      const info = await this.transporter.sendMail({
        from: `${brand} <${from}>`,
        to,
        subject,
        text: text || this.stripHtml(html),
        html,
      });

      this.logger.log(`Email sent successfully to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * "We got your booking" — sent the moment a customer creates an order,
   * before the owner has confirmed. Lets the customer know we have their
   * request and a ticket will follow once confirmed.
   */
  async sendBookingReceivedToCustomer(
    customerEmail: string,
    customerName: string,
    orderId: number,
    listingName: string,
    amount: number,
  ): Promise<boolean> {
    const subject = `We got your booking — ${listingName}`;
    const html = this.getBookingReceivedCustomerTemplate(customerName, orderId, listingName, amount);
    return this.sendEmail(customerEmail, subject, html);
  }

  /**
   * Ticket-style email — sent when the owner confirms a booking.
   * This is the email the customer shows at the door.
   */
  async sendBookingTicket(
    customerEmail: string,
    customerName: string,
    orderId: number,
    listingName: string,
    amount: number,
    bookingDate: string,
    bookingTime: string,
    guests: number,
  ): Promise<boolean> {
    const subject = `Your ticket — ${listingName}`;
    const html = this.getBookingTicketTemplate(
      customerName,
      orderId,
      listingName,
      amount,
      bookingDate,
      bookingTime,
      guests,
    );
    return this.sendEmail(customerEmail, subject, html);
  }

  /**
   * Send booking confirmation email to customer
   */
  async sendBookingConfirmation(
    customerEmail: string,
    customerName: string,
    orderId: number,
    eventName: string,
    amount: number,
    bookingDate: string,
    bookingTime: string,
  ): Promise<boolean> {
    const subject = `Booking Confirmed - ${eventName}`;
    const html = this.getBookingConfirmationTemplate(
      customerName,
      orderId,
      eventName,
      amount,
      bookingDate,
      bookingTime,
    );

    return this.sendEmail(customerEmail, subject, html);
  }

  /**
   * Send booking received notification to organizer
   */
  async sendBookingReceived(
    organizerEmail: string,
    organizerName: string,
    orderId: number,
    eventName: string,
    amount: number,
    customerName: string,
  ): Promise<boolean> {
    const subject = `New Booking Received - ${eventName}`;
    const html = this.getBookingReceivedTemplate(
      organizerName,
      orderId,
      eventName,
      amount,
      customerName,
    );

    return this.sendEmail(organizerEmail, subject, html);
  }

  /**
   * Send refund processed email
   */
  async sendRefundProcessed(
    email: string,
    name: string,
    orderId: number,
    amount: number,
    isCustomer: boolean = false,
  ): Promise<boolean> {
    const subject = isCustomer 
      ? `Refund Processed - Order #${orderId}`
      : `Refund Processed for Order #${orderId}`;
    
    const html = this.getRefundProcessedTemplate(
      name,
      orderId,
      amount,
      isCustomer,
    );

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send payout notification
   */
  async sendPayoutNotification(
    email: string,
    name: string,
    payoutId: number,
    amount: number,
    status: 'approved' | 'rejected' | 'paid' | 'failed',
    rejectionReason?: string,
  ): Promise<boolean> {
    const subject = `Payout ${status.charAt(0).toUpperCase() + status.slice(1)} - $${amount.toFixed(2)}`;
    const html = this.getPayoutNotificationTemplate(
      name,
      payoutId,
      amount,
      status,
      rejectionReason,
    );

    return this.sendEmail(email, subject, html);
  }

  /**
   * Password reset email — sends the raw token in a clickable link.
   * Caller is responsible for storing only the SHA-256 hash of the token.
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
    expiresInMinutes: number = 60,
  ): Promise<boolean> {
    const subject = 'Reset your Destination Whisky password';
    const html = this.getPasswordResetTemplate(name, resetUrl, expiresInMinutes);
    return this.sendEmail(to, subject, html);
  }

  /**
   * Welcome email for a brand-new customer or business owner.
   */
  async sendWelcomeEmail(
    to: string,
    name: string,
    audience: 'customer' | 'owner' = 'customer',
  ): Promise<boolean> {
    const subject =
      audience === 'owner'
        ? 'Welcome to Destination Whisky — your account is ready'
        : 'Welcome to Destination Whisky';
    const html = this.getWelcomeEmailTemplate(name, audience);
    return this.sendEmail(to, subject, html);
  }

  /**
   * Send KYC incomplete reminder
   */
  async sendKYCIncompleteReminder(
    email: string,
    name: string,
    missingRequirements: string[],
  ): Promise<boolean> {
    const subject = 'Action Required: Complete Your Stripe Onboarding';
    const html = this.getKYCIncompleteTemplate(name, missingRequirements);

    return this.sendEmail(email, subject, html);
  }

  /**
   * Email templates
   */
  private getBookingReceivedCustomerTemplate(
    name: string,
    orderId: number,
    listingName: string,
    amount: number,
  ): string {
    const safeAmount = Number.isFinite(Number(amount)) ? Number(amount).toFixed(2) : '0.00';
    return `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Booking received</title></head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#f4f4f5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
          <tr><td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;">
              <tr><td style="padding:32px;text-align:center;background:linear-gradient(135deg,#0a0a0a,#1a1a1a);border-bottom:2px solid #eab308;">
                <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">Destination <span style="color:#eab308;">Whisky</span></h1>
              </td></tr>
              <tr><td style="padding:32px;">
                <p style="margin:0 0 6px;font-size:20px;color:#fff;">Hi ${name},</p>
                <p style="margin:0 0 18px;font-size:15px;color:#a1a1aa;line-height:1.6;">
                  We've got your booking request for <strong style="color:#fff;">${listingName}</strong>. The venue is reviewing it right now — once they confirm, we'll send you your ticket.
                </p>
                <div style="background:#0a0a0a;border:1px solid #1f1f1f;border-radius:8px;padding:16px;margin:20px 0;">
                  <p style="margin:0;font-size:13px;color:#71717a;">BOOKING REFERENCE</p>
                  <p style="margin:4px 0 12px;font-size:22px;font-weight:700;color:#eab308;letter-spacing:2px;">#${orderId.toString().padStart(6, '0')}</p>
                  <p style="margin:0;font-size:13px;color:#71717a;">Amount</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:#fff;">$${safeAmount}</p>
                </div>
                <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
                  Confirmation usually arrives within a few hours. If you don't hear back within 24 hours, reply to this email and we'll chase the venue for you.
                </p>
              </td></tr>
              <tr><td style="padding:18px 32px;background:#0a0a0a;border-top:1px solid #1f1f1f;text-align:center;">
                <p style="margin:0;font-size:12px;color:#52525b;">Booking ref #${orderId.toString().padStart(6, '0')} · Keep this email for your records</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body></html>
    `;
  }

  private getBookingTicketTemplate(
    name: string,
    orderId: number,
    listingName: string,
    amount: number,
    bookingDate: string,
    bookingTime: string,
    guests: number,
  ): string {
    const safeAmount = Number.isFinite(Number(amount)) ? Number(amount).toFixed(2) : '0.00';
    const ref = `#${orderId.toString().padStart(6, '0')}`;
    let dateStr = bookingDate;
    try {
      if (bookingDate) {
        dateStr = new Date(bookingDate).toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    } catch {
      // keep raw
    }
    return `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Your ticket</title></head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#f4f4f5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
          <tr><td align="center">
            <!-- Ticket card -->
            <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border:1px solid #2a2a2a;border-radius:18px;overflow:hidden;box-shadow:0 24px 48px rgba(234,179,8,0.08);">
              <!-- Top stripe -->
              <tr><td style="height:8px;background:linear-gradient(90deg,#eab308,#facc15,#eab308);"></td></tr>
              <!-- Header -->
              <tr><td style="padding:28px 32px 18px;text-align:center;">
                <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:3px;color:#eab308;text-transform:uppercase;">Booking confirmed</p>
                <h1 style="margin:8px 0 0;font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.5px;">
                  Destination <span style="color:#eab308;">Whisky</span>
                </h1>
              </td></tr>
              <!-- Greeting -->
              <tr><td style="padding:0 32px 12px;">
                <p style="margin:0;font-size:16px;color:#fff;">Hi ${name},</p>
                <p style="margin:6px 0 0;font-size:14px;color:#a1a1aa;line-height:1.5;">
                  Your booking is confirmed. Show this ticket at the venue.
                </p>
              </td></tr>
              <!-- Ticket body -->
              <tr><td style="padding:18px 32px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #2a2a2a;border-radius:12px;">
                  <tr><td style="padding:24px;text-align:center;border-bottom:1px dashed #2a2a2a;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:2px;color:#71717a;text-transform:uppercase;">${listingName}</p>
                    <p style="margin:0;font-size:32px;font-weight:800;color:#eab308;letter-spacing:4px;">${ref}</p>
                  </td></tr>
                  <tr><td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 8px 6px 0;vertical-align:top;width:50%;">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#71717a;text-transform:uppercase;">Date</p>
                          <p style="margin:4px 0 0;font-size:15px;color:#fff;font-weight:500;">${dateStr || '—'}</p>
                        </td>
                        <td style="padding:6px 0 6px 8px;vertical-align:top;width:50%;">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#71717a;text-transform:uppercase;">Time</p>
                          <p style="margin:4px 0 0;font-size:15px;color:#fff;font-weight:500;">${bookingTime || '—'}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 8px 6px 0;vertical-align:top;width:50%;">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#71717a;text-transform:uppercase;">Guests</p>
                          <p style="margin:4px 0 0;font-size:15px;color:#fff;font-weight:500;">${guests}</p>
                        </td>
                        <td style="padding:14px 0 6px 8px;vertical-align:top;width:50%;">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#71717a;text-transform:uppercase;">Total paid</p>
                          <p style="margin:4px 0 0;font-size:15px;color:#fff;font-weight:500;">$${safeAmount}</p>
                        </td>
                      </tr>
                    </table>
                  </td></tr>
                </table>
              </td></tr>
              <!-- Footer note -->
              <tr><td style="padding:18px 32px 24px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#52525b;line-height:1.5;">
                  Bring this ticket on your phone or printed. Please arrive 10 minutes early.<br/>
                  Reference: ${ref} · Need to cancel? Reply to this email.
                </p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body></html>
    `;
  }

  private getPasswordResetTemplate(name: string, resetUrl: string, expiresInMinutes: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Reset your Destination Whisky password</title>
      </head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#f4f4f5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
          <tr><td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:40px 32px;text-align:center;background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);border-bottom:2px solid #eab308;">
                  <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                    Destination <span style="color:#eab308;">Whisky</span>
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 12px;font-size:20px;color:#ffffff;">Hi ${name},</p>
                  <p style="margin:0 0 20px;font-size:15px;color:#a1a1aa;line-height:1.6;">
                    We received a request to reset the password on your Destination Whisky account.
                    Click the button below to choose a new one. The link expires in <strong style="color:#eab308;">${expiresInMinutes} minutes</strong>.
                  </p>

                  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:24px auto;">
                    <tr>
                      <td style="background:#eab308;border-radius:8px;">
                        <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;color:#000000;font-weight:600;font-size:15px;text-decoration:none;">
                          Reset password
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:24px 0 0;font-size:13px;color:#71717a;line-height:1.6;">
                    Trouble with the button? Paste this link into your browser:<br/>
                    <a href="${resetUrl}" style="color:#eab308;word-break:break-all;">${resetUrl}</a>
                  </p>

                  <p style="margin:24px 0 0;font-size:13px;color:#71717a;line-height:1.6;">
                    If you didn't request this, you can safely ignore this email — your password won't change unless you click the link above and choose a new one.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px;background:#0a0a0a;border-top:1px solid #1f1f1f;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#52525b;">
                    For your security, this link can only be used once and expires in ${expiresInMinutes} minutes.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(name: string, audience: 'customer' | 'owner'): string {
    const ctaUrl =
      audience === 'owner'
        ? this.configService.get<string>('CMS_ADMIN_URL') || 'https://destinationwhisky.com'
        : this.configService.get<string>('FRONTEND_URL') || 'https://destinationwhisky.com';
    const ctaLabel = audience === 'owner' ? 'Go to your dashboard' : 'Start exploring';
    const intro =
      audience === 'owner'
        ? 'Your business owner account is ready. Head to your dashboard to set up your listing, upload photos, and connect Stripe so you can start accepting bookings.'
        : 'Your account is ready. Browse premium whisky bars, distillery tours, tastings, and exclusive events — all in one place.';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Welcome to Destination Whisky</title>
      </head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#f4f4f5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
          <tr><td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:40px 32px;text-align:center;background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);border-bottom:2px solid #eab308;">
                  <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                    Destination <span style="color:#eab308;">Whisky</span>
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 12px;font-size:20px;color:#ffffff;">Welcome, ${name} 👋</p>
                  <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">${intro}</p>

                  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:24px auto;">
                    <tr>
                      <td style="background:#eab308;border-radius:8px;">
                        <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;color:#000000;font-weight:600;font-size:15px;text-decoration:none;">
                          ${ctaLabel}
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:24px 0 0;font-size:13px;color:#71717a;line-height:1.6;">
                    Trouble with the button? Paste this link into your browser:<br/>
                    <a href="${ctaUrl}" style="color:#eab308;word-break:break-all;">${ctaUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px;background:#0a0a0a;border-top:1px solid #1f1f1f;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#52525b;">
                    You're receiving this because you signed up at Destination Whisky.<br/>
                    If this wasn't you, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;
  }

  private getBookingConfirmationTemplate(
    customerName: string,
    orderId: number,
    eventName: string,
    amount: number,
    bookingDate: string,
    bookingTime: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .amount { font-size: 24px; font-weight: bold; color: #667eea; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your booking has been confirmed. We're excited to have you join us!</p>
            
            <div class="info-box">
              <h3>Booking Details</h3>
              <p><strong>Order ID:</strong> #${orderId}</p>
              <p><strong>Event:</strong> ${eventName}</p>
              <p><strong>Date:</strong> ${new Date(bookingDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${bookingTime}</p>
              <p><strong>Amount Paid:</strong> <span class="amount">$${amount.toFixed(2)}</span></p>
            </div>

            <p>You will receive a reminder email closer to the event date.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>The ByFoods Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getBookingReceivedTemplate(
    organizerName: string,
    orderId: number,
    eventName: string,
    amount: number,
    customerName: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
          .amount { font-size: 24px; font-weight: bold; color: #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Booking Received!</h1>
          </div>
          <div class="content">
            <p>Hi ${organizerName},</p>
            <p>You have received a new booking for your event.</p>
            
            <div class="info-box">
              <h3>Booking Details</h3>
              <p><strong>Order ID:</strong> #${orderId}</p>
              <p><strong>Event:</strong> ${eventName}</p>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Amount:</strong> <span class="amount">$${amount.toFixed(2)}</span></p>
            </div>

            <p>You can view and manage this booking in your dashboard.</p>
            
            <p>Best regards,<br>The ByFoods Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getRefundProcessedTemplate(
    name: string,
    orderId: number,
    amount: number,
    isCustomer: boolean,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
          .amount { font-size: 24px; font-weight: bold; color: #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Refund Processed</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>A refund has been processed ${isCustomer ? 'for your order' : 'for order'}.</p>
            
            <div class="info-box">
              <h3>Refund Details</h3>
              <p><strong>Order ID:</strong> #${orderId}</p>
              <p><strong>Refund Amount:</strong> <span class="amount">$${amount.toFixed(2)}</span></p>
              <p><strong>Status:</strong> Completed</p>
            </div>

            ${isCustomer 
              ? '<p>The refund will be processed to your original payment method within 5-10 business days.</p>'
              : '<p>The refund has been processed and the customer will receive the amount in their original payment method.</p>'
            }
            
            <p>Best regards,<br>The ByFoods Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPayoutNotificationTemplate(
    name: string,
    payoutId: number,
    amount: number,
    status: string,
    rejectionReason?: string,
  ): string {
    const statusColors: Record<string, string> = {
      approved: '#10b981',
      paid: '#10b981',
      rejected: '#ef4444',
      failed: '#ef4444',
    };

    const statusMessages: Record<string, string> = {
      approved: 'Your payout request has been approved and is being processed.',
      paid: 'Your payout has been successfully processed and transferred to your account.',
      rejected: 'Your payout request has been rejected.',
      failed: 'Your payout processing failed. Please contact support.',
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${statusColors[status] || '#667eea'} 0%, ${statusColors[status] || '#764ba2'} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid ${statusColors[status] || '#667eea'}; }
          .amount { font-size: 24px; font-weight: bold; color: ${statusColors[status] || '#667eea'}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payout ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>${statusMessages[status]}</p>
            
            <div class="info-box">
              <h3>Payout Details</h3>
              <p><strong>Payout ID:</strong> #${payoutId}</p>
              <p><strong>Amount:</strong> <span class="amount">$${amount.toFixed(2)}</span></p>
              <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
              ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
            </div>

            ${status === 'rejected' && rejectionReason 
              ? '<p>If you have any questions about this decision, please contact our support team.</p>'
              : ''
            }
            
            <p>Best regards,<br>The ByFoods Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getKYCIncompleteTemplate(
    name: string,
    missingRequirements: string[],
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
          .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          ul { list-style-type: disc; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Action Required: Complete Your Onboarding</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>To start receiving payouts, you need to complete your Stripe onboarding process.</p>
            
            <div class="info-box">
              <h3>Missing Requirements</h3>
              <ul>
                ${missingRequirements.map(req => `<li>${req.replace(/_/g, ' ')}</li>`).join('')}
              </ul>
            </div>

            <p>Please complete these requirements in your dashboard to enable payouts.</p>
            <a href="${this.configService.get('FRONTEND_URL')}/dashboard/finance" class="button">Complete Onboarding</a>
            
            <p>Best regards,<br>The ByFoods Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }
}
