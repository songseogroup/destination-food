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
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';
import { FeedbackStatus } from './entities/feedback.entity';

@ApiTags('Feedback')
@Controller()
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  /**
   * Public submission. Anonymous visitors can send feedback too.
   * Signed-in customers get their customer.id linked to the row.
   */
  @Post('feedback')
  @ApiOperation({ summary: 'Submit feedback (public)' })
  async submit(@Body() dto: CreateFeedbackDto, @Request() req) {
    // If a JWT happens to be present and it's a customer JWT, link it.
    // We don't *require* auth here — the form is also reachable anonymously.
    let customerId: number | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ') && (req as any).user?.id) {
      customerId = (req as any).user.id;
    }
    return this.service.submit(dto, customerId);
  }

  @Get('admin/feedback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin — list every feedback row' })
  async list(@Query('status') status?: FeedbackStatus) {
    return this.service.list({ status });
  }

  @Get('admin/feedback/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin — counts by status' })
  async stats() {
    return this.service.stats();
  }

  @Patch('admin/feedback/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin — update status / notes on a feedback row' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFeedbackDto) {
    return this.service.update(id, dto);
  }

  @Delete('admin/feedback/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin — delete a feedback row' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return { ok: true };
  }
}
