import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { VerifiedVisit } from './entities/verified-visit.entity';
import { ReviewReport } from './entities/review-report.entity';
import { Order } from '../orders/entities/order.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/entities/user.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, ReviewReport, VerifiedVisit, Order, Bar, Distillery, Event, Customer, User]),
    NotificationsModule,
    EmailModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
