import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';
import { AnalyticsEntityType } from './entities/analytics-event.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /**
   * Record a view/click. PUBLIC and unauthenticated — the caller is an
   * anonymous site visitor. The body is the only input and is whitelisted by
   * the DTO. `referrer` is captured server-side too as a fallback.
   */
  @Post('track')
  track(@Body() dto: TrackEventDto, @Req() req: any) {
    if (!dto.referrer && req?.headers?.referer) {
      dto.referrer = String(req.headers.referer).slice(0, 512);
    }
    return this.analytics.track(dto);
  }

  /**
   * Dashboard summary. Any authenticated staff/owner. The service scopes the
   * data: platform roles see everything, owners see only their own listings.
   */
  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BAR,
    UserRole.DISTILLERY,
    UserRole.EVENT_HOST,
    UserRole.TOUR_OPERATOR,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Views/clicks summary, scoped to the caller' })
  getSummary(@Req() req: any, @Query('days') days?: string) {
    return this.analytics.getSummary(req.user, this.clampDays(days));
  }

  /** Time series for one listing. Owners must own it (enforced in the service). */
  @Get(':entityType/:entityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.BAR,
    UserRole.DISTILLERY,
    UserRole.EVENT_HOST,
    UserRole.TOUR_OPERATOR,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Time series for a single listing' })
  getEntityStats(
    @Param('entityType') entityType: AnalyticsEntityType,
    @Param('entityId', ParseIntPipe) entityId: number,
    @Req() req: any,
    @Query('days') days?: string,
  ) {
    return this.analytics.getEntityStats(entityType, entityId, req.user, this.clampDays(days));
  }

  private clampDays(days?: string): number {
    const n = parseInt(days ?? '30', 10);
    if (Number.isNaN(n)) return 30;
    return Math.min(365, Math.max(1, n));
  }
}
