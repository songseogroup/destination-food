import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Repository } from 'typeorm';
import { Order, OrderStatus, OrderType } from './entities/order.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

/**
 * Asks guests how their visit went, the day after it happened.
 *
 * Reviews are the whole basis of the ratings, the rankings and (later) the
 * badges — but only people who booked through us may write one, so if we never
 * ask, the shelf stays empty. This is the ask.
 *
 * A no-show still gets asked: the client's rules explicitly allow them to review
 * after the session, and the eligibility check treats CONFIRMED as enough.
 */
@Injectable()
export class ReviewRequestScheduler {
  private readonly logger = new Logger(ReviewRequestScheduler.name);

  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Bar) private barRepo: Repository<Bar>,
    @InjectRepository(Distillery) private distilleryRepo: Repository<Distillery>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  private async listingNameFor(order: Order): Promise<string> {
    if (order.orderType === OrderType.BAR_RESERVATION && order.barId) {
      return (await this.barRepo.findOne({ where: { id: order.barId } }))?.name || 'your booking';
    }
    if (order.orderType === OrderType.DISTILLERY_TOUR && order.distilleryId) {
      return (
        (await this.distilleryRepo.findOne({ where: { id: order.distilleryId } }))?.name ||
        'your booking'
      );
    }
    if (order.orderType === OrderType.EVENT_BOOKING && order.eventId) {
      return (await this.eventRepo.findOne({ where: { id: order.eventId } }))?.name || 'your booking';
    }
    return 'your booking';
  }

  /** The listing page, where the review form lives. */
  private reviewUrlFor(order: Order): string {
    const base = (this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000').replace(
      /\/+$/,
      '',
    );
    if (order.orderType === OrderType.BAR_RESERVATION && order.barId) {
      return `${base}/bars/${order.barId}#reviews`;
    }
    if (order.orderType === OrderType.DISTILLERY_TOUR && order.distilleryId) {
      return `${base}/distilleries/${order.distilleryId}#reviews`;
    }
    if (order.orderType === OrderType.EVENT_BOOKING && order.eventId) {
      return `${base}/events/${order.eventId}#reviews`;
    }
    return `${base}/orders/${order.id}`;
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendReviewRequests(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // A month back is far enough to catch anything the job missed while down,
    // and recent enough that we're not emailing people about last winter.
    const floor = new Date();
    floor.setDate(floor.getDate() - 30);

    // `bookingDate < yesterday` also excludes NULLs on its own — in SQL a
    // comparison against NULL is never true — so no separate IS NOT NULL.
    const due = await this.orderRepo.find({
      where: {
        status: In([OrderStatus.CONFIRMED, OrderStatus.COMPLETED]),
        bookingDate: LessThan(yesterday),
        reviewRequestSentAt: IsNull(),
      },
      take: 200,
    });

    const eligible = due.filter(
      (o) => o.bookingDate && o.bookingDate < yesterday && o.bookingDate > floor && o.customerEmail,
    );
    if (eligible.length === 0) return;

    for (const order of eligible) {
      try {
        const name = await this.listingNameFor(order);
        const sent = await this.emailService.sendReviewRequest(
          order.customerEmail,
          order.customerName || 'there',
          name,
          this.reviewUrlFor(order),
        );
        // Stamp it either way. If SMTP is down every booking would otherwise be
        // retried daily forever, and a guest getting asked twice about one visit
        // is worse than not being asked at all.
        order.reviewRequestSentAt = new Date();
        await this.orderRepo.save(order);
        if (!sent) {
          this.logger.warn(`Review request for order #${order.id} was not sent (email disabled?)`);
        }
      } catch (err: any) {
        this.logger.error(`Review request for order #${order.id} failed: ${err.message}`);
      }
    }

    this.logger.log(`Review requests processed: ${eligible.length}`);
  }
}
