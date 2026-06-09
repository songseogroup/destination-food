import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformConfigService } from './platform-config.service';
import { PlatformConfigController } from './platform-config.controller';
import { PlatformConfig } from './entities/platform-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformConfig])],
  providers: [PlatformConfigService],
  controllers: [PlatformConfigController],
  exports: [PlatformConfigService],
})
export class PlatformConfigModule {}
