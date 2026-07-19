import { Controller, Get, Param, ParseEnumPipe, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BadgesService } from './badges.service';
import { ReviewEntityType } from '../reviews/entities/review.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly service: BadgesService) {}

  // Public — badges exist to be seen. One fetch decorates every card on a page.
  @Get()
  @ApiOperation({ summary: 'All active badges' })
  async all() {
    return this.service.allActive();
  }

  @Get(':entityType/:entityId')
  @ApiOperation({ summary: 'Active badges for one listing' })
  async forEntity(
    @Param('entityType', new ParseEnumPipe(ReviewEntityType)) entityType: ReviewEntityType,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    return this.service.forEntity(entityType, entityId);
  }

  /**
   * Force a recompute now.
   *
   * The scheduler runs this daily; this is for an admin who wants it applied
   * immediately (after a data fix, or the first time). It is not a way to *set*
   * a badge — it only re-runs the same rules, so an operator still can't award
   * themselves anything.
   */
  @Post('recompute')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recompute all badges now (admin)' })
  async recompute() {
    return this.service.recompute();
  }
}
