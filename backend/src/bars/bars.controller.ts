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

import { BarsService } from './bars.service';
import { UploadService } from '../upload/upload.service';
import { CreateBarDto } from './dto/create-bar.dto';
import { UpdateBarDto } from './dto/update-bar.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Bars')
@Controller('bars')
export class BarsController {
  constructor(
    private readonly barsService: BarsService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BAR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new bar' })
  @ApiResponse({ status: 201, description: 'Bar created successfully' })
  async create(@Body() createBarDto: CreateBarDto, @Request() req) {
    return this.barsService.create(createBarDto, req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bars with pagination (Public)' })
  @ApiResponse({ status: 200, description: 'Bars retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(@Query() paginationDto: PaginationDto, @Request() req) {
    // For public access, don't pass user info - service will return all active bars
    return this.barsService.findAll(paginationDto, undefined, undefined);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured bars' })
  @ApiResponse({ status: 200, description: 'Featured bars retrieved successfully' })
  async findFeatured() {
    return this.barsService.findFeatured();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search bars' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiQuery({ name: 'q', required: true, type: String })
  async search(@Query('q') query: string) {
    return this.barsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bar by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Bar retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Bar not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // For public access, don't pass user info
    return this.barsService.findOne(id, undefined, undefined);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BAR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update bar' })
  @ApiResponse({ status: 200, description: 'Bar updated successfully' })
  @ApiResponse({ status: 404, description: 'Bar not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateBarDto: UpdateBarDto, @Request() req) {
    return this.barsService.update(id, updateBarDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BAR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete bar (soft delete)' })
  @ApiResponse({ status: 200, description: 'Bar deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bar not found' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.barsService.remove(id, req.user.id, req.user.role);
    return { message: 'Bar deleted successfully' };
  }

  @Get('my-bar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BAR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current bar owner\'s bar' })
  @ApiResponse({ status: 200, description: 'Bar retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No bar found for this user' })
  async getMyBar(@Request() req) {
    return this.barsService.findByUserId(req.user.id);
  }

  @Get(':id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BAR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bar media gallery' })
  @ApiResponse({ status: 200, description: 'Media retrieved successfully' })
  async getMedia(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const bar = await this.barsService.findOne(id, req.user.id, req.user.role);
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return (bar.mediaGallery || []).map((url, index) => {
      const isVideo = videoExtensions.some(ext => url.toLowerCase().includes(ext));
      return {
        id: index,
        url,
        type: isVideo ? 'video' : 'image',
        uploadedAt: bar.updatedAt
      };
    });
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BAR)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload media for a bar' })
  @ApiConsumes('multipart/form-data')
  async uploadMedia(
    @Param('id', ParseIntPipe) id: number, 
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    
    const bar = await this.barsService.findOne(id, req.user.id, req.user.role);
    
    const uploadPromises = files.map(file => this.uploadService.uploadFile(file));
    const results = await Promise.all(uploadPromises);
    const urls = results.map(r => r.url);
    
    const mediaGallery = [...(bar.mediaGallery || []), ...urls];
    await this.barsService.update(id, { mediaGallery } as any, req.user.id, req.user.role);
    
    return { message: 'Media uploaded successfully', urls };
  }

  @Delete(':id/media/:mediaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BAR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete media from a bar' })
  async deleteMedia(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Request() req
  ) {
    const bar = await this.barsService.findOne(id, req.user.id, req.user.role);
    const mediaGallery = bar.mediaGallery || [];
    
    if (mediaId >= 0 && mediaId < mediaGallery.length) {
      mediaGallery.splice(mediaId, 1);
      await this.barsService.update(id, { mediaGallery } as any, req.user.id, req.user.role);
    }
    
    return { message: 'Media deleted successfully' };
  }
}
