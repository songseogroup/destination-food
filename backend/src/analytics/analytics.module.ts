import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { Blog } from '../blogs/entities/blog.entity';

@Module({
  // Bar/Distillery/Event/Blog repos are read-only here: for owner-scoping (whose
  // listings?) and for resolving ids to names in the dashboard.
  imports: [TypeOrmModule.forFeature([AnalyticsEvent, Bar, Distillery, Event, Blog])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
