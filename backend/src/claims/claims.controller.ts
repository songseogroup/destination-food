import {
  Body,
  Controller,
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
import { ClaimsService } from './claims.service';
import { RejectClaimDto, SubmitClaimDto } from './dto/claim.dto';
import { ClaimStatus } from './entities/claim.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Claims')
@Controller('claims')
export class ClaimsController {
  constructor(private readonly service: ClaimsService) {}

  /**
   * Submit a claim. Public — the person claiming a business may not have an
   * account yet, and requiring one before they can even ask would defeat the
   * point of letting real owners take over their listing.
   */
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Claim a listing that has no owner' })
  async submit(@Body() dto: SubmitClaimDto) {
    return this.service.submit(dto);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List claims for review' })
  async list(@Query('status') status?: string) {
    return this.service.listForAdminWithListings(
      status && status !== 'all' ? (status as ClaimStatus) : undefined,
    );
  }

  @Patch('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a claim and hand over the listing' })
  async approve(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.service.approve(id, req.user.id);
  }

  @Patch('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a claim' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectClaimDto,
    @Request() req,
  ) {
    return this.service.reject(id, req.user.id, dto.note);
  }
}
