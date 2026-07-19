import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { AnalyticsEvent } from '../analytics/entities/analytics-event.entity';
import { DestinationsService } from './destinations.service';
import { DestinationsController } from './destinations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bar, Distillery, Event, AnalyticsEvent])],
  controllers: [DestinationsController],
  providers: [DestinationsService],
  exports: [DestinationsService],
})
export class DestinationsModule {}
