import { Injectable } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UploadService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; filename: string; publicId: string }> {
    try {
      const result = await this.cloudinaryService.uploadImage(file);
      
      return {
        url: result.secure_url,
        filename: result.original_filename || file.originalname,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Error uploading file to Cloudinary:', error);
      throw new Error('Failed to upload file');
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await this.cloudinaryService.deleteImage(publicId);
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      throw new Error('Failed to delete file');
    }
  }

  async getFileInfo(publicId: string): Promise<{ exists: boolean; size?: number; url?: string }> {
    try {
      const result = await this.cloudinaryService.getImageInfo(publicId);
      return {
        exists: true,
        size: result.bytes,
        url: result.secure_url,
      };
    } catch (error) {
      return {
        exists: false,
      };
    }
  }

  generateOptimizedUrl(publicId: string, options: any = {}): string {
    return this.cloudinaryService.generateOptimizedUrl(publicId, options);
  }
}
