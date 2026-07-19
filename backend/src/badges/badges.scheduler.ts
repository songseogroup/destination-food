import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BadgesService } from './badges.service';

/**
 * Keeps badges honest.
 *
 * Spec says badges expire monthly and are revoked when the numbers fall. Rather
 * than wait a month and let a badge go stale in the meantime, this recomputes
 * daily — so "trending this month" reflects the rolling window, and a listing
 * whose rating drops loses "top rated" within a day, not weeks later.
 */
@Injectable()
export class BadgesScheduler {
  private readonly logger = new Logger(BadgesScheduler.name);

  constructor(private readonly badgesService: BadgesService) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async recompute(): Promise<void> {
    try {
      const result = await this.badgesService.recompute();
      this.logger.log(`Daily badge recompute: +${result.awarded} / -${result.revoked}`);
    } catch (err: any) {
      this.logger.error(`Badge recompute failed: ${err.message}`, err.stack);
    }
  }
}
