import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Refund } from '../stripe/entities/refund.entity';
import { TransactionLedger } from '../stripe/entities/transaction-ledger.entity';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Bar, Distillery, Event, Customer, Refund, TransactionLedger]),
    EmailModule,
    NotificationsModule,
    // For the pre-flight check that the host can actually be paid before we
    // create an order and email the customer about it. StripeModule doesn't
    // import this one, so there's no cycle.
    StripeModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

