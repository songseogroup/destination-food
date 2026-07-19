import { Controller, Post, Req, Res, Headers, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';

// Stripe retries failed webhook deliveries, sometimes in bursts. Rate limiting
// them would drop legitimate payment events — the signature check below is what
// keeps this endpoint safe, not a request cap.
@SkipThrottle()
@Controller('stripe/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(
    private configService: ConfigService,
    private stripeService: StripeService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() req: Request, @Res() res: Response, @Headers('stripe-signature') signature: string) {
    let event: Stripe.Event;

    try {
      // Get raw body for signature verification
      const rawBody = (req as any).rawBody || req.body;
      
      // Verify webhook signature
      if (!this.webhookSecret) {
        this.logger.warn('STRIPE_WEBHOOK_SECRET not configured, skipping signature verification');
        event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
      } else {
        event = this.stripe.webhooks.constructEvent(
          rawBody,
          signature,
          this.webhookSecret,
        );
      }
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'account.updated':
          await this.handleAccountUpdated(event.data.object as Stripe.Account);
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        case 'payout.paid':
          await this.handlePayoutPaid(event.data.object as Stripe.Transfer | Stripe.Payout);
          break;

        case 'payout.failed':
          await this.handlePayoutFailed(event.data.object as Stripe.Payout);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      this.logger.error(`Error handling webhook ${event.type}: ${error.message}`, error.stack);
      res.status(500).json({ error: error.message });
    }
  }

  private async handleAccountUpdated(account: Stripe.Account) {
    this.logger.log(`Account updated: ${account.id}`);
    // The StripeService.getAccountStatus will handle syncing
    // This could trigger a notification if KYC status changes
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Checkout session completed: ${session.id}`);
    if (session.payment_intent) {
      const paymentIntentId = typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent.id;
      await this.stripeService.handlePaymentSuccess(paymentIntentId);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);
    await this.stripeService.handlePaymentSuccess(paymentIntent.id);
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    this.logger.log(`Charge refunded: ${charge.id}`);
    // Refund processing is handled through the refund service
    // This webhook confirms the refund was processed by Stripe
  }

  private async handlePayoutPaid(payout: Stripe.Transfer | Stripe.Payout) {
    this.logger.log(`Payout paid: ${payout.id}`);
    const payoutId = typeof payout === 'string' ? payout : payout.id;
    await this.stripeService.updatePayoutStatusFromWebhook(payoutId, 'paid');
  }

  private async handlePayoutFailed(payout: Stripe.Payout) {
    this.logger.log(`Payout failed: ${payout.id}`);
    await this.stripeService.updatePayoutStatusFromWebhook(payout.id, 'failed');
  }
}
