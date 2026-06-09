import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards,
  ParseIntPipe,
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';

import { EventsService } from './events.service';
import { UploadService } from '../upload/upload.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  async create(@Body() createEventDto: CreateEventDto, @Request() req) {
    return this.eventsService.create(createEventDto, req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with pagination (Public)' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(@Query() paginationDto: PaginationDto, @Request() req) {
    // For public access, don't pass user info - service will return all active events
    return this.eventsService.findAll(paginationDto, undefined, undefined);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured events' })
  @ApiResponse({ status: 200, description: 'Featured events retrieved successfully' })
  async findFeatured() {
    return this.eventsService.findFeatured();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiResponse({ status: 200, description: 'Upcoming events retrieved successfully' })
  async findUpcoming() {
    return this.eventsService.findUpcoming();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search events' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiQuery({ name: 'q', required: true, type: String })
  async search(@Query('q') query: string) {
    return this.eventsService.search(query);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get events by category' })
  @ApiResponse({ status: 200, description: 'Events by category retrieved successfully' })
  async findByCategory(@Param('category') category: string) {
    return this.eventsService.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // For public access, don't pass user info
    return this.eventsService.findOne(id, undefined, undefined);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateEventDto: UpdateEventDto, @Request() req) {
    return this.eventsService.update(id, updateEventDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event (soft delete)' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.eventsService.remove(id, req.user.id, req.user.role);
    return { message: 'Event deleted successfully' };
  }

  @Get(':id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event media gallery' })
  @ApiResponse({ status: 200, description: 'Media retrieved successfully' })
  async getMedia(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const event = await this.eventsService.findOne(id, req.user.id, req.user.role);
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return (event.mediaGallery || []).map((url, index) => {
      const isVideo = videoExtensions.some(ext => url.toLowerCase().includes(ext));
      return {
        id: index,
        url,
        type: isVideo ? 'video' : 'image',
        uploadedAt: event.updatedAt
      };
    });
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload media for an event' })
  @ApiConsumes('multipart/form-data')
  async uploadMedia(
    @Param('id', ParseIntPipe) id: number, 
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    
    const event = await this.eventsService.findOne(id, req.user.id, req.user.role);
    
    const uploadPromises = files.map(file => this.uploadService.uploadFile(file));
    const results = await Promise.all(uploadPromises);
    const urls = results.map(r => r.url);
    
    const mediaGallery = [...(event.mediaGallery || []), ...urls];
    await this.eventsService.update(id, { mediaGallery } as any, req.user.id, req.user.role);
    
    return { message: 'Media uploaded successfully', urls };
  }

  @Delete(':id/media/:mediaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EVENT_HOST, UserRole.TOUR_OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete media from an event' })
  async deleteMedia(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Request() req
  ) {
    const event = await this.eventsService.findOne(id, req.user.id, req.user.role);
    const mediaGallery = event.mediaGallery || [];
    
    if (mediaId >= 0 && mediaId < mediaGallery.length) {
      mediaGallery.splice(mediaId, 1);
      await this.eventsService.update(id, { mediaGallery } as any, req.user.id, req.user.role);
    }
    
    return { message: 'Media deleted successfully' };
  }
}
