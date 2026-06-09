import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DistilleriesService } from './distilleries.service';
import { DistilleriesController } from './distilleries.controller';
import { Distillery } from './entities/distillery.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([Distillery]), UploadModule],
  controllers: [DistilleriesController],
  providers: [DistilleriesService],
  exports: [DistilleriesService],
})
export class DistilleriesModule {}
