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
  /**
   * The site's palette, from project/lib/design-tokens.js — keep in sync.
   *
   * The emails had drifted into three different looks: a purple gradient left
   * over from the original template, a green one, and a dark near-black theme
   * with a lemon accent. None of them were the site's warm cream + bronze gold.
   */
  private static readonly C = {
    gold: '#B8862F',
    goldDeep: '#7B5620',
    cream: '#FAF7F2',
    white: '#FFFFFF',
    border: '#EDE7DF',
    ink: '#1A1614',
    muted: '#585046',
    faint: '#A99E8F',
    chrome: '#14110F',
    success: '#3F7D58',
    danger: '#B4453A',
    warning: '#C08A2E',
  };

  /**
   * Serif for headings, sans for everything else — standing in for the site's
   * Playfair Display and Inter. Web fonts can't be relied on in email (Outlook
   * ignores @font-face entirely), so these are the closest ubiquitous stacks.
   */
  private static readonly SERIF = "Georgia,'Times New Roman',serif";
  private static readonly SANS =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  /** AUD. The site prices in A$; the emails said "$", which reads as USD. */
  private money(amount: number | string): string {
    const n = Number(amount);
    return `A$${Number.isFinite(n) ? n.toFixed(2) : '0.00'}`;
  }

  private ref(orderId: number): string {
    return `#${orderId.toString().padStart(6, '0')}`;
  }

  /** Where owners actually manage their business — the CMS, not the storefront. */
  private adminUrl(path = ''): string {
    const base = (this.configService.get<string>('CMS_ADMIN_URL') || 'http://localhost:3002').replace(
      /\/+$/,
      '',
    );
    return `${base}${path}`;
  }

  private siteUrl(path = ''): string {
    const base = (this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000').replace(
      /\/+$/,
      '',
    );
    return `${base}${path}`;
  }

  /**
   * The chrome every email shares: cream page, white card, gold rule, dark
   * footer — the storefront's card language, rebuilt for mail clients.
   *
   * Tables and inline styles throughout: Outlook renders through Word and drops
   * most of what a <style> block would carry, so nothing here relies on one.
   */
  private shell(opts: {
    title: string;
    /** The grey line clients preview next to the subject. */
    preheader?: string;
    eyebrow?: string;
    heading: string;
    /** Raw HTML for the message body. */
    body: string;
    cta?: { label: string; href: string };
    footNote?: string;
  }): string {
    const C = EmailService.C;
    const brand = this.configService.get<string>('BRAND_NAME') || 'Destination Whisky';
    const year = new Date().getFullYear();

    const ctaBlock = opts.cta
      ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
        <tr>
          <td style="background:${C.gold};border-radius:999px;">
            <a href="${opts.cta.href}" style="display:inline-block;padding:14px 32px;color:${C.white};font-family:${EmailService.SANS};font-weight:600;font-size:15px;text-decoration:none;border-radius:999px;">${opts.cta.label}</a>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-family:${EmailService.SANS};font-size:12px;color:${C.faint};line-height:1.6;">
        Button not working? Paste this into your browser:<br/>
        <a href="${opts.cta.href}" style="color:${C.goldDeep};word-break:break-all;">${opts.cta.href}</a>
      </p>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:${C.cream};">
  ${
    opts.preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>`
      : ''
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};padding:32px 16px;">
    <tr><td align="center">

      <!-- Wordmark -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td align="center" style="padding-bottom:20px;">
          <p style="margin:0;font-family:${EmailService.SERIF};font-size:20px;letter-spacing:4px;color:${C.ink};text-transform:uppercase;">Destination</p>
          <p style="margin:2px 0 0;font-family:${EmailService.SANS};font-size:10px;font-weight:600;letter-spacing:6px;color:${C.gold};text-transform:uppercase;">Whisky</p>
        </td></tr>
      </table>

      <!-- Card -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.white};border:1px solid ${C.border};border-radius:20px;overflow:hidden;">
        <tr><td style="height:4px;background:${C.gold};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:36px 36px 32px;">
          ${
            opts.eyebrow
              ? `<p style="margin:0 0 10px;font-family:${EmailService.SANS};font-size:11px;font-weight:600;letter-spacing:2px;color:${C.gold};text-transform:uppercase;">${opts.eyebrow}</p>`
              : ''
          }
          <h1 style="margin:0 0 18px;font-family:${EmailService.SERIF};font-size:27px;font-weight:400;color:${C.ink};line-height:1.25;">${opts.heading}</h1>
          <div style="font-family:${EmailService.SANS};font-size:15px;color:${C.muted};line-height:1.65;">
            ${opts.body}
          </div>
          ${ctaBlock}
        </td></tr>
      </table>

      <!-- Footer -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td align="center" style="padding:24px 16px 8px;">
          ${
            opts.footNote
              ? `<p style="margin:0 0 12px;font-family:${EmailService.SANS};font-size:12px;color:${C.faint};line-height:1.6;">${opts.footNote}</p>`
              : ''
          }
          <p style="margin:0;font-family:${EmailService.SANS};font-size:12px;color:${C.faint};line-height:1.6;">
            &copy; ${year} ${brand}. Sydney, Australia.
          </p>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
  }

  /** A bordered panel of label/value rows — the "details" block every email needs. */
  private detailPanel(rows: Array<[string, string]>, accent?: string): string {
    const C = EmailService.C;
    const body = rows
      .map(
        ([label, value]) => `
        <tr>
          <td style="padding:8px 0;font-family:${EmailService.SANS};font-size:13px;color:${C.faint};white-space:nowrap;">${label}</td>
          <td style="padding:8px 0;font-family:${EmailService.SANS};font-size:14px;color:${C.ink};font-weight:600;text-align:right;">${value}</td>
        </tr>`,
      )
      .join('');
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:${C.cream};border:1px solid ${C.border};border-left:3px solid ${accent || C.gold};border-radius:12px;">
        <tr><td style="padding:6px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table>
        </td></tr>
      </table>`;
  }

  private getBookingReceivedCustomerTemplate(
    name: string,
    orderId: number,
    listingName: string,
    amount: number,
  ): string {
    return this.shell({
      title: 'Booking received',
      preheader: `We've got your request for ${listingName} — awaiting confirmation.`,
      eyebrow: 'Booking received',
      heading: `Hi ${name}, we've got your booking`,
      body: `
        <p style="margin:0 0 4px;">
          Your request for <strong style="color:${EmailService.C.ink};">${listingName}</strong> is with the venue now.
          As soon as they confirm, we'll email your ticket.
        </p>
        ${this.detailPanel([
          ['Booking reference', this.ref(orderId)],
          ['Amount', this.money(amount)],
          ['Status', 'Awaiting confirmation'],
        ])}
        <p style="margin:0;">
          Confirmation usually arrives within a few hours. If you haven't heard back in 24 hours,
          reply to this email and we'll chase it up for you.
        </p>`,
      footNote: `Booking ${this.ref(orderId)} · Keep this email for your records.`,
    });
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
    const C = EmailService.C;
    let dateStr = bookingDate;
    try {
      if (bookingDate) {
        dateStr = new Date(bookingDate).toLocaleDateString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    } catch {
      // keep raw
    }

    return this.shell({
      title: 'Your ticket',
      preheader: `Confirmed — ${listingName}. Reference ${this.ref(orderId)}.`,
      eyebrow: 'Booking confirmed',
      heading: `You're going to ${listingName}`,
      body: `
        <p style="margin:0 0 4px;">Hi ${name}, your booking is confirmed. Show this at the door.</p>

        <!-- Ticket -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;background:${C.cream};border:1px solid ${C.border};border-radius:16px;">
          <tr><td style="padding:24px;text-align:center;border-bottom:1px dashed ${C.border};">
            <p style="margin:0 0 6px;font-family:${EmailService.SANS};font-size:11px;font-weight:600;letter-spacing:2px;color:${C.faint};text-transform:uppercase;">${listingName}</p>
            <p style="margin:0;font-family:${EmailService.SERIF};font-size:32px;color:${C.gold};letter-spacing:3px;">${this.ref(orderId)}</p>
          </td></tr>
          <tr><td style="padding:20px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 8px 6px 0;vertical-align:top;width:50%;">
                  <p style="margin:0;font-family:${EmailService.SANS};font-size:11px;font-weight:600;letter-spacing:1.5px;color:${C.faint};text-transform:uppercase;">Date</p>
                  <p style="margin:4px 0 0;font-family:${EmailService.SANS};font-size:15px;color:${C.ink};font-weight:600;">${dateStr || '—'}</p>
                </td>
                <td style="padding:6px 0 6px 8px;vertical-align:top;width:50%;">
                  <p style="margin:0;font-family:${EmailService.SANS};font-size:11px;font-weight:600;letter-spacing:1.5px;color:${C.faint};text-transform:uppercase;">Time</p>
                  <p style="margin:4px 0 0;font-family:${EmailService.SANS};font-size:15px;color:${C.ink};font-weight:600;">${bookingTime || '—'}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 8px 6px 0;vertical-align:top;">
                  <p style="margin:0;font-family:${EmailService.SANS};font-size:11px;font-weight:600;letter-spacing:1.5px;color:${C.faint};text-transform:uppercase;">Guests</p>
                  <p style="margin:4px 0 0;font-family:${EmailService.SANS};font-size:15px;color:${C.ink};font-weight:600;">${guests}</p>
                </td>
                <td style="padding:14px 0 6px 8px;vertical-align:top;">
                  <p style="margin:0;font-family:${EmailService.SANS};font-size:11px;font-weight:600;letter-spacing:1.5px;color:${C.faint};text-transform:uppercase;">Total paid</p>
                  <p style="margin:4px 0 0;font-family:${EmailService.SANS};font-size:15px;color:${C.ink};font-weight:600;">${this.money(amount)}</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>`,
      footNote: `Bring this on your phone or printed, and arrive 10 minutes early.<br/>Reference ${this.ref(orderId)} · Need to cancel? Reply to this email.`,
    });
  }

  private getPasswordResetTemplate(name: string, resetUrl: string, expiresInMinutes: number): string {
    return this.shell({
      title: 'Reset your password',
      preheader: `Your reset link expires in ${expiresInMinutes} minutes.`,
      eyebrow: 'Password reset',
      heading: `Hi ${name}, let's get you back in`,
      body: `
        <p style="margin:0;">
          We received a request to reset your password. Choose a new one with the button below —
          the link expires in <strong style="color:${EmailService.C.ink};">${expiresInMinutes} minutes</strong>.
        </p>
        <p style="margin:14px 0 0;">
          If you didn't ask for this, ignore this email. Your password won't change unless you use the link.
        </p>`,
      cta: { label: 'Reset password', href: resetUrl },
      footNote: `For your security this link works once, and expires in ${expiresInMinutes} minutes.`,
    });
  }

  private getWelcomeEmailTemplate(name: string, audience: 'customer' | 'owner'): string {
    const isOwner = audience === 'owner';
    return this.shell({
      title: 'Welcome to Destination Whisky',
      preheader: isOwner
        ? 'Your owner account is ready — set up your listing.'
        : 'Your account is ready — start exploring.',
      eyebrow: 'Welcome',
      heading: `Welcome, ${name}`,
      body: `<p style="margin:0;">${
        isOwner
          ? 'Your business account is ready. Head to your dashboard to set up your listing, upload photos, and connect Stripe so you can start taking bookings.'
          : 'Your account is ready. Browse whisky bars, distillery tours, tastings and events — all in one place.'
      }</p>`,
      cta: isOwner
        ? { label: 'Go to your dashboard', href: this.adminUrl('/dashboard') }
        : { label: 'Start exploring', href: this.siteUrl('/') },
      footNote: `You're receiving this because you signed up at Destination Whisky.<br/>If this wasn't you, you can safely ignore this email.`,
    });
  }

  private getBookingConfirmationTemplate(
    customerName: string,
    orderId: number,
    eventName: string,
    amount: number,
    bookingDate: string,
    bookingTime: string,
  ): string {
    let dateStr = bookingDate;
    try {
      if (bookingDate) dateStr = new Date(bookingDate).toLocaleDateString('en-AU');
    } catch {
      // keep raw
    }
    return this.shell({
      title: 'Booking confirmed',
      preheader: `${eventName} is confirmed.`,
      eyebrow: 'Booking confirmed',
      heading: `Hi ${customerName}, you're confirmed`,
      body: `
        <p style="margin:0 0 4px;">Your booking is confirmed — we're glad to have you.</p>
        ${this.detailPanel(
          [
            ['Booking reference', this.ref(orderId)],
            ['Experience', eventName],
            ['Date', dateStr || '—'],
            ['Time', bookingTime || '—'],
            ['Amount paid', this.money(amount)],
          ],
          EmailService.C.success,
        )}
        <p style="margin:0;">We'll send a reminder closer to the date. Any questions, just reply to this email.</p>`,
      cta: { label: 'View your booking', href: this.siteUrl(`/orders/${orderId}`) },
      footNote: `Booking ${this.ref(orderId)}`,
    });
  }

  private getBookingReceivedTemplate(
    organizerName: string,
    orderId: number,
    eventName: string,
    amount: number,
    customerName: string,
  ): string {
    return this.shell({
      title: 'New booking received',
      preheader: `${customerName} booked ${eventName}.`,
      eyebrow: 'New booking',
      heading: `Hi ${organizerName}, you have a new booking`,
      body: `
        <p style="margin:0 0 4px;">A customer has just booked one of your experiences.</p>
        ${this.detailPanel(
          [
            ['Booking reference', this.ref(orderId)],
            ['Experience', eventName],
            ['Customer', customerName],
            ['Amount', this.money(amount)],
          ],
          EmailService.C.success,
        )}
        <p style="margin:0;">Confirm or decline it from your dashboard.</p>`,
      cta: { label: 'Open in dashboard', href: this.adminUrl(`/dashboard/orders/${orderId}`) },
    });
  }

  private getRefundProcessedTemplate(
    name: string,
    orderId: number,
    amount: number,
    isCustomer: boolean,
  ): string {
    return this.shell({
      title: 'Refund processed',
      preheader: `${this.money(amount)} refunded on booking ${this.ref(orderId)}.`,
      eyebrow: 'Refund processed',
      heading: `Hi ${name}, a refund has gone through`,
      body: `
        ${this.detailPanel(
          [
            ['Booking reference', this.ref(orderId)],
            ['Refund amount', this.money(amount)],
            ['Status', 'Completed'],
          ],
          EmailService.C.warning,
        )}
        <p style="margin:0;">${
          isCustomer
            ? 'It will appear on your original payment method within 5–10 business days, depending on your bank.'
            : "The customer will receive the amount on their original payment method within 5–10 business days."
        }</p>`,
      cta: isCustomer
        ? { label: 'View your booking', href: this.siteUrl(`/orders/${orderId}`) }
        : { label: 'Open in dashboard', href: this.adminUrl(`/dashboard/orders/${orderId}`) },
    });
  }

  private getPayoutNotificationTemplate(
    name: string,
    payoutId: number,
    amount: number,
    status: string,
    rejectionReason?: string,
  ): string {
    const C = EmailService.C;
    const accents: Record<string, string> = {
      approved: C.success,
      paid: C.success,
      rejected: C.danger,
      failed: C.danger,
    };
    const messages: Record<string, string> = {
      approved: 'Your payout request has been approved and is being processed.',
      paid: 'Your payout has been sent to your bank account.',
      rejected: 'Your payout request was rejected.',
      failed: 'Your payout could not be processed.',
    };
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    const rows: Array<[string, string]> = [
      ['Payout reference', `#${payoutId}`],
      ['Amount', this.money(amount)],
      ['Status', label],
    ];
    if (rejectionReason) rows.push(['Reason', rejectionReason]);

    return this.shell({
      title: `Payout ${label.toLowerCase()}`,
      preheader: `${this.money(amount)} — ${label.toLowerCase()}.`,
      eyebrow: 'Payout',
      heading: `Hi ${name}, your payout is ${label.toLowerCase()}`,
      body: `
        <p style="margin:0 0 4px;">${messages[status] || `Your payout status is now ${label.toLowerCase()}.`}</p>
        ${this.detailPanel(rows, accents[status] || C.gold)}
        ${
          status === 'rejected' || status === 'failed'
            ? `<p style="margin:0;">If you think this is a mistake, reply to this email and we'll take a look.</p>`
            : ''
        }`,
      cta: { label: 'View payouts', href: this.adminUrl('/dashboard/finance/payouts') },
    });
  }

  private getKYCIncompleteTemplate(name: string, missingRequirements: string[]): string {
    const C = EmailService.C;
    const items = missingRequirements
      .map(
        (req) =>
          `<li style="margin:0 0 6px;color:${C.ink};">${req.replace(/_/g, ' ')}</li>`,
      )
      .join('');

    return this.shell({
      title: 'Finish your payout setup',
      preheader: "You can't receive payouts until Stripe verification is complete.",
      eyebrow: 'Action required',
      heading: `Hi ${name}, your payout setup isn't finished`,
      body: `
        <p style="margin:0 0 4px;">
          Until Stripe has verified your details, bookings can't be paid out to you —
          and your listings can't take online bookings.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:${C.cream};border:1px solid ${C.border};border-left:3px solid ${C.warning};border-radius:12px;">
          <tr><td style="padding:18px 20px;">
            <p style="margin:0 0 10px;font-family:${EmailService.SANS};font-size:11px;font-weight:600;letter-spacing:1.5px;color:${C.faint};text-transform:uppercase;">Still needed</p>
            <ul style="margin:0;padding-left:18px;font-family:${EmailService.SANS};font-size:14px;line-height:1.7;">${items}</ul>
          </td></tr>
        </table>`,
      // This used to point at FRONTEND_URL/dashboard/finance — a page that only
      // exists in the admin portal, so owners landed on a 404 on the storefront.
      cta: { label: 'Finish setup', href: this.adminUrl('/dashboard/finance') },
    });
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }
}
