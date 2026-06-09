import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HomepageService } from './homepage.service';
import { HomepageController } from './homepage.controller';
import { HomepageContent } from './entities/homepage-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HomepageContent])],
  controllers: [HomepageController],
  providers: [HomepageService],
  exports: [HomepageService],
})
export class HomepageModule {}
