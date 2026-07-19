import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';
import { ReviewEntityType } from '../reviews/entities/review.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  /** Bookable slots a customer can choose from — public, upcoming, with room. */
  @Get(':entityType/:entityId/bookable')
  @ApiOperation({ summary: 'Bookable sessions for a listing' })
  async bookable(
    @Param('entityType', new ParseEnumPipe(ReviewEntityType)) entityType: ReviewEntityType,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    const sessions = await this.service.listBookable(entityType, entityId);
    return sessions.map((s) => ({ ...s, remaining: this.service.remaining(s) }));
  }

  /** Every slot for a listing — the operator's management view. Auth required. */
  @Get(':entityType/:entityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'All sessions for a listing (operator)' })
  async list(
    @Param('entityType', new ParseEnumPipe(ReviewEntityType)) entityType: ReviewEntityType,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    const sessions = await this.service.listForEntity(entityType, entityId);
    return sessions.map((s) => ({ ...s, remaining: this.service.remaining(s) }));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Open a session (operator)' })
  async create(@Body() dto: CreateSessionDto, @Request() req) {
    return this.service.create(dto, req.user.id, req.user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a session (operator)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSessionDto,
    @Request() req,
  ) {
    return this.service.update(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a session (operator)' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.service.remove(id, req.user.id, req.user.role);
    return { ok: true };
  }
}
