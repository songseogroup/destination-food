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
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, OwnerReplyDto } from './dto/review.dto';
import { ReviewEntityType } from './entities/review.entity';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review (customer)' })
  async create(@Body() dto: CreateReviewDto, @Request() req) {
    return this.service.create(req.user.id, dto);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own review (customer)' })
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
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
  async listAll(@Query('hidden') hidden?: string) {
    return this.service.listAllForAdmin({
      hidden: hidden === 'true' ? true : hidden === 'false' ? false : undefined,
    });
  }

  @Patch('admin/reviews/:id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hide a review (SuperAdmin)' })
  async hide(@Param('id', ParseIntPipe) id: number) {
    return this.service.setHidden(id, true);
  }

  @Patch('admin/reviews/:id/unhide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unhide a review (SuperAdmin)' })
  async unhide(@Param('id', ParseIntPipe) id: number) {
    return this.service.setHidden(id, false);
  }
}
