import { 
  Controller, 
  Post, 
  Delete, 
  Param, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile,
  Get 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.uploadService.uploadFile(file);
  }

  @Delete('image/:publicId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an image file' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  async deleteImage(@Param('publicId') publicId: string) {
    await this.uploadService.deleteFile(publicId);
    return { message: 'Image deleted successfully' };
  }

  @Get('image/:publicId/info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get image file information' })
  @ApiResponse({ status: 200, description: 'Image information retrieved successfully' })
  async getImageInfo(@Param('publicId') publicId: string) {
    return this.uploadService.getFileInfo(publicId);
  }

  @Get('image/:publicId/optimized')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get optimized image URL' })
  @ApiResponse({ status: 200, description: 'Optimized image URL generated successfully' })
  async getOptimizedImageUrl(@Param('publicId') publicId: string) {
    const url = this.uploadService.generateOptimizedUrl(publicId);
    return { url };
  }

  @Get('media')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all uploaded media files' })
  @ApiResponse({ status: 200, description: 'Media files retrieved successfully' })
  async getMediaFiles() {
    // This would typically fetch from database or Cloudinary
    // For now, return empty array as we don't have a media tracking system
    return [];
  }
}
