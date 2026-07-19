import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from './entities/badge.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { Order } from '../orders/entities/order.entity';
import { Review } from '../reviews/entities/review.entity';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';
import { BadgesScheduler } from './badges.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, Bar, Distillery, Event, Order, Review])],
  controllers: [BadgesController],
  providers: [BadgesService, BadgesScheduler],
  exports: [BadgesService],
})
export class BadgesModule {}
