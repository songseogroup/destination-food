import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Claim } from './entities/claim.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { User } from '../users/entities/user.entity';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Claim, Bar, Distillery, Event, User]),
    NotificationsModule,
  ],
  controllers: [ClaimsController],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule {}
