import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StripeService } from './stripe.service';

@Injectable()
export class StripePayoutScheduler {
  private readonly logger = new Logger(StripePayoutScheduler.name);

  constructor(private readonly stripeService: StripeService) {}

  // Weekly auto payouts
  @Cron(CronExpression.EVERY_WEEK)
  async runWeeklyAutoPayouts() {
    try {
      await this.stripeService.processAutomaticPayouts('weekly');
    } catch (error) {
      this.logger.error(`Weekly automatic payout job failed: ${error.message}`, error.stack);
    }
  }

  // Event-ended auto payouts (checked hourly)
  @Cron(CronExpression.EVERY_HOUR)
  async runEventEndAutoPayouts() {
    try {
      await this.stripeService.processAutomaticPayouts('event_end');
    } catch (error) {
      this.logger.error(`Event-end automatic payout job failed: ${error.message}`, error.stack);
    }
  }
}
