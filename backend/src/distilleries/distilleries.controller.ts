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

import { DistilleriesService } from './distilleries.service';
import { UploadService } from '../upload/upload.service';
import { CreateDistilleryDto } from './dto/create-distillery.dto';
import { UpdateDistilleryDto } from './dto/update-distillery.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Distilleries')
@Controller('distilleries')
export class DistilleriesController {
  constructor(
    private readonly distilleriesService: DistilleriesService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DISTILLERY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new distillery' })
  @ApiResponse({ status: 201, description: 'Distillery created successfully' })
  async create(@Body() createDistilleryDto: CreateDistilleryDto, @Request() req) {
    return this.distilleriesService.create(createDistilleryDto, req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all distilleries with pagination (Public)' })
  @ApiResponse({ status: 200, description: 'Distilleries retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(@Query() paginationDto: PaginationDto, @Request() req) {
    // For public access, don't pass user info - service will return all active distilleries
    return this.distilleriesService.findAll(paginationDto, undefined, undefined);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured distilleries' })
  @ApiResponse({ status: 200, description: 'Featured distilleries retrieved successfully' })
  async findFeatured() {
    return this.distilleriesService.findFeatured();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search distilleries' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiQuery({ name: 'q', required: true, type: String })
  async search(@Query('q') query: string) {
    return this.distilleriesService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get distillery by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Distillery retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Distillery not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // For public access, don't pass user info
    return this.distilleriesService.findOne(id, undefined, undefined);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DISTILLERY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update distillery' })
  @ApiResponse({ status: 200, description: 'Distillery updated successfully' })
  @ApiResponse({ status: 404, description: 'Distillery not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDistilleryDto: UpdateDistilleryDto, @Request() req) {
    return this.distilleriesService.update(id, updateDistilleryDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DISTILLERY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete distillery (soft delete)' })
  @ApiResponse({ status: 200, description: 'Distillery deleted successfully' })
  @ApiResponse({ status: 404, description: 'Distillery not found' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.distilleriesService.remove(id, req.user.id, req.user.role);
    return { message: 'Distillery deleted successfully' };
  }

  @Get(':id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DISTILLERY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get distillery media gallery' })
  @ApiResponse({ status: 200, description: 'Media retrieved successfully' })
  async getMedia(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const distillery = await this.distilleriesService.findOne(id, req.user.id, req.user.role);
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return (distillery.mediaGallery || []).map((url, index) => {
      const isVideo = videoExtensions.some(ext => url.toLowerCase().includes(ext));
      return {
        id: index,
        url,
        type: isVideo ? 'video' : 'image',
        uploadedAt: distillery.updatedAt
      };
    });
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DISTILLERY)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload media for a distillery' })
  @ApiConsumes('multipart/form-data')
  async uploadMedia(
    @Param('id', ParseIntPipe) id: number, 
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    
    const distillery = await this.distilleriesService.findOne(id, req.user.id, req.user.role);
    
    const uploadPromises = files.map(file => this.uploadService.uploadFile(file));
    const results = await Promise.all(uploadPromises);
    const urls = results.map(r => r.url);
    
    const mediaGallery = [...(distillery.mediaGallery || []), ...urls];
    await this.distilleriesService.update(id, { mediaGallery } as any, req.user.id, req.user.role);
    
    return { message: 'Media uploaded successfully', urls };
  }

  @Delete(':id/media/:mediaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DISTILLERY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete media from a distillery' })
  async deleteMedia(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Request() req
  ) {
    const distillery = await this.distilleriesService.findOne(id, req.user.id, req.user.role);
    const mediaGallery = distillery.mediaGallery || [];
    
    if (mediaId >= 0 && mediaId < mediaGallery.length) {
      mediaGallery.splice(mediaId, 1);
      await this.distilleriesService.update(id, { mediaGallery } as any, req.user.id, req.user.role);
    }
    
    return { message: 'Media deleted successfully' };
  }
}
