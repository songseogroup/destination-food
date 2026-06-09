import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { StripeWebhookController } from './stripe.webhook.controller';
import { StripeAccount } from './entities/stripe-account.entity';
import { TransactionLedger } from './entities/transaction-ledger.entity';
import { Payout } from './entities/payout.entity';
import { Refund } from './entities/refund.entity';
import { Notification } from './entities/notification.entity';
import { PricingConfig } from './entities/pricing-config.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { EmailModule } from '../email/email.module';
import { StripePayoutScheduler } from './stripe-payout.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StripeAccount,
      TransactionLedger,
      Payout,
      Refund,
      Notification,
      PricingConfig,
      User,
      Order,
    ]),
    ConfigModule,
    EmailModule,
  ],
  controllers: [StripeController, StripeWebhookController],
  providers: [StripeService, StripePayoutScheduler],
  exports: [StripeService],
})
export class StripeModule {}
