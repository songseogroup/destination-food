import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  GrantVerifiedVisitDto,
  OwnerReplyDto,
  ReportReviewDto,
} from './dto/review.dto';
import { ReviewEntityType, ReviewStatus } from './entities/review.entity';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  /**
   * Customer and staff tokens are signed with the same secret and both carry
   * their own table's id in `sub`, so JwtAuthGuard alone would let a staff token
   * through here — and `req.user.id` would then be read as a customerId,
   * attributing the review to whichever customer happens to share that number.
   * The role claim is the only thing separating the two audiences.
   */
  private assertCustomer(req: any) {
    if (req.user?.role !== 'customer') {
      throw new ForbiddenException('Only customers can do this');
    }
  }

  // Public — anyone can list reviews on a listing
  @Get('reviews')
  @ApiOperation({ summary: 'List approved reviews for an entity' })
  async list(
    @Query('entityType') entityType: ReviewEntityType,
    @Query('entityId', ParseIntPipe) entityId: number,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.listPublic(
      entityType,
      entityId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  // Customer (JWT issued by /customers/login)
  @Post('reviews')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review (customer)' })
  async create(@Body() dto: CreateReviewDto, @Request() req) {
    this.assertCustomer(req);
    // req.ip is the real client because main.ts trusts one proxy hop.
    return this.service.create(req.user.id, dto, req.ip);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own review (customer)' })
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    this.assertCustomer(req);
    await this.service.delete(id, req.user.id);
    return { ok: true };
  }

  // Owner (JWT issued by /auth/login with bar/distillery/event_host/tour_operator role)
  @Get('reviews/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BAR, UserRole.DISTILLERY, UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List reviews on my listings (owner)' })
  async listMine(@Request() req) {
    return this.service.listForOwner(req.user.id, req.user.role);
  }

  @Patch('reviews/:id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BAR, UserRole.DISTILLERY, UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post or update the owner reply (owner of the listing)' })
  async reply(@Param('id', ParseIntPipe) id: number, @Body() dto: OwnerReplyDto, @Request() req) {
    return this.service.setOwnerReply(id, req.user.id, dto);
  }

  // SuperAdmin moderation
  @Get('admin/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List every review for moderation (SuperAdmin)' })
  async listAll(@Query('status') status?: string, @Query('flagged') flagged?: string) {
    return this.service.listAllForAdmin({
      status: status && status !== 'all' ? (status as ReviewStatus) : undefined,
      flaggedOnly: flagged === 'true',
    });
  }

  /**
   * Report a review.
   *
   * Deliberately open to any signed-in account, customer or operator: the person
   * most likely to spot a libellous review of a venue is the venue. Reports are
   * attributed, so an operator reporting every poor review is visible in the
   * queue rather than invisible.
   */
  @Post('reviews/:id/report')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a review' })
  async reportReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReportReviewDto,
    @Request() req,
  ) {
    const isCustomer = req.user?.role === 'customer';
    return this.service.report(id, dto, {
      customerId: isCustomer ? req.user.id : undefined,
      userId: isCustomer ? undefined : req.user.id,
    });
  }

  @Patch('admin/reviews/:id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Take a review down (SuperAdmin)' })
  async hide(@Param('id', ParseIntPipe) id: number) {
    return this.service.setStatus(id, ReviewStatus.REMOVED);
  }

  @Patch('admin/reviews/:id/unhide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a review and clear its flag (SuperAdmin)' })
  async unhide(@Param('id', ParseIntPipe) id: number) {
    return this.service.setStatus(id, ReviewStatus.VISIBLE);
  }

  @Get('admin/review-reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reports behind flagged reviews' })
  async listReports(@Query('reviewId') reviewId?: string) {
    return this.service.listReports(reviewId ? parseInt(reviewId) : undefined);
  }

  /**
   * The manual escape hatch from the booking-required rule.
   *
   * Reviews are limited to people who booked through us. A guest who visited
   * before launch, or booked by phone, has no order — an admin can vouch for
   * that one visit here rather than the venue being unreviewable.
   */
  @Get('admin/verified-visits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List manually verified visits' })
  async listVerifiedVisits() {
    return this.service.listVerifiedVisits();
  }

  @Post('admin/verified-visits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Let one customer review one listing without a booking' })
  async grantVerifiedVisit(@Body() dto: GrantVerifiedVisitDto, @Request() req) {
    return this.service.grantVerifiedVisit(dto, req.user.id);
  }

  @Delete('admin/verified-visits/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw a manually verified visit' })
  async revokeVerifiedVisit(@Param('id', ParseIntPipe) id: number) {
    return this.service.revokeVerifiedVisit(id);
  }
}
