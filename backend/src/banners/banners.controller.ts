import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
import { BannerSlot } from './entities/banner.entity';

@ApiTags('Banners')
@Controller()
export class BannersController {
  constructor(private readonly service: BannersService) {}

  @Get('banners')
  @ApiOperation({ summary: 'Public — active banners, optionally filtered by slot' })
  async listActive(@Query('slot') slot?: BannerSlot) {
    return this.service.listActive(slot);
  }

  @Post('banners/:id/impression')
  @ApiOperation({ summary: 'Public — record an impression for a banner' })
  async impression(@Param('id', ParseIntPipe) id: number) {
    await this.service.incrementImpression(id);
    return { ok: true };
  }

  @Post('banners/:id/click')
  @ApiOperation({ summary: 'Public — record a click for a banner' })
  async click(@Param('id', ParseIntPipe) id: number) {
    await this.service.incrementClick(id);
    return { ok: true };
  }

  @Get('admin/banners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin — list every banner (active + inactive)' })
  async adminList(@Query('slot') slot?: BannerSlot) {
    return this.service.listAll(slot);
  }

  @Post('admin/banners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin — create banner' })
  async create(@Body() dto: CreateBannerDto) {
    return this.service.create(dto);
  }

  @Patch('admin/banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin — update banner' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.service.update(id, dto);
  }

  @Delete('admin/banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin — delete banner' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { ok: true };
  }
}
